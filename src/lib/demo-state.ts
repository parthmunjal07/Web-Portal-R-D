import { cookies } from "next/headers";
import {
  demoAccounts,
  demoProjects,
  demoTransactions,
  type TransactionStatus,
} from "./domain";
import { profileFieldsSchema, type ProfileFields } from "./profile-fields";

export type DemoEntity = "users" | "projects" | "transactions";
type DemoDeletions = Record<DemoEntity, string[]>;
const cookieName = "rd_demo_deleted";
const approvalCookieName = "rd_demo_approvals";
const profileCookieName = "rd_demo_profiles";
const validStatuses = new Set<TransactionStatus>([
  "PENDING_DEAN",
  "APPROVED_BY_DEAN",
  "APPROVED",
  "REJECTED",
]);

export async function demoApprovalStatuses(): Promise<
  Record<string, TransactionStatus>
> {
  const raw = (await cookies()).get(approvalCookieName)?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, TransactionStatus] =>
          typeof entry[1] === "string" &&
          validStatuses.has(entry[1] as TransactionStatus),
      ),
    );
  } catch {
    return {};
  }
}

export async function setDemoApprovalStatus(
  code: string,
  status: TransactionStatus,
) {
  const statuses = await demoApprovalStatuses();
  statuses[code] = status;
  (await cookies()).set(approvalCookieName, JSON.stringify(statuses), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
}

async function demoProfiles(): Promise<Record<string, ProfileFields>> {
  const raw = (await cookies()).get(profileCookieName)?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([email, value]) => {
        const result = profileFieldsSchema.safeParse(value);
        return result.success ? [[email, result.data]] : [];
      }),
    );
  } catch {
    return {};
  }
}

export async function setDemoProfile(email: string, fields: ProfileFields) {
  const profiles = await demoProfiles();
  profiles[email] = fields;
  (await cookies()).set(profileCookieName, JSON.stringify(profiles), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
}

export async function demoDeletions(): Promise<DemoDeletions> {
  const raw = (await cookies()).get(cookieName)?.value;
  if (!raw) return { users: [], projects: [], transactions: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users)
        ? parsed.users.filter((v: unknown) => typeof v === "string")
        : [],
      projects: Array.isArray(parsed.projects)
        ? parsed.projects.filter((v: unknown) => typeof v === "string")
        : [],
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions.filter((v: unknown) => typeof v === "string")
        : [],
    };
  } catch {
    return { users: [], projects: [], transactions: [] };
  }
}

export async function demoRecords() {
  const [deleted, statuses, profiles] = await Promise.all([
    demoDeletions(),
    demoApprovalStatuses(),
    demoProfiles(),
  ]);
  const projects = demoProjects.filter((p) => !deleted.projects.includes(p.id));
  const projectCodes = new Set(projects.map((p) => p.code));
  return {
    accounts: demoAccounts
      .filter((a) => !deleted.users.includes(a.email))
      .map((account) => ({ ...account, ...profiles[account.email] })),
    projects,
    transactions: demoTransactions
      .filter(
        (t) =>
          !deleted.transactions.includes(t.id) && projectCodes.has(t.project),
      )
      .map((t) => ({ ...t, status: statuses[t.id] ?? t.status })),
  };
}

export async function markDemoDeleted(entity: DemoEntity, id: string) {
  const deleted = await demoDeletions();
  if (!deleted[entity].includes(id)) deleted[entity].push(id);
  (await cookies()).set(cookieName, JSON.stringify(deleted), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
}
