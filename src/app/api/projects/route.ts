import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser, requireRole } from "@/lib/auth";

const schema = z.object({ name: z.string().min(3), description: z.string().min(3), startDate: z.coerce.date(), endDate: z.coerce.date(), totalBudget: z.coerce.number().positive(), fundingOrganization: z.string().min(2), coInspectors: z.string().optional() });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Complete all required project fields." }, { status: 400 });
  if (process.env.DEMO_MODE === "true" && !process.env.DATABASE_URL) return NextResponse.json({ ok: true, code: `RND-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`, demo: true }, { status: 201 });
  const user = await currentUser(); requireRole(user, ["INSPECTOR", "DEAN", "SUPER_ADMIN"]);
  const { name, description, startDate, endDate, totalBudget, fundingOrganization, coInspectors } = parsed.data;
  const organization = await db.fundingOrganization.upsert({ where: { name: fundingOrganization }, update: {}, create: { name: fundingOrganization } });
  const project = await db.project.create({ data: { code: `RND-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`, name, description, startDate, endDate, totalBudget, ownerId: user!.id, funders: { create: { organizationId: organization.id, contributed: totalBudget } }, coInspectors: { create: (coInspectors || "").split(",").map((item) => item.trim()).filter(Boolean).map((name) => ({ name })) } } });
  return NextResponse.json({ ok: true, id: project.id, code: project.code }, { status: 201 });
}
