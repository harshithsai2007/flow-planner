import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const ICONS = ['⭐', '💪', '📚', '🏃', '💧', '🧘', '💤', '🍎', '✍️', '🎯'];

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editHabit?: any;
}

export function HabitDialog({ open, onOpenChange, onSuccess, editHabit }: HabitDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');

  useEffect(() => {
    if (editHabit) {
      setName(editHabit.name);
      setIcon(editHabit.icon);
    } else {
      setName('');
      setIcon('⭐');
    }
  }, [editHabit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      if (editHabit) {
        await supabase.from('habits').update({ name, icon }).eq('id', editHabit.id);
        toast({ title: 'Habit updated!' });
      } else {
        await supabase.from('habits').insert({ user_id: user?.id, name, icon });
        toast({ title: 'Habit created!' });
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
        <DialogHeader><DialogTitle>{editHabit ? 'Edit Habit' : 'New Habit'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Drink water" required /></div>
          <div><Label>Icon</Label><div className="flex gap-2 flex-wrap">{ICONS.map((i) => (<button key={i} type="button" onClick={() => setIcon(i)} className={`text-2xl p-2 rounded-lg transition-colors ${icon === i ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted'}`}>{i}</button>))}</div></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : editHabit ? 'Update Habit' : 'Create Habit'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
