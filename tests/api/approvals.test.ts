import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionStatus as PrismaStatus } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  role: "DEAN",
  demoRecords: vi.fn(),
  setDemoApprovalStatus: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "rd_demo_role" ? { value: mocks.role } : undefined,
  }),
}));
vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
  hasRole: (user: { role: string } | null, roles: string[]) =>
    !!user && roles.includes(user.role),
}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/demo-state", () => ({
  demoRecords: mocks.demoRecords,
  setDemoApprovalStatus: mocks.setDemoApprovalStatus,
}));

import { POST } from "@/app/api/approvals/route";
import { getApprovalRows } from "@/lib/approval-rows";

const originalDemoMode = process.env.DEMO_MODE;
const request = (code: string, decision: string) =>
  new Request("http://localhost/api/approvals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactionCode: code, decision }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DEMO_MODE = "true";
  mocks.role = "DEAN";
  mocks.demoRecords.mockResolvedValue({
    transactions: [
      {
        id: "TX-PENDING",
        status: "PENDING_DEAN",
        project: "P-1",
        date: "Today",
        amount: 10,
      },
      {
        id: "TX-FINAL",
        status: "APPROVED_BY_DEAN",
        project: "P-1",
        date: "Today",
        amount: 20,
      },
      {
        id: "TX-APPROVED",
        status: "APPROVED",
        project: "P-1",
        date: "Today",
        amount: 30,
      },
      {
        id: "TX-REJECTED",
        status: "REJECTED",
        project: "P-1",
        date: "Today",
        amount: 40,
      },
    ],
  });
});

afterEach(() => {
  process.env.DEMO_MODE = originalDemoMode;
});

describe("dashboard approval queues", () => {
  it("separates Dean, final review, and completed decisions", async () => {
    expect(
      (await getApprovalRows([PrismaStatus.PENDING_DEAN])).map(
        (row) => row.code,
      ),
    ).toEqual(["TX-PENDING"]);
    expect(
      (await getApprovalRows([PrismaStatus.APPROVED_BY_DEAN])).map(
        (row) => row.code,
      ),
    ).toEqual(["TX-FINAL"]);
    expect(
      (
        await getApprovalRows([PrismaStatus.APPROVED, PrismaStatus.REJECTED])
      ).map((row) => row.code),
    ).toEqual(["TX-APPROVED", "TX-REJECTED"]);
  });

  it("saves a Dean decision so it leaves the pending queue", async () => {
    const response = await POST(request("TX-PENDING", "APPROVE"));
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("APPROVED_BY_DEAN");
    expect(mocks.setDemoApprovalStatus).toHaveBeenCalledWith(
      "TX-PENDING",
      "APPROVED_BY_DEAN",
    );
    expect((await POST(request("TX-APPROVED", "REJECT"))).status).toBe(409);
  });

  it("lets Super Admin finalize and change recorded decisions", async () => {
    mocks.role = "SUPER_ADMIN";
    expect((await POST(request("TX-FINAL", "REJECT"))).status).toBe(200);
    expect(mocks.setDemoApprovalStatus).toHaveBeenCalledWith(
      "TX-FINAL",
      "REJECTED",
    );
    expect((await POST(request("TX-REJECTED", "APPROVE"))).status).toBe(200);
    expect(mocks.setDemoApprovalStatus).toHaveBeenCalledWith(
      "TX-REJECTED",
      "APPROVED",
    );
    expect((await POST(request("TX-PENDING", "APPROVE"))).status).toBe(409);
  });
});
