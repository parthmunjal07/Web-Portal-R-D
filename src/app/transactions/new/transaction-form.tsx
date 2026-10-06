"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, UploadCloud, Loader2 } from "lucide-react";
import { money } from "@/lib/domain";

export type FormProject = {
  id: string;
  name: string;
  code: string;
  categories: {
    id: string;
    name: string;
    remaining: number;
  }[];
};

export function NewTransactionForm({
  projects,
  role,
}: {
  projects: FormProject[];
  role?: string;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    projectId: projects[0]?.id || "",
    date: "",
    vendor: "",
    description: "",
    categoryId: projects[0]?.categories[0]?.id || "",
    amount: "",
  });
  const [invoice, setInvoice] = useState<{ path: string; name: string } | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);

  const activeProject = projects.find((p) => p.id === form.projectId);
  const categories = activeProject?.categories || [];

  const change = (key: keyof typeof form, value: string) => {
    if (key === "projectId") {
      const newProj = projects.find((p) => p.id === value);
      setForm((current) => ({
        ...current,
        projectId: value,
        categoryId: newProj?.categories[0]?.id || "",
      }));
    } else {
      setForm((current) => ({ ...current, [key]: value }));
    }
  };

  async function upload(file: File) {
    setUploading(true);
    setMessage(null);
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { "x-demo-role": role || "" },
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
      !form.projectId ||
      !form.categoryId ||
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
    setSubmitting(true);
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-role": role || "" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        invoicePath: invoice.path,
        invoiceName: invoice.name,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage({
        text: result.error || "Could not submit transaction.",
        error: true,
      });
      setSubmitting(false);
    } else {
      setMessage({
        text: `Transaction ${result.code || "submitted"} successfully.`,
      });
      // Optionally redirect or clear form after a delay
      setTimeout(() => {
        router.push("/transactions");
      }, 1500);
    }
  }

  return (
    <div className="panel">
      <div className="form-grid">
        <div className="field">
          <label>Project</label>
          <select
            value={form.projectId}
            onChange={(e) => change("projectId", e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.code}
              </option>
            ))}
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
            disabled={uploading || submitting}
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
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {money(c.remaining)} remaining
              </option>
            ))}
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

      {message && (
        <div
          className="notice"
          style={{
            ...(message.error
              ? {}
              : { background: "rgba(5,150,105,.1)", color: "#047857" }),
            marginTop: 20,
          }}
        >
          {message.text}
        </div>
      )}

      <div className="form-actions">
        <button className="secondary" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </button>
        <button className="primary" onClick={submit} disabled={submitting || uploading}>
          {submitting ? <Loader2 size={16} className="spin" /> : null}
          {submitting ? "Submitting..." : "Submit for Dean approval"}
        </button>
      </div>
    </div>
  );
}
