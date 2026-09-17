import type { Role } from "./domain";
export type { Role } from "./domain";

export type Capability =
  | "createProject" | "setBudget" | "addFundingOrganization"
  | "addCoInspectors" | "editEndDate" | "submitTransaction"
  | "editDraftTransaction" | "viewAllProjects" | "viewAllTransactions"
  | "approveTransaction" | "viewAllAudit" | "manageUsers";

const matrix: Record<Capability, Role[]> = {
  createProject: ["INSPECTOR", "DEAN", "SUPER_ADMIN"],
  setBudget: ["INSPECTOR", "DEAN", "SUPER_ADMIN"],
  addFundingOrganization: ["INSPECTOR"],
  addCoInspectors: ["INSPECTOR", "DEAN", "SUPER_ADMIN"],
  editEndDate: ["DEAN", "SUPER_ADMIN"],
  submitTransaction: ["INSPECTOR"],
  editDraftTransaction: ["INSPECTOR"],
  viewAllProjects: ["DEAN", "SUPER_ADMIN"],
  viewAllTransactions: ["DEAN", "SUPER_ADMIN"],
  approveTransaction: ["DEAN", "SUPER_ADMIN"],
  viewAllAudit: ["DEAN", "SUPER_ADMIN"],
  manageUsers: ["SUPER_ADMIN"],
};

export function can(role: Role, capability: Capability) { return matrix[capability].includes(role); }
export function parseRole(value?: string): Role { return value === "DEAN" || value === "SUPER_ADMIN" ? value : "INSPECTOR"; }
