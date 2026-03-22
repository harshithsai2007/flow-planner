import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Flame, 
  Target,
  Sparkles
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface Task { id: string; completed: boolean; completed_at: string | null; created_at: string; }
interface HabitLog { completed_date: string; }
interface Goal { current_value: number; target_value: number; completed: boolean; }

export function AnalyticsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    const [tasksRes, logsRes, goalsRes] = await Promise.all([
      supabase.from('tasks').select('id, completed, completed_at, created_at').eq('user_id', user?.id).gte('created_at', thirtyDaysAgo),
      supabase.from('habit_logs').select('completed_date').eq('user_id', user?.id).gte('completed_date', thirtyDaysAgo),
      supabase.from('goals').select('current_value, target_value, completed').eq('user_id', user?.id)
    ]);

    setTasks(tasksRes.data || []);
    setHabitLogs(logsRes.data || []);
    setGoals(goalsRes.data || []);
    setLoading(false);
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalHabitLogs = habitLogs.length;
  const avgHabitsPerDay = Math.round(totalHabitLogs / 30 * 10) / 10;
  const completedGoals = goals.filter(g => g.completed).length;
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.current_value / g.target_value), 0) / goals.length * 100)
    : 0;

  const weeklyTaskData = (() => {
    const days = eachDayOfInterval({ start: startOfWeek(new Date()), end: endOfWeek(new Date()) });
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(t => t.completed_at && format(new Date(t.completed_at), 'yyyy-MM-dd') === dateStr);
      return { name: format(day, 'EEE'), completed: dayTasks.length };
    });
  })();

  const habitTrendData = (() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), 13 - i), 'yyyy-MM-dd'));
    return last14Days.map(date => ({
      name: format(new Date(date), 'dd'),
      habits: habitLogs.filter(l => l.completed_date === date).length
    }));
  })();

  const taskDistributionData = [
    { name: 'Completed', value: completedTasks, color: 'hsl(160, 80%, 45%)' },
    { name: 'Pending', value: totalTasks - completedTasks, color: 'hsl(215, 20%, 25%)' }
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-secondary rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (<div key={i} className="h-24 bg-secondary rounded-xl"></div>))}
        </div>
      </div>
    );
  }

  const chartColors = {
    bg: 'hsl(220, 20%, 7%)',
    border: 'hsl(215, 20%, 16%)',
    grid: 'hsl(215, 20%, 12%)',
    text: 'hsl(215, 20%, 45%)',
    primary: 'hsl(210, 100%, 56%)',
    cyan: 'hsl(185, 100%, 50%)',
    success: 'hsl(160, 80%, 45%)',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground font-mono text-sm">Track your productivity over time</p>
      </div>

      {/* Motivational Banner */}
      <div className="neon-card rounded-xl p-4 animate-slide-in-right">
        <p className="text-primary text-sm font-mono flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-glow" />
          <span>You've completed <strong className="text-foreground">{completedTasks} tasks</strong> and logged <strong className="text-foreground">{totalHabitLogs} habits</strong> in the last 30 days!</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Task Completion', value: `${taskCompletionRate}%`, sub: `${completedTasks}/${totalTasks} tasks`, icon: CheckCircle2, color: 'text-success' },
          { label: 'Daily Habits', value: `${avgHabitsPerDay}`, sub: 'avg per day', icon: Flame, color: 'text-warning' },
          { label: 'Goals Progress', value: `${avgGoalProgress}%`, sub: `${completedGoals} completed`, icon: Target, color: 'text-progress' },
          { label: '30-Day Activity', value: `${totalHabitLogs + completedTasks}`, sub: 'total completions', icon: TrendingUp, color: 'text-primary' },
        ].map((stat, i) => (
          <Card key={i} className="neon-card animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-mono">{stat.sub}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="neon-card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Tasks Completed This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTaskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="name" stroke={chartColors.text} fontSize={12} />
                  <YAxis stroke={chartColors.text} fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: chartColors.bg, border: `1px solid ${chartColors.border}`, borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="completed" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="neon-card animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Flame className="h-5 w-5 text-warning" />
              Habit Trend (14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={habitTrendData}>
                  <defs>
                    <linearGradient id="habitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.cyan} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors.cyan} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="name" stroke={chartColors.text} fontSize={12} />
                  <YAxis stroke={chartColors.text} fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: chartColors.bg, border: `1px solid ${chartColors.border}`, borderRadius: '8px', color: '#fff' }} />
                  <Area type="monotone" dataKey="habits" stroke={chartColors.cyan} strokeWidth={2} fill="url(#habitGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="neon-card lg:col-span-2 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Task Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-12">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                      {taskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: chartColors.bg, border: `1px solid ${chartColors.border}`, borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {taskDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{item.value} tasks</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
