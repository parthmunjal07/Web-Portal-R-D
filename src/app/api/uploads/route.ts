import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { parseRole } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";

const allowed = new Set(["application/pdf", "image/jpeg", "image/png"]);
const maxSize = 15 * 1024 * 1024;

/** True when all four required S3 env vars are set and non-empty. */
function s3Configured(): boolean {
  return !!(
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
}

export async function POST(request: Request) {
  const user =
    process.env.DEMO_MODE === "true"
      ? {
          role: parseRole((await cookies()).get("rd_demo_role")?.value),
        }
      : await currentUser();
  if (user?.role !== "INSPECTOR")
    return NextResponse.json(
      { error: "Only Project Inspectors can upload invoices." },
      { status: 403 },
    );

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json(
      { error: "Invoice file is required" },
      { status: 400 },
    );
  if (!allowed.has(file.type))
    return NextResponse.json(
      { error: "Only PDF, JPG, and PNG invoices are supported" },
      { status: 400 },
    );
  if (file.size > maxSize)
    return NextResponse.json(
      { error: "Invoice must be smaller than 15 MB" },
      { status: 400 },
    );

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const key = `invoices/${crypto.randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  /* ── S3 upload path ─────────────────────────────────────────────── */
  if (s3Configured()) {
    const client = new S3Client({
      region: process.env.AWS_REGION,
      endpoint: process.env.S3_ENDPOINT || undefined,
    });
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ContentLength: file.size,
      }),
    );
    const url = process.env.S3_PUBLIC_BASE_URL
      ? `${process.env.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`
      : undefined;
    return NextResponse.json({ url, pathname: key });
  }

  /* ── Local filesystem fallback (no S3 configured) ───────────────── */
  const uploadDir = path.join(process.cwd(), "public", "uploads", "invoices");
  await mkdir(uploadDir, { recursive: true });
  const localPath = path.join(uploadDir, `${crypto.randomUUID()}-${safeName}`);
  await writeFile(localPath, buffer);

  // Return a URL relative to public/ so Next.js can serve it
  const publicUrl = `/uploads/invoices/${path.basename(localPath)}`;
  return NextResponse.json({ url: publicUrl, pathname: publicUrl });
}
