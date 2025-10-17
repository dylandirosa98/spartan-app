'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  Plug,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  User,
  Shield,
  Smartphone,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const adminNavItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    description: 'System overview and key metrics',
  },
  {
    label: 'Companies',
    href: '/admin/companies',
    icon: Building2,
    description: 'Manage roofing companies',
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Cross-company user management',
  },
  {
    label: 'Activity Logs',
    href: '/admin/activity',
    icon: Activity,
    description: 'Audit trail and system logs',
  },
  {
    label: 'Integrations',
    href: '/admin/integrations',
    icon: Plug,
    description: 'API and integration health',
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'System-wide analytics',
  },
  {
    label: 'Mobile',
    href: '/admin/mobile',
    icon: Smartphone,
    description: 'Mobile app oversight',
  },
  {
    label: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    description: 'Communication center',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System configuration',
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="hidden md:fixed md:left-0 md:top-16 md:flex md:h-[calc(100vh-4rem)] md:w-64 md:flex-col md:border-r md:bg-white md:shadow-sm">
      {/* Admin Badge */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-[#C41E3A]/5 to-[#C41E3A]/10">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#C41E3A]" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Admin Panel</p>
            <p className="text-xs text-gray-600">System Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-all group',
                isActive
                  ? 'bg-[#C41E3A]/10 text-[#C41E3A] font-medium'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 mt-0.5 flex-shrink-0',
                isActive ? 'text-[#C41E3A]' : 'text-gray-500 group-hover:text-gray-700'
              )} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.label}</p>
                <p className={cn(
                  'text-xs truncate mt-0.5',
                  isActive ? 'text-[#C41E3A]/70' : 'text-gray-500'
                )}>
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Actions */}
      {currentUser && (
        <div className="border-t p-3 space-y-3 bg-gray-50">
          <div className="flex items-start gap-3 px-3 py-2 bg-white rounded-lg border border-gray-200">
            <div className="rounded-full bg-gradient-to-br from-[#C41E3A] to-[#A01829] p-2">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUser.email}
              </p>
              <Badge
                variant="secondary"
                className="mt-1.5 text-[10px] capitalize bg-[#C41E3A] text-white hover:bg-[#A01829]"
              >
                Master Admin
              </Badge>
            </div>
          </div>

          {/* Preview Company View */}
          <Button
            variant="outline"
            className="w-full text-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            onClick={() => router.push('/leads')}
          >
            <Eye className="mr-2 h-4 w-4" />
            View as Company
          </Button>

          <Button
            variant="outline"
            className="w-full text-sm hover:bg-[#C41E3A]/10 hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      )}
    </aside>
  );
}
