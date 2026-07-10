import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Onest } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import SettingsTrigger from "@/components/SettingsTrigger";
import Snackbar from "@/components/Snackbar";
import RegisterSW from "@/components/RegisterSW";
import Onboarding from "@/components/Onboarding";
import PageTransition from "@/components/PageTransition";
import { getUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/server";
import { LanguageProvider } from "@/lib/i18n/client";

/* Two-family system, «Фарфор и хвоя»:
   - Source Serif 4: transitional text-serif (Tiempos-adjacent) that
     holds up at 17–44px on mobile — unlike a display didone whose
     hairline strokes fall apart small. Full Cyrillic support.
   - Onest: warm humanist sans drawn for Russian-language interfaces;
     near-metric swap for Inter without the stock-template feel. */
const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Onest({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DoIt",
  description: "Tasks and habits for today",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DoIt" },
  icons: { apple: "/icon-192.png", icon: "/icon-512.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FAF8F4",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, lang] = await Promise.all([getUser(), getLang()]);
  const authed = !!user;
  return (
    <html lang={lang} className={`${sans.variable} ${serif.variable}`}>
      <body>
        <LanguageProvider initial={lang}>
          <main>
            <PageTransition>{children}</PageTransition>
          </main>
          {authed && <BottomNav />}
          {authed && <SettingsTrigger />}
          {authed && <Snackbar />}
          {!authed && <Onboarding />}
          <RegisterSW />
        </LanguageProvider>
      </body>
    </html>
  );
}
