import Link from "next/link";
import { TransactionStatus as PrismaStatus } from "@prisma/client";
import { demoProjects, money } from "@/lib/domain";
import { db } from "@/lib/db";
import { Status } from "../ui";

// ── Normalised row type ───────────────────────────────────────────────────────
type ProjectRow = {
  id: string;
  code: string;
  name: string;
  owner: string;
  funder: string;
  budget: number;
  spent: number;
  status: string;
};

// ── Derive a human status from DB fields ──────────────────────────────────────
function deriveStatus(endDate: Date, budget: number, spent: number): string {
  const daysLeft = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "Completed";
  if (daysLeft < 90) return "Nearing Completion";
  if (budget > 0 && spent / budget < 0.05) return "Just Started";
  return "Active";
}

// ── Data source ───────────────────────────────────────────────────────────────
async function getProjects(): Promise<ProjectRow[]> {
  // Demo: keep original data exactly
  if (process.env.DEMO_MODE === "true") {
    return demoProjects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      owner: "Dr. Arvind Kumar",
      funder: p.funder,
      budget: p.budget,
      spent: p.spent,
      status: p.status,
    }));
  }

  // Real DB: all projects with owner name, primary funder, and approved spend
  const rows = await db.project.findMany({
    include: {
      owner: { select: { name: true } },
      funders: {
        include: { organization: { select: { name: true } } },
        take: 1,
      },
      transactions: {
        where: {
          status: {
            in: [PrismaStatus.APPROVED, PrismaStatus.APPROVED_BY_DEAN],
          },
        },
        include: { lines: { select: { amount: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((p) => {
    const budget = Number(p.totalBudget);
    const spent = p.transactions
      .flatMap((t) => t.lines)
      .reduce((sum, l) => sum + Number(l.amount), 0);
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      owner: p.owner.name,
      funder: p.funders[0]?.organization.name ?? "—",
      budget,
      spent,
      status: deriveStatus(p.endDate, budget, spent),
    };
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function Projects() {
  const projects = await getProjects();

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">Projects</h1>
          <div className="eyebrow">
            All research projects and their funding position
          </div>
        </div>
        <Link className="primary" href="/projects/new">
          ＋ New Project
        </Link>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>PROJECT</th>
              <th>OWNER</th>
              <th>FUNDING</th>
              <th>BUDGET</th>
              <th>SPENT</th>
              <th>REMAINING</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
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
              projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link className="link" href={`/projects/${p.id}`}>
                      {p.name}
                    </Link>
                    <span className="sub">{p.code}</span>
                  </td>
                  <td>{p.owner}</td>
                  <td>{p.funder}</td>
                  <td>{money(p.budget)}</td>
                  <td>{money(p.spent)}</td>
                  <td>{money(p.budget - p.spent)}</td>
                  <td>
                    <Status status={p.status} />
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
