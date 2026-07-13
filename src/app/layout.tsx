import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MusicProductionUp",
  description:
    "Upload a mix, get grounded analysis and prioritized production steps.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <main>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
              🎚️ MusicProductionUp
            </Link>
            <span className="muted">mix → measure → improve</span>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "1rem 0 2rem" }} />
          {children}
        </main>
      </body>
    </html>
  );
}
