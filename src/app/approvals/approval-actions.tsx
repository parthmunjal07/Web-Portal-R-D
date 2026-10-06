"use client";
import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

export function ApprovalActions({
  code,
  status,
}: {
  code: string;
  status: string;
}) {
  const [role, setRole] = useState<string>("DEAN");
  const [committed, setCommitted] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () => setRole(sessionStorage.getItem("rd_demo_role") || "DEAN"),
    [],
  );

  const isAdmin = role === "SUPER_ADMIN";
  const isOverride = isAdmin && status !== "PENDING_DEAN";
  // DEAN acts on PENDING_DEAN; Admin can act on APPROVED_BY_DEAN or override
  const canDecide =
    status === "PENDING_DEAN" ||
    (isAdmin &&
      (status === "APPROVED_BY_DEAN" ||
        status === "APPROVED" ||
        status === "REJECTED"));

  async function decide(decision: "APPROVE" | "REJECT") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-role": role,
        },
        body: JSON.stringify({ transactionCode: code, decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Action failed. Please try again.");
        return;
      }
      const verb = decision === "APPROVE" ? "approved" : "rejected";
      setCommitted(
        isOverride ? `${code} decision changed to ${verb}` : `${code} ${verb}`,
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!canDecide) return <span className="sub">Completed</span>;
  if (committed) return <span className="decision-made">{committed}</span>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {error && <span className="approval-error">{error}</span>}
      <div className="approval-actions">
        <button
          className="approve-button"
          disabled={loading}
          onClick={() => decide("APPROVE")}
        >
          {loading ? (
            <Loader2 size={14} className="spin" />
          ) : (
            <Check size={14} />
          )}{" "}
          {isOverride ? "Change to approve" : "Approve"}
        </button>
        <button
          className="reject-button"
          disabled={loading}
          onClick={() => decide("REJECT")}
        >
          {loading ? (
            <Loader2 size={14} className="spin" />
          ) : (
            <X size={14} />
          )}{" "}
          {isOverride ? "Change to reject" : "Reject"}
        </button>
      </div>
    </div>
  );
}
