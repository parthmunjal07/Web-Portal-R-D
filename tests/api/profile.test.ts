import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signedIn: true,
  role: "INSPECTOR",
  currentUser: vi.fn(),
  demoRecords: vi.fn(),
  setDemoProfile: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "rd_demo"
        ? mocks.signedIn
          ? { value: "true" }
          : undefined
        : name === "rd_demo_role"
          ? { value: mocks.role }
          : undefined,
  }),
}));
vi.mock("@/lib/auth", () => ({ currentUser: mocks.currentUser }));
vi.mock("@/lib/demo-state", () => ({
  demoRecords: mocks.demoRecords,
  setDemoProfile: mocks.setDemoProfile,
}));
vi.mock("@/lib/db", () => ({ db: { user: { update: mocks.updateUser } } }));

import { PATCH } from "@/app/api/profile/route";

const fields = {
  department: "Computer Science",
  institutionId: "RND-PI-001",
  phoneNumber: "+91 98765 43210",
};
const request = (body: unknown) =>
  new Request("http://localhost/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const originalDemoMode = process.env.DEMO_MODE;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DEMO_MODE = "true";
  mocks.signedIn = true;
  mocks.role = "INSPECTOR";
  mocks.demoRecords.mockResolvedValue({
    accounts: [{ email: "inspector@demo.edu", role: "INSPECTOR" }],
  });
});

afterEach(() => {
  process.env.DEMO_MODE = originalDemoMode;
});

describe("profile details", () => {
  it("validates the phone number", async () => {
    const response = await PATCH(
      request({ ...fields, phoneNumber: "invalid" }),
    );
    expect(response.status).toBe(400);
    expect(mocks.setDemoProfile).not.toHaveBeenCalled();
  });

  it("saves demo details for the signed-in account", async () => {
    expect((await PATCH(request(fields))).status).toBe(200);
    expect(mocks.setDemoProfile).toHaveBeenCalledWith(
      "inspector@demo.edu",
      fields,
    );
  });

  it("requires a signed-in account", async () => {
    mocks.signedIn = false;
    expect((await PATCH(request(fields))).status).toBe(401);
  });

  it("updates database-backed users", async () => {
    process.env.DEMO_MODE = "false";
    mocks.currentUser.mockResolvedValue({ id: "user-1", active: true });
    expect((await PATCH(request(fields))).status).toBe(200);
    expect(mocks.updateUser).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: fields,
    });
  });
});
