import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Target
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { TaskDialog } from '@/components/dashboard/dialogs/TaskDialog';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date: string | null;
}

interface HabitLog {
  habit_id: string;
  completed_date: string;
}

export function CalendarPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user, currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const [tasksRes, logsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .gte('due_date', start)
        .lte('due_date', end),
      supabase
        .from('habit_logs')
        .select('habit_id, completed_date')
        .eq('user_id', user?.id)
        .gte('completed_date', start)
        .lte('completed_date', end)
    ]);

    setTasks(tasksRes.data || []);
    setHabitLogs(logsRes.data || []);
    setLoading(false);
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await supabase
      .from('tasks')
      .update({ 
        completed: !completed,
        completed_at: !completed ? new Date().toISOString() : null
      })
      .eq('id', taskId);
    
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, completed: !completed } : t
    ));
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const tasksForSelectedDate = tasks.filter(t => t.due_date === selectedDateStr);
  const habitsCompletedOnDate = habitLogs.filter(l => l.completed_date === selectedDateStr).length;

  const getDayIndicators = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasTasks = tasks.some(t => t.due_date === dateStr);
    const hasHabits = habitLogs.some(l => l.completed_date === dateStr);
    return { hasTasks, hasHabits };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">View your schedule at a glance</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon-sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setCurrentMonth(new Date());
                    setSelectedDate(new Date());
                  }}
                >
                  Today
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon-sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md w-full pointer-events-auto"
              modifiers={{
                hasTasks: (date) => getDayIndicators(date).hasTasks,
                hasHabits: (date) => getDayIndicators(date).hasHabits,
              }}
              modifiersClassNames={{
                hasTasks: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-primary after:rounded-full',
              }}
              components={{
                Day: ({ date, ...props }) => {
                  const { hasTasks, hasHabits } = getDayIndicators(date);
                  const isSelected = isSameDay(date, selectedDate);
                  const isCurrentMonth = isSameMonth(date, currentMonth);
                  
                  return (
                    <button
                      onClick={() => setSelectedDate(date)}
                      className={`relative w-full aspect-square flex flex-col items-center justify-center rounded-lg transition-colors ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground' 
                          : isCurrentMonth
                          ? 'hover:bg-muted'
                          : 'text-muted-foreground/50'
                      }`}
                    >
                      <span className="text-sm">{format(date, 'd')}</span>
                      {(hasTasks || hasHabits) && isCurrentMonth && (
                        <div className="flex gap-0.5 mt-0.5">
                          {hasTasks && (
                            <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                          )}
                          {hasHabits && (
                            <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-accent'}`} />
                          )}
                        </div>
                      )}
                    </button>
                  );
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, 'EEEE, MMMM d')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tasks */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Tasks ({tasksForSelectedDate.length})
              </h3>
              {tasksForSelectedDate.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks scheduled</p>
              ) : (
                <div className="space-y-2">
                  {tasksForSelectedDate.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <button onClick={() => toggleTask(task.id, task.completed)}>
                        {task.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                      <span className={`text-sm flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Habits Summary */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Habits Completed
              </h3>
              {habitsCompletedOnDate === 0 ? (
                <p className="text-sm text-muted-foreground">No habits completed</p>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">{habitsCompletedOnDate}</p>
                    <p className="text-xs text-muted-foreground">habits completed</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Add */}
            <Button 
              variant="soft" 
              className="w-full" 
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task for {format(selectedDate, 'MMM d')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <TaskDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={fetchData}
        defaultDate={selectedDateStr}
      />
    </div>
  );
}
