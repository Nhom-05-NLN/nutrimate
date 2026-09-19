import { Category } from '../types/index.js';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../db/seedData.js';
import { isDbConnected, queryPostgres } from '../db/index.js';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  diet_type: string;
  icon: string | null;
  product_count?: string;
}

export async function getAllCategories(): Promise<Category[]> {
  if (isDbConnected()) {
    try {
      const sql = `
        SELECT c.id, c.name, c.slug, c.description, c.diet_type, c.icon,
               COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON p.category = c.slug AND p.is_active = TRUE
        GROUP BY c.id, c.name, c.slug, c.description, c.diet_type, c.icon
        ORDER BY c.sort_order ASC, c.id ASC
      `;
      const result = await queryPostgres<CategoryRow>(sql);
      if (result.rows.length > 0) {
        return result.rows.map((row) => ({
          id: String(row.id),
          name: row.name,
          slug: row.slug,
          description: row.description || '',
          dietType: row.diet_type as Category['dietType'],
          icon: row.icon || undefined,
          count: parseInt(row.product_count || '0', 10),
        }));
      }
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
