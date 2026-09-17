"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, CircleHelp, ClipboardCheck, FileBarChart, FolderKanban, LayoutDashboard, LogOut, Menu, ReceiptIndianRupee, ShieldCheck, UserRound } from "lucide-react";

const navigation = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Projects", "/projects", FolderKanban],
  ["Transactions", "/transactions", ReceiptIndianRupee],
  ["Approvals", "/approvals", ClipboardCheck],
  ["Reports", "/reports", FileBarChart],
] as const;

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => { const queryRole = new URLSearchParams(window.location.search).get("role"); const savedRole = sessionStorage.getItem("rd_demo_role"); setRole(queryRole || savedRole); }, []);
  const isApprover = role === "DEAN" || role === "SUPER_ADMIN";
  return <><button className={`sidebar-scrim ${open ? "visible" : ""}`} aria-label="Close navigation" onClick={onClose} /><aside className={`sidebar ${open ? "open" : ""}`}>
    <div className="brand"><div className="brand-mark">R</div><small>R&amp;D Fund Portal</small></div>
    <nav className="nav" aria-label="Primary navigation">{navigation.filter(([label]) => label !== "Approvals" || isApprover).map(([label, href, Icon]) => <Link className={pathname.startsWith(href) ? "active" : ""} href={role ? `${href}?role=${role}` : href} key={href}><Icon className="nav-icon" size={19} strokeWidth={1.8} /><span>{label}</span></Link>)}{role === "SUPER_ADMIN" && <><Link className={pathname.startsWith("/admin/users") ? "active" : ""} href="/admin/users?role=SUPER_ADMIN"><UserRound className="nav-icon" size={19}/><span>User accounts</span></Link><Link className={pathname.startsWith("/admin/audit") ? "active" : ""} href="/admin/audit?role=SUPER_ADMIN"><ShieldCheck className="nav-icon" size={19}/><span>Audit log</span></Link></>}</nav>
    <div className="sidebar-footer"><Link href="/profile"><UserRound size={17} /><span>Profile</span></Link><Link href="/login"><LogOut size={17} /><span>Logout</span></Link></div>
  </aside></>;
}

export function Topbar({ onMenu }: { onMenu?: () => void }) { return <header className="topbar"><div className="topbar-left"><button className="mobile-menu" aria-label="Open navigation" onClick={onMenu}><Menu size={19}/></button><div className="crumb">Main <span> / </span> <strong>R&amp;D Portal</strong></div></div><div className="top-actions"><button className="icon-button" aria-label="Notifications"><Bell size={18}/><i className="notification-dot" /></button><button className="icon-button" aria-label="Help"><CircleHelp size={18}/></button><div className="avatar" aria-label="Signed in as Dr. Sharma">AS</div></div></header>; }

export function Status({ status }: { status: string }) { const lower = status.toLowerCase(); const cls = lower.includes("pending") ? "orange" : lower.includes("near") ? "blue" : lower.includes("reject") ? "red" : "green"; return <span className={`pill ${cls}`}><i />{status}</span>; }
