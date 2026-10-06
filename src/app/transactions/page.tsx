import Link from "next/link";
import { demoTransactions, money } from "@/lib/domain";
import { db } from "@/lib/db";
import { Status } from "../ui";

// ── Normalised row type ───────────────────────────────────────────────────────
type TxRow = {
  id: string;       // transaction code — also used as the URL param
  date: string;
  vendor: string;
  purpose: string;
  project: string;  // project code
  amount: number;
  statusLabel: string;
};

// ── Map raw DB status → display label understood by <Status> ─────────────────
function statusLabel(s: string): string {
  switch (s) {
    case "APPROVED":        return "Cleared";
    case "REJECTED":        return "Rejected";
    case "APPROVED_BY_DEAN": return "Pending Final";
    case "DRAFT":           return "Draft";
    default:                return "Pending Approval"; // PENDING_DEAN
  }
}

// ── Data source ───────────────────────────────────────────────────────────────
async function getTransactions(): Promise<TxRow[]> {
  // Demo: original data, exact same labels as before
  if (process.env.DEMO_MODE === "true") {
    return demoTransactions.map((t) => ({
      id: t.id,
      date: t.date,
      vendor: t.vendor,
      purpose: t.purpose,
      project: t.project,
      amount: t.amount,
      statusLabel: t.status === "APPROVED" ? "Cleared" : "Pending Approval",
    }));
  }

  // Real DB: all transactions, most recent first
  const rows = await db.transaction.findMany({
    include: {
      project: { select: { code: true } },
      lines:   { select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((t) => ({
    id: t.code,
    date: t.date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    vendor: t.vendor,
    purpose: t.description,
    project: t.project.code,
    amount: t.lines.reduce((sum, l) => sum + Number(l.amount), 0),
    statusLabel: statusLabel(t.status),
  }));
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function Transactions() {
  const transactions = await getTransactions();

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">Transactions</h1>
          <div className="eyebrow">
            Track invoice-backed project spending and approval status
          </div>
        </div>
        <Link className="primary" href="/transactions/new">
          ＋ New transaction
        </Link>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>DATE</th>
              <th>VENDOR / PURPOSE</th>
              <th>PROJECT</th>
              <th>AMOUNT</th>
              <th>STATUS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    color: "#66717a",
                    padding: "28px 0",
                  }}
                >
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.date}</td>
                  <td>
                    {t.vendor}
                    <span className="sub">{t.purpose}</span>
                  </td>
                  <td>{t.project}</td>
                  <td>{money(t.amount)}</td>
                  <td>
                    <Status status={t.statusLabel} />
                  </td>
                  <td>
                    <Link className="link" href={`/transactions/${t.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
