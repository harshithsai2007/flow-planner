import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { OverviewPage } from '@/components/dashboard/pages/OverviewPage';
import { TasksPage } from '@/components/dashboard/pages/TasksPage';
import { HabitsPage } from '@/components/dashboard/pages/HabitsPage';
import { GoalsPage } from '@/components/dashboard/pages/GoalsPage';
import { CalendarPage } from '@/components/dashboard/pages/CalendarPage';
import { AnalyticsPage } from '@/components/dashboard/pages/AnalyticsPage';

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const [transitionState, setTransitionState] = useState<'enter' | 'exit'>('enter');
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      setTransitionState('exit');
      const timer = setTimeout(() => {
        setDisplayedChildren(children);
        setTransitionState('enter');
        prevPath.current = location.pathname;
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setDisplayedChildren(children);
    }
  }, [children, location.pathname]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        transitionState === 'enter'
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-3'
      }`}
    >
      {displayedChildren}
    </div>
  );
}

export function DashboardContent() {
  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
      </div>
      <div className="p-6">
        <PageTransition>
          <Routes>
            <Route index element={<OverviewPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Routes>
        </PageTransition>
      </div>
    </main>
  );
}
