import { Routes, Route } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { OverviewPage } from '@/components/dashboard/pages/OverviewPage';
import { TasksPage } from '@/components/dashboard/pages/TasksPage';
import { HabitsPage } from '@/components/dashboard/pages/HabitsPage';
import { GoalsPage } from '@/components/dashboard/pages/GoalsPage';
import { CalendarPage } from '@/components/dashboard/pages/CalendarPage';
import { AnalyticsPage } from '@/components/dashboard/pages/AnalyticsPage';

export function DashboardContent() {
  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
      </div>
      <div className="p-6">
        <Routes>
          <Route index element={<OverviewPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Routes>
      </div>
    </main>
  );
}
