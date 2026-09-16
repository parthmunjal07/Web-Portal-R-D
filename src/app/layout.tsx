import "./globals.css";
import { Sidebar, Topbar } from "./ui";
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><div className="shell"><Sidebar/><div className="main"><Topbar/>{children}</div></div></body></html> }
