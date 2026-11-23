import { TransactionStatus as PrismaStatus } from "@prisma/client";
import { db } from "./db";
import { demoRecords } from "./demo-state";
import type { Transaction } from "./domain";

export type ApprovalRow = {
  code: string;
  date: string;
  project: string;
  submittedBy: string;
  amount: number;
  invoiceName: string;
  status: string;
};

export async function getApprovalRows(
  statuses: PrismaStatus[],
  sharedDemoTransactions?: Transaction[],
): Promise<ApprovalRow[]> {
  if (process.env.DEMO_MODE === "true") {
    return (sharedDemoTransactions ?? (await demoRecords()).transactions)
      .filter((transaction) =>
        statuses.some((status) => status === transaction.status),
      )
      .map((transaction) => ({
        code: transaction.id,
        date: transaction.date,
        project: transaction.project,
        submittedBy: "Dr. Arvind Kumar",
        amount: transaction.amount,
        invoiceName: `${transaction.id.toLowerCase()}.pdf`,
        status: transaction.status,
      }));
  }

  const transactions = await db.transaction.findMany({
    where: { status: { in: statuses } },
    include: {
      project: { select: { code: true } },
      lines: { select: { amount: true } },
      invoice: { select: { fileName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const creatorIds = [
    ...new Set(transactions.map((transaction) => transaction.createdById)),
  ];
  const creators = await db.user.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, name: true },
  });
  const creatorMap = Object.fromEntries(
    creators.map((creator) => [creator.id, creator.name]),
  );

  return transactions.map((transaction) => ({
    code: transaction.code,
    date: transaction.date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    project: transaction.project.code,
    submittedBy:
      creatorMap[transaction.createdById] ??
      transaction.createdByName ??
      "Unknown",
    amount: transaction.lines.reduce(
      (sum, line) => sum + Number(line.amount),
      0,
    ),
    invoiceName:
      transaction.invoice?.fileName ?? `${transaction.code.toLowerCase()}.pdf`,
    status: transaction.status,
  }));
}
