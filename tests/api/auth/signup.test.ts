import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  createUser: vi.fn(),
  createSession: vi.fn(),
  hash: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { user: { findUnique: mocks.findUser, create: mocks.createUser } },
}));
vi.mock("@/lib/auth", () => ({ createSession: mocks.createSession }));
vi.mock("bcryptjs", () => ({ default: { hash: mocks.hash } }));

import { POST } from "@/app/api/auth/signup/route";

const originalDemoMode = process.env.DEMO_MODE;
const payload = {
  name: "Dr. Arvind Kumar",
  email: "arvind@example.edu",
  password: "A-strong-password",
  role: "INSPECTOR",
  department: "Computer Science",
  institutionId: "RND-PI-001",
  phoneNumber: "+91 98765 43210",
};
const request = (body: unknown) =>
  new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DEMO_MODE = "false";
  mocks.findUser.mockResolvedValue(null);
  mocks.hash.mockResolvedValue("hashed-password");
  mocks.createUser.mockResolvedValue({ id: "user-1", role: "INSPECTOR" });
});

afterEach(() => {
  process.env.DEMO_MODE = originalDemoMode;
});

describe("signup details", () => {
  it("requires the new contact fields", async () => {
    const { department: _department, ...incomplete } = payload;
    expect((await POST(request(incomplete))).status).toBe(400);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("stores department, institution ID, and phone with the new user", async () => {
    expect((await POST(request(payload))).status).toBe(200);
    expect(mocks.createUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        department: payload.department,
        institutionId: payload.institutionId,
        phoneNumber: payload.phoneNumber,
      }),
    });
    expect(mocks.createSession).toHaveBeenCalledWith("user-1");
  });
});
