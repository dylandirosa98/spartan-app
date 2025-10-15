'use client';

import { AdminTopNav } from './admin-top-nav';
import { AdminSidebar } from './admin-sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin Layout Component
 * Provides the layout structure for admin panel pages
 * Separate from regular dashboard layout to provide distinct admin experience
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Top Navigation */}
      <AdminTopNav />

      {/* Admin Sidebar - Desktop */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
