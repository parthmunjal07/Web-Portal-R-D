"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { demoAccounts, type Role } from "@/lib/domain";

export default function Login() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>("INSPECTOR");
  const [email, setEmail] = useState("inspector@demo.edu");
  const router = useRouter();
  const selectAccount = (account: (typeof demoAccounts)[number]) => {
    setRole(account.role);
    setEmail(account.email);
    sessionStorage.setItem("rd_demo_role", account.role);
  };
  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">R</div>
          <div>
            <h1>R&amp;D Fund Portal</h1>
            <span className="sub">Secure institutional access</span>
          </div>
        </div>
        {step === 1 ? (
          <>
            <h2>Sign in</h2>
            <p className="sub login-copy">
              Choose a demo role or enter your institutional credentials.
            </p>
            <div className="demo-account-list">
              {demoAccounts.map((account) => (
                <button
                  className={`demo-account ${role === account.role ? "selected" : ""}`}
                  key={account.role}
                  onClick={() => selectAccount(account)}
                >
                  <span className="account-avatar">
                    {account.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(-2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <span>
                    <strong>{account.name}</strong>
                    <small>{account.title}</small>
                  </span>
                  {role === account.role ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                </button>
              ))}
            </div>
            <div className="login-divider">
              <span>or use account credentials</span>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="field">
                <label>Institutional email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" defaultValue="Demo@12345" />
              </div>
            </div>
            <button className="primary login-submit" onClick={() => setStep(2)}>
              Continue to verification <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="otp-icon">
              <ShieldCheck size={25} />
            </div>
            <h2>Verify your email</h2>
            <p className="sub login-copy">
              Enter the six-digit code sent to <strong>{email}</strong>. It
              expires in 5 minutes.
            </p>
            <div className="field" style={{ marginTop: 18 }}>
              <label>One-time code</label>
              <input placeholder="000000" maxLength={6} inputMode="numeric" />
            </div>
            <button
              className="primary login-submit"
              onClick={() => router.push(`/dashboard?role=${role}`)}
            >
              Verify and sign in <ArrowRight size={16} />
            </button>
            <button
              className="secondary login-submit"
              onClick={() => setStep(1)}
            >
              Back
            </button>
          </>
        )}
      </div>
    </main>
  );
}
