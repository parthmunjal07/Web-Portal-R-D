"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CircleHelp, ClipboardCheck, FileBarChart, FolderKanban, LayoutDashboard, LogOut, Menu, ReceiptIndianRupee, UserRound } from "lucide-react";

const navigation = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Projects", "/projects", FolderKanban],
  ["Transactions", "/transactions", ReceiptIndianRupee],
  ["Approvals", "/approvals", ClipboardCheck],
  ["Reports", "/reports", FileBarChart],
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark">R</div><small>R&amp;D Fund Portal</small></div>
    <nav className="nav" aria-label="Primary navigation">{navigation.map(([label, href, Icon]) => <Link className={pathname.startsWith(href) ? "active" : ""} href={href} key={href}><Icon className="nav-icon" size={19} strokeWidth={1.8} /><span>{label}</span></Link>)}</nav>
    <div className="sidebar-footer"><Link href="/profile"><UserRound size={17} /><span>Profile</span></Link><Link href="/login"><LogOut size={17} /><span>Logout</span></Link></div>
  </aside>;
}

export function Topbar() { return <header className="topbar"><div className="topbar-left"><button className="mobile-menu" aria-label="Open navigation"><Menu size={19}/></button><div className="crumb">Main <span> / </span> <strong>R&amp;D Portal</strong></div></div><div className="top-actions"><button className="icon-button" aria-label="Notifications"><Bell size={18}/><i className="notification-dot" /></button><button className="icon-button" aria-label="Help"><CircleHelp size={18}/></button><div className="avatar" aria-label="Signed in as Dr. Sharma">AS</div></div></header>; }

export function Status({ status }: { status: string }) { const lower = status.toLowerCase(); const cls = lower.includes("pending") ? "orange" : lower.includes("near") ? "blue" : lower.includes("reject") ? "red" : "green"; return <span className={`pill ${cls}`}><i />{status}</span>; }
