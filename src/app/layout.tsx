import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c, Nunito } from "next/font/google";
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

/* Two-family rounded system ("крупные пухлые шрифты"):
   - M PLUS Rounded 1c: plump, fully-rounded display face for H1s,
     hero numbers, card headings and section labels. Full Cyrillic
     support. Not a variable font — we load only the two display
     weights we actually use.
   - Nunito: rounded, friendly variable sans for body/UI/meta.
     Full Cyrillic support; harmonises with the display face. */
const rounded = M_PLUS_Rounded_1c({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-rounded",
  display: "swap",
  weight: ["700", "800"],
});

const sans = Nunito({
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
  themeColor: "#FBF7F1",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, lang] = await Promise.all([getUser(), getLang()]);
  const authed = !!user;
  return (
    <html lang={lang} className={`${sans.variable} ${rounded.variable}`}>
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
