import { ClipboardCheck } from "lucide-react";
import { TransactionStatus as PrismaStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { getApprovalRows } from "@/lib/approval-rows";
import { ApprovalTable } from "./approval-table";

export default async function Approvals() {
  const admin = await currentAdmin();
  if (!admin) redirect("/dashboard");

  const rows = await getApprovalRows([PrismaStatus.APPROVED, PrismaStatus.REJECTED]);

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">Recorded decisions</h1>
          <div className="eyebrow">
            Review approved and rejected transactions and change a decision when needed
          </div>
        </div>
        <span className="pill blue"><i />{rows.length} decisions</span>
      </div>
      <div className="notice">
        <ClipboardCheck size={17} /> New final approvals are handled on the dashboard.
      </div>
      <ApprovalTable initialRows={rows} role="SUPER_ADMIN" />
    </main>
  );
}
