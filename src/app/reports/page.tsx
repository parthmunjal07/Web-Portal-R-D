import Link from "next/link";
import {
  CheckCircle2,
  FileBarChart2,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import { demoProjects, money } from "@/lib/domain";
import { ExportActions } from "./report-actions";

export default function Reports() {
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
          <Link className="primary" href="/projects">
            Choose project →
          </Link>
        </div>
      </section>
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
        {demoProjects.map((p) => (
          <div className="readiness-row" key={p.id}>
            <div>
              <Link className="table-link" href={`/projects/${p.id}`}>
                {p.name}
              </Link>
              <span className="sub">
                {p.code} · {money(p.spent)} approved spend
              </span>
            </div>
            <span className="ready">
              <CheckCircle2 size={15} /> Ready
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
