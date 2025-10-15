'use client';

import Link from 'next/link';
import { Bell, Search, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function AdminTopNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="flex h-16 items-center gap-4 px-4">
        {/* Logo and Brand */}
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <img
            src="/arisys-logo.png"
            alt="Arisys"
            className="h-10 w-auto"
          />
          <div className="hidden md:flex items-center gap-2">
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-[#C41E3A]" />
              <span className="text-sm font-semibold text-gray-900">Admin Panel</span>
            </div>
          </div>
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search companies, users, logs..."
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              3
            </Badge>
          </Button>

          {/* Settings */}
          <Link href="/admin/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
