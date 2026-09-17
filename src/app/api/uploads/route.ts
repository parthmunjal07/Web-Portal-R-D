import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { parseRole } from "@/lib/permissions";

const allowed = new Set(["application/pdf", "image/jpeg", "image/png"]);
const maxSize = 15 * 1024 * 1024;

export async function POST(request: Request) {
  const user = process.env.DEMO_MODE === "true" && !process.env.DATABASE_URL ? { role: parseRole(request.headers.get("x-demo-role") || undefined) } : await currentUser();
  if (user?.role !== "INSPECTOR") return NextResponse.json({ error: "Only Project Inspectors can upload invoices." }, { status: 403 });
  if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) return NextResponse.json({ error: "Amazon S3 storage is not configured" }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Invoice file is required" }, { status: 400 });
  if (!allowed.has(file.type)) return NextResponse.json({ error: "Only PDF, JPG, and PNG invoices are supported" }, { status: 400 });
  if (file.size > maxSize) return NextResponse.json({ error: "Invoice must be smaller than 15 MB" }, { status: 400 });
  const key = `invoices/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const client = new S3Client({ region: process.env.AWS_REGION, endpoint: process.env.S3_ENDPOINT || undefined });
  await client.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: key, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type, ContentLength: file.size }));
  const url = process.env.S3_PUBLIC_BASE_URL ? `${process.env.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}` : undefined;
  return NextResponse.json({ url, pathname: key });
}
