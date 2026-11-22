import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { demoRecords } from "@/lib/demo-state";
import { parseRole } from "@/lib/permissions";
import { ProfileForm, type ProfileData } from "./profile-form";

function roleTitle(role: string) {
  switch (role) {
    case "INSPECTOR":
      return "Principal Investigator";
    case "DEAN":
      return "Dean of Research & Development";
    case "SUPER_ADMIN":
      return "Super Admin";
    default:
      return role;
  }
}

async function getProfile(): Promise<ProfileData> {
  if (process.env.DEMO_MODE === "true") {
    const store = await cookies();
    if (store.get("rd_demo")?.value !== "true") redirect("/login");
    const role = parseRole(store.get("rd_demo_role")?.value);
    const account = (await demoRecords()).accounts.find(
      (user) => user.role === role,
    );
    if (!account) redirect("/login");
    return {
      name: account.name,
      email: account.email,
      roleTitle: account.title,
      department: account.department,
      institutionId: account.institutionId,
      phoneNumber: account.phoneNumber,
    };
  }

  const user = await currentUser();
  if (!user?.active) redirect("/login");
  return {
    name: user.name,
    email: user.email,
    roleTitle: roleTitle(user.role),
    department: user.department ?? "",
    institutionId: user.institutionId ?? "",
    phoneNumber: user.phoneNumber ?? "",
  };
}

export default async function Profile() {
  const profile = await getProfile();

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">Profile</h1>
          <div className="eyebrow">Account and contact details</div>
        </div>
      </div>
      <div className="panel" style={{ maxWidth: 700 }}>
        <ProfileForm profile={profile} />
        <hr
          style={{
            border: 0,
            borderTop: "1px solid #e5e7eb",
            margin: "28px 0",
          }}
        />
        <h2>Sessions</h2>
        <p className="sub">Your current session is active.</p>
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
