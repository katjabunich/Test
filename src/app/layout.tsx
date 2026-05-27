import type { Metadata, Viewport } from "next";
import { Lora, Manrope } from "next/font/google";
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

/* Two-family system:
   - Lora: warm soft serif for emotional moments (H1s, hero title,
     streak number, onboarding titles). Modern soft serif, full Cyrillic.
   - Manrope: workhorse sans for body, lists, labels, UI chrome. Native
     Cyrillic by Mikhail Sharanda, slightly rounded geometric. */
const serif = Lora({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-serif",
  display: "swap",
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
  themeColor: "#FAFAFA",
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
