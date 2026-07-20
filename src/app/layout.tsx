import type { Metadata } from "next";
import Link from "next/link";
import { Archivo, Inter, IBM_Plex_Mono } from "next/font/google";
import { ThemeScript } from "@upwithagents/ui";
import "./globals.css";
import { PortalChrome } from "./components/PortalChrome";

const archivo = Archivo({
  variable: "--app-font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--app-font-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--app-font-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MusicProductionUp",
  description:
    "Upload a mix, get grounded analysis and prioritized production steps.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <PortalChrome />
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
