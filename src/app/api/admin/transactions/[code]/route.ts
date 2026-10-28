import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentAdmin } from "@/lib/admin-auth";
import { cleanupInvoices } from "@/lib/invoice-storage";
import { demoRecords, markDemoDeleted } from "@/lib/demo-state";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const actor = await currentAdmin();
  if (!actor)
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { code } = await params;
  if (process.env.DEMO_MODE === "true") {
    if (
      !(await demoRecords()).transactions.some(
        (transaction) => transaction.id === code,
      )
    )
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 },
      );
    await markDemoDeleted("transactions", code);
    return NextResponse.json({ ok: true });
  }
  const transaction = await db.transaction.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      vendor: true,
      projectId: true,
      invoice: { select: { storageKey: true } },
    },
  });
  if (!transaction)
    return NextResponse.json(
      { error: "Transaction not found." },
      { status: 404 },
    );

  await db.$transaction(async (tx) => {
    await tx.transaction.delete({ where: { id: transaction.id } });
    await tx.auditEntry.create({
      data: {
        action: "TRANSACTION_DELETED",
        entity: "Transaction",
        entityId: transaction.id,
        before: {
          code: transaction.code,
          vendor: transaction.vendor,
          projectId: transaction.projectId,
        },
        actorId: actor.id,
      },
    });
  });
  const failedFiles = transaction.invoice
    ? await cleanupInvoices([transaction.invoice.storageKey])
    : 0;

  return NextResponse.json({
    ok: true,
    ...(failedFiles
      ? {
          warning:
            "Transaction deleted, but its invoice file could not be removed.",
        }
      : {}),
  });
}
