import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { demoTransactions, money } from "@/lib/domain";
import { Status } from "../ui";
import { ApprovalActions } from "./approval-actions";

export default function Approvals() {
  return <main className="content"><div className="page-header"><div><h1 className="title">Approval queue</h1><div className="eyebrow">Review every transaction before funds are released</div></div><span className="pill orange"><i/>1 awaiting Dean review</span></div><div className="notice"><ClipboardCheck size={17}/> Dean review is required. Super Admin can change a recorded decision when needed.</div><div className="table-wrap"><table className="table"><thead><tr><th>TRANSACTION</th><th>PROJECT</th><th>SUBMITTED BY</th><th>AMOUNT</th><th>INVOICE</th><th>STATUS</th><th>DECISION</th></tr></thead><tbody>{demoTransactions.map((t) => <tr key={t.id}><td>{t.id}<span className="sub">{t.date}</span></td><td><Link className="table-link" href={`/transactions/${t.id}`}>{t.project}</Link></td><td>Dr. Arvind Kumar</td><td>{money(t.amount)}</td><td>📄 {t.id.toLowerCase()}.pdf</td><td><Status status={t.status === "PENDING_DEAN" ? "Dean Review" : "Cleared"}/></td><td><ApprovalActions code={t.id} status={t.status}/></td></tr>)}</tbody></table></div></main>;
}
