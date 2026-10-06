import { NextResponse } from "next/server";
import { demoTransactions, money } from "@/lib/domain";
import { db } from "@/lib/db";

export type TxCsvRow = {
  id: string;
  date: string;
  vendor: string;
  purpose: string;
  project: string;
  category: string;
  amount: string;
  status: string;
};

export async function GET() {
  // ── Demo path ──────────────────────────────────────────────────────────────
  if (process.env.DEMO_MODE === "true") {
    const rows: TxCsvRow[] = demoTransactions.map((t) => ({
      id: t.id,
      date: t.date,
      vendor: t.vendor,
      purpose: t.purpose,
      project: t.project,
      category: "Equipment",
      amount: money(t.amount),
      status: t.status,
    }));
    return NextResponse.json(rows);
  }

  // ── Real DB path ───────────────────────────────────────────────────────────
  const txs = await db.transaction.findMany({
    include: {
      project: { select: { code: true } },
      lines: {
        include: { category: { select: { name: true } } },
        take: 1, // first line category name for the CSV
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: TxCsvRow[] = txs.map((t) => {
    const totalAmount = t.lines.reduce((sum, l) => sum + Number(l.amount), 0);
    return {
      id: t.code,
      date: t.date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      vendor: t.vendor,
      purpose: t.description,
      project: t.project.code,
      category: t.lines[0]?.category.name ?? "—",
      amount: money(totalAmount),
      status: t.status,
    };
  });

  return NextResponse.json(rows);
}
