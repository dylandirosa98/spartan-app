'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { TaskCalendar } from '@/components/calendar/task-calendar';

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Task Calendar
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            View all your tasks and appointments in a calendar view
          </p>
        </div>

        <TaskCalendar />
      </div>
    </DashboardLayout>
  );
}
