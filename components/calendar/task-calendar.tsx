'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, User, MapPin } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup date-fns localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarTask {
  id: string;
  title: string;
  body: string | null;
  status: string | null;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  leadId: string | null;
  leadName: string | null;
  assignee: {
    id: string;
    name: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarTask;
}

export function TaskCalendar() {
  const params = useParams();
  const companyId = params.company_id as string;
  const { toast } = useToast();

  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // Fetch all tasks
  const fetchTasks = async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/tasks/all?companyId=${companyId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('[Task Calendar] Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks for calendar',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [companyId]);

  // Transform tasks to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return tasks
      .filter(task => task.dueAt) // Only show tasks with due dates
      .map(task => {
        const startDate = new Date(task.dueAt!);
        const endDate = addHours(startDate, 1); // Make each task 1 hour long

        return {
          id: task.id,
          title: `${task.leadName ? `[${task.leadName}] ` : ''}${task.title}`,
          start: startDate,
          end: endDate,
          resource: task,
        };
      });
  }, [tasks]);

  // Custom event style based on status
  const eventStyleGetter = (event: CalendarEvent) => {
    const task = event.resource;
    let backgroundColor = '#C41E3A'; // Default Spartan red

    switch (task.status) {
      case 'DONE':
        backgroundColor = '#10b981'; // Green
        break;
      case 'IN_PROGRESS':
        backgroundColor = '#3b82f6'; // Blue
        break;
      case 'TODO':
        backgroundColor = '#f59e0b'; // Amber
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  // Format status for display
  const formatStatus = (status: string | null) => {
    if (!status) return 'To Do';
    return status.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Get status color
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'TODO':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-[#C41E3A]" />
            Tasks Calendar
          </CardTitle>
          <p className="text-sm text-gray-500">
            {tasks.length} total tasks, {events.length} scheduled
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2 flex-wrap">
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
              To Do
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              In Progress
            </Badge>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Done
            </Badge>
          </div>

          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={(event) => setSelectedEvent(event)}
              eventPropGetter={eventStyleGetter}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              popup
              views={['month', 'week', 'day', 'agenda']}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-[#C41E3A]" />
              {selectedEvent?.resource.title}
            </DialogTitle>
            <DialogDescription>
              Task details and information
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedEvent.resource.status)}>
                  {formatStatus(selectedEvent.resource.status)}
                </Badge>
              </div>

              {selectedEvent.resource.leadName && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Lead:</span>
                  <span>{selectedEvent.resource.leadName}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Due:</span>
                <span>
                  {format(selectedEvent.start, 'PPP p')}
                </span>
              </div>

              {selectedEvent.resource.assignee && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Assigned to:</span>
                  <span>
                    {selectedEvent.resource.assignee.name.firstName}{' '}
                    {selectedEvent.resource.assignee.name.lastName}
                  </span>
                </div>
              )}

              {selectedEvent.resource.body && (
                <div className="border-t pt-4">
                  <p className="font-medium text-sm mb-2">Description:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedEvent.resource.body}
                  </p>
                </div>
              )}

              <div className="border-t pt-4 text-xs text-gray-500">
                <p>Created: {format(new Date(selectedEvent.resource.createdAt), 'PPP p')}</p>
                <p>Updated: {format(new Date(selectedEvent.resource.updatedAt), 'PPP p')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
