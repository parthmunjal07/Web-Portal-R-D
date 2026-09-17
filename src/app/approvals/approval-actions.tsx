"use client";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

export function ApprovalActions({ code, status }: { code: string; status: string }) {
  const [role, setRole] = useState<string>("DEAN");
  const [decision, setDecision] = useState("");
  useEffect(() => setRole(sessionStorage.getItem("rd_demo_role") || "DEAN"), []);
  const isAdmin = role === "SUPER_ADMIN";
  const canDecide = status === "PENDING_DEAN" || isAdmin;
  if (!canDecide) return <span className="sub">Completed</span>;
  if (decision) return <span className="decision-made">{decision}</span>;
  return <div className="approval-actions"><button className="approve-button" onClick={() => setDecision(`${code} ${isAdmin && status !== "PENDING_DEAN" ? "decision changed to approved" : "approved"}`)}><Check size={14}/> {isAdmin && status !== "PENDING_DEAN" ? "Change to approve" : "Approve"}</button><button className="reject-button" onClick={() => setDecision(`${code} ${isAdmin && status !== "PENDING_DEAN" ? "decision changed to rejected" : "rejected"}`)}><X size={14}/> {isAdmin && status !== "PENDING_DEAN" ? "Change to reject" : "Reject"}</button></div>;
}
