"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

type Entity = "users" | "projects" | "transactions";

const consequences: Record<Entity, string> = {
  users: "This removes the account and ends its sessions.",
  projects: "This also removes its transactions, approvals, and invoices.",
  transactions: "This also removes its approvals and invoice.",
};

export function DeleteAction({
  entity,
  id,
  name,
  disabledReason,
}: {
  entity: Entity;
  id: string;
  name: string;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  async function remove() {
    if (
      !window.confirm(`Permanently delete ${name}?\n\n${consequences[entity]}`)
    )
      return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/${entity}/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Deletion failed. Please try again.");
        return;
      }
      setWarning(result.warning || "");
      setDeleted(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (deleted)
    return (
      <div className="delete-action">
        <span className="sub">Deleted</span>
        {warning && (
          <span className="delete-error" role="alert">
            {warning}
          </span>
        )}
      </div>
    );

  return (
    <div className="delete-action">
      <button
        type="button"
        className="delete-button"
        onClick={remove}
        disabled={loading || !!disabledReason}
        title={disabledReason}
        aria-label={`Delete ${name}`}
      >
        {loading ? <Loader2 size={14} /> : <Trash2 size={14} />}
        {loading ? "Deleting…" : "Delete"}
      </button>
      {disabledReason && <span className="sub">{disabledReason}</span>}
      {error && (
        <span className="delete-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
