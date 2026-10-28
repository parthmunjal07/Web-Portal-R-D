import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { demoRecords, setDemoProfile } from "@/lib/demo-state";
import { parseRole } from "@/lib/permissions";
import { profileFieldsSchema } from "@/lib/profile-fields";

export async function PATCH(request: Request) {
  const parsed = profileFieldsSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Complete all profile fields.",
      },
      { status: 400 },
    );

  if (process.env.DEMO_MODE === "true") {
    const store = await cookies();
    if (store.get("rd_demo")?.value !== "true")
      return NextResponse.json(
        { error: "Sign in to update your profile." },
        { status: 401 },
      );
    const role = parseRole(store.get("rd_demo_role")?.value);
    const account = (await demoRecords()).accounts.find(
      (user) => user.role === role,
    );
    if (!account)
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    await setDemoProfile(account.email, parsed.data);
    return NextResponse.json({ ok: true });
  }

  const user = await currentUser();
  if (!user?.active)
    return NextResponse.json(
      { error: "Sign in to update your profile." },
      { status: 401 },
    );
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}
