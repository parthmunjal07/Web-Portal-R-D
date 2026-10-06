import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileBarChart2,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import { demoProjects, money } from "@/lib/domain";
import { db } from "@/lib/db";
import { ExportActions } from "./report-actions";
import { ClosureSelector } from "./closure-selector";

// ── Readiness state per project ───────────────────────────────────────────────
type ReadinessState = "ready" | "pending" | "no-activity";

type ReadinessRow = {
  id: string;
  code: string;
  name: string;
  approvedSpend: number;
  state: ReadinessState;
  pendingCount: number;
};

// ── Data source ───────────────────────────────────────────────────────────────
async function getReadiness(): Promise<ReadinessRow[]> {
  // Demo: original data, all show "Ready"
  if (process.env.DEMO_MODE === "true") {
    return demoProjects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      approvedSpend: p.spent,
      state: "ready",
      pendingCount: 0,
    }));
  }

  // Real DB: all projects with their transaction statuses + approved spend
  const rows = await db.project.findMany({
    include: {
      transactions: {
        select: {
          status: true,
          lines: { select: { amount: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((p) => {
    const pending = p.transactions.filter(
      (t) => t.status === "PENDING_DEAN" || t.status === "APPROVED_BY_DEAN",
    );
    const approvedSpend = p.transactions
      .filter((t) => t.status === "APPROVED" || t.status === "APPROVED_BY_DEAN")
      .flatMap((t) => t.lines)
      .reduce((sum, l) => sum + Number(l.amount), 0);

    const state: ReadinessState =
      p.transactions.length === 0
        ? "no-activity"
        : pending.length > 0
          ? "pending"
          : "ready";

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      approvedSpend,
      state,
      pendingCount: pending.length,
    };
  });
}

// ── Readiness badge ───────────────────────────────────────────────────────────
function ReadinessBadge({ row }: { row: ReadinessRow }) {
  if (row.state === "ready")
    return (
      <span className="ready">
        <CheckCircle2 size={15} /> Ready
      </span>
    );
  if (row.state === "pending")
    return (
      <span className="not-ready">
        <Clock size={15} /> {row.pendingCount} pending
      </span>
    );
  return (
    <span className="pill" style={{ color: "#66717a", background: "#f1f3f5" }}>
      <AlertCircle size={13} /> No activity
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function Reports() {
  const projects = await getReadiness();
  const readyCount = projects.filter((p) => p.state === "ready").length;

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">Reports &amp; closure</h1>
          <div className="eyebrow">
            Export auditable project history and close completed grants
          </div>
        </div>
      </div>

      <div className="report-hero">
        <div>
          <span className="pill blue">Reporting centre</span>
          <h2>Everything you need for review and closure</h2>
          <p>
            Download transaction history for analysis or create a print-ready
            closure pack containing project totals and approved invoices.
          </p>
        </div>
        <FileBarChart2 size={56} strokeWidth={1.2} />
      </div>

      <section className="report-grid">
        <div className="panel report-card">
          <div className="report-card-icon">
            <FileBarChart2 size={22} />
          </div>
          <h2>Transaction history</h2>
          <p>
            Includes every transaction, status, vendor, project, category, and
            amount in a spreadsheet-friendly format.
          </p>
          <ExportActions />
        </div>
        <div className="panel report-card">
          <div className="report-card-icon green-icon">
            <FileCheck2 size={22} />
          </div>
          <h2>Closure document</h2>
          <p>
            Use your browser print dialog to save a PDF summary with project
            balances and approved bills.
          </p>
          <ClosureSelector projects={projects.map(p => ({ id: p.id, name: p.name, code: p.code }))} />
        </div>
      </section>

      {/* ── Readiness panel ── */}
      <div className="panel">
        <div className="section-heading">
          <div>
            <h2>Project reporting readiness</h2>
            <span className="sub">
              Projects with complete category totals and approval history
            </span>
          </div>
          <ShieldCheck size={22} color="#059669" />
        </div>

        {projects.length === 0 ? (
          <p className="sub" style={{ paddingTop: 16 }}>
            No projects found.
          </p>
        ) : (
          <>
            {/* Summary line for real mode */}
            {process.env.DEMO_MODE !== "true" && (
              <p className="sub" style={{ marginBottom: 4 }}>
                {readyCount} of {projects.length} project
                {projects.length !== 1 ? "s" : ""} ready for closure
              </p>
            )}

            {projects.map((p) => (
              <div className="readiness-row" key={p.id}>
                <div>
                  <Link className="table-link" href={`/projects/${p.id}`}>
                    {p.name}
                  </Link>
                  <span className="sub">
                    {p.code} · {money(p.approvedSpend)} approved spend
                  </span>
                </div>
                <ReadinessBadge row={p} />
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
