import Link from "next/link";
import { notFound } from "next/navigation";
import { TransactionStatus as PrismaStatus } from "@prisma/client";
import { demoProjects, money } from "@/lib/domain";
import { db } from "@/lib/db";
import { Status } from "../../ui";

type TimelineEvent = {
  id: string;
  date: Date;
  title: string;
  description: string;
};

// ── Normalised shape ──────────────────────────────────────────────────────────
type CategoryRow = { name: string; allocated: number; spent: number };
type ProjectData = {
  id: string;
  code: string;
  name: string;
  pi: string;
  duration: string;
  budget: number;
  spent: number;
  status: string;
  funders: string[];
  coInspectors: string[];
  categories: CategoryRow[];
  timeline: TimelineEvent[];
};

// ── Status helper ─────────────────────────────────────────────────────────────
function deriveStatus(endDate: Date, budget: number, spent: number): string {
  const daysLeft = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "Completed";
  if (daysLeft < 90) return "Nearing Completion";
  if (budget > 0 && spent / budget < 0.05) return "Just Started";
  return "Active";
}

// ── Data source ───────────────────────────────────────────────────────────────
async function getProject(id: string): Promise<ProjectData> {
  // Demo: find in array (fall back to first as original did)
  if (process.env.DEMO_MODE === "true") {
    const p = demoProjects.find((x) => x.id === id) ?? demoProjects[0];
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      pi: "Dr. Arvind Kumar",
      duration: p.duration,
      budget: p.budget,
      spent: p.spent,
      status: p.status,
      funders: ["DST-SERB"],
      coInspectors: ["Dr. Neha Rao"],
      categories: [
        { name: "Equipment", allocated: 700000, spent: 350000 },
        { name: "Travel", allocated: 300000, spent: 120000 },
        { name: "Research Personnel", allocated: 500000, spent: 205000 },
      ],
      timeline: [
        {
          id: "e1",
          date: new Date("2023-04-01T10:00:00Z"),
          title: "Project created",
          description: "Project RND-2026-014 was created by Dr. Arvind Kumar.",
        },
        {
          id: "e2",
          date: new Date("2026-08-28T14:30:00Z"),
          title: "Transaction submitted",
          description: "Transaction TXN-1842 was submitted for INR 42,500.",
        },
      ],
    };
  }

  // Real DB
  const row = await db.project.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true } },
      funders: { include: { organization: { select: { name: true } } } },
      coInspectors: { select: { name: true } },
      categories: {
        include: {
          lines: {
            select: { amount: true },
            where: {
              transaction: {
                status: {
                  in: [PrismaStatus.APPROVED, PrismaStatus.APPROVED_BY_DEAN],
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      },
      transactions: {
        include: {
          lines: { select: { amount: true } },
          approvals: true,
        },
      },
    },
  });

  if (!row) notFound();

  const budget = Number(row.totalBudget);
  const categories: CategoryRow[] = row.categories.map((c) => ({
    name: c.name,
    allocated: Number(c.allocated),
    spent: c.lines.reduce((sum, l) => sum + Number(l.amount), 0),
  }));
  const spent = categories.reduce((sum, c) => sum + c.spent, 0);

  const timeline: TimelineEvent[] = [];
  timeline.push({
    id: `proj_${row.id}`,
    date: row.createdAt,
    title: "Project created",
    description: `Project ${row.code} was created by ${row.owner.name}.`,
  });

  const reviewerIds = [
    ...new Set(row.transactions.flatMap((t) => t.approvals.map((a) => a.reviewerId))),
  ];
  const reviewers = await db.user.findMany({
    where: { id: { in: reviewerIds } },
    select: { id: true, name: true },
  });
  const reviewerMap = new Map(reviewers.map((r) => [r.id, r.name]));

  for (const t of row.transactions) {
    const totalAmount = t.lines.reduce((sum, l) => sum + Number(l.amount), 0);
    timeline.push({
      id: `txn_${t.id}`,
      date: t.createdAt,
      title: "Transaction submitted",
      description: `Transaction ${t.code} was submitted for ${money(
        totalAmount
      )}.`,
    });
    for (const a of t.approvals) {
      const reviewerName = reviewerMap.get(a.reviewerId) || a.reviewerId;
      timeline.push({
        id: `appr_${a.id}`,
        date: a.createdAt,
        title: `Transaction ${a.decision.toLowerCase()}`,
        description: `Transaction ${t.code} was ${a.decision.toLowerCase()} by ${reviewerName} (${a.stage}).`,
      });
    }
  }

  timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    pi: row.owner.name,
    duration: `${row.startDate.getFullYear()}–${row.endDate.getFullYear()}`,
    budget,
    spent,
    status: deriveStatus(row.endDate, budget, spent),
    funders: row.funders.map((f) => f.organization.name),
    coInspectors: row.coInspectors.map((c) => c.name),
    categories,
    timeline,
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProject(id);

  const utilisationPct =
    p.budget > 0 ? Math.min(Math.round((p.spent / p.budget) * 100), 100) : 0;

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span className="pill blue">ID: {p.code}</span>
            <Status status={p.status} />
          </div>
          <h1 className="title" style={{ marginTop: 10 }}>
            {p.name}
          </h1>
          <div className="eyebrow">
            PI: {p.pi} · {p.duration}
          </div>
        </div>
        <Link className="primary" href="/transactions/new">
          ＋ Add transaction
        </Link>
      </div>

      <div className="detail-grid">
        {/* ── Left column ── */}
        <div style={{ display: "grid", gap: 24 }}>
          {/* Budget overview */}
          <div className="panel">
            <h2>Budget overview</h2>
            <div className="stat-grid">
              <div className="stat">
                <span>Total budget</span>
                <strong>{money(p.budget)}</strong>
              </div>
              <div className="stat">
                <span>Approved spend</span>
                <strong>{money(p.spent)}</strong>
              </div>
              <div className="stat">
                <span>Available balance</span>
                <strong style={{ color: "#059669" }}>
                  {money(p.budget - p.spent)}
                </strong>
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#66717a",
                }}
              >
                <span>Overall utilisation</span>
                <span>{utilisationPct}%</span>
              </div>
              <div className="progress" style={{ marginTop: 8, height: 12 }}>
                <i style={{ width: `${utilisationPct}%` }} />
              </div>
            </div>
          </div>

          {/* Category allocation */}
          <div className="panel">
            <h2>Category allocation</h2>
            {p.categories.map((cat) => {
              const pct =
                cat.allocated > 0
                  ? Math.min(
                      Math.round((cat.spent / cat.allocated) * 100),
                      100,
                    )
                  : 0;
              return (
                <div key={cat.name} style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span>{cat.name}</span>
                    <span>
                      {money(cat.spent)} / {money(cat.allocated)}
                    </span>
                  </div>
                  <div className="progress" style={{ marginTop: 7 }}>
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right column ── */}
        <aside style={{ display: "grid", gap: 24 }}>
          <div className="panel">
            <h2>Project details</h2>

            <p className="sub">Funding agency</p>
            <p>{p.funders.length > 0 ? p.funders.join(", ") : "—"}</p>

            <p className="sub">Co-project inspectors</p>
            <p>
              {p.coInspectors.length > 0 ? p.coInspectors.join(", ") : "—"}
            </p>

            <p className="sub">Budget lock</p>
            <p>Locked after creation</p>
          </div>

          <div className="panel">
            <h2>Recent transactions</h2>
            <Link className="link" href="/transactions">
              View All →
            </Link>
          </div>
        </aside>
      </div>
      
      {/* ── Bottom Section: Timeline ── */}
      <div className="panel" style={{ marginTop: 24 }}>
        <h2>Project Timeline</h2>
        <div className="timeline" style={{ marginTop: 24 }}>
          {p.timeline.map((event) => (
            <div className="timeline-item" key={event.id}>
              <small>
                {new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(event.date)}
              </small>
              <strong>{event.title}</strong>
              <p style={{ margin: 0, fontSize: 13, color: "#66717a" }}>
                {event.description}
              </p>
            </div>
          ))}
          {p.timeline.length === 0 && (
            <p style={{ color: "#66717a" }}>No events recorded.</p>
          )}
        </div>
      </div>
    </main>
  );
}
