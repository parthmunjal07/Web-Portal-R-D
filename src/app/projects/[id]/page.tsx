import Link from "next/link";
import { demoProjects, money } from "@/lib/domain";
import { Status } from "../../ui";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = demoProjects.find((x) => x.id === id) || demoProjects[0];
  const categories = [["Equipment", 700000, 350000], ["Travel", 300000, 120000], ["Research Personnel", 500000, 205000]] as const;
  return <main className="content">
    <div className="page-header"><div><div style={{ display: "flex", gap: 12, alignItems: "center" }}><span className="pill blue">ID: {p.code}</span><Status status={p.status} /></div><h1 className="title" style={{ marginTop: 10 }}>{p.name}</h1><div className="eyebrow">PI: Dr. Arvind Kumar · {p.duration}</div></div><Link className="primary" href="/transactions/new">＋ Add transaction</Link></div>
    <div className="detail-grid">
      <div style={{ display: "grid", gap: 24 }}>
        <div className="panel"><h2>Budget overview</h2><div className="stat-grid"><div className="stat"><span>Total budget</span><strong>{money(p.budget)}</strong></div><div className="stat"><span>Approved spend</span><strong>{money(p.spent)}</strong></div><div className="stat"><span>Available balance</span><strong style={{ color: "#059669" }}>{money(p.budget - p.spent)}</strong></div></div><div style={{ marginTop: 24 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#66717a" }}><span>Overall utilisation</span><span>{Math.round(p.spent / p.budget * 100)}%</span></div><div className="progress" style={{ marginTop: 8, height: 12 }}><i style={{ width: `${p.spent / p.budget * 100}%` }} /></div></div></div>
        <div className="panel"><h2>Category allocation</h2>{categories.map(([name, allocated, spent]) => <div key={name} style={{ marginBottom: 18 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{name}</span><span>{money(spent)} / {money(allocated)}</span></div><div className="progress" style={{ marginTop: 7 }}><i style={{ width: `${spent / allocated * 100}%` }} /></div></div>)}</div>
      </div>
      <aside style={{ display: "grid", gap: 24 }}><div className="panel"><h2>Project details</h2><p className="sub">Funding agency</p><p>DST-SERB</p><p className="sub">Co-project inspectors</p><p>Dr. Neha Rao</p><p className="sub">Budget lock</p><p>Locked after creation</p></div><div className="panel"><h2>Recent transactions</h2><Link className="link" href="/transactions">View All →</Link></div></aside>
    </div>
  </main>;
}
