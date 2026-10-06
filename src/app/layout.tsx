import "./globals.css";
import { AppShell } from "./shell";
import { currentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { demoAccounts, type Role } from "@/lib/domain";

async function getUser() {
  if (process.env.DEMO_MODE === "true") {
    const role = (await cookies()).get("rd_demo_role")?.value as Role | undefined;
    if (role) {
      const demoUser = demoAccounts.find((a) => a.role === role);
      if (demoUser) return { name: demoUser.name };
    }
  }
  return await currentUser();
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  return (
    <html lang="en">
      <body>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
