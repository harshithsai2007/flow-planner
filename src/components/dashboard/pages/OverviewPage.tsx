import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Target, 
  TrendingUp, 
  Plus,
  Sparkles,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { TaskDialog } from '@/components/dashboard/dialogs/TaskDialog';
import { HabitDialog } from '@/components/dashboard/dialogs/HabitDialog';
import { GoalDialog } from '@/components/dashboard/dialogs/GoalDialog';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date: string | null;
}

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  streak?: number;
  completedToday?: boolean;
}

interface Goal {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  category: string;
}

const motivationalQuotes = [
  "Small daily improvements lead to stunning results.",
  "You don't have to be great to start, but you have to start to be great.",
  "Discipline is the bridge between goals and accomplishments.",
  "Progress, not perfection.",
  "The only bad workout is the one that didn't happen.",
];

export function OverviewPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const quote = motivationalQuotes[new Date().getDate() % motivationalQuotes.length];

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .or(`due_date.eq.${today},due_date.is.null`)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user?.id)
        .limit(4);

      const { data: logsData } = await supabase
        .from('habit_logs')
        .select('habit_id')
        .eq('user_id', user?.id)
        .eq('completed_date', today);

      const completedHabitIds = new Set(logsData?.map(log => log.habit_id) || []);

      const habitsWithStreaks = await Promise.all(
        (habitsData || []).map(async (habit) => {
          const streak = await calculateStreak(habit.id);
          return { ...habit, streak, completedToday: completedHabitIds.has(habit.id) };
        })
      );

      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(3);

      setTasks(tasksData || []);
      setHabits(habitsWithStreaks);
      setGoals(goalsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = async (habitId: string): Promise<number> => {
    const { data } = await supabase
      .from('habit_logs')
      .select('completed_date')
      .eq('habit_id', habitId)
      .order('completed_date', { ascending: false })
      .limit(30);

    if (!data || data.length === 0) return 0;

    let streak = 0;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < data.length; i++) {
      const logDate = new Date(data[i].completed_date);
      logDate.setHours(0, 0, 0, 0);
      const expectedDate = new Date(todayDate);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (i === 0 && logDate.getTime() === new Date(todayDate.getTime() - 86400000).getTime()) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await supabase
      .from('tasks')
      .update({ completed: !completed, completed_at: !completed ? new Date().toISOString() : null })
      .eq('id', taskId);
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !completed } : t));
  };

  const toggleHabit = async (habitId: string, completedToday: boolean) => {
    if (completedToday) {
      await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('completed_date', today);
    } else {
      await supabase.from('habit_logs').insert({ habit_id: habitId, user_id: user?.id, completed_date: today });
    }
    fetchData();
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completedHabits = habits.filter(h => h.completedToday).length;
  const totalHabits = habits.length;

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-secondary rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-secondary rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            Good {getGreeting()}, {user?.email?.split('@')[0]} <span className="animate-float inline-block">⚡</span>
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Button onClick={() => setTaskDialogOpen(true)} size="sm" className="shadow-neon">
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Motivational Quote */}
      <div className="neon-card rounded-xl p-4 animate-slide-in-right">
        <p className="text-primary text-sm font-mono flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-glow" />
          <span className="italic">"{quote}"</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Tasks", value: `${completedTasks}/${totalTasks}`, icon: CheckCircle2, color: 'text-primary', progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0 },
          { label: 'Habits Done', value: `${completedHabits}/${totalHabits}`, icon: Flame, color: 'text-warning', progress: totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0 },
          { label: 'Active Goals', value: `${goals.length}`, icon: Target, color: 'text-progress', extra: 'Keep pushing forward!' },
          { label: 'Best Streak', value: `${Math.max(...habits.map(h => h.streak || 0), 0)} days`, icon: TrendingUp, color: 'text-streak', extra: '🔥 Keep it up!' },
        ].map((stat, i) => (
          <Card key={i} className="neon-card animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              {stat.progress !== undefined && <Progress value={stat.progress} className="mt-3 h-1.5" />}
              {stat.extra && <p className="text-xs text-muted-foreground mt-3">{stat.extra}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Section */}
        <Card className="lg:col-span-2 neon-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Today's Tasks
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setTaskDialogOpen(true)} className="text-muted-foreground hover:text-primary">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground">No tasks for today</p>
                <Button variant="soft" size="sm" className="mt-3" onClick={() => setTaskDialogOpen(true)}>Add your first task</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-all duration-300 animate-slide-in-left"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <button onClick={() => toggleTask(task.id, task.completed)} className="flex-shrink-0">
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-success animate-check" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>
                    <span className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-mono ${
                      task.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                      task.priority === 'medium' ? 'bg-warning/10 text-warning' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habits Section */}
        <Card className="neon-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Flame className="h-5 w-5 text-warning" />
              Daily Habits
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setHabitDialogOpen(true)} className="text-muted-foreground hover:text-primary">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <div className="text-center py-8">
                <Flame className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground">No habits yet</p>
                <Button variant="soft" size="sm" className="mt-3" onClick={() => setHabitDialogOpen(true)}>Create a habit</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit, index) => (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id, habit.completedToday || false)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 animate-slide-in-right ${
                      habit.completedToday 
                        ? 'bg-success/10 border border-success/20' 
                        : 'hover:bg-secondary/50 border border-transparent'
                    }`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <span className="text-2xl">{habit.icon}</span>
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${habit.completedToday ? 'text-success' : 'text-foreground'}`}>
                        {habit.name}
                      </p>
                      {(habit.streak || 0) > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Flame className="h-3 w-3 text-streak" />
                          {habit.streak} day streak
                        </p>
                      )}
                    </div>
                    {habit.completedToday && (
                      <CheckCircle2 className="h-5 w-5 text-success animate-check" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Section */}
        <Card className="lg:col-span-3 neon-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Target className="h-5 w-5 text-progress" />
              Active Goals
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setGoalDialogOpen(true)} className="text-muted-foreground hover:text-primary">
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground">No active goals</p>
                <Button variant="soft" size="sm" className="mt-3" onClick={() => setGoalDialogOpen(true)}>Set a goal</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goals.map((goal, index) => {
                  const progress = (goal.current_value / goal.target_value) * 100;
                  return (
                    <div key={goal.id} className="p-4 rounded-lg bg-secondary/50 border border-border animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">{goal.title}</p>
                          <p className="text-xs text-muted-foreground capitalize font-mono">{goal.category}</p>
                        </div>
                        <span className="text-sm font-bold font-mono text-primary neon-text-subtle">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-2 font-mono">{goal.current_value} / {goal.target_value}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} onSuccess={fetchData} />
      <HabitDialog open={habitDialogOpen} onOpenChange={setHabitDialogOpen} onSuccess={fetchData} />
      <GoalDialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen} onSuccess={fetchData} />
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
