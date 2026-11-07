import { Category } from '../types/index.js';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../db/seedData.js';
import { isDbConnected, queryPostgres } from '../db/index.js';

interface CategoryRow {
  id: string;
  name: string;
  description: string;
  product_count?: string;
}

export async function getAllCategories(): Promise<Category[]> {
  if (isDbConnected()) {
    try {
      const sql = `
        SELECT c.category_id AS id, c.name, c.description,
               COUNT(p.product_id) as product_count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.category_id AND p.status = TRUE
        WHERE c.status = TRUE
        GROUP BY c.category_id, c.name, c.description
        ORDER BY c.category_id ASC
      `;
      const result = await queryPostgres<CategoryRow>(sql);
        return result.rows.map((row) => ({
          id: String(row.id),
          name: row.name,
          slug: String(row.id),
          description: row.description || '',
          dietType: 'all' as const,
          count: parseInt(row.product_count || '0', 10),
        }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Category query error';
      console.warn('[CategoryRepository Fallback]:', msg);
    }
  }

  // Fallback in-memory
  return INITIAL_CATEGORIES.map((cat) => ({
    ...cat,
    count: INITIAL_PRODUCTS.filter((p) => p.category === cat.dietType).length,
  }));
}
