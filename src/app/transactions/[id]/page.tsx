import { notFound } from "next/navigation";
import { TransactionStatus as PrismaStatus } from "@prisma/client";
import { demoTransactions, money } from "@/lib/domain";
import { db } from "@/lib/db";
import { Status } from "../../ui";

// ── Normalised shape ──────────────────────────────────────────────────────────
type ApprovalEntry = {
  at: string;
  label: string;
  by: string;
};

type TxDetail = {
  code: string;
  projectName: string;
  date: string;
  vendor: string;
  category: string;
  description: string;
  amount: number;
  statusLabel: string;
  // Budget impact (first line's category)
  categoryAllocation: number;
  alreadyApprovedInCategory: number;
  // Invoice
  invoiceFileName: string;
  invoiceUrl: string | null;
  // Approval timeline
  createdAt: string;
  createdBy: string;
  approvals: ApprovalEntry[];
  currentStep: string | null;
};

// ── Status → display label ────────────────────────────────────────────────────
function statusLabel(s: string): string {
  switch (s) {
    case "APPROVED":         return "Cleared";
    case "REJECTED":         return "Rejected";
    case "APPROVED_BY_DEAN": return "Pending Final Approval";
    case "DRAFT":            return "Draft";
    default:                 return "Pending Dean Review"; // PENDING_DEAN
  }
}

// ── Current step label (null = resolved) ─────────────────────────────────────
function currentStep(s: string): string | null {
  switch (s) {
    case "DRAFT":            return "Awaiting submission by Inspector";
    case "PENDING_DEAN":     return "Pending Dean review";
    case "APPROVED_BY_DEAN": return "Pending final approval (Super Admin)";
    default:                 return null; // APPROVED / REJECTED — fully resolved
  }
}

