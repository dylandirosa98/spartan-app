'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, CheckSquare, Clock, Calendar, User, Pencil, Save, X, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  body: string | null;
  status: string | null;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: {
    id: string;
    name: {
      firstName: string;
      lastName: string;
    };
  } | null;
  createdBy: {
    source: string;
    name: string;
  } | null;
}

interface TasksTimelineProps {
  leadId: string;
  leadName: string;
}

export function TasksTimeline({ leadId, leadName }: TasksTimelineProps) {
  const params = useParams();
  const companyId = params.company_id as string;
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskBody, setNewTaskBody] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('TODO');
  const [newTaskDueAt, setNewTaskDueAt] = useState('');

  // Fetch tasks
  const fetchTasks = async () => {
    if (!leadId || !companyId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/tasks?leadId=${leadId}&companyId=${companyId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('[Tasks Timeline] Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [leadId, companyId]);

  // Create new task
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Task title is required',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          companyId,
          title: newTaskTitle.trim(),
          body: newTaskBody.trim() || null,
          status: newTaskStatus,
          dueAt: newTaskDueAt || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      toast({
        title: 'Task created',
        description: 'Your task has been added successfully',
      });

      // Reset form
      setNewTaskTitle('');
      setNewTaskBody('');
      setNewTaskStatus('TODO');
      setNewTaskDueAt('');
      setShowNewTask(false);

      // Refresh tasks
      fetchTasks();
    } catch (error) {
      console.error('[Tasks Timeline] Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Start editing a task
  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingValues({
      title: task.title,
      body: task.body || '',
      status: task.status || 'TODO',
      dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '',
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingValues({});
  };

  // Save task edits
  const saveTask = async (taskId: string) => {
    setIsSaving(true);
    try {
      const updates: Record<string, any> = {
        title: editingValues.title,
        body: editingValues.body || null,
        status: editingValues.status,
      };

      if (editingValues.dueAt) {
        updates.dueAt = new Date(editingValues.dueAt).toISOString();
      }

      // Note: Twenty CRM doesn't have a completedAt field for tasks
      // Status tracking is done via the status field only

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          updates,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      toast({
        title: 'Task updated',
        description: 'Task has been updated successfully',
      });

      setEditingTaskId(null);
      setEditingValues({});
      fetchTasks();
    } catch (error) {
      console.error('[Tasks Timeline] Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}?companyId=${companyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      toast({
        title: 'Task deleted',
        description: 'Task has been removed successfully',
      });

      fetchTasks();
    } catch (error) {
      console.error('[Tasks Timeline] Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  // Format due date
  const formatDueDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  // Get status badge color
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-100 text-green-800';
      case 'TODO':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format status for display
  const formatStatus = (status: string | null) => {
    if (!status) return 'To Do';
    return status.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-[#C41E3A]" />
          Tasks
        </h3>
        {!showNewTask && (
          <Button
            size="sm"
            onClick={() => setShowNewTask(true)}
            className="bg-[#C41E3A] hover:bg-[#A01828]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        )}
      </div>

      {/* New Task Form */}
      {showNewTask && (
        <Card className="border-[#C41E3A]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">New Task for {leadName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="task-title" className="text-sm">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-body" className="text-sm">
                Description (Optional)
              </Label>
              <Textarea
                id="task-body"
                value={newTaskBody}
                onChange={(e) => setNewTaskBody(e.target.value)}
                placeholder="Add details..."
                rows={3}
                disabled={isCreating}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="task-status" className="text-sm">
                  Status
                </Label>
                <Select
                  value={newTaskStatus}
                  onValueChange={setNewTaskStatus}
                  disabled={isCreating}
                >
                  <SelectTrigger id="task-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due" className="text-sm">
                  Due Date (Optional)
                </Label>
                <Input
                  id="task-due"
                  type="datetime-local"
                  value={newTaskDueAt}
                  onChange={(e) => setNewTaskDueAt(e.target.value)}
                  disabled={isCreating}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewTask(false);
                  setNewTaskTitle('');
                  setNewTaskBody('');
                  setNewTaskStatus('TODO');
                  setNewTaskDueAt('');
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateTask}
                disabled={isCreating || !newTaskTitle.trim()}
                className="bg-[#C41E3A] hover:bg-[#A01828]"
              >
                {isCreating ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <CheckSquare className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              No tasks yet. Add your first task to start tracking to-dos and follow-ups.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {!isLoading && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isEditing = editingTaskId === task.id;

            return (
              <Card
                key={task.id}
                className={`hover:shadow-sm transition-shadow ${
                  task.status === 'DONE' ? 'opacity-75' : ''
                }`}
              >
                <CardContent className="p-4">
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Title</Label>
                        <Input
                          value={editingValues.title || ''}
                          onChange={(e) =>
                            setEditingValues({ ...editingValues, title: e.target.value })
                          }
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={editingValues.body || ''}
                          onChange={(e) =>
                            setEditingValues({ ...editingValues, body: e.target.value })
                          }
                          rows={3}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Status</Label>
                          <Select
                            value={editingValues.status || 'TODO'}
                            onValueChange={(val) =>
                              setEditingValues({ ...editingValues, status: val })
                            }
                            disabled={isSaving}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TODO">To Do</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="DONE">Done</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Due Date</Label>
                          <Input
                            type="datetime-local"
                            value={editingValues.dueAt || ''}
                            onChange={(e) =>
                              setEditingValues({ ...editingValues, dueAt: e.target.value })
                            }
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                          disabled={isSaving}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveTask(task.id)}
                          disabled={isSaving}
                          className="bg-[#C41E3A] hover:bg-[#A01828]"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className={`font-medium text-gray-900 text-sm ${
                              task.status === 'DONE' ? 'line-through' : ''
                            }`}>
                              {task.title}
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                              {formatStatus(task.status)}
                            </span>
                          </div>
                          {task.body && (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              {task.body}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => startEditing(task)}
                            className="p-1 text-gray-400 hover:text-[#C41E3A] rounded"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-2 border-t">
                        {task.dueAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {formatDueDate(task.dueAt)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Created {formatDate(task.createdAt)}</span>
                        </div>
                        {task.assignee && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>
                              {task.assignee.name.firstName} {task.assignee.name.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
