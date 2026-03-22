import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle2, 
  Circle, 
  Plus,
  Search,
  Trash2,
  Edit2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { TaskDialog } from '@/components/dashboard/dialogs/TaskDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  category: string;
  due_date: string | null;
  due_time: string | null;
  created_at: string;
}

export function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tasks').select('*').eq('user_id', user?.id)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    setTasks(data || []);
    setLoading(false);
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await supabase.from('tasks').update({ completed: !completed, completed_at: !completed ? new Date().toISOString() : null }).eq('id', taskId);
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !completed } : t));
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'completed' && task.completed) || (filterStatus === 'active' && !task.completed);
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const groupedTasks = {
    overdue: filteredTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && !t.completed),
    today: filteredTasks.filter(t => t.due_date === format(new Date(), 'yyyy-MM-dd')),
    upcoming: filteredTasks.filter(t => t.due_date && new Date(t.due_date) > new Date()),
    noDue: filteredTasks.filter(t => !t.due_date),
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-secondary rounded w-1/4"></div>
        {[1, 2, 3].map(i => (<div key={i} className="h-20 bg-secondary rounded-xl"></div>))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground font-mono text-sm">Manage your to-do list</p>
        </div>
        <Button onClick={() => { setEditingTask(null); setDialogOpen(true); }} className="shadow-neon">
          <Plus className="h-4 w-4 mr-2" /> Add Task
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-secondary border-border focus:border-primary" />
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-full sm:w-40 bg-secondary border-border"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Priorities</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40 bg-secondary border-border"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
        </Select>
      </div>

      {groupedTasks.overdue.length > 0 && <TaskGroup title="Overdue" tasks={groupedTasks.overdue} variant="destructive" onToggle={toggleTask} onEdit={(task) => { setEditingTask(task); setDialogOpen(true); }} onDelete={deleteTask} />}
      {groupedTasks.today.length > 0 && <TaskGroup title="Today" tasks={groupedTasks.today} variant="primary" onToggle={toggleTask} onEdit={(task) => { setEditingTask(task); setDialogOpen(true); }} onDelete={deleteTask} />}
      {groupedTasks.upcoming.length > 0 && <TaskGroup title="Upcoming" tasks={groupedTasks.upcoming} variant="default" onToggle={toggleTask} onEdit={(task) => { setEditingTask(task); setDialogOpen(true); }} onDelete={deleteTask} />}
      {groupedTasks.noDue.length > 0 && <TaskGroup title="No Due Date" tasks={groupedTasks.noDue} variant="muted" onToggle={toggleTask} onEdit={(task) => { setEditingTask(task); setDialogOpen(true); }} onDelete={deleteTask} />}

      {filteredTasks.length === 0 && (
        <Card className="neon-card">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || filterPriority !== 'all' || filterStatus !== 'all' ? 'No tasks match your filters' : 'No tasks yet. Create your first task!'}
            </p>
            <Button variant="soft" className="mt-4" onClick={() => { setEditingTask(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Task
            </Button>
          </CardContent>
        </Card>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchTasks} editTask={editingTask} />
    </div>
  );
}

interface TaskGroupProps {
  title: string;
  tasks: { id: string; title: string; description: string | null; completed: boolean; priority: string; category: string; due_date: string | null; due_time: string | null; }[];
  variant: 'destructive' | 'primary' | 'default' | 'muted';
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (task: any) => void;
  onDelete: (id: string) => void;
}

function TaskGroup({ title, tasks, variant, onToggle, onEdit, onDelete }: TaskGroupProps) {
  const variantStyles = {
    destructive: 'text-destructive',
    primary: 'text-primary neon-text-subtle',
    default: 'text-foreground',
    muted: 'text-muted-foreground',
  };

  return (
    <div className="space-y-3">
      <h2 className={`text-sm font-mono font-semibold uppercase tracking-wider ${variantStyles[variant]}`}>
        {title} ({tasks.length})
      </h2>
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <Card key={task.id} className="neon-card hover:shadow-neon transition-all duration-300 animate-slide-in-left" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <button onClick={() => onToggle(task.id, task.completed)} className="mt-0.5 flex-shrink-0">
                  {task.completed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</p>
                  {task.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3" /> {format(new Date(task.due_date), 'MMM d')}{task.due_time && ` at ${task.due_time.slice(0, 5)}`}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      task.priority === 'high' ? 'bg-destructive/10 text-destructive' : task.priority === 'medium' ? 'bg-warning/10 text-warning' : 'bg-secondary text-muted-foreground'
                    }`}>{task.priority}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">{task.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => onEdit(task)} className="text-muted-foreground hover:text-primary"><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => onDelete(task.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
