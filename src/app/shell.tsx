"use client";
import { useEffect, useState } from "react";
import { Sidebar, Topbar } from "./ui";
import { usePathname, useRouter } from "next/navigation";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: { name: string; role: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!user || pathname === "/login" || pathname === "/signup") return;
    const refresh = () => { if (document.visibilityState === "visible") router.refresh(); };
    const timer = window.setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("focus", refresh); };
  }, [pathname, router, user]);

  if (pathname === "/login" || pathname === "/signup") {
    return <>{children}</>;
  }

  return (
    <div className="shell">
      <Sidebar open={open} onClose={() => setOpen(false)} role={user?.role} />
      <div className="main">
        <Topbar onMenu={() => setOpen(true)} user={user} />
        {children}
      </div>
    </div>
  );
}
