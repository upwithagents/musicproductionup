import type { Metadata } from "next";
import { Archivo, Inter, IBM_Plex_Mono } from "next/font/google";
import { AppNav, ThemeScript } from "@upwithagents/ui";
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
        <PortalChrome>
          <main>
            <AppNav
              links={[{ href: "/", label: "Dashboard" }]}
              right={<span className="muted">mix → measure → improve</span>}
            />
            {children}
          </main>
        </PortalChrome>
      </body>
    </html>
  );
}
