import { History, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";

// ── Normalised row shape ──────────────────────────────────────────────────────
type AuditRow = {
  id: string;
  action: string;
  entity: string;
  actor: string;
  date: string;
};

// ── Demo data ─────────────────────────────────────────────────────────────────
const demoEvents: AuditRow[] = [
  {
    id: "1",
    action: "Project created",
    entity: "RND-2026-014",
    actor: "Dr. Arvind Kumar",
    date: "17 Sep 2026, 10:02 AM",
  },
  {
    id: "2",
    action: "Transaction submitted",
    entity: "TXN-1842",
    actor: "Dr. Arvind Kumar",
    date: "17 Sep 2026, 10:45 AM",
  },
  {
    id: "3",
    action: "Dean review pending",
    entity: "TXN-1842",
    actor: "Prof. Meena Sharma",
    date: "17 Sep 2026, 11:12 AM",
  },
];

// ── Data source ───────────────────────────────────────────────────────────────
async function getAuditEvents(): Promise<AuditRow[]> {
  if (process.env.DEMO_MODE === "true") {
    return demoEvents;
  }

  const entries = await db.auditEntry.findMany({
    include: {
      actor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Batch resolve human-readable codes for known entities (Transaction, Project)
  const txIds = entries.filter((e) => e.entity === "Transaction").map((e) => e.entityId);
  const txs = await db.transaction.findMany({
    where: { id: { in: txIds } },
    select: { id: true, code: true },
  });
  const txMap = Object.fromEntries(txs.map((t) => [t.id, t.code]));

  const projIds = entries.filter((e) => e.entity === "Project").map((e) => e.entityId);
  const projs = await db.project.findMany({
    where: { id: { in: projIds } },
    select: { id: true, code: true },
  });
  const projMap = Object.fromEntries(projs.map((p) => [p.id, p.code]));

  return entries.map((entry) => {
    let readableEntity = entry.entityId;
    if (entry.entity === "Transaction") {
      readableEntity = txMap[entry.entityId] || entry.entityId;
    } else if (entry.entity === "Project") {
      readableEntity = projMap[entry.entityId] || entry.entityId;
    }

    return {
      id: entry.id,
      action: entry.action.replace(/_/g, " "), // Basic cleanup, e.g. "APPROVAL_APPROVE" -> "APPROVAL APPROVE"
      entity: readableEntity,
      actor: entry.actor.name,
      date: entry.createdAt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────
import { currentUser, hasRole } from "@/lib/auth";
import { parseRole } from "@/lib/permissions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Audit() {
  const user = process.env.DEMO_MODE === "true" 
    ? { role: parseRole((await cookies()).get("rd_demo_role")?.value) } 
    : await currentUser();
  if (!hasRole(user, ["SUPER_ADMIN"])) {
    redirect("/dashboard");
  }

  const events = await getAuditEvents();

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">Audit log</h1>
          <div className="eyebrow">
            Permanent record of administrative and approval activity
          </div>
        </div>
        <ShieldCheck size={30} color="#059669" />
      </div>
      <div className="panel">
        <div className="section-heading">
          <h2>Recent activity</h2>
          <History size={20} color="#66717a" />
        </div>
        <div className="audit-list">
          {events.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "#66717a" }}>
              No audit records found.
            </div>
          ) : (
            events.map(({ id, action, entity, actor, date }) => (
              <div className="audit-row" key={id}>
                <div className="audit-icon">
                  <History size={16} />
                </div>
                <div>
                  <strong style={{ textTransform: "capitalize" }}>{action.toLowerCase()}</strong>
                  <span className="sub">
                    {entity} · by {actor}
                  </span>
                </div>
                <time>{date}</time>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
