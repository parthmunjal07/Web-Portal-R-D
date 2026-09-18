export type Role = "INSPECTOR" | "DEAN" | "SUPER_ADMIN";
export type TransactionStatus =
  "DRAFT" | "PENDING_DEAN" | "APPROVED_BY_DEAN" | "APPROVED" | "REJECTED";
export type Project = {
  id: string;
  code: string;
  name: string;
  funder: string;
  duration: string;
  budget: number;
  spent: number;
  status: string;
};
export type Transaction = {
  id: string;
  date: string;
  vendor: string;
  purpose: string;
  project: string;
  amount: number;
  status: TransactionStatus;
};
export const demoAccounts = [
  {
    role: "INSPECTOR" as Role,
    name: "Dr. Arvind Kumar",
    email: "inspector@demo.edu",
    title: "Project Inspector",
    focus: "Manage your projects and submit invoice-backed spend",
  },
  {
    role: "DEAN" as Role,
    name: "Prof. Meena Sharma",
    email: "dean@demo.edu",
    title: "Dean of Research & Development",
    focus: "Review every transaction awaiting Dean approval",
  },
  {
    role: "SUPER_ADMIN" as Role,
    name: "Ravi Menon",
    email: "admin@demo.edu",
    title: "Super Admin",
    focus: "Complete final approvals, users, and audit oversight",
  },
];
export const demoProjects: Project[] = [
  {
    id: "1",
    code: "PRJ-2023-014",
    name: "AI in Healthcare Diagnostics",
    funder: "DST-SERB",
    duration: "2022-2025",
    budget: 1500000,
    spent: 675000,
    status: "Active",
  },
  {
    id: "2",
    code: "PRJ-2023-089",
    name: "Quantum Computing Alg.",
    funder: "MeitY",
    duration: "2023-2026",
    budget: 1200000,
    spent: 180000,
    status: "Just Started",
  },
  {
    id: "3",
    code: "PRJ-2022-045",
    name: "IoT Sensor Networks",
    funder: "UGC",
    duration: "2021-2024",
    budget: 550000,
    spent: 467500,
    status: "Nearing Completion",
  },
];
export const demoTransactions: Transaction[] = [
  {
    id: "TX-4092",
    date: "Oct 24, 2023",
    vendor: "TechNova Equipments Ltd.",
    purpose: "Lab GPU Servers",
    project: "PRJ-2023-014",
    amount: 345000,
    status: "PENDING_DEAN",
  },
  {
    id: "TX-4088",
    date: "Oct 22, 2023",
    vendor: "Global Chemicals Inc.",
    purpose: "Consumables",
    project: "PRJ-2022-045",
    amount: 12500,
    status: "APPROVED",
  },
  {
    id: "TX-4085",
    date: "Oct 18, 2023",
    vendor: "Dr. A. Kumar",
    purpose: "Travel Advance - Conference",
    project: "PRJ-2023-089",
    amount: 45000,
    status: "APPROVED",
  },
];
export const money = (n: number) => `\u20b9${n.toLocaleString("en-IN")}`;
