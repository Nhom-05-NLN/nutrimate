export const ADMIN_PAGE_SIZE = 8;

export function clampAdminPage(page: number, totalItems: number, pageSize = ADMIN_PAGE_SIZE): number {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(page, totalPages);
}

export function paginateItems<T>(items: readonly T[], page: number, pageSize = ADMIN_PAGE_SIZE): T[] {
  const currentPage = clampAdminPage(page, items.length, pageSize);
  const start = (currentPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
