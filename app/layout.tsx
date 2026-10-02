import "./globals.css";
import "./help.css";
import "./settings.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "ReviewFlow", description: "Turn great visits into Google reviews." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
