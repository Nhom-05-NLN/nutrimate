import { getAdminDashboard } from '../repositories/adminDashboardRepository.js';

export async function loadAdminDashboard(
  periodStart: string,
  periodEnd: string,
  previousStart: string,
  period: 'week' | 'month' | 'year',
) {
  return getAdminDashboard(periodStart, periodEnd, previousStart, period);
}
