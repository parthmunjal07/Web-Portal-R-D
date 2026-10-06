import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  // ── Demo path ──────────────────────────────────────────────────────────────
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.json({ ok: true, demo: true });
  }

  // ── Real DB path ───────────────────────────────────────────────────────────
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Invalid credentials or account inactive" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Generate 6 digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);

  await db.otpChallenge.create({
    data: {
      email,
      codeHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5),
    }
  });

  if (resend) {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: email,
      subject: "R&D Portal - Your Login Code",
      text: `Your login code for the R&D Portal is: ${code}`,
    });

    if (error) {
      console.error("[AUTH] Resend error:", error);
      return NextResponse.json({ error: "Failed to send OTP email." }, { status: 500 });
    }
  } else {
    // Fallback for local development without API key
    console.log(`\n\n[AUTH] OTP for ${email}: ${code}\n\n`);
  }

  return NextResponse.json({ ok: true });
}
