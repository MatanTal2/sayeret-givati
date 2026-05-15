import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { OutboxProvider } from "@/contexts/OutboxContext";
import { ToastProvider } from "@/components/ui/Toast";
import GlobalAuthModal from "@/components/auth/GlobalAuthModal";
import EmailVerificationBanner from "@/components/auth/EmailVerificationBanner";
import ServiceWorkerUpdater from "@/components/pwa/ServiceWorkerUpdater";
import SyncStatusIndicator from "@/components/pwa/SyncStatusIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "מסייעת סיירת גבעתי",
  description: "מערכת ניהול מסייעת לסיירת גבעתי",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <OutboxProvider>
            <NotificationProvider>
              <ToastProvider>
                <EmailVerificationBanner />
                {children}
                <GlobalAuthModal />
                <ServiceWorkerUpdater />
                <SyncStatusIndicator />
              </ToastProvider>
            </NotificationProvider>
          </OutboxProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
