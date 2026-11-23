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
    if (!user || !["/dashboard", "/transactions", "/approvals"].some((p) => pathname === p || pathname.startsWith(p + "/"))) return;
    let previous: string | undefined;
    let stopped = false;
    let pending = false;
    const check = async () => {
      if (document.visibilityState !== "visible" || pending) return;
      pending = true;
      try {
        const response = await fetch("/api/approval-version", { cache: "no-store" });
        if (!response.ok) return;
        const { version } = await response.json();
        if (stopped || typeof version !== "string") return;
        if (previous !== undefined && previous !== version) router.refresh();
        previous = version;
      } catch { /* Retry on the next interval without interrupting the page. */ }
      finally { pending = false; }
    };
    void check();
    const timer = window.setInterval(check, 15000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => { stopped = true; window.clearInterval(timer); document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); };
  }, [pathname, router, user?.role]);

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
