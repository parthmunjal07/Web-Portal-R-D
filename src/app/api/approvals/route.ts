import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser, hasRole } from "@/lib/auth";
import { parseRole } from "@/lib/permissions";
import { cookies } from "next/headers";
import { demoRecords, setDemoApprovalStatus } from "@/lib/demo-state";
import { nextApprovalStatus } from "@/lib/approval-transitions";
import type { TransactionStatus } from "@/lib/domain";

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

  const role = user!.role;
  const { transactionCode, decision, remarks } = parsed.data;

  const invalidStatusMessage = role === "DEAN"
    ? "This transaction is not awaiting Dean review."
    : "This transaction has not yet received Dean approval and is not ready for final review.";

  // ── DEMO_MODE without a real DB ───────────────────────────────────────────
  if (process.env.DEMO_MODE === "true") {
    const transaction = (await demoRecords()).transactions.find((t) => t.id === transactionCode);
    if (!transaction)
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    const nextStatus = nextApprovalStatus(role, transaction.status, decision);
    if (!nextStatus)
      return NextResponse.json({ error: invalidStatusMessage }, { status: 409 });
    if (!(await setDemoApprovalStatus(transactionCode, nextStatus, transaction.status, role as "DEAN" | "SUPER_ADMIN", decision)))
      return NextResponse.json({ error: "Transaction changed; refresh and try again." }, { status: 409 });
    return NextResponse.json({ ok: true, status: nextStatus, demo: true });
  }

  // ── Real DB path ──────────────────────────────────────────────────────────
  const transaction = await db.transaction.findUnique({
    where: { code: transactionCode },
  });
  if (!transaction)
    return NextResponse.json(
      { error: "Transaction not found." },
      { status: 404 },
    );

  const nextStatus = nextApprovalStatus(role, transaction.status as TransactionStatus, decision);
  if (!nextStatus)
    return NextResponse.json({ error: invalidStatusMessage }, { status: 409 });
  const stage = role === "DEAN" ? "DEAN" : "SUPER_ADMIN";

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
