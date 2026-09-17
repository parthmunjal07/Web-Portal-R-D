import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser, requireRole } from "@/lib/auth";

const transactionSchema = z.object({
  projectId: z.string().min(1), date: z.coerce.date(), vendor: z.string().min(2),
  description: z.string().min(3), categoryId: z.string().min(1), amount: z.coerce.number().positive(),
  invoicePath: z.string().min(1), invoiceName: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const parsed = transactionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Complete every transaction field and attach an invoice." }, { status: 400 });
  const user = process.env.DEMO_MODE === "true" && !process.env.DATABASE_URL ? { role: "INSPECTOR", id: "demo-user" } : await currentUser();
  requireRole(user, ["INSPECTOR"]);
  const { projectId, date, vendor, description, categoryId, amount, invoicePath, invoiceName } = parsed.data;
  if (process.env.DEMO_MODE === "true" && !process.env.DATABASE_URL) return NextResponse.json({ ok: true, code: `TXN-${Math.floor(1000 + Math.random() * 9000)}`, demo: true }, { status: 201 });
  const category = await db.budgetCategory.findFirst({ where: { id: categoryId, project: { ownerId: user!.id } } });
  if (!category) return NextResponse.json({ error: "Category not found for your project." }, { status: 404 });
  const approved = await db.transactionLine.aggregate({ _sum: { amount: true }, where: { categoryId, transaction: { status: { in: ["APPROVED", "APPROVED_BY_DEAN"] } } } });
  const spent = Number(approved._sum.amount ?? 0);
  if (spent + amount > Number(category.allocated)) return NextResponse.json({ error: `This exceeds the remaining category balance of ${Number(category.allocated) - spent}.` }, { status: 409 });
  const transaction = await db.transaction.create({ data: { code: `TXN-${Date.now().toString().slice(-6)}`, date, vendor, description, projectId, createdById: user!.id, status: "PENDING_DEAN", lines: { create: { categoryId, amount } }, invoice: { create: { fileName: invoiceName || "invoice", mimeType: "application/octet-stream", size: 0, storageKey: invoicePath } } } });
  return NextResponse.json({ ok: true, id: transaction.id, code: transaction.code }, { status: 201 });
}
