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
  Calendar
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface Task {
  id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

interface HabitLog {
  completed_date: string;
}

interface Goal {
  current_value: number;
  target_value: number;
  completed: boolean;
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const last30Days = Array.from({ length: 30 }, (_, i) => 
    format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
  );

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    const [tasksRes, logsRes, goalsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, completed, completed_at, created_at')
        .eq('user_id', user?.id)
        .gte('created_at', thirtyDaysAgo),
      supabase
        .from('habit_logs')
        .select('completed_date')
        .eq('user_id', user?.id)
        .gte('completed_date', thirtyDaysAgo),
      supabase
        .from('goals')
        .select('current_value, target_value, completed')
        .eq('user_id', user?.id)
    ]);

    setTasks(tasksRes.data || []);
    setHabitLogs(logsRes.data || []);
    setGoals(goalsRes.data || []);
    setLoading(false);
  };

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalHabitLogs = habitLogs.length;
  const avgHabitsPerDay = Math.round(totalHabitLogs / 30 * 10) / 10;

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.completed).length;
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.current_value / g.target_value), 0) / goals.length * 100)
    : 0;

  // Prepare chart data
  const weeklyTaskData = (() => {
    const days = eachDayOfInterval({
      start: startOfWeek(new Date()),
      end: endOfWeek(new Date())
    });

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(t => 
        t.completed_at && format(new Date(t.completed_at), 'yyyy-MM-dd') === dateStr
      );
      return {
        name: format(day, 'EEE'),
        completed: dayTasks.length
      };
    });
  })();

  const habitTrendData = (() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => 
      format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    );

    return last7Days.map(date => ({
      name: format(new Date(date), 'EEE'),
      habits: habitLogs.filter(l => l.completed_date === date).length
    }));
  })();

  const taskDistributionData = [
    { name: 'Completed', value: completedTasks, color: 'hsl(var(--success))' },
    { name: 'Pending', value: totalTasks - completedTasks, color: 'hsl(var(--muted))' }
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your productivity over time</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Task Completion</p>
                <p className="text-2xl font-bold">{taskCompletionRate}%</p>
                <p className="text-xs text-muted-foreground">{completedTasks}/{totalTasks} tasks</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Habits</p>
                <p className="text-2xl font-bold">{avgHabitsPerDay}</p>
                <p className="text-xs text-muted-foreground">avg per day</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Flame className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Goals Progress</p>
                <p className="text-2xl font-bold">{avgGoalProgress}%</p>
                <p className="text-xs text-muted-foreground">{completedGoals} completed</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-progress/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-progress" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">30-Day Activity</p>
                <p className="text-2xl font-bold">{totalHabitLogs + completedTasks}</p>
                <p className="text-xs text-muted-foreground">total completions</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Tasks Completed This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTaskData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar 
                    dataKey="completed" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-accent" />
              Habit Trend (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={habitTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="habits" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Task Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-12">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {taskDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.value} tasks</p>
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
