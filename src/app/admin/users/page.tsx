import { UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { currentAdmin } from "@/lib/admin-auth";
import { demoRecords } from "@/lib/demo-state";
import { DeleteAction } from "../delete-action";
import { redirect } from "next/navigation";

// ── Normalised row shape ──────────────────────────────────────────────────────
type UserRow = {
  id: string;
  name: string;
  email: string;
  department: string;
  institutionId: string;
  phoneNumber: string;
  role: string;
  roleTitle: string;
  active: boolean;
  projectCount: number;
};

// ── Role label helper ─────────────────────────────────────────────────────────
function roleTitle(r: string) {
  switch (r) {
    case "INSPECTOR":
      return "Principal Inspector";
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
    const records = await demoRecords();
    return records.accounts.map((a) => ({
      id: a.email,
      name: a.name,
      email: a.email,
      department: a.department,
      institutionId: a.institutionId,
      phoneNumber: a.phoneNumber,
      role: a.role,
      roleTitle: a.title,
      active: true,
      projectCount: a.role === "INSPECTOR" ? records.projects.length : 0,
    }));
  }

  // Real DB
  const users = await db.user.findMany({
    orderBy: [{ role: "desc" }, { name: "asc" }],
    include: { _count: { select: { projects: true } } },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    department: u.department ?? "—",
    institutionId: u.institutionId ?? "—",
    phoneNumber: u.phoneNumber ?? "—",
    role: u.role,
    roleTitle: roleTitle(u.role),
    active: u.active,
    projectCount: u._count.projects,
  }));
}

export default async function Users() {
  const admin = await currentAdmin();
  if (!admin) redirect("/dashboard");

  const users = await getUsers();

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">User accounts</h1>
          <div className="eyebrow">
            Manage user accounts and access
          </div>
        </div>
        <button className="primary" disabled title="User creation not implemented in this demo">
          <UserPlus size={16} /> New user
        </button>
      </div>
      <div className="table-wrap">
        <table className="table user-table">
          <thead>
            <tr>
              <th>USER</th>
              <th>ROLE</th>
              <th>DEPARTMENT</th>
              <th>INSTITUTION ID</th>
              <th>EMAIL</th>
              <th>PHONE</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
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
                  <td>{account.department}</td>
                  <td>{account.institutionId}</td>
                  <td>{account.email}</td>
                  <td>{account.phoneNumber}</td>
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
                    <DeleteAction
                      entity="users"
                      id={account.id}
                      name={account.name}
                      disabledReason={
                        account.id === admin.id ||
                        (process.env.DEMO_MODE === "true" && account.role === "SUPER_ADMIN")
                          ? "You cannot delete your own account."
                          : account.projectCount > 0
                            ? "Delete this user's projects first."
                            : undefined
                      }
                    />
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
