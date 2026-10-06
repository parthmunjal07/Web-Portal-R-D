"use client";
import { useState } from "react";
import { Sidebar, Topbar } from "./ui";
import { usePathname } from "next/navigation";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: { name: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/signup") {
    return <>{children}</>;
  }

  return (
    <div className="shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="main">
        <Topbar onMenu={() => setOpen(true)} user={user} />
        {children}
      </div>
    </div>
  );
}
