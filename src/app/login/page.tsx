import { LoginForm } from "./login-form";

export default function LoginPage() {
  const isDemoMode = process.env.DEMO_MODE === "true";
  
  return <LoginForm isDemoMode={isDemoMode} />;
}
