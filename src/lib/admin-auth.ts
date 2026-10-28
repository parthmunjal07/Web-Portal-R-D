import { cookies } from "next/headers";
import { currentUser } from "./auth";
import { parseRole } from "./permissions";

export async function currentAdmin() {
  if (process.env.DEMO_MODE === "true") {
    const role = parseRole((await cookies()).get("rd_demo_role")?.value);
    return role === "SUPER_ADMIN" ? { id: "demo-user", role } : null;
  }

  const user = await currentUser();
  return user?.active && user.role === "SUPER_ADMIN" ? user : null;
}
