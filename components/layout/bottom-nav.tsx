'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, BarChart3, Calendar, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';

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
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    requiredPermission: 'view_settings' as const,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { hasPermission } = useAuthStore();

  // Filter nav items based on user permissions
  const visibleNavItems = navItems.filter((item) =>
    hasPermission(item.requiredPermission)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white pb-safe md:hidden">
      <div className="flex h-18 items-center justify-around">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
