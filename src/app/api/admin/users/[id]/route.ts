import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentAdmin } from "@/lib/admin-auth";
import { demoRecords, markDemoDeleted } from "@/lib/demo-state";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await currentAdmin();
  if (!actor)
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  if (process.env.DEMO_MODE === "true") {
    const records = await demoRecords();
    const target = records.accounts.find((account) => account.email === id);
    if (!target)
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (target.role === "SUPER_ADMIN")
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 409 },
      );
    if (target.role === "INSPECTOR" && records.projects.length > 0)
      return NextResponse.json(
        { error: "Delete this user's projects first." },
        { status: 409 },
      );
    await markDemoDeleted("users", id);
    return NextResponse.json({ ok: true });
  }
  if (id === actor.id)
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 409 },
    );

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      institutionId: true,
      phoneNumber: true,
      role: true,
      _count: { select: { projects: true } },
    },
  });
  if (!user)
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (user._count.projects > 0)
    return NextResponse.json(
      { error: "Delete this user's projects before deleting their account." },
      { status: 409 },
    );

  await db.$transaction(async (tx) => {
    await tx.transaction.updateMany({
      where: { createdById: id },
      data: { createdByName: user.name },
    });
    await tx.approval.updateMany({
      where: { reviewerId: id },
      data: { reviewerName: user.name },
    });
    await tx.auditEntry.updateMany({
      where: { actorId: id },
      data: { actorId: null, actorName: user.name },
    });
    await tx.user.delete({ where: { id } });
    await tx.auditEntry.create({
      data: {
        action: "USER_DELETED",
        entity: "User",
        entityId: id,
        before: {
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          institutionId: user.institutionId,
          phoneNumber: user.phoneNumber,
        },
        actorId: actor.id,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
