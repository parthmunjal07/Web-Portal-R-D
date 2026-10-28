import { LoginForm } from "./login-form";
import { demoRecords } from "@/lib/demo-state";

export default async function LoginPage() {
  const isDemoMode = process.env.DEMO_MODE === "true";
  const accounts = isDemoMode ? (await demoRecords()).accounts : [];
  return <LoginForm isDemoMode={isDemoMode} demoAccounts={accounts} />;
}
