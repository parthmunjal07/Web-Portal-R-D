import { currentUser, hasRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { TransactionStatus as PrismaStatus } from "@prisma/client";
import { NewTransactionForm, type FormProject } from "./transaction-form";

// ── Data source ───────────────────────────────────────────────────────────────
async function getProjectsForForm(): Promise<FormProject[]> {
  if (process.env.DEMO_MODE === "true") {
    return [
      {
        id: "demo-project",
        name: "AI-Based Crop Disease Detection",
        code: "RND-2026-014",
        categories: [
          { id: "equipment", name: "Equipment", remaining: 350000 },
          { id: "travel", name: "Travel", remaining: 180000 },
        ],
      },
    ];
  }

  const user = await currentUser();
  if (!user) return [];

  // If Inspector, only show their own projects. If Super Admin / Dean, maybe they can select any?
  // We'll scope to ownerId for Inspector, otherwise all.
  const where = user.role === "INSPECTOR" ? { ownerId: user.id } : {};

  const rows = await db.project.findMany({
    where,
    select: {
      id: true,
      name: true,
      code: true,
      categories: {
        select: {
          id: true,
          name: true,
          allocated: true,
          lines: {
            where: {
              transaction: {
                status: {
                  in: [PrismaStatus.APPROVED, PrismaStatus.APPROVED_BY_DEAN],
                },
              },
            },
            select: { amount: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((p) => {
    return {
      id: p.id,
      name: p.name,
      code: p.code,
      categories: p.categories.map((c) => {
        const spent = c.lines.reduce((sum, l) => sum + Number(l.amount), 0);
        const remaining = Number(c.allocated) - spent;
        return {
          id: c.id,
          name: c.name,
          remaining,
        };
      }),
    };
  });
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { parseRole } from "@/lib/permissions";

export default async function NewTransactionPage() {
  const cookieStore = await cookies();
  const rawRole = cookieStore.get("rd_demo_role")?.value;
  const user = process.env.DEMO_MODE === "true"
    ? { role: parseRole(rawRole) }
    : await currentUser();
    
  if (!hasRole(user as { role: string } | null, ["INSPECTOR"])) {
    redirect("/dashboard");
  }

  const role = rawRole;
  const projects = await getProjectsForForm();

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

      {projects.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px 0", color: "#66717a" }}>
          You don't have any active projects to create transactions for.
        </div>
      ) : (
        <NewTransactionForm projects={projects} role={role} />
      )}
    </main>
  );
}
