import { getAdminDashboard } from '../repositories/adminDashboardRepository.js';

export async function loadAdminDashboard() {
  return getAdminDashboard();
}
