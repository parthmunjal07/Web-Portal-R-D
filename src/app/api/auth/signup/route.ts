import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { z } from "zod";
import { profileFieldsSchema } from "@/lib/profile-fields";

const signupSchema = profileFieldsSchema.extend({
  name: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["INSPECTOR", "DEAN", "SUPER_ADMIN"]).default("INSPECTOR"),
});

export async function POST(request: Request) {
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.json(
      { error: "Cannot sign up in demo mode" },
      { status: 400 },
    );
  }

  const parsed = signupSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Complete all signup fields.",
      },
      { status: 400 },
    );
  const {
    name,
    email,
    password,
    role,
    department,
    institutionId,
    phoneNumber,
  } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email is already registered" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      name,
      email,
      department,
      institutionId,
      phoneNumber,
      passwordHash,
      role,
      active: true,
    },
  });

  await createSession(user.id);

  return NextResponse.json({ ok: true, role: user.role });
}
