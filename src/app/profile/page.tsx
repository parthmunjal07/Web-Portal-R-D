import { currentUser } from "@/lib/auth";
import { demoAccounts, type Role } from "@/lib/domain";

// ── Role label helper ─────────────────────────────────────────────────────────
function roleTitle(r: string) {
  switch (r) {
    case "INSPECTOR":
      return "Project Inspector";
    case "DEAN":
      return "Dean of Research & Development";
    case "SUPER_ADMIN":
      return "Super Admin";
    default:
      return r;
  }
}

// ── Data source ───────────────────────────────────────────────────────────────
async function getProfile(
  roleParam?: string
): Promise<{ name: string; email: string; roleTitle: string }> {
  if (process.env.DEMO_MODE === "true") {
    const role = (
      roleParam === "DEAN" || roleParam === "SUPER_ADMIN"
        ? roleParam
        : "INSPECTOR"
    ) as Role;
    const account = demoAccounts.find((a) => a.role === role) ?? demoAccounts[0];
    return {
      name: account.name,
      email: account.email,
      roleTitle: account.title,
    };
  }

  const user = await currentUser();
  if (!user) {
    // Fallback if accessed without session in real mode
    return { name: "Guest", email: "guest@example.com", roleTitle: "None" };
  }
  return {
    name: user.name,
    email: user.email,
    roleTitle: roleTitle(user.role),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
import { cookies } from "next/headers";

export default async function Profile() {
  const cookieStore = await cookies();
  const role = cookieStore.get("rd_demo_role")?.value;
  const profile = await getProfile(role);

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">Profile</h1>
          <div className="eyebrow">Account and session security</div>
        </div>
      </div>
      <div className="panel" style={{ maxWidth: 700 }}>
        <div className="form-grid">
          <div className="field">
            <label>Full name</label>
            <input defaultValue={profile.name} disabled />
          </div>
          <div className="field">
            <label>Role</label>
            <input defaultValue={profile.roleTitle} disabled />
          </div>
          <div className="field full">
            <label>Institutional email</label>
            <input defaultValue={profile.email} disabled />
          </div>
        </div>
        <div className="form-actions">
          <button className="primary" disabled title="Profile editing not implemented in this demo">
            Save profile
          </button>
        </div>
        <hr
          style={{
            border: 0,
            borderTop: "1px solid #e5e7eb",
            margin: "28px 0",
          }}
        />
        <h2>Sessions</h2>
        <p className="sub">
          Your current session is protected by a secure httpOnly cookie.
        </p>
        <button
          className="secondary"
          style={{ marginTop: 12 }}
          disabled
          title="Session management not implemented in this demo"
        >
          Log out of all sessions
        </button>
      </div>
    </main>
  );
}
