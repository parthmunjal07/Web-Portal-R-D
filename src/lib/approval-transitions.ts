import type { Role, TransactionStatus } from "./domain";

export function nextApprovalStatus(
  role: Role,
  status: TransactionStatus,
  decision: "APPROVE" | "REJECT",
): TransactionStatus | null {
  if (role === "DEAN" && status === "PENDING_DEAN")
    return decision === "APPROVE" ? "APPROVED_BY_DEAN" : "REJECTED";
  if (
    role === "SUPER_ADMIN" &&
    (status === "APPROVED_BY_DEAN" ||
      status === "APPROVED" ||
      status === "REJECTED")
  )
    return decision === "APPROVE" ? "APPROVED" : "REJECTED";
  return null;
}
