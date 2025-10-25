'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, MessageSquare, User, Clock, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
  } | null;
}

interface NotesTimelineProps {
  leadId: string;
  leadName: string;
}

export function NotesTimeline({ leadId, leadName }: NotesTimelineProps) {
  const params = useParams();
  const companyId = params.company_id as string;
  const { toast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteBody, setNewNoteBody] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteBody, setEditNoteBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch notes
  const fetchNotes = async () => {
    if (!leadId || !companyId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/notes?leadId=${leadId}&companyId=${companyId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('[Notes Timeline] Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [leadId, companyId]);

  // Create new note
  const handleCreateNote = async () => {
    if (!newNoteBody.trim()) {
      toast({
        title: 'Error',
        description: 'Note body is required',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          companyId,
          title: newNoteTitle.trim() || 'Note',
          noteBody: newNoteBody.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      await response.json();

      toast({
        title: 'Note created',
        description: 'Your note has been added successfully',
      });

      // Reset form
      setNewNoteTitle('');
      setNewNoteBody('');
      setShowNewNote(false);

      // Fetch notes to show the newly created note
      fetchNotes();
    } catch (error) {
      console.error('[Notes Timeline] Error creating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to create note',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Start editing a note
  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditNoteTitle(note.title || '');
    setEditNoteBody(note.body || '');
  };

  // Cancel editing
  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditNoteTitle('');
    setEditNoteBody('');
  };

  // Save note edits
  const handleUpdateNote = async (noteId: string) => {
    if (!editNoteBody.trim()) {
      toast({
        title: 'Error',
        description: 'Note body is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/notes/${noteId}?companyId=${companyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: {
            title: editNoteTitle.trim() || 'Note',
            body: editNoteBody.trim(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      toast({
        title: 'Note updated',
        description: 'Your note has been updated successfully',
      });

      cancelEditingNote();
      fetchNotes();
    } catch (error) {
      console.error('[Notes Timeline] Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${noteId}?companyId=${companyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      toast({
        title: 'Note deleted',
        description: 'The note has been deleted successfully',
      });

      fetchNotes();
    } catch (error) {
      console.error('[Notes Timeline] Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note',
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#C41E3A]" />
          Notes & Timeline
        </h3>
        {!showNewNote && (
          <Button
            size="sm"
            onClick={() => setShowNewNote(true)}
            className="bg-[#C41E3A] hover:bg-[#A01828]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        )}
      </div>

      {/* New Note Form */}
      {showNewNote && (
        <Card className="border-[#C41E3A]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">New Note for {leadName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="note-title" className="text-sm">
                Title (Optional)
              </Label>
              <Input
                id="note-title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Brief summary..."
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-body" className="text-sm">
                Note <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="note-body"
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                placeholder="Enter your note here..."
                rows={4}
                disabled={isCreating}
                className="resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewNote(false);
                  setNewNoteTitle('');
                  setNewNoteBody('');
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateNote}
                disabled={isCreating || !newNoteBody.trim()}
                className="bg-[#C41E3A] hover:bg-[#A01828]"
              >
                {isCreating ? 'Saving...' : 'Save Note'}
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

      {/* Notes List */}
      {!isLoading && notes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              No notes yet. Add your first note to start tracking conversations and updates.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && notes.length > 0 && (
        <div className="space-y-3">
          {notes.map((note) => {
            const isEditing = editingNoteId === note.id;

            return (
              <Card key={note.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`edit-title-${note.id}`} className="text-sm">
                          Title (Optional)
                        </Label>
                        <Input
                          id={`edit-title-${note.id}`}
                          value={editNoteTitle}
                          onChange={(e) => setEditNoteTitle(e.target.value)}
                          placeholder="Brief summary..."
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-body-${note.id}`} className="text-sm">
                          Note <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id={`edit-body-${note.id}`}
                          value={editNoteBody}
                          onChange={(e) => setEditNoteBody(e.target.value)}
                          placeholder="Enter your note here..."
                          rows={4}
                          disabled={isSaving}
                          className="resize-none"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditingNote}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={isSaving || !editNoteBody.trim()}
                          className="bg-[#C41E3A] hover:bg-[#A01828]"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {note.title && (
                            <h4 className="font-medium text-gray-900 text-sm mb-1">
                              {note.title}
                            </h4>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(note.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingNote(note)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
                        {note.body}
                      </p>
                      {note.createdBy && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                          <User className="h-3 w-3" />
                          <span>By {note.createdBy.name}</span>
                        </div>
                      )}
                    </>
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
