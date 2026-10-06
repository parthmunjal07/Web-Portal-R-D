"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { demoAccounts, type Role } from "@/lib/domain";

export function LoginForm({ isDemoMode }: { isDemoMode: boolean }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>("INSPECTOR");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const selectAccount = (account: (typeof demoAccounts)[number]) => {
    setRole(account.role);
    setEmail(account.email);
    setPassword("Demo@12345");
    sessionStorage.setItem("rd_demo_role", account.role);
  };

  async function handleStep1() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        setStep(2);
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/step2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Verification failed");
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

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

        {error && (
          <div className="notice" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <>
            <h2>Sign in</h2>
            <p className="sub login-copy">
              {isDemoMode ? "Choose a demo role or enter your institutional credentials." : "Enter your institutional credentials."}
            </p>

            {isDemoMode && (
              <>
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
                          .filter((p) => !!p)
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
              </>
            )}

            <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="field">
                <label>Institutional email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <button className="primary login-submit" onClick={handleStep1} disabled={loading}>
              {loading ? <Loader2 size={16} className="spin" /> : null}
              {loading ? "Verifying..." : "Continue to verification"}{" "}
              {!loading && <ArrowRight size={16} />}
            </button>
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <span className="sub">Don't have an account? </span>
              <Link href="/signup" className="table-link" style={{ fontWeight: 500 }}>
                Sign up
              </Link>
            </div>
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
            {process.env.NODE_ENV === "development" && (
              <p style={{ fontSize: 12, color: "#66717a", background: "#f1f3f5", padding: 8, borderRadius: 6, marginTop: 12 }}>
                Check your terminal/console for the OTP code.
              </p>
            )}
            <div className="field" style={{ marginTop: 18 }}>
              <label>One-time code</label>
              <input 
                placeholder="000000" 
                maxLength={6} 
                inputMode="numeric" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              className="primary login-submit"
              onClick={handleStep2}
              disabled={loading || code.length !== 6}
            >
              {loading ? <Loader2 size={16} className="spin" /> : null}
              {loading ? "Signing in..." : "Verify and sign in"}{" "}
              {!loading && <ArrowRight size={16} />}
            </button>
            <button
              className="secondary login-submit"
              onClick={() => {
                setStep(1);
                setError("");
                setCode("");
              }}
              disabled={loading}
            >
              Back
            </button>
          </>
        )}
      </div>
    </main>
  );
}
