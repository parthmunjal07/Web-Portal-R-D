import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("@/lib/db", () => ({
  db: { demoTransaction: { upsert: () => { throw new Error("Database unavailable"); } } },
}));

import { demoAccountRecords } from "@/lib/demo-state";

describe("demo account lookup", () => {
  it("returns login accounts without querying the database", async () => {
    const accounts = await demoAccountRecords();
    expect(accounts.map((account) => account.role)).toEqual(["INSPECTOR", "DEAN", "SUPER_ADMIN"]);
  });
});
