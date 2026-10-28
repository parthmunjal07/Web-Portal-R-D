"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { money, type Role } from "@/lib/domain";
import type { ApprovalRow } from "@/lib/approval-rows";
import { Status } from "../ui";
import { ApprovalActions } from "./approval-actions";
import { ClickableTableRow } from "../clickable-table-row";

function statusLabel(status: string) {
  switch (status) {
    case "PENDING_DEAN":
      return "Pending Dean";
    case "APPROVED_BY_DEAN":
      return "Pending Final";
    case "REJECTED":
      return "Rejected";
    default:
      return "Cleared";
  }
}

export function ApprovalTable({
  initialRows,
  role,
  queue = false,
}: {
  initialRows: ApprovalRow[];
  role: Extract<Role, "DEAN" | "SUPER_ADMIN">;
  queue?: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  useEffect(() => setRows(initialRows), [initialRows]);

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>TRANSACTION</th>
            <th>PROJECT</th>
            <th>SUBMITTED BY</th>
            <th>AMOUNT</th>
            <th>INVOICE</th>
            <th>STATUS</th>
            <th>DECISION</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty-approval-row">
                {queue
                  ? "No transactions awaiting your approval."
                  : "No recorded decisions yet."}
              </td>
            </tr>
          ) : (
            rows.map((transaction) => (
              <ClickableTableRow
                key={`${transaction.code}-${transaction.status}`}
                href={`/transactions/${transaction.code}`}
                label={`Open transaction ${transaction.code}`}
              >
                <td>
                  <Link
                    className="table-link"
                    href={`/transactions/${transaction.code}`}
                  >
                    {transaction.code}
                  </Link>
                  <span className="sub">{transaction.date}</span>
                </td>
                <td>{transaction.project}</td>
                <td>{transaction.submittedBy}</td>
                <td>{money(transaction.amount)}</td>
                <td>📄 {transaction.invoiceName}</td>
                <td>
                  <Status status={statusLabel(transaction.status)} />
                </td>
                <td>
                  <ApprovalActions
                    code={transaction.code}
                    status={transaction.status}
                    role={role}
                    onDecided={(nextStatus) =>
                      setRows((current) =>
                        queue
                          ? current.filter(
                              (row) => row.code !== transaction.code,
                            )
                          : current.map((row) =>
                              row.code === transaction.code
                                ? { ...row, status: nextStatus }
                                : row,
                            ),
                      )
                    }
                  />
                </td>
              </ClickableTableRow>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
