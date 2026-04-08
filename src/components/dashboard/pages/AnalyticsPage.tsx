import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Flame, 
  Target,
  Sparkles,
  Zap,
  Calendar,
  Award,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, LineChart, Line, Legend } from 'recharts';

interface Task { id: string; completed: boolean; completed_at: string | null; created_at: string; priority: string | null; category: string | null; }
interface HabitLog { completed_date: string; habit_id: string; }
interface Habit { id: string; name: string; icon: string; }
interface Goal { current_value: number; target_value: number; completed: boolean; category: string | null; title: string; }

export function AnalyticsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const sixtyDaysAgo = format(subDays(new Date(), 60), 'yyyy-MM-dd');

    const [tasksRes, allTasksRes, logsRes, habitsRes, goalsRes] = await Promise.all([
      supabase.from('tasks').select('id, completed, completed_at, created_at, priority, category').eq('user_id', user?.id).gte('created_at', thirtyDaysAgo),
      supabase.from('tasks').select('id, completed, completed_at, created_at, priority, category').eq('user_id', user?.id).gte('created_at', sixtyDaysAgo),
      supabase.from('habit_logs').select('completed_date, habit_id').eq('user_id', user?.id).gte('completed_date', thirtyDaysAgo),
      supabase.from('habits').select('id, name, icon').eq('user_id', user?.id),
      supabase.from('goals').select('current_value, target_value, completed, category, title').eq('user_id', user?.id)
    ]);

    setTasks(tasksRes.data || []);
    setAllTasks(allTasksRes.data || []);
    setHabitLogs(logsRes.data || []);
    setHabits(habitsRes.data || []);
    setGoals(goalsRes.data || []);
    setLoading(false);
  };

  // Key metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalHabitLogs = habitLogs.length;
  const avgHabitsPerDay = Math.round(totalHabitLogs / 30 * 10) / 10;
  const completedGoals = goals.filter(g => g.completed).length;
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.current_value / g.target_value), 0) / goals.length * 100)
    : 0;

  // Week-over-week comparison
  const thisWeekStart = startOfWeek(new Date());
  const lastWeekStart = startOfWeek(subWeeks(new Date(), 1));
  const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1));
  const thisWeekTasks = allTasks.filter(t => t.completed && t.completed_at && new Date(t.completed_at) >= thisWeekStart).length;
  const lastWeekTasks = allTasks.filter(t => t.completed && t.completed_at && new Date(t.completed_at) >= lastWeekStart && new Date(t.completed_at) <= lastWeekEnd).length;
  const weekTrend = lastWeekTasks > 0 ? Math.round(((thisWeekTasks - lastWeekTasks) / lastWeekTasks) * 100) : thisWeekTasks > 0 ? 100 : 0;

  // Productivity score (0-100)
  const productivityScore = Math.min(100, Math.round(
    (taskCompletionRate * 0.4) + (Math.min(avgHabitsPerDay * 20, 30)) + (avgGoalProgress * 0.3)
  ));

  // Weekly tasks chart
  const weeklyTaskData = (() => {
    const days = eachDayOfInterval({ start: startOfWeek(new Date()), end: endOfWeek(new Date()) });
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const completed = allTasks.filter(t => t.completed && t.completed_at && format(new Date(t.completed_at), 'yyyy-MM-dd') === dateStr).length;
      const created = allTasks.filter(t => format(new Date(t.created_at), 'yyyy-MM-dd') === dateStr).length;
      return { name: format(day, 'EEE'), completed, created };
    });
  })();

  // 30-day habit trend
  const habitTrendData = (() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'));
    return last30Days.map(date => ({
      name: format(new Date(date), 'dd'),
      habits: habitLogs.filter(l => l.completed_date === date).length
    }));
  })();

  // Task distribution by priority
  const taskByPriority = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: 'hsl(0, 75%, 55%)' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: 'hsl(45, 100%, 55%)' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: 'hsl(210, 100%, 56%)' },
  ].filter(d => d.value > 0);

  // Task status distribution
  const taskStatusData = [
    { name: 'Completed', value: completedTasks, color: 'hsl(160, 80%, 45%)' },
    { name: 'Pending', value: totalTasks - completedTasks, color: 'hsl(215, 20%, 25%)' }
  ].filter(d => d.value > 0);

  // Habit leaderboard
  const habitLeaderboard = habits.map(habit => {
    const count = habitLogs.filter(l => l.habit_id === habit.id).length;
    return { ...habit, count };
  }).sort((a, b) => b.count - a.count).slice(0, 5);

  // Goal progress data
  const goalProgressData = goals.slice(0, 6).map(g => ({
    name: g.title.length > 15 ? g.title.slice(0, 15) + '...' : g.title,
    progress: Math.round((g.current_value / g.target_value) * 100),
    fill: g.completed ? 'hsl(160, 80%, 45%)' : 'hsl(210, 100%, 56%)'
  }));

  // Daily productivity (tasks completed + habits logged per day, last 14 days)
  const dailyProductivity = (() => {
    const last14 = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), 13 - i), 'yyyy-MM-dd'));
    return last14.map(date => {
      const tasksCompleted = allTasks.filter(t => t.completed && t.completed_at && format(new Date(t.completed_at), 'yyyy-MM-dd') === date).length;
      const habitsCompleted = habitLogs.filter(l => l.completed_date === date).length;
      return { name: format(new Date(date), 'MMM dd'), tasks: tasksCompleted, habits: habitsCompleted };
    });
  })();

  // Productivity score radial data
  const scoreData = [{ name: 'Score', value: productivityScore, fill: 'hsl(210, 100%, 56%)' }];

  const chartColors = {
    bg: 'hsl(220, 20%, 7%)',
    border: 'hsl(215, 20%, 16%)',
    grid: 'hsl(215, 20%, 12%)',
    text: 'hsl(215, 20%, 45%)',
    primary: 'hsl(210, 100%, 56%)',
    cyan: 'hsl(185, 100%, 50%)',
    success: 'hsl(160, 80%, 45%)',
    warning: 'hsl(45, 100%, 55%)',
  };

  const tooltipStyle = { backgroundColor: chartColors.bg, border: `1px solid ${chartColors.border}`, borderRadius: '8px', color: '#fff', fontSize: '12px' };

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

  const TrendIcon = weekTrend > 0 ? ArrowUp : weekTrend < 0 ? ArrowDown : Minus;
  const trendColor = weekTrend > 0 ? 'text-success' : weekTrend < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground font-mono text-sm">Deep dive into your productivity patterns</p>
      </div>

      {/* Motivational Banner */}
      <div className="neon-card rounded-xl p-4 animate-slide-in-right">
        <p className="text-primary text-sm font-mono flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-glow" />
          <span>
            {productivityScore >= 80 ? "🔥 You're on fire! Keep this incredible momentum going!" :
             productivityScore >= 50 ? "💪 Great progress! You're building solid habits." :
             productivityScore >= 25 ? "🌱 Every step counts. Keep showing up!" :
             "🚀 Your journey starts now. Add tasks and habits to begin tracking!"}
          </span>
        </p>
      </div>

      {/* Productivity Score + Key Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Big score card */}
        <Card className="neon-card lg:col-span-1 animate-scale-in">
          <CardContent className="p-4 flex flex-col items-center justify-center h-full">
            <p className="text-xs text-muted-foreground font-mono mb-2">PRODUCTIVITY SCORE</p>
            <div className="relative w-28 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={scoreData} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: chartColors.grid }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold font-mono text-foreground neon-text-subtle">{productivityScore}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {productivityScore >= 80 ? 'Exceptional' : productivityScore >= 50 ? 'Good' : productivityScore >= 25 ? 'Building' : 'Getting Started'}
            </p>
          </CardContent>
        </Card>

        {/* Stats row */}
        {[
          { label: 'Task Completion', value: `${taskCompletionRate}%`, sub: `${completedTasks}/${totalTasks} tasks`, icon: CheckCircle2, color: 'text-success' },
          { label: 'Avg Daily Habits', value: `${avgHabitsPerDay}`, sub: `${totalHabitLogs} total logs`, icon: Flame, color: 'text-warning' },
          { label: 'Goal Progress', value: `${avgGoalProgress}%`, sub: `${completedGoals}/${goals.length} completed`, icon: Target, color: 'text-progress' },
          { label: 'Week Trend', value: `${weekTrend > 0 ? '+' : ''}${weekTrend}%`, sub: `${thisWeekTasks} tasks this week`, icon: TrendIcon, color: trendColor },
        ].map((stat, i) => (
          <Card key={i} className="neon-card animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">{stat.label}</p>
                  <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{stat.sub}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Combined productivity + Habit trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="neon-card animate-slide-up" style={{ animationDelay: '150ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Daily Productivity (14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyProductivity} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="name" stroke={chartColors.text} fontSize={10} />
                  <YAxis stroke={chartColors.text} fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: chartColors.text }} />
                  <Bar dataKey="tasks" fill={chartColors.primary} radius={[3, 3, 0, 0]} name="Tasks" />
                  <Bar dataKey="habits" fill={chartColors.cyan} radius={[3, 3, 0, 0]} name="Habits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="neon-card animate-slide-up" style={{ animationDelay: '250ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Flame className="h-5 w-5 text-warning" />
              Habit Consistency (30 Days)
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
                  <XAxis dataKey="name" stroke={chartColors.text} fontSize={10} />
                  <YAxis stroke={chartColors.text} fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="habits" stroke={chartColors.cyan} strokeWidth={2} fill="url(#habitGradient)" name="Habits Logged" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Weekly tasks + Task priority + Task status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="neon-card animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              This Week's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTaskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="name" stroke={chartColors.text} fontSize={11} />
                  <YAxis stroke={chartColors.text} fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="completed" fill={chartColors.success} radius={[3, 3, 0, 0]} name="Done" />
                  <Bar dataKey="created" fill={chartColors.border} radius={[3, 3, 0, 0]} name="Created" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="neon-card animate-slide-up" style={{ animationDelay: '350ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Target className="h-5 w-5 text-warning" />
              Tasks by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-44 w-44 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskByPriority.length > 0 ? taskByPriority : [{ name: 'None', value: 1, color: chartColors.grid }]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                      {(taskByPriority.length > 0 ? taskByPriority : [{ name: 'None', value: 1, color: chartColors.grid }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {taskByPriority.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.value} tasks</p>
                    </div>
                  </div>
                ))}
                {taskByPriority.length === 0 && <p className="text-xs text-muted-foreground">No tasks yet</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neon-card animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Completion Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-44 w-44 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskStatusData.length > 0 ? taskStatusData : [{ name: 'None', value: 1, color: chartColors.grid }]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                      {(taskStatusData.length > 0 ? taskStatusData : [{ name: 'None', value: 1, color: chartColors.grid }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {taskStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.value} tasks</p>
                    </div>
                  </div>
                ))}
                {taskStatusData.length === 0 && <p className="text-xs text-muted-foreground">No tasks yet</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Habit leaderboard + Goal progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="neon-card animate-slide-up" style={{ animationDelay: '450ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Award className="h-5 w-5 text-warning" />
              Top Habits (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {habitLeaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No habit data yet. Start tracking!</p>
            ) : (
              <div className="space-y-3">
                {habitLeaderboard.map((habit, i) => {
                  const maxCount = habitLeaderboard[0]?.count || 1;
                  const pct = Math.round((habit.count / maxCount) * 100);
                  return (
                    <div key={habit.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{habit.icon}</span>
                          <span className="text-sm font-medium text-foreground">{habit.name}</span>
                        </div>
                        <span className="text-sm font-mono text-primary">{habit.count} days</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, hsl(210 100% 56%) 0%, hsl(185 100% 50%) 100%)`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="neon-card animate-slide-up" style={{ animationDelay: '500ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Target className="h-5 w-5 text-progress" />
              Goal Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalProgressData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No goals set yet. Create your first goal!</p>
            ) : (
              <div className="space-y-4">
                {goalProgressData.map((goal, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{goal.name}</span>
                      <span className="text-sm font-mono font-bold" style={{ color: goal.fill }}>{goal.progress}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${goal.progress}%`, backgroundColor: goal.fill }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card className="neon-card animate-slide-up" style={{ animationDelay: '550ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-glow" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Most Productive Day',
                value: (() => {
                  const dayCounts: Record<string, number> = {};
                  allTasks.filter(t => t.completed && t.completed_at).forEach(t => {
                    const day = format(new Date(t.completed_at!), 'EEEE');
                    dayCounts[day] = (dayCounts[day] || 0) + 1;
                  });
                  const best = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
                  return best ? `${best[0]} (${best[1]} tasks)` : 'N/A';
                })(),
                icon: Calendar,
                color: 'text-primary',
              },
              {
                title: 'Best Habit',
                value: habitLeaderboard[0] ? `${habitLeaderboard[0].icon} ${habitLeaderboard[0].name}` : 'N/A',
                icon: Flame,
                color: 'text-warning',
              },
              {
                title: 'Focus Area',
                value: (() => {
                  const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;
                  if (highPriority > 0) return `${highPriority} high priority tasks pending`;
                  if (avgHabitsPerDay < 1) return 'Build more habit consistency';
                  if (avgGoalProgress < 50) return 'Push harder on your goals';
                  return 'Keep up the great work!';
                })(),
                icon: TrendingUp,
                color: 'text-progress',
              },
            ].map((insight, i) => (
              <div key={i} className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <insight.icon className={`h-4 w-4 ${insight.color}`} />
                  <span className="text-xs text-muted-foreground font-mono uppercase">{insight.title}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{insight.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
