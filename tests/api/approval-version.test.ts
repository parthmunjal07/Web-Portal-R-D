import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ role: "INSPECTOR", signedIn: true, rows: [{ id: "t1", status: "PENDING_DEAN" }] }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  has: () => mocks.signedIn,
  get: () => mocks.signedIn ? { value: mocks.role } : undefined,
}) }));
vi.mock("@/lib/auth", () => ({ currentUser: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ db: { demoTransaction: { findMany: vi.fn(async () => mocks.rows) } } }));
import { GET } from "@/app/api/approval-version/route";

const original = process.env.DEMO_MODE;
beforeEach(() => { process.env.DEMO_MODE = "true"; mocks.signedIn = true; mocks.rows = [{ id: "t1", status: "PENDING_DEAN" }]; });
afterEach(() => { process.env.DEMO_MODE = original; });
describe("approval change checks", () => {
  it("changes the version when an approval changes and never returns transaction details", async () => {
    const before = await (await GET()).json();
    mocks.rows = [{ id: "t1", status: "APPROVED_BY_DEAN" }];
    const after = await (await GET()).json();
    expect(after.version).not.toBe(before.version);
    expect(Object.keys(after)).toEqual(["version"]);
  });
  it("rejects unsigned demo requests", async () => {
    mocks.signedIn = false;
    expect((await GET()).status).toBe(401);
  });
});
