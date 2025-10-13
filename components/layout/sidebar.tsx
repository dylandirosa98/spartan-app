'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, BarChart3, Calendar, Settings, LogOut, User, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navItems = [
  {
    label: 'Leads',
    href: '/leads',
    icon: Users,
    requiredPermission: 'view_leads' as const,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    requiredPermission: 'view_analytics' as const,
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    requiredPermission: 'view_leads' as const,
  },
  {
    label: 'Mobile Users',
    href: '/mobile-users',
    icon: Smartphone,
    requiredPermission: 'view_settings' as const, // Only admins can manage mobile users
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    requiredPermission: 'view_settings' as const,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, currentUser, logout } = useAuthStore();

  // Filter nav items based on user permissions
  const visibleNavItems = navItems.filter((item) =>
    hasPermission(item.requiredPermission)
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="hidden md:fixed md:left-0 md:top-16 md:flex md:h-[calc(100vh-4rem)] md:w-60 md:flex-col md:border-r md:bg-white">
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      {currentUser && (
        <div className="border-t p-3 space-y-3">
          <div className="flex items-start gap-3 px-3 py-2 bg-gray-50 rounded-lg">
            <div className="rounded-full bg-[#C41E3A] p-2">
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
                className="mt-1 text-[10px] capitalize bg-[#C41E3A]/10 text-[#C41E3A] hover:bg-[#C41E3A]/20"
              >
                {currentUser.role}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full text-sm"
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
