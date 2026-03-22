import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Flame, 
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { HabitDialog } from '@/components/dashboard/dialogs/HabitDialog';

interface Habit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency: string;
  target_days: number[];
  created_at: string;
}

interface HabitLog {
  habit_id: string;
  completed_date: string;
}

export function HabitsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [habitsRes, logsRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user?.id).order('created_at'),
      supabase.from('habit_logs').select('habit_id, completed_date').eq('user_id', user?.id)
    ]);
    setHabits(habitsRes.data || []);
    setLogs(logsRes.data || []);
    setLoading(false);
  };

  const toggleHabit = async (habitId: string, date: string) => {
    const existingLog = logs.find(l => l.habit_id === habitId && l.completed_date === date);
    if (existingLog) {
      await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('completed_date', date);
      setLogs(logs.filter(l => !(l.habit_id === habitId && l.completed_date === date)));
    } else {
      await supabase.from('habit_logs').insert({ habit_id: habitId, user_id: user?.id, completed_date: date });
      setLogs([...logs, { habit_id: habitId, completed_date: date }]);
    }
  };

  const deleteHabit = async (habitId: string) => {
    await supabase.from('habits').delete().eq('id', habitId);
    setHabits(habits.filter(h => h.id !== habitId));
    setLogs(logs.filter(l => l.habit_id !== habitId));
  };

  const calculateStreak = (habitId: string): number => {
    const habitLogs = logs.filter(l => l.habit_id === habitId).map(l => l.completed_date).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (habitLogs.length === 0) return 0;
    let streak = 0;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(todayDate, i), 'yyyy-MM-dd');
      if (habitLogs.includes(checkDate)) { streak++; } 
      else if (i > 0) { break; }
    }
    return streak;
  };

  const getWeeklyCompletion = (habitId: string): number => {
    const weekLogs = logs.filter(l => l.habit_id === habitId && last7Days.includes(l.completed_date));
    return Math.round((weekLogs.length / 7) * 100);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-secondary rounded w-1/4"></div>
        {[1, 2, 3].map(i => (<div key={i} className="h-32 bg-secondary rounded-xl"></div>))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Habits</h1>
          <p className="text-muted-foreground font-mono text-sm">Build consistency, one day at a time</p>
        </div>
        <Button onClick={() => { setEditingHabit(null); setDialogOpen(true); }} className="shadow-neon">
          <Plus className="h-4 w-4 mr-2" />
          New Habit
        </Button>
      </div>

      {/* Motivational */}
      <div className="neon-card rounded-xl p-4 animate-slide-in-right">
        <p className="text-primary text-sm font-mono flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-glow" />
          <span className="italic">"We are what we repeatedly do. Excellence is not an act, but a habit."</span>
        </p>
      </div>

      {/* Week Overview */}
      <Card className="neon-card">
        <CardHeader>
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {last7Days.map((date) => {
              const dayName = format(new Date(date), 'EEE');
              const dayNum = format(new Date(date), 'd');
              const isToday = date === today;
              return (
                <div key={date} className={`text-center p-2 rounded-lg transition-all ${isToday ? 'bg-primary/10 border border-primary/30' : ''}`}>
                  <p className="text-xs text-muted-foreground font-mono">{dayName}</p>
                  <p className={`text-lg font-bold ${isToday ? 'text-primary neon-text-subtle' : 'text-foreground'}`}>{dayNum}</p>
                </div>
              );
            })}
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-8">
              <Flame className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground">No habits yet</p>
              <Button variant="soft" className="mt-4" onClick={() => setDialogOpen(true)}>Create your first habit</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {habits.map((habit, index) => {
                const streak = calculateStreak(habit.id);
                const weeklyCompletion = getWeeklyCompletion(habit.id);
                return (
                  <div key={habit.id} className="p-4 rounded-lg bg-secondary/50 border border-border animate-slide-up" style={{ animationDelay: `${index * 80}ms` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{habit.icon}</span>
                        <div>
                          <p className="font-medium text-foreground">{habit.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                            {streak > 0 && (
                              <span className="flex items-center gap-1 text-streak">
                                <Flame className="h-3 w-3" /> {streak}d streak
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" /> {weeklyCompletion}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => { setEditingHabit(habit); setDialogOpen(true); }} className="text-muted-foreground hover:text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => deleteHabit(habit.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {last7Days.map((date) => {
                        const isCompleted = logs.some(l => l.habit_id === habit.id && l.completed_date === date);
                        const isToday = date === today;
                        return (
                          <button
                            key={date}
                            onClick={() => toggleHabit(habit.id, date)}
                            className={`aspect-square rounded-lg flex items-center justify-center transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-success text-success-foreground shadow-neon' 
                                : isToday
                                ? 'bg-primary/10 hover:bg-primary/20 border-2 border-dashed border-primary/30'
                                : 'bg-secondary hover:bg-secondary/80'
                            }`}
                          >
                            {isCompleted && <CheckCircle2 className="h-5 w-5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <HabitDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchData} editHabit={editingHabit} />
    </div>
  );
}
