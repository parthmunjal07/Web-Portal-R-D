import "./globals.css";
import { AppShell } from "./shell";
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><AppShell>{children}</AppShell></body></html> }
