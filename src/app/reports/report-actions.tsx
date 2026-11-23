"use client";
import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import type { TxCsvRow } from "@/app/api/reports/transactions/route";

// ── CSV helpers ───────────────────────────────────────────────────────────────
const HEADERS: (keyof TxCsvRow)[] = [
  "id",
  "date",
  "vendor",
  "purpose",
  "project",
  "category",
  "amount",
  "status",
];

const HEADER_LABELS: Record<keyof TxCsvRow, string> = {
  id: "Transaction ID",
  date: "Date",
  vendor: "Vendor",
  purpose: "Purpose",
  project: "Project",
  category: "Category",
  amount: "Amount",
  status: "Status",
};

function toCsv(rows: TxCsvRow[]): string {
  const escape = (v: string) => `"${String(v).replaceAll('"', '""')}"`;
  const header = HEADERS.map((k) => escape(HEADER_LABELS[k])).join(",");
  const body = rows
    .map((r) => HEADERS.map((k) => escape(r[k])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

function downloadBlob(content: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ExportActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<TxCsvRow[] | null>(null);

  useEffect(() => {
    if (!rows) return;
    const timer = window.setTimeout(() => window.print(), 150);
    return () => window.clearTimeout(timer);
  }, [rows]);

  async function exportCsv() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reports/transactions");
      if (!res.ok) throw new Error("Failed to fetch transaction data.");
      const rows: TxCsvRow[] = await res.json();
      downloadBlob(toCsv(rows), "rd-transaction-history.csv");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setLoading(false);
    }
  }

  async function printHistory() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/reports/transactions", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch transaction history.");
      setRows(await response.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Print failed.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows && <div className="history-preview">
        <div className="history-toolbar no-print"><strong>Transaction history preview</strong> <button onClick={() => window.print()}>Print / save PDF</button> <button onClick={() => setRows(null)}>Close</button></div>
        <div className="history-document"><h1>Transaction History</h1><p>Generated {new Date().toLocaleDateString("en-IN")}</p>
          <table><thead><tr>{HEADERS.map((key) => <th key={key}>{HEADER_LABELS[key]}</th>)}</tr></thead>
          <tbody>{rows.map((row, i) => <tr key={`${row.id}-${i}`}>{HEADERS.map((key) => <td key={key}>{row[key]}</td>)}</tr>)}</tbody></table>
          {rows.length === 0 && <p>No transactions found.</p>}
        </div>
      </div>}
      {error && (
        <span style={{ fontSize: 12, color: "#b71329" }}>{error}</span>
      )}
      <div className="report-actions">
        <button className="primary" onClick={exportCsv} disabled={loading}>
          {loading ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <FileSpreadsheet size={16} />
          )}{" "}
          {loading ? "Exporting…" : "Export Excel-compatible CSV"}
        </button>
        <button className="secondary" onClick={printHistory} disabled={loading}>
          <FileText size={16} /> Print / save PDF
        </button>
      </div>
    </div>
  );
}

export function DownloadButton({ label }: { label: string }) {
  return (
    <button className="secondary" onClick={() => window.print()}>
      <Download size={16} /> {label}
    </button>
  );
}
