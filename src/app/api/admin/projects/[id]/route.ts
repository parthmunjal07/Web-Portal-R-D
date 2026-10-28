import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentAdmin } from "@/lib/admin-auth";
import { cleanupInvoices } from "@/lib/invoice-storage";
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
    if (!(await demoRecords()).projects.some((project) => project.id === id))
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 },
      );
    await markDemoDeleted("projects", id);
    return NextResponse.json({ ok: true });
  }
  const project = await db.project.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      name: true,
      transactions: { select: { invoice: { select: { storageKey: true } } } },
    },
  });
  if (!project)
    return NextResponse.json({ error: "Project not found." }, { status: 404 });

  await db.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { projectId: id } });
    await tx.project.delete({ where: { id } });
    await tx.auditEntry.create({
      data: {
        action: "PROJECT_DELETED",
        entity: "Project",
        entityId: id,
        before: {
          code: project.code,
          name: project.name,
          transactions: project.transactions.length,
        },
        actorId: actor.id,
      },
    });
  });
  const failedFiles = await cleanupInvoices(
    project.transactions.flatMap((transaction) =>
      transaction.invoice ? [transaction.invoice.storageKey] : [],
    ),
  );

  return NextResponse.json({
    ok: true,
    ...(failedFiles
      ? { warning: `${failedFiles} invoice file(s) could not be removed.` }
      : {}),
  });
}
