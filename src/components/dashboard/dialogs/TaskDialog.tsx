import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editTask?: any;
  defaultDate?: string;
}

export function TaskDialog({ open, onOpenChange, onSuccess, editTask, defaultDate }: TaskDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setDueDate(editTask.due_date || '');
      setPriority(editTask.priority);
      setCategory(editTask.category);
    } else {
      setTitle('');
      setDescription('');
      setDueDate(defaultDate || '');
      setPriority('medium');
      setCategory('general');
    }
  }, [editTask, defaultDate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      if (editTask) {
        await supabase.from('tasks').update({
          title, description, due_date: dueDate || null, priority, category
        }).eq('id', editTask.id);
        toast({ title: 'Task updated!' });
      } else {
        await supabase.from('tasks').insert({
          user_id: user?.id, title, description, due_date: dueDate || null, priority, category
        });
        toast({ title: 'Task created!' });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editTask ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div><Label>Priority</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="work">Work</SelectItem><SelectItem value="study">Study</SelectItem><SelectItem value="personal">Personal</SelectItem></SelectContent></Select></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
