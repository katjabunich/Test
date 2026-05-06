import type { Metadata, Viewport } from "next";
import { Onest, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import RegisterSW from "@/components/RegisterSW";

/* Geist clone with full Cyrillic support — visually nearly identical. */
const display = Onest({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-geist",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});
/* Mono for tabular labels — has Cyrillic. */
const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Дела",
  description: "Задачи и привычки на сегодня",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Дела" },
  icons: { apple: "/icon-192.png", icon: "/icon-512.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fbf6ee",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${display.variable} ${mono.variable}`}>
      <body>
        <main>{children}</main>
        <BottomNav />
        <RegisterSW />
      </body>
    </html>
  );
}