// ── Data source ───────────────────────────────────────────────────────────────
async function getTxDetail(id: string): Promise<TxDetail> {
  // ── Demo path ──────────────────────────────────────────────────────────────
  if (process.env.DEMO_MODE === "true") {
    const t =
      demoTransactions.find((x) => x.id === id) ?? demoTransactions[0];
    return {
      code: t.id,
      projectName: "AI-Based Crop Disease Detection",
      date: t.date,
      vendor: t.vendor,
      category: "Equipment",
      description: "GPU servers for model training and image processing workloads.",
      amount: t.amount,
      statusLabel: statusLabel(t.status),
      categoryAllocation: 700000,
      alreadyApprovedInCategory: 350000,
      invoiceFileName: `${t.id.toLowerCase()}.pdf`,
      invoiceUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      createdAt: "28 Aug 2026, 10:45 AM",
      createdBy: "Dr. Arvind Kumar (PI)",
      approvals: [],
      currentStep: currentStep(t.status),
    };
  }

  // ── Real DB path ──────────────────────────────────────────────────────────
  // Transaction URL param is the transaction code
  const tx = await db.transaction.findUnique({
    where: { code: id },
    include: {
      project: { select: { name: true, code: true } },
      lines: {
        include: {
          category: { select: { id: true, name: true, allocated: true } },
        },
      },
      invoice: { select: { fileName: true, storageKey: true } },
      approvals: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!tx) notFound();

  // Batch-fetch names for creator + all reviewers (no direct relations in schema)
  const userIds = [
    tx.createdById,
    ...tx.approvals.map((a) => a.reviewerId),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const byId = Object.fromEntries(users.map((u) => [u.id, u.name]));

  // Primary line (first one) for budget impact panel
  const firstLine = tx.lines[0];
  const txAmount = tx.lines.reduce((s, l) => s + Number(l.amount), 0);

  // Approved spend in that category from OTHER transactions
  let alreadyApproved = 0;
  if (firstLine) {
    const agg = await db.transactionLine.aggregate({
      _sum: { amount: true },
      where: {
        categoryId: firstLine.category.id,
        transaction: {
          status: { in: [PrismaStatus.APPROVED, PrismaStatus.APPROVED_BY_DEAN] },
          id: { not: tx.id },
        },
      },
    });
    alreadyApproved = Number(agg._sum?.amount ?? 0);
  }

  // Approval timeline entries
  const approvalEntries: ApprovalEntry[] = tx.approvals.map((a) => {
    const stageLabel =
      a.stage === "DEAN" ? "Dean" : "Super Admin";
    const decisionLabel =
      a.decision === "APPROVE" ? "approved" : "rejected";
    return {
      at: a.createdAt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      label: `${stageLabel} ${decisionLabel}${a.remarks ? ` — "${a.remarks}"` : ""}`,
      by: byId[a.reviewerId] ?? "Unknown",
    };
  });

  // Invoice download URL (only if S3_PUBLIC_BASE_URL is configured)
  const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const invoiceUrl =
    tx.invoice && base ? `${base}/${tx.invoice.storageKey}` : null;

  return {
    code: tx.code,
    projectName: tx.project.name,
    date: tx.date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    vendor: tx.vendor,
    category: firstLine?.category.name ?? "—",
    description: tx.description,
    amount: txAmount,
    statusLabel: statusLabel(tx.status),
    categoryAllocation: firstLine ? Number(firstLine.category.allocated) : 0,
    alreadyApprovedInCategory: alreadyApproved,
    invoiceFileName: tx.invoice?.fileName ?? "invoice",
    invoiceUrl,
    createdAt: tx.createdAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    createdBy: byId[tx.createdById] ?? "Unknown",
    approvals: approvalEntries,
    currentStep: currentStep(tx.status),
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
import { InvoiceViewer } from "./invoice-viewer";

export default async function TransactionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTxDetail(id);

  const afterThisTx = t.alreadyApprovedInCategory + t.amount;
  const remaining = t.categoryAllocation - afterThisTx;
  const usedPct =
    t.categoryAllocation > 0
      ? Math.min(Math.round((afterThisTx / t.categoryAllocation) * 100), 100)
      : 0;

  return (
    <main className="content">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="title">Transaction {t.code}</h1>
          <div className="eyebrow">
            Project:{" "}
            <span style={{ color: "#dc3545", fontWeight: 500 }}>
              {t.projectName}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="metric" style={{ fontSize: 24 }}>
            {money(t.amount)}
          </div>
          <Status status={t.statusLabel} />
        </div>
      </div>

      <div className="detail-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* ── Left column ── */}
        <div style={{ display: "grid", gap: 24 }}>
          {/* Transaction details */}
          <div className="panel">
            <h2>Transaction details</h2>
            <div className="stat-grid">
              <div className="stat">
                <span>Date</span>
                <strong style={{ fontSize: 15 }}>{t.date}</strong>
              </div>
              <div className="stat">
                <span>Vendor</span>
                <strong style={{ fontSize: 15 }}>{t.vendor}</strong>
              </div>
              <div className="stat">
                <span>Category</span>
                <strong style={{ fontSize: 15 }}>{t.category}</strong>
              </div>
            </div>
            <p style={{ marginTop: 22, color: "#40484f" }}>{t.description}</p>
          </div>

          {/* Budget impact */}
          <div className="panel">
            <h2>Budget impact</h2>
            <div className="stat-grid">
              <div className="stat">
                <span>Category allocation</span>
                <strong>{money(t.categoryAllocation)}</strong>
              </div>
              <div className="stat">
                <span>After this transaction</span>
                <strong>{money(afterThisTx)}</strong>
              </div>
              <div className="stat">
                <span>Remaining</span>
                <strong style={{ color: remaining >= 0 ? "#059669" : "#b71329" }}>
                  {money(Math.abs(remaining))}
                  {remaining < 0 ? " over" : ""}
                </strong>
              </div>
            </div>
            <div className="progress" style={{ marginTop: 24, height: 12 }}>
              <i style={{ width: `${usedPct}%` }} />
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <aside style={{ display: "grid", gap: 24 }}>
          {/* Invoice */}
          <div className="panel">
            <h2>Invoice preview</h2>
            <InvoiceViewer
              url={t.invoiceUrl}
              fileName={t.invoiceFileName}
              vendor={t.vendor}
            />
          </div>

          {/* Approval history */}
          <div className="panel">
            <h2>Approval history</h2>
            <div className="timeline">
              {/* Initiated */}
              <div className="timeline-item">
                <small>{t.createdAt}</small>
                <strong>Transaction initiated</strong>
                <span className="sub">By {t.createdBy}</span>
              </div>

              {/* Each approval decision */}
              {t.approvals.map((a, i) => (
                <div className="timeline-item" key={i}>
                  <small>{a.at}</small>
                  <strong style={{ textTransform: "capitalize" }}>
                    {a.label}
                  </strong>
                  <span className="sub">By {a.by}</span>
                </div>
              ))}

              {/* Current pending step */}
              {t.currentStep && (
                <div className="timeline-item">
                  <small>Current step</small>
                  <strong>{t.currentStep}</strong>
                  <span className="sub">Awaiting action</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
