"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, UploadCloud } from "lucide-react";

export default function NewTransaction() {
  const [sent, setSent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const router = useRouter();
  async function upload(file: File) {
    setUploading(true); setFileName(file.name);
    const body = new FormData(); body.append("file", file);
    const response = await fetch("/api/uploads", { method: "POST", body });
    if (!response.ok) { setFileName(""); alert("Add BLOB_READ_WRITE_TOKEN to enable invoice uploads."); }
    setUploading(false);
  }
  return <main className="content"><div className="page-header"><div><h1 className="title">New transaction</h1><div className="eyebrow">Invoice and category details are required before submission</div></div></div>{sent && <div className="notice" style={{ background: "rgba(5,150,105,.1)", color: "#047857" }}>Transaction submitted for Dean review.</div>}<div className="panel"><div className="form-grid"><div className="field"><label>Project</label><select><option>AI-Based Crop Disease Detection · RND-2026-014</option></select></div><div className="field"><label>Transaction date</label><input type="date" /></div><div className="field"><label>Vendor or payee</label><input placeholder="Vendor name" /></div><div className="field"><label>Invoice file</label><label className="upload-field"><UploadCloud size={18} /><span>{uploading ? "Uploading…" : fileName || "Choose PDF, JPG, or PNG"}</span>{fileName && <CheckCircle2 size={16} />}<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const file = e.target.files?.[0]; if (file) upload(file); }} hidden /></label></div><div className="field full"><label>Description</label><textarea placeholder="What was this spend for?" /></div><div className="field"><label>Budget category</label><select><option>Equipment · ₹350,000 remaining</option><option>Travel · ₹180,000 remaining</option></select></div><div className="field"><label>Amount</label><input placeholder="₹ 0.00" /></div></div><div className="form-actions"><button className="secondary" onClick={() => router.back()}>Save draft</button><button className="primary" onClick={() => setSent(true)}>Submit for Dean approval</button></div></div></main>;
}
