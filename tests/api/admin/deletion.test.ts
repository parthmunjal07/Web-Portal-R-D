import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentAdmin: vi.fn(),
  demoRecords: vi.fn(),
  markDemoDeleted: vi.fn(),
  cleanupInvoices: vi.fn(),
  userFind: vi.fn(),
  projectFind: vi.fn(),
  transactionFind: vi.fn(),
  auditUpdateMany: vi.fn(),
  createdByUpdateMany: vi.fn(),
  reviewerUpdateMany: vi.fn(),
  auditCreate: vi.fn(),
  userDelete: vi.fn(),
  projectDelete: vi.fn(),
  transactionDelete: vi.fn(),
  transactionDeleteMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ currentAdmin: mocks.currentAdmin }));
vi.mock("@/lib/demo-state", () => ({
  demoRecords: mocks.demoRecords,
  markDemoDeleted: mocks.markDemoDeleted,
}));
vi.mock("@/lib/invoice-storage", () => ({
  cleanupInvoices: mocks.cleanupInvoices,
}));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: mocks.userFind },
    project: { findUnique: mocks.projectFind },
    transaction: { findUnique: mocks.transactionFind },
    $transaction: mocks.transaction,
  },
}));

import { DELETE as deleteUser } from "@/app/api/admin/users/[id]/route";
import { DELETE as deleteProject } from "@/app/api/admin/projects/[id]/route";
import { DELETE as deleteTransaction } from "@/app/api/admin/transactions/[code]/route";

const request = new Request("http://localhost/api/admin");
const context = (id: string) => ({ params: Promise.resolve({ id, code: id }) });
const originalDemoMode = process.env.DEMO_MODE;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DEMO_MODE = "true";
  mocks.currentAdmin.mockResolvedValue({ id: "admin", role: "SUPER_ADMIN" });
  mocks.cleanupInvoices.mockResolvedValue(0);
  mocks.demoRecords.mockResolvedValue({
    accounts: [
      { email: "inspector@demo.edu", role: "INSPECTOR" },
      { email: "admin@demo.edu", role: "SUPER_ADMIN" },
    ],
    projects: [{ id: "project-1" }],
    transactions: [{ id: "TX-1" }],
  });
  mocks.transaction.mockImplementation((fn) =>
    fn({
      auditEntry: {
        updateMany: mocks.auditUpdateMany,
        create: mocks.auditCreate,
      },
      user: { delete: mocks.userDelete },
      approval: { updateMany: mocks.reviewerUpdateMany },
      project: { delete: mocks.projectDelete },
      transaction: {
        delete: mocks.transactionDelete,
        deleteMany: mocks.transactionDeleteMany,
        updateMany: mocks.createdByUpdateMany,
      },
    }),
  );
});

afterEach(() => {
  process.env.DEMO_MODE = originalDemoMode;
});

describe("Super Admin deletion", () => {
  it("rejects non-admins for every entity", async () => {
    mocks.currentAdmin.mockResolvedValue(null);
    const responses = await Promise.all([
      deleteUser(request, context("user-1")),
      deleteProject(request, context("project-1")),
      deleteTransaction(request, context("TX-1")),
    ]);
    expect(responses.map((response) => response.status)).toEqual([
      403, 403, 403,
    ]);
  });

  it("deletes demo projects and transactions, and requires an owner's projects to go first", async () => {
    expect(
      (await deleteUser(request, context("inspector@demo.edu"))).status,
    ).toBe(409);
    expect((await deleteProject(request, context("project-1"))).status).toBe(
      200,
    );
    expect((await deleteTransaction(request, context("TX-1"))).status).toBe(
      200,
    );
    expect(mocks.markDemoDeleted).toHaveBeenCalledWith("projects", "project-1");
    expect(mocks.markDemoDeleted).toHaveBeenCalledWith("transactions", "TX-1");
    mocks.demoRecords.mockResolvedValue({
      accounts: [{ email: "inspector@demo.edu", role: "INSPECTOR" }],
      projects: [],
      transactions: [],
    });
    expect(
      (await deleteUser(request, context("inspector@demo.edu"))).status,
    ).toBe(200);
    expect(mocks.markDemoDeleted).toHaveBeenCalledWith(
      "users",
      "inspector@demo.edu",
    );
  });

  it("preserves user audit entries before deleting a real account", async () => {
    process.env.DEMO_MODE = "false";
    mocks.userFind.mockResolvedValue({
      id: "user-1",
      name: "Researcher",
      email: "r@example.com",
      role: "INSPECTOR",
      _count: { projects: 0 },
    });
    expect((await deleteUser(request, context("user-1"))).status).toBe(200);
    expect(mocks.auditUpdateMany).toHaveBeenCalledWith({
      where: { actorId: "user-1" },
      data: { actorId: null, actorName: "Researcher" },
    });
    expect(mocks.createdByUpdateMany).toHaveBeenCalledWith({
      where: { createdById: "user-1" },
      data: { createdByName: "Researcher" },
    });
    expect(mocks.reviewerUpdateMany).toHaveBeenCalledWith({
      where: { reviewerId: "user-1" },
      data: { reviewerName: "Researcher" },
    });
    expect(mocks.userDelete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "USER_DELETED",
          actorId: "admin",
        }),
      }),
    );
  });

  it("removes project transactions before the project and its invoice objects after commit", async () => {
    process.env.DEMO_MODE = "false";
    mocks.projectFind.mockResolvedValue({
      id: "project-1",
      code: "P-1",
      name: "Project",
      transactions: [{ invoice: { storageKey: "invoices/a.pdf" } }],
    });
    expect((await deleteProject(request, context("project-1"))).status).toBe(
      200,
    );
    expect(mocks.transactionDeleteMany).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
    });
    expect(mocks.projectDelete).toHaveBeenCalledWith({
      where: { id: "project-1" },
    });
    expect(mocks.cleanupInvoices).toHaveBeenCalledWith(["invoices/a.pdf"]);
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "PROJECT_DELETED" }),
      }),
    );
  });

  it("removes transaction children through cascade and cleans up its invoice", async () => {
    process.env.DEMO_MODE = "false";
    mocks.transactionFind.mockResolvedValue({
      id: "tx-1",
      code: "TX-1",
      vendor: "Vendor",
      projectId: "project-1",
      invoice: { storageKey: "invoices/a.pdf" },
    });
    expect((await deleteTransaction(request, context("TX-1"))).status).toBe(
      200,
    );
    expect(mocks.transactionDelete).toHaveBeenCalledWith({
      where: { id: "tx-1" },
    });
    expect(mocks.cleanupInvoices).toHaveBeenCalledWith(["invoices/a.pdf"]);
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "TRANSACTION_DELETED" }),
      }),
    );
  });

  it("reports invoice cleanup failures after deleting the record", async () => {
    process.env.DEMO_MODE = "false";
    mocks.transactionFind.mockResolvedValue({
      id: "tx-1",
      code: "TX-1",
      vendor: "Vendor",
      projectId: "project-1",
      invoice: { storageKey: "invoices/a.pdf" },
    });
    mocks.cleanupInvoices.mockResolvedValue(1);
    const response = await deleteTransaction(request, context("TX-1"));
    expect(response.status).toBe(200);
    expect((await response.json()).warning).toMatch(/invoice file/);
  });
});
