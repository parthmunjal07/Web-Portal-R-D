import { NextResponse } from "next/server";
import { money } from "@/lib/domain";
import { db } from "@/lib/db";
import { demoRecords } from "@/lib/demo-state";
import { currentUser } from "@/lib/auth";
import { cookies } from "next/headers";

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
    const role = (await cookies()).get("rd_demo_role")?.value;
    if (!["INSPECTOR", "DEAN", "SUPER_ADMIN"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const rows: TxCsvRow[] = (await demoRecords()).transactions.map((t) => ({
      id: t.id,
      date: t.date,
      vendor: t.vendor,
      purpose: t.purpose,
      project: t.project,
      category: t.category,
      amount: money(t.amount),
      status: t.status,
    }));
    return NextResponse.json(rows);
  }

  // ── Real DB path ───────────────────────────────────────────────────────────
  const user = await currentUser();
  if (!user || !user.active) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const txs = await db.transaction.findMany({
    where: user.role === "INSPECTOR" ? { project: { ownerId: user.id } } : {},
    include: {
      project: { select: { code: true } },
      lines: {
        include: { category: { select: { name: true } } },
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
      category: [...new Set(t.lines.map((line) => line.category.name))].join(", ") || "—",
      amount: money(totalAmount),
      status: t.status,
    };
  });

  return NextResponse.json(rows);
}
