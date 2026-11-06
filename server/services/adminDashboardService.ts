import { getAdminDashboard } from '../repositories/adminDashboardRepository.js';

export async function loadAdminDashboard(weekStart: string) {
  return getAdminDashboard(weekStart);
}
