'use client';

import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <aside className="hidden md:block border-r bg-muted/10">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
