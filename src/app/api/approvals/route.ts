import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser, hasRole } from "@/lib/auth";
import { parseRole } from "@/lib/permissions";
import { cookies } from "next/headers";

const schema = z.object({
  transactionCode: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT"]),
  remarks: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "transactionCode and a valid decision (APPROVE | REJECT) are required." },
      { status: 400 },
    );

  const user =
    process.env.DEMO_MODE === "true"
      ? {
          role: parseRole((await cookies()).get("rd_demo_role")?.value),
          id: "demo-user",
          name: "Demo User",
        }
      : await currentUser();

  if (!hasRole(user, ["DEAN", "SUPER_ADMIN"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const role = user?.role ?? parseRole((await cookies()).get("rd_demo_role")?.value);
  const { transactionCode, decision, remarks } = parsed.data;

  // ── DEMO_MODE without a real DB ───────────────────────────────────────────
  if (process.env.DEMO_MODE === "true")
    return NextResponse.json({ ok: true, demo: true });

  // ── Real DB path ──────────────────────────────────────────────────────────
  const transaction = await db.transaction.findUnique({
    where: { code: transactionCode },
  });
  if (!transaction)
    return NextResponse.json(
      { error: "Transaction not found." },
      { status: 404 },
    );

  // Determine the approval stage + next status based on role and current status
  const isDean = role === "DEAN";
  const isAdmin = role === "SUPER_ADMIN";

  let stage: "DEAN" | "SUPER_ADMIN";
  let nextStatus: "APPROVED_BY_DEAN" | "APPROVED" | "REJECTED";

  if (isDean) {
    if (transaction.status !== "PENDING_DEAN")
      return NextResponse.json(
        { error: "This transaction is not awaiting Dean review." },
        { status: 409 },
      );
    stage = "DEAN";
    nextStatus = decision === "APPROVE" ? "APPROVED_BY_DEAN" : "REJECTED";
  } else if (isAdmin) {
    // Admin can give the final approval after Dean, or override any prior decision
    if (
      transaction.status !== "APPROVED_BY_DEAN" &&
      transaction.status !== "APPROVED" &&
      transaction.status !== "REJECTED"
    )
      return NextResponse.json(
        {
          error:
            "This transaction has not yet received Dean approval and is not ready for final review.",
        },
        { status: 409 },
      );
    stage = "SUPER_ADMIN";
    nextStatus = decision === "APPROVE" ? "APPROVED" : "REJECTED";
  } else {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const previousStatus = transaction.status;

  // Write Approval record + status update + audit entry atomically
  await db.$transaction(async (tx) => {
    await tx.approval.create({
      data: {
        stage,
        decision,
        remarks: remarks ?? null,
        transactionId: transaction.id,
        reviewerId: user!.id,
      },
    });

    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: nextStatus },
    });

    await tx.auditEntry.create({
      data: {
        action: `APPROVAL_${decision}`,
        entity: "Transaction",
        entityId: transaction.id,
        before: { status: previousStatus },
        after: { status: nextStatus },
        actorId: user!.id,
      },
    });
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}
