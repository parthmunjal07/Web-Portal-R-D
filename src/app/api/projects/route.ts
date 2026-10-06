import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser, hasRole } from "@/lib/auth";
import { can, parseRole } from "@/lib/permissions";
import { cookies } from "next/headers";

const schema = z.object({
  name: z.string().min(3),
  description: z.string().min(3),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  totalBudget: z.coerce.number().positive(),
  categories: z
    .array(
      z.object({
        name: z.string().min(1),
        allocated: z.coerce.number().positive(),
      }),
    )
    .min(1),
  fundingOrganization: z.string().min(2).optional(),
  coInspectors: z.string().optional(),
});
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Complete all required project fields." },
      { status: 400 },
    );
  const user =
    process.env.DEMO_MODE === "true"
      ? {
          role: parseRole((await cookies()).get("rd_demo_role")?.value),
          id: "demo-user",
        }
      : await currentUser();
  if (!hasRole(user, ["INSPECTOR", "DEAN", "SUPER_ADMIN"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }
  const role =
    user?.role || parseRole((await cookies()).get("rd_demo_role")?.value);
  if (!can(role, "createProject"))
    return NextResponse.json(
      { error: "You cannot create projects." },
      { status: 403 },
    );
  const {
    name,
    description,
    startDate,
    endDate,
    totalBudget,
    categories,
    fundingOrganization,
    coInspectors,
  } = parsed.data;
  const budgetCents = Math.round(totalBudget * 100);
  const categoryCents = categories.reduce(
    (sum, category) => sum + Math.round(category.allocated * 100),
    0,
  );
  if (categoryCents !== budgetCents)
    return NextResponse.json(
      { error: "Category allocations must equal the total project budget." },
      { status: 400 },
    );
  if (fundingOrganization && !can(role, "addFundingOrganization"))
    return NextResponse.json(
      { error: "Only Project Inspectors can add funding organizations." },
      { status: 403 },
    );
  if (process.env.DEMO_MODE === "true")
    return NextResponse.json(
      {
        ok: true,
        code: `RND-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        demo: true,
      },
      { status: 201 },
    );
  const organization = fundingOrganization
    ? await db.fundingOrganization.upsert({
        where: { name: fundingOrganization },
        update: {},
        create: { name: fundingOrganization },
      })
    : null;
  const project = await db.project.create({
    data: {
      code: `RND-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      name,
      description,
      startDate,
      endDate,
      totalBudget,
      ownerId: user!.id!,
      categories: {
        create: categories.map((category) => ({
          name: category.name,
          allocated: category.allocated,
        })),
      },
      ...(organization
        ? {
            funders: {
              create: {
                organizationId: organization.id,
                contributed: totalBudget,
              },
            },
          }
        : {}),
      coInspectors: {
        create: (coInspectors || "")
          .split(",")
          .map((item) => item.trim())
          .filter((p) => !!p)
          .map((name) => ({ name })),
      },
    },
  });
  return NextResponse.json(
    { ok: true, id: project.id, code: project.code },
    { status: 201 },
  );
}
