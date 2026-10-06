import Link from "next/link";
import {
  IndianRupee,
  BriefcaseBusiness,
  ClipboardCheck,
  WalletCards,
} from "lucide-react";
import { TransactionStatus as PrismaStatus } from "@prisma/client";
import {
  demoAccounts,
  demoProjects,
  demoTransactions,
  money,
  type Role,
  type TransactionStatus,
} from "@/lib/domain";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { Status } from "../ui";

// ── Normalised types used by the render layer ─────────────────────────────────
type ProjectRow = {
  id: string;
  code: string;
  name: string;
  funder: string;
  duration: string;
  budget: number;
  spent: number;
  status: string;
};

type TxRow = {
  id: string;
  date: string;
  vendor: string;
  purpose: string;
  project: string;
  amount: number;
  status: TransactionStatus;
};

type DashboardData = {
  projectCount: number;
  totalSanctioned: number;
  approvedSpend: number;
  availableBalance: number;
  /** Dean: # of PENDING_DEAN txns; Admin: # of APPROVED_BY_DEAN txns */
  reviewCount: number;
  projects: ProjectRow[];
  transactions: TxRow[];
};

// ── Derive a human project status from DB fields ──────────────────────────────
function deriveProjectStatus(endDate: Date, budget: number, spent: number) {
  const daysLeft =
    (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "Completed";
  if (daysLeft < 90) return "Nearing Completion";
  if (budget > 0 && spent / budget < 0.05) return "Just Started";
  return "Active";
}

// ── Map a DB status to the label <Status> understands ────────────────────────
function txStatusLabel(s: string): string {
  switch (s) {
    case "APPROVED":
      return "Cleared";
    case "REJECTED":
      return "Rejected";
    case "APPROVED_BY_DEAN":
      return "Pending Final";
    default:
      return "Pending Approval"; // DRAFT + PENDING_DEAN
  }
}

// ── Demo data in the normalised shape ─────────────────────────────────────────
function getDemoData(): DashboardData {
  return {
    projectCount: 4,
    totalSanctioned: 3250000,
    approvedSpend: 1284500,
    availableBalance: 1790500,
    reviewCount: 1,
    projects: demoProjects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      funder: p.funder,
      duration: p.duration,
      budget: p.budget,
      spent: p.spent,
      status: p.status,
    })),
    transactions: demoTransactions.map((t) => ({
      id: t.id,
      date: t.date,
      vendor: t.vendor,
      purpose: t.purpose,
      project: t.project,
      amount: t.amount,
      status: t.status,
    })),
  };
}

