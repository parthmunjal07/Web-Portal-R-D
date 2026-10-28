import { describe, expect, it } from "vitest";
import { nextApprovalStatus } from "@/lib/approval-transitions";

describe("approval transitions", () => {
  it("moves a Dean decision out of the Dean queue", () => {
    expect(nextApprovalStatus("DEAN", "PENDING_DEAN", "APPROVE")).toBe(
      "APPROVED_BY_DEAN",
    );
    expect(nextApprovalStatus("DEAN", "PENDING_DEAN", "REJECT")).toBe(
      "REJECTED",
    );
    expect(nextApprovalStatus("DEAN", "REJECTED", "APPROVE")).toBeNull();
  });

  it("allows final review and later Super Admin overrides", () => {
    expect(
      nextApprovalStatus("SUPER_ADMIN", "APPROVED_BY_DEAN", "APPROVE"),
    ).toBe("APPROVED");
    expect(
      nextApprovalStatus("SUPER_ADMIN", "APPROVED_BY_DEAN", "REJECT"),
    ).toBe("REJECTED");
    expect(nextApprovalStatus("SUPER_ADMIN", "REJECTED", "APPROVE")).toBe(
      "APPROVED",
    );
    expect(nextApprovalStatus("SUPER_ADMIN", "APPROVED", "REJECT")).toBe(
      "REJECTED",
    );
    expect(
      nextApprovalStatus("SUPER_ADMIN", "PENDING_DEAN", "APPROVE"),
    ).toBeNull();
  });
});
