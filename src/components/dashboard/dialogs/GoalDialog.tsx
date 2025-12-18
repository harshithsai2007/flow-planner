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

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editGoal?: any;
}

export function GoalDialog({ open, onOpenChange, onSuccess, editGoal }: GoalDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('100');
  const [unit, setUnit] = useState('percent');
  const [category, setCategory] = useState('personal');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setDescription(editGoal.description || '');
      setTargetValue(String(editGoal.target_value));
      setUnit(editGoal.unit);
      setCategory(editGoal.category);
      setDeadline(editGoal.deadline || '');
    } else {
      setTitle(''); setDescription(''); setTargetValue('100'); setUnit('percent'); setCategory('personal'); setDeadline('');
    }
  }, [editGoal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      if (editGoal) {
        await supabase.from('goals').update({ title, description, target_value: Number(targetValue), unit, category, deadline: deadline || null }).eq('id', editGoal.id);
        toast({ title: 'Goal updated!' });
      } else {
        await supabase.from('goals').insert({ user_id: user?.id, title, description, target_value: Number(targetValue), unit, category, deadline: deadline || null });
        toast({ title: 'Goal created!' });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editGoal ? 'Edit Goal' : 'New Goal'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Read 12 books" required /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Target</Label><Input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} min="1" required /></div>
            <div><Label>Unit</Label><Select value={unit} onValueChange={setUnit}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percent">%</SelectItem><SelectItem value="items">Items</SelectItem><SelectItem value="hours">Hours</SelectItem><SelectItem value="pages">Pages</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="personal">Personal</SelectItem><SelectItem value="health">Health</SelectItem><SelectItem value="career">Career</SelectItem><SelectItem value="learning">Learning</SelectItem></SelectContent></Select></div>
            <div><Label>Deadline</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : editGoal ? 'Update Goal' : 'Create Goal'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
