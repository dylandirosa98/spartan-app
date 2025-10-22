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
  const { currentUser } = useAuthStore();

  // Show all nav items - don't filter by permissions
  const visibleNavItems = navItems;

  // Generate company-specific URL
  const getCompanyUrl = (href: string) => {
    if (currentUser?.company_id) {
      return `/company/${currentUser.company_id}${href}`;
    }
    // Fallback: try to extract company_id from current pathname
    const companyMatch = pathname?.match(/^\/company\/([^\/]+)/);
    if (companyMatch) {
      return `/company/${companyMatch[1]}${href}`;
    }
    return href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white pb-safe md:hidden">
      <div className="flex h-18 items-center justify-around">
        {visibleNavItems.map((item) => {
          const companyHref = getCompanyUrl(item.href);
          const isActive = pathname === companyHref || pathname?.startsWith(`${companyHref}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={companyHref}
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
