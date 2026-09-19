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
  title: "CyberCash Sentinel — I4C Command Centre",
  description: "National Predictive Financial Cybercrime Intelligence",
};

import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./components/AuthContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-[#0b1120] text-slate-300">
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
            <div className="w-full bg-rose-500/10 text-rose-400 text-xs font-mono py-1 px-4 text-center border-b border-rose-500/20">
              DATA SOURCE: SYNTHETIC SIMULATION | MODEL: V1.0 CALIBRATED
            </div>
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
