import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Target, 
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { format } from 'date-fns';
import { GoalDialog } from '@/components/dashboard/dialogs/GoalDialog';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
  completed: boolean;
  created_at: string;
}

export function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (user) fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user?.id)
      .order('completed', { ascending: true })
      .order('deadline', { ascending: true, nullsFirst: false });
    
    setGoals(data || []);
    setLoading(false);
  };

  const updateProgress = async (goalId: string, newValue: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const completed = newValue >= goal.target_value;
    
    await supabase
      .from('goals')
      .update({ 
        current_value: Math.min(newValue, goal.target_value),
        completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .eq('id', goalId);
    
    setGoals(goals.map(g => 
      g.id === goalId 
        ? { ...g, current_value: Math.min(newValue, goal.target_value), completed }
        : g
    ));
  };

  const deleteGoal = async (goalId: string) => {
    await supabase.from('goals').delete().eq('id', goalId);
    setGoals(goals.filter(g => g.id !== goalId));
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded w-1/4"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground">Track your progress and celebrate wins</p>
        </div>
        <Button onClick={() => { setEditingGoal(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-progress/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-progress" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeGoals.length}</p>
              <p className="text-sm text-muted-foreground">Active Goals</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedGoals.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-streak/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-streak" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {goals.length > 0 
                  ? Math.round(goals.reduce((acc, g) => acc + (g.current_value / g.target_value), 0) / goals.length * 100)
                  : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Avg Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Active Goals</h2>
        {activeGoals.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No active goals yet</p>
              <Button variant="soft" className="mt-4" onClick={() => setDialogOpen(true)}>
                Create your first goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal, index) => {
              const progress = (goal.current_value / goal.target_value) * 100;
              
              return (
                <Card 
                  key={goal.id} 
                  className="border-0 shadow-md animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                            {goal.category}
                          </span>
                          {goal.deadline && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due {format(new Date(goal.deadline), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          onClick={() => { setEditingGoal(goal); setDialogOpen(true); }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          onClick={() => deleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={goal.current_value}
                            onChange={(e) => updateProgress(goal.id, Number(e.target.value))}
                            className="w-20 h-8 text-sm"
                            min={0}
                            max={goal.target_value}
                          />
                          <span className="text-sm text-muted-foreground">
                            / {goal.target_value} {goal.unit}
                          </span>
                        </div>
                        <Button 
                          variant="soft" 
                          size="sm"
                          onClick={() => updateProgress(goal.id, goal.current_value + 1)}
                        >
                          +1
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-success flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Completed Goals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((goal, index) => (
              <Card 
                key={goal.id} 
                className="border-0 shadow-md bg-success/5 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{goal.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {goal.target_value} {goal.unit} achieved
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon-sm" 
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <GoalDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={fetchGoals}
        editGoal={editingGoal}
      />
    </div>
  );
}
