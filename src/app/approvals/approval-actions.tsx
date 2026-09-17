"use client";
import { useState } from "react";
import { Check, X } from "lucide-react";
export function ApprovalActions({ code }: { code: string }) { const [decision, setDecision] = useState(""); return decision ? <span className="decision-made">{decision}</span> : <div className="approval-actions"><button className="approve-button" onClick={() => setDecision(`${code} approved`)}><Check size={14}/> Approve</button><button className="reject-button" onClick={() => setDecision(`${code} rejected`)}><X size={14}/> Reject</button></div>; }
