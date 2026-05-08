import type { Metadata, Viewport } from "next";
import { Lora, Manrope } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import RegisterSW from "@/components/RegisterSW";
import SplashScreen from "@/components/SplashScreen";
import Onboarding from "@/components/Onboarding";
import PageTransition from "@/components/PageTransition";
import { getUser } from "@/lib/auth";

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
  description: "Задачи и привычки на сегодня",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DoIt" },
  icons: { apple: "/icon-192.png", icon: "/icon-512.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f5ede0",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  const authed = !!user;
  return (
    <html lang="ru" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <main>
          <PageTransition>{children}</PageTransition>
        </main>
        {authed && <BottomNav />}
        {authed && <SplashScreen />}
        {!authed && <Onboarding />}
        <RegisterSW />
      </body>
    </html>
  );
}
