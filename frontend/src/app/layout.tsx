import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CyberCash Sentinel | I4C Command Centre",
  description: "National Predictive Financial Cybercrime Intelligence — MHA / I4C",
};

import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./components/AuthContext";
import { WebSocketProvider } from "./components/WebSocketProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import NotificationOverlay from "./components/NotificationOverlay";
import AppShell from "./components/AppShell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0b1120] text-slate-300">
        <ErrorBoundary>
          <AuthProvider>
            <WebSocketProvider>
              <AppShell>{children}</AppShell>
              <NotificationOverlay />
            </WebSocketProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
