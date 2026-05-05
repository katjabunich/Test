import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "Дела",
  description: "Задачи и привычки на сегодня",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Дела",
  },
  icons: {
    apple: "/icon-192.png",
    icon: "/icon-512.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FCFEFD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full">
        <main
          style={{
            maxWidth: 430,
            margin: "0 auto",
            minHeight: "100vh",
            paddingBottom: "calc(96px + env(safe-area-inset-bottom))",
          }}
        >
          {children}
        </main>
        <BottomNav />
        <RegisterSW />
      </body>
    </html>
  );
}
