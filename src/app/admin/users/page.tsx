import { UserPlus, UserRoundCheck } from "lucide-react";
import { demoAccounts } from "@/lib/domain";
import { db } from "@/lib/db";

// ── Normalised row shape ──────────────────────────────────────────────────────
type UserRow = {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  active: boolean;
};

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
async function getUsers(): Promise<UserRow[]> {
  // Demo mode
  if (process.env.DEMO_MODE === "true") {
    return demoAccounts.map((a) => ({
      id: a.email,
      name: a.name,
      email: a.email,
      roleTitle: a.title,
      active: true,
    }));
  }

  // Real DB
  const users = await db.user.findMany({
    orderBy: [{ role: "desc" }, { name: "asc" }],
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    roleTitle: roleTitle(u.role),
    active: u.active,
  }));
}

import { currentUser, hasRole } from "@/lib/auth";
import { parseRole } from "@/lib/permissions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Users() {
  const user = process.env.DEMO_MODE === "true" 
    ? { role: parseRole((await cookies()).get("rd_demo_role")?.value) } 
    : await currentUser();
  if (!hasRole(user, ["SUPER_ADMIN"])) {
    redirect("/dashboard");
  }

  const users = await getUsers();

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">User accounts</h1>
          <div className="eyebrow">
            Create and deactivate Inspector and Dean access
          </div>
        </div>
        <button className="primary" disabled title="User creation not implemented in this demo">
          <UserPlus size={16} /> New user
        </button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>USER</th>
              <th>ROLE</th>
              <th>EMAIL</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    color: "#66717a",
                    padding: "28px 0",
                  }}
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((account) => (
                <tr key={account.id}>
                  <td>{account.name}</td>
                  <td>{account.roleTitle}</td>
                  <td>{account.email}</td>
                  <td>
                    {account.active ? (
                      <span className="pill green">
                        <i />
                        Active
                      </span>
                    ) : (
                      <span
                        className="pill"
                        style={{ background: "#f1f3f5", color: "#66717a" }}
                      >
                        <i style={{ background: "#adb5bd" }} />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="secondary" disabled title="User management not implemented in this demo">
                      <UserRoundCheck size={15} /> Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
