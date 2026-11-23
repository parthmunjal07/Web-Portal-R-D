import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let rows: { id: string; status: string }[];
  if (process.env.DEMO_MODE === "true") {
    const store = await cookies();
    const role = store.get("rd_demo_role")?.value;
    if (!store.has("rd_demo") || !["INSPECTOR", "DEAN", "SUPER_ADMIN"].includes(role ?? ""))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    rows = await db.demoTransaction.findMany({ select: { id: true, status: true }, orderBy: { id: "asc" } });
  } else {
    const user = await currentUser();
    if (!user?.active) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    rows = await db.transaction.findMany({
      where: user.role === "INSPECTOR" ? { project: { ownerId: user.id } } : {},
      select: { id: true, status: true }, orderBy: { id: "asc" },
    });
  }
  const version = createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  return NextResponse.json({ version }, { headers: { "Cache-Control": "no-store" } });
}
