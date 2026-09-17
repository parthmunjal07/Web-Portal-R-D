import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const allowed = new Set(["application/pdf", "image/jpeg", "image/png"]);
const maxSize = 15 * 1024 * 1024;

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Blob storage is not configured" }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Invoice file is required" }, { status: 400 });
  if (!allowed.has(file.type)) return NextResponse.json({ error: "Only PDF, JPG, and PNG invoices are supported" }, { status: 400 });
  if (file.size > maxSize) return NextResponse.json({ error: "Invoice must be smaller than 15 MB" }, { status: 400 });
  const blob = await put(`invoices/${crypto.randomUUID()}-${file.name}`, file, { access: "private", addRandomSuffix: false });
  return NextResponse.json({ url: blob.url, pathname: blob.pathname });
}
