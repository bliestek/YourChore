import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "YourChore - Family Chore & Reward System",
  description: "Help your family manage chores and earn stars!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "YourChore",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f6ef7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read dark mode cookie server-side to prevent flash of wrong theme
  const cookieStore = cookies();
  const isDark = cookieStore.get("darkMode")?.value === "1";

  return (
    <html lang="en" className={isDark ? "dark" : ""} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 antialiased">
        {children}
        <ServiceWorkerRegister />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              padding: "12px 20px",
              fontFamily: "Nunito, sans-serif",
              fontWeight: 600,
            },
          }}
        />
      </body>
    </html>
  );
}
