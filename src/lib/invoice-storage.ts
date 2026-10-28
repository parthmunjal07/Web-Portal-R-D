import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { unlink } from "fs/promises";
import path from "path";

export async function deleteInvoiceObject(key: string) {
  const localPrefix = "/uploads/invoices/";
  if (key.startsWith(localPrefix)) {
    const fileName = key.slice(localPrefix.length);
    if (
      !/^[a-zA-Z0-9._-]+$/.test(fileName) ||
      fileName === "." ||
      fileName === ".."
    )
      return;
    try {
      await unlink(
        path.join(process.cwd(), "public", "uploads", "invoices", fileName),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    return;
  }

  if (
    !process.env.AWS_REGION ||
    !process.env.S3_BUCKET_NAME ||
    !/^invoices\/[a-zA-Z0-9._-]+$/.test(key)
  )
    return;
  const client = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
  });
  await client.send(
    new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: key }),
  );
}

export async function cleanupInvoices(keys: string[]) {
  const outcomes = await Promise.allSettled(keys.map(deleteInvoiceObject));
  let failed = 0;
  for (const outcome of outcomes) {
    if (outcome.status === "rejected") {
      failed += 1;
      console.error(
        "Failed to remove an invoice file after deletion:",
        outcome.reason,
      );
    }
  }
  return failed;
}
