'use client';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-hidden">
        <div className="w-full bg-rose-500/10 text-rose-400 text-xs font-mono py-1 px-4 text-center border-b border-rose-500/20 shrink-0">
          DATA SOURCE: SYNTHETIC SIMULATION | MODEL: V1.0 CALIBRATED | MHA / I4C PROTOTYPE
        </div>
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
