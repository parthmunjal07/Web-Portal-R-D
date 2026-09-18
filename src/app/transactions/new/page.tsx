"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { parseRole } from "@/lib/permissions";

export default function NewTransaction() {
  const router = useRouter();
  const role = parseRole(
    typeof window === "undefined"
      ? undefined
      : new URLSearchParams(window.location.search).get("role") || undefined,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    projectId: "demo-project",
    date: "",
    vendor: "",
    description: "",
    categoryId: "equipment",
    amount: "",
  });
  const [invoice, setInvoice] = useState<{ path: string; name: string } | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);
  const change = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function upload(file: File) {
    setUploading(true);
    setMessage(null);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { "x-demo-role": role },
      body,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      setMessage({ text: result.error || "Upload failed.", error: true });
    else setInvoice({ path: result.pathname, name: file.name });
    setUploading(false);
  }
  async function submit() {
    if (
      !form.date ||
      !form.vendor ||
      !form.description ||
      !form.amount ||
      !invoice
    ) {
      setMessage({
        text: "Complete the form and attach an invoice before submitting.",
        error: true,
      });
      return;
    }
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-role": role },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        invoicePath: invoice.path,
        invoiceName: invoice.name,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      setMessage({
        text: result.error || "Could not submit transaction.",
        error: true,
      });
    else
      setMessage({
        text: `Transaction ${result.code} submitted for Dean review.`,
      });
  }
  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">New transaction</h1>
          <div className="eyebrow">
            Invoice and category details are required before submission
          </div>
        </div>
      </div>
      {message && (
        <div
          className="notice"
          style={
            message.error
              ? undefined
              : { background: "rgba(5,150,105,.1)", color: "#047857" }
          }
        >
          {message.text}
        </div>
      )}
      <div className="panel">
        <div className="form-grid">
          <div className="field">
            <label>Project</label>
            <select
              value={form.projectId}
              onChange={(e) => change("projectId", e.target.value)}
            >
              <option value="demo-project">
                AI-Based Crop Disease Detection - RND-2026-014
              </option>
            </select>
          </div>
          <div className="field">
            <label>Transaction date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => change("date", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Vendor or payee</label>
            <input
              placeholder="Vendor name"
              value={form.vendor}
              onChange={(e) => change("vendor", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Invoice file</label>
            <button
              className="upload-field"
              type="button"
              onClick={() => fileInput.current?.click()}
            >
              <UploadCloud size={18} />
              <span>
                {uploading
                  ? "Uploading..."
                  : invoice?.name || "Choose PDF, JPG, or PNG"}
              </span>
              {invoice && <CheckCircle2 size={16} />}
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(file);
                }}
                hidden
              />
            </button>
          </div>
          <div className="field full">
            <label>Description</label>
            <textarea
              placeholder="What was this spend for?"
              value={form.description}
              onChange={(e) => change("description", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Budget category</label>
            <select
              value={form.categoryId}
              onChange={(e) => change("categoryId", e.target.value)}
            >
              <option value="equipment">
                Equipment - INR 350,000 remaining
              </option>
              <option value="travel">Travel - INR 180,000 remaining</option>
            </select>
          </div>
          <div className="field">
            <label>Amount</label>
            <input
              inputMode="decimal"
              placeholder="INR 0.00"
              value={form.amount}
              onChange={(e) => change("amount", e.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <button className="secondary" onClick={() => router.back()}>
            Save draft
          </button>
          <button className="primary" onClick={submit}>
            Submit for Dean approval
          </button>
        </div>
      </div>
    </main>
  );
}
