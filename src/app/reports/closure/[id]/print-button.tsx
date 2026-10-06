"use client";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button className="primary" onClick={() => window.print()} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <Printer size={16} /> Print Closure Pack
    </button>
  );
}