// ── Real DB data ──────────────────────────────────────────────────────────────
async function getDbData(role: Role, userId: string | null): Promise<DashboardData> {
  const isInspector = role === "INSPECTOR";
  const isDean = role === "DEAN";
  const isAdmin = role === "SUPER_ADMIN";

  // Scope filter for inspector (only their projects)
  const projectScope = isInspector && userId ? { ownerId: userId } : {};
  // Use the Prisma enum so the type satisfies `TransactionStatus[]`
  const approvedStatuses: PrismaStatus[] = [
    PrismaStatus.APPROVED,
    PrismaStatus.APPROVED_BY_DEAN,
  ];

  // ── KPI aggregates ──────────────────────────────────────────────────────────
  const [projectAgg, spentAgg, reviewCount] = await Promise.all([
    db.project.aggregate({
      _sum: { totalBudget: true },
      _count: { id: true },
      where: projectScope,
    }),

    db.transactionLine.aggregate({
      _sum: { amount: true },
      where: {
        transaction: {
          status: { in: approvedStatuses },
          ...(isInspector && userId ? { project: { ownerId: userId } } : {}),
        },
      },
    }),

    isDean
      ? db.transaction.count({ where: { status: "PENDING_DEAN" } })
      : isAdmin
        ? db.transaction.count({ where: { status: "APPROVED_BY_DEAN" } })
        : Promise.resolve(0),
  ]);

  const totalSanctioned = Number(projectAgg._sum?.totalBudget ?? 0);
  const approvedSpend = Number(spentAgg._sum?.amount ?? 0);

  // ── Projects table (most recent 5) ─────────────────────────────────────────
  const projectsRaw = await db.project.findMany({
    where: projectScope,
    include: {
      funders: {
        include: { organization: { select: { name: true } } },
        take: 1,
      },
      transactions: {
        where: { status: { in: approvedStatuses } },
        include: { lines: { select: { amount: true } } },
      },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const projects: ProjectRow[] = projectsRaw.map((p) => {
    const spent = p.transactions
      .flatMap((t) => t.lines)
      .reduce((sum, l) => sum + Number(l.amount), 0);
    const budget = Number(p.totalBudget);
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      funder: p.funders[0]?.organization.name ?? "—",
      duration: `${p.startDate.getFullYear()}–${p.endDate.getFullYear()}`,
      budget,
      spent,
      status: deriveProjectStatus(p.endDate, budget, spent),
    };
  });

  // ── Transactions table (most recent 5) ─────────────────────────────────────
  const txWhere = isInspector && userId
    ? { project: { ownerId: userId } }
    : isDean
      ? { status: "PENDING_DEAN" as const }
      : {};

  const txsRaw = await db.transaction.findMany({
    where: txWhere,
    include: {
      project: { select: { code: true } },
      lines: { select: { amount: true } },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const transactions: TxRow[] = txsRaw.map((t) => ({
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
    status: t.status as TransactionStatus,
  }));

  return {
    projectCount: projectAgg._count.id,
    totalSanctioned,
    approvedSpend,
    availableBalance: totalSanctioned - approvedSpend,
    reviewCount,
    projects,
    transactions,
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
import { cookies } from "next/headers";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const rawRole = cookieStore.get("rd_demo_role")?.value;
  const role = (
    rawRole === "DEAN" || rawRole === "SUPER_ADMIN"
      ? rawRole
      : "INSPECTOR"
  ) as Role;

  const isDemo = process.env.DEMO_MODE === "true";

  // Identity: demo uses the demoAccounts array; real uses the session user
  const sessionUser = isDemo ? null : await currentUser();
  const account = isDemo
    ? demoAccounts.find((a) => a.role === role) ?? demoAccounts[0]
    : {
        name: sessionUser?.name ?? role,
        title:
          role === "DEAN"
            ? "Dean of Research & Development"
            : role === "SUPER_ADMIN"
              ? "Super Admin"
              : "Project Inspector",
        focus:
          role === "DEAN"
            ? "Review every transaction awaiting Dean approval"
            : role === "SUPER_ADMIN"
              ? "Complete final approvals, users, and audit oversight"
              : "Manage your projects and submit invoice-backed spend",
      };

  const data = isDemo
    ? getDemoData()
    : await getDbData(role, sessionUser?.id ?? null);

  const isInspector = role === "INSPECTOR";
  const isDean = role === "DEAN";

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <div className="role-kicker">
            <span className="pill blue">
              {isDemo ? "Demo account" : "Signed in"}
            </span>
            <span>{account.title}</span>
          </div>
          <h1 className="title">
            Good morning, {account.name.replace(/^(Dr\.|Prof\.) /, "")}
          </h1>
          <div className="eyebrow">
            {isInspector ? "Your R&D fund overview" : account.focus}
          </div>
        </div>
        <Link className="primary" href="/projects/new">
          ＋ New Project
        </Link>
      </div>

      {/* ── KPI cards ── */}
      <section className="cards">
        <Metric
          label={isInspector ? "ACTIVE PROJECTS" : "PROJECTS IN VIEW"}
          value={String(data.projectCount)}
          icon={<BriefcaseBusiness size={18} />}
        />
        <Metric
          label="TOTAL SANCTIONED"
          value={money(data.totalSanctioned)}
          icon={<IndianRupee size={18} />}
        />
        <Metric
          label={
            isDean
              ? "PENDING REVIEW"
              : role === "SUPER_ADMIN"
                ? "FINAL APPROVALS"
                : "APPROVED SPEND"
          }
          value={
            isInspector
              ? money(data.approvedSpend)
              : String(data.reviewCount)
          }
          icon={
            isInspector ? (
              <IndianRupee size={18} />
            ) : (
              <ClipboardCheck size={18} />
            )
          }
        />
        <Metric
          label="AVAILABLE BALANCE"
          value={money(data.availableBalance)}
          icon={<WalletCards size={18} />}
          green
        />
      </section>

      {/* ── Projects table ── */}
      <section>
        <div className="section-heading">
          <h2>{isInspector ? "My Projects" : "Projects Overview"}</h2>
          <Link className="link" href="/projects">
            View All →
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>PROJECT</th>
                <th>FUNDING AGENCY</th>
                <th>DURATION</th>
                <th>BUDGET</th>
                <th>UTILISATION</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      color: "#66717a",
                      padding: "28px 0",
                    }}
                  >
                    No projects found.
                  </td>
                </tr>
              ) : (
                data.projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        className="table-link"
                        href={`/projects/${p.id}`}
                      >
                        {p.name}
                      </Link>
                      <span className="sub">{p.code}</span>
                    </td>
                    <td>{p.funder}</td>
                    <td>{p.duration}</td>
                    <td>{money(p.budget)}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div className="progress">
                          <i
                            style={{
                              width: `${p.budget > 0 ? Math.min((p.spent / p.budget) * 100, 100) : 0}%`,
                            }}
                          />
                        </div>
                        <span>
                          {p.budget > 0
                            ? Math.round((p.spent / p.budget) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    </td>
                    <td>
                      <Status status={p.status} />
                    </td>
                    <td>
                      <Link
                        className="dots"
                        href={`/projects/${p.id}`}
                        aria-label={`Open ${p.name}`}
                      >
                        ⋮
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Transactions table ── */}
      <section>
        <div className="section-heading">
          <h2>
            {isDean ? "Pending Dean Review" : "Recent Transactions"}
          </h2>
          <Link className="link" href="/transactions">
            View All →
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
              </tr>
            </thead>
            <tbody>
              {data.transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                data.transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.date}</td>
                    <td>
                      {t.vendor}
                      <span className="sub">{t.purpose}</span>
                    </td>
                    <td>
                      <Link
                        className="table-link"
                        href={`/transactions/${t.id}`}
                      >
                        {t.project}
                      </Link>
                    </td>
                    <td>{money(t.amount)}</td>
                    <td>
                      <Status
                        status={
                          isDemo
                            ? t.status === "APPROVED"
                              ? "Cleared"
                              : "Pending Approval"
                            : txStatusLabel(t.status)
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────
function Metric({
  label,
  value,
  icon,
  green,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  green?: boolean;
}) {
  return (
    <div className="card">
      <div className="card-label">
        <span>{label}</span>
        <span className="card-icon">{icon}</span>
      </div>
      <div className={`metric ${green ? "green" : ""}`}>{value}</div>
    </div>
  );
}
