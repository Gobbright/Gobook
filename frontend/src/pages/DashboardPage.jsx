import { AiInsights } from '../features/ai-insights/AiInsights.jsx';
import { DashboardMetrics } from '../features/dashboard/DashboardMetrics.jsx';
import { DashboardOverview } from '../features/dashboard/DashboardOverview.jsx';
import { QuickActions } from '../features/dashboard/QuickActions.jsx';
import { RecentTransactions } from '../features/dashboard/RecentTransactions.jsx';
import { Reminders } from '../features/dashboard/Reminders.jsx';
import { useDashboard } from '../hooks/useDashboard.js';

export function DashboardPage() {
  const { error, insights, isLoading, metrics, reminders, transactions } = useDashboard();

  return (
    <div className="p-4 md:p-7">
      <section className="mb-5">
        <div>
          <h1 className="m-0 text-[28px]">Welcome back, Admin!</h1>
          <p className="text-[#536173] mt-2 mb-0">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
      </section>
      {isLoading && <p className="text-blue-600 text-sm mt-4">Loading dashboard from backend...</p>}
      {error && <p className="text-amber-700 text-sm mt-4">Backend unavailable. Unable to load dashboard data.</p>}
      <DashboardMetrics metrics={metrics} />
      <DashboardOverview />
      <AiInsights insights={insights} />
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 mt-5">
        <RecentTransactions transactions={transactions} />
        <Reminders reminders={reminders} />
      </section>
      <QuickActions />
    </div>
  );
}
