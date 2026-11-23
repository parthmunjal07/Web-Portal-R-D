import { cookies } from "next/headers";
import { db } from "./db";
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
const profileCookieName = "rd_demo_profiles";

// All roles use the same dedicated demo database. Seed entries without overwriting
// decisions already made by another user.
async function seedDemoTransactions() {
  await Promise.all(demoTransactions.map((transaction) =>
    db.demoTransaction.upsert({
      where: { id: transaction.id },
      create: transaction,
      update: {},
    }),
  ));
}

export async function setDemoApprovalStatus(code: string, status: TransactionStatus, expected: TransactionStatus, stage: "DEAN" | "SUPER_ADMIN", decision: "APPROVE" | "REJECT") {
  return db.$transaction(async (tx) => {
    const result = await tx.demoTransaction.updateMany({ where: { id: code, status: expected }, data: { status } });
    if (result.count !== 1) return false;
    await tx.demoApproval.create({ data: { transactionId: code, stage, decision } });
    return true;
  });
}

export async function createDemoTransaction(data: {
  project: string; date: string; vendor: string; purpose: string;
  amount: number; category: string; invoiceName?: string; invoicePath: string;
}) {
  return db.demoTransaction.create({ data: {
    id: `TXN-${crypto.randomUUID()}`, ...data, status: "PENDING_DEAN",
  } });
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

// Account lookup is independent of the database, so demo login remains available
// even when the shared demo database is temporarily unreachable.
export async function demoAccountRecords() {
  const [deleted, profiles] = await Promise.all([demoDeletions(), demoProfiles()]);
  return demoAccounts
    .filter((account) => !deleted.users.includes(account.email))
    .map((account) => ({ ...account, ...profiles[account.email] }));
}

export async function demoRecords() {
  await seedDemoTransactions();
  const [deleted, transactions, accounts] = await Promise.all([
    demoDeletions(), db.demoTransaction.findMany({ include: { approvals: { orderBy: { createdAt: "asc" } } } }), demoAccountRecords(),
  ]);
  const projects = demoProjects.filter((p) => !deleted.projects.includes(p.id));
  const projectCodes = new Set(projects.map((p) => p.code));
  return {
    accounts,
    projects,
    transactions: transactions
      .filter(
        (t) =>
          !deleted.transactions.includes(t.id) && projectCodes.has(t.project),
      ),
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
