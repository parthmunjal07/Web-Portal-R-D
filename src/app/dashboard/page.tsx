import Link from "next/link";
import { IndianRupee, BriefcaseBusiness, DollarSign, ClipboardCheck, WalletCards } from "lucide-react";
import { demoAccounts, demoProjects, demoTransactions, money, type Role } from "@/lib/domain";
import { Status } from "../ui";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const params = await searchParams;
  const role = (params.role === "DEAN" || params.role === "SUPER_ADMIN" ? params.role : "INSPECTOR") as Role;
  const account = demoAccounts.find((item) => item.role === role) || demoAccounts[0];
  const isInspector = role === "INSPECTOR";
  return <main className="content">
    <div className="page-header">
      <div>
        <div className="role-kicker">
          <span className="pill blue">
            Demo account
          </span>
          <span>{account.title}</span>
        </div>
        <h1 className="title">Good morning, {account.name.replace(/^(Dr\.|Prof\.) /, "")}
        </h1><div className="eyebrow">
          {isInspector ? "Your R&D fund overview" : account.focus}</div></div>
          <Link className="primary" href="/projects/new">＋ New Project</Link>
        </div>
    <section className="cards"><Metric label={isInspector ? "ACTIVE PROJECTS" : "PROJECTS IN VIEW"} value="4" icon={<BriefcaseBusiness size={18} />} /><Metric label="TOTAL SANCTIONED" value={money(3250000)} icon={<IndianRupee size={18} />} /><Metric label={role === "DEAN" ? "PENDING REVIEW" : role === "SUPER_ADMIN" ? "FINAL APPROVALS" : "APPROVED SPEND"} value={role === "INSPECTOR" ? money(1284500) : "1"} icon={role === "INSPECTOR" ? <DollarSign size={18} /> : <ClipboardCheck size={18} />} /><Metric label="AVAILABLE BALANCE" value={money(1790500)} icon={<WalletCards size={18} />} green /></section>
    <section><div className="section-heading"><h2>{isInspector ? "My Projects" : "Projects Overview"}</h2><Link className="link" href="/projects">View All →</Link></div><div className="table-wrap"><table className="table"><thead><tr><th>PROJECT</th><th>FUNDING AGENCY</th><th>DURATION</th><th>BUDGET</th><th>UTILISATION</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{demoProjects.map((p) => <tr key={p.id}><td><Link className="table-link" href={`/projects/${p.id}`}>{p.name}</Link><span className="sub">{p.code}</span></td><td>{p.funder}</td><td>{p.duration}</td><td>{money(p.budget)}</td><td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div className="progress"><i style={{ width: `${p.spent / p.budget * 100}%` }} /></div><span>{Math.round(p.spent / p.budget * 100)}%</span></div></td><td><Status status={p.status} /></td><td><Link className="dots" href={`/projects/${p.id}`} aria-label={`Open ${p.name}`}>⋮</Link></td></tr>)}</tbody></table></div></section>
    <section><div className="section-heading"><h2>{role === "DEAN" ? "Pending Dean Review" : "Recent Transactions"}</h2><Link className="link" href="/transactions">View All →</Link></div><div className="table-wrap"><table className="table"><thead><tr><th>ID</th><th>DATE</th><th>VENDOR / PURPOSE</th><th>PROJECT</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{demoTransactions.map((t) => <tr key={t.id}><td>{t.id}</td><td>{t.date}</td><td>{t.vendor}<span className="sub">{t.purpose}</span></td><td><Link className="table-link" href={`/transactions/${t.id}`}>{t.project}</Link></td><td>{money(t.amount)}</td><td><Status status={t.status === "APPROVED" ? "Cleared" : "Pending Approval"} /></td></tr>)}</tbody></table></div></section>
  </main>;
}
function Metric({ label, value, icon, green }: { label: string; value: string; icon: React.ReactNode; green?: boolean }) { return <div className="card"><div className="card-label"><span>{label}</span><span className="card-icon">{icon}</span></div><div className={`metric ${green ? "green" : ""}`}>{value}</div></div>; }
