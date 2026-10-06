import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { demoTransactions, money } from "@/lib/domain";
import { db } from "@/lib/db";
import { TransactionStatus as PrismaStatus } from "@prisma/client";
import { Status } from "../ui";
import { ApprovalActions } from "./approval-actions";

// ── Normalised shape used by the render layer ─────────────────────────────────
type ApprovalRow = {
  code: string;
  date: string;
  project: string;
  submittedBy: string;
  amount: number;
  invoiceName: string;
  status: string;
};

// ── Data source: demo array OR real DB ───────────────────────────────────────
async function getRows(): Promise<ApprovalRow[]> {
  // Keep original demo behaviour untouched
  if (process.env.DEMO_MODE === "true") {
    return demoTransactions.map((t) => ({
      code: t.id,
      date: t.date,
      project: t.project,
      submittedBy: "Dr. Arvind Kumar",
      amount: t.amount,
      invoiceName: `${t.id.toLowerCase()}.pdf`,
      status: t.status,
    }));
  }

  // Real DB: fetch transactions that are in either pending approval stage
  const txs = await db.transaction.findMany({
    where: { status: { in: [PrismaStatus.PENDING_DEAN, PrismaStatus.APPROVED_BY_DEAN] } },
    include: {
      project: { select: { code: true, name: true } },
      lines: { select: { amount: true } },
      invoice: { select: { fileName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Batch-fetch creator names (Transaction has no direct relation to User)
  const creatorIds = [...new Set(txs.map((t) => t.createdById))];
  const creators = await db.user.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, name: true },
  });
  const creatorMap = Object.fromEntries(creators.map((u) => [u.id, u.name]));

  return txs.map((t) => ({
    code: t.code,
    date: t.date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    project: t.project.code,
    submittedBy: creatorMap[t.createdById] ?? "Unknown",
    amount: t.lines.reduce((sum, l) => sum + Number(l.amount), 0),
    invoiceName: t.invoice?.fileName ?? `${t.code.toLowerCase()}.pdf`,
    status: t.status,
  }));
}

// ── Map DB/demo status → display label understood by <Status> ─────────────────
function statusLabel(status: string) {
  switch (status) {
    case "PENDING_DEAN":
      return "Dean Review";
    case "APPROVED_BY_DEAN":
      return "Pending Final";   // includes "pending" → orange pill
    default:
      return "Cleared";
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────
import { currentUser, hasRole } from "@/lib/auth";
import { parseRole } from "@/lib/permissions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Approvals() {
  const user = process.env.DEMO_MODE === "true" 
    ? { role: parseRole((await cookies()).get("rd_demo_role")?.value) } 
    : await currentUser();
  if (!hasRole(user, ["DEAN", "SUPER_ADMIN"])) {
    redirect("/dashboard");
  }

  const rows = await getRows();
  const pendingCount = rows.filter((r) => r.status === "PENDING_DEAN").length;

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">Approval queue</h1>
          <div className="eyebrow">
            Review every transaction before funds are released
          </div>
        </div>
        <span className="pill orange">
          <i />{pendingCount} awaiting Dean review
        </span>
      </div>
      <div className="notice">
        <ClipboardCheck size={17} /> Dean review is required. Super Admin can
        change a recorded decision when needed.
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>TRANSACTION</th>
              <th>PROJECT</th>
              <th>SUBMITTED BY</th>
              <th>AMOUNT</th>
              <th>INVOICE</th>
              <th>STATUS</th>
              <th>DECISION</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    color: "#66717a",
                    padding: "32px 0",
                  }}
                >
                  No transactions awaiting approval.
                </td>
              </tr>
            ) : (
              rows.map((t) => (
                <tr key={t.code}>
                  <td>
                    {t.code}
                    <span className="sub">{t.date}</span>
                  </td>
                  <td>
                    <Link
                      className="table-link"
                      href={`/transactions/${t.code}`}
                    >
                      {t.project}
                    </Link>
                  </td>
                  <td>{t.submittedBy}</td>
                  <td>{money(t.amount)}</td>
                  <td>📄 {t.invoiceName}</td>
                  <td>
                    <Status status={statusLabel(t.status)} />
                  </td>
                  <td>
                    <ApprovalActions code={t.code} status={t.status} />
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
