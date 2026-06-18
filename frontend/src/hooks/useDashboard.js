import { useEffect, useState } from 'react';

import { getDashboardSummary } from '../services/dashboardService.js';

const EMPTY_DASHBOARD = {
  metrics: [],
  transactions: [],
  reminders: [],
  insights: [],
};

export function useDashboard() {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const summary = await getDashboardSummary();

        if (isMounted) {
          setDashboard(summary);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setDashboard(EMPTY_DASHBOARD);
          setError(requestError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return { ...dashboard, isLoading, error };
}
