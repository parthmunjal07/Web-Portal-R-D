"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Role } from "@/lib/domain";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("INSPECTOR");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  async function handleSignup() {
    if (!name || !email || !password) {
      setError("Please fill out all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Signup failed");
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
            <span className="sub">Register a new account</span>
          </div>
        </div>

        {error && (
          <div className="notice" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <h2>Sign up</h2>
        <p className="sub login-copy">
          Create your account to start managing research grants.
        </p>
        
        <div className="form-grid" style={{ gridTemplateColumns: "1fr", marginTop: 24 }}>
          <div className="field">
            <label>Full name</label>
            <input
              placeholder="e.g. Dr. Arvind Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="field">
            <label>Institutional email</label>
            <input
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Must be strong"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={loading}>
              <option value="INSPECTOR">Project Inspector</option>
              <option value="DEAN">Dean of Research</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
        </div>
        
        <button className="primary login-submit" onClick={handleSignup} disabled={loading} style={{ marginTop: 24 }}>
          {loading ? <Loader2 size={16} className="spin" /> : null}
          {loading ? "Creating account..." : "Sign up"} {!loading && <ArrowRight size={16} />}
        </button>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link href="/login" className="table-link" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={14} /> Back to Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
