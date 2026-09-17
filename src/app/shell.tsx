"use client";
import { useState } from "react";
import { Sidebar, Topbar } from "./ui";
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="shell"><Sidebar open={open} onClose={() => setOpen(false)} /><div className="main"><Topbar onMenu={() => setOpen(true)} />{children}</div></div>;
}
