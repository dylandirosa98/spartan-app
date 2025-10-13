'use client';

import { TopNav } from './top-nav';
import { BottomNav } from './bottom-nav';
import { Sidebar } from './sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation - Always visible */}
      <TopNav />

      {/* Desktop Sidebar - Hidden on mobile */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="pb-18 md:pb-0 md:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
    </div>
  );
}
