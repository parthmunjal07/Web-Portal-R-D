import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { email, code, role } = await request.json();

  // ── Demo path ──────────────────────────────────────────────────────────────
  if (process.env.DEMO_MODE === "true") {
    const cookieStore = await cookies();
    cookieStore.set("rd_demo", "true", { path: "/" });
    cookieStore.set("rd_demo_role", role || "INSPECTOR", { path: "/" });
    return NextResponse.json({ ok: true, demo: true });
  }

  // ── Real DB path ───────────────────────────────────────────────────────────
  const challenge = await db.otpChallenge.findFirst({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    return NextResponse.json({ error: "No active code found or code expired" }, { status: 400 });
  }

  if (challenge.attempts >= 3) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 400 });
  }

  const valid = await bcrypt.compare(code, challenge.codeHash);
  
  if (!valid) {
    await db.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await db.otpChallenge.update({
    where: { id: challenge.id },
    data: { usedAt: new Date() },
  });

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await createSession(user.id);

  return NextResponse.json({ ok: true, role: user.role });
}
