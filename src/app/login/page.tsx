import { LoginForm } from "./login-form";
import { demoAccountRecords } from "@/lib/demo-state";

export default async function LoginPage() {
  const isDemoMode = process.env.DEMO_MODE === "true";
  const accounts = isDemoMode ? (await demoAccountRecords()) : [];
  return <LoginForm isDemoMode={isDemoMode} demoAccounts={accounts} />;
}
