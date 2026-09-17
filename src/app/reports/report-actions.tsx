"use client";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { demoTransactions, money } from "@/lib/domain";

export function ExportActions() {
  function exportCsv() {
    const rows = [["Transaction ID", "Date", "Vendor", "Purpose", "Project", "Amount", "Status"], ...demoTransactions.map((t) => [t.id, t.date, t.vendor, t.purpose, t.project, money(t.amount), t.status])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "rd-transaction-history.csv"; anchor.click(); URL.revokeObjectURL(url);
  }
  return <div className="report-actions"><button className="primary" onClick={exportCsv}><FileSpreadsheet size={16} /> Export Excel-compatible CSV</button><button className="secondary" onClick={() => window.print()}><FileText size={16} /> Print / save PDF</button></div>;
}

export function DownloadButton({ label }: { label: string }) { return <button className="secondary" onClick={() => window.print()}><Download size={16} /> {label}</button>; }
