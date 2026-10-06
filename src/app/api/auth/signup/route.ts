import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const { name, email, password, role } = await request.json();
  
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.json({ error: "Cannot sign up in demo mode" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role || "INSPECTOR",
      active: true,
    }
  });

  await createSession(user.id);

  return NextResponse.json({ ok: true, role: user.role });
}
