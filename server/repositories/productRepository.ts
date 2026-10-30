import { Product, ProductFilterQuery } from '../types/index.js';
import { INITIAL_PRODUCTS } from '../db/seedData.js';
import { isDbConnected, queryPostgres } from '../db/index.js';

// In-memory runtime cache when DB is in fallback mode
let memoryProducts: Product[] = [...INITIAL_PRODUCTS];

interface ProductRow {
  id: string;
  code: string;
  name: string;
  category: string;
  category_name: string;
  price: string;
  original_price: string | null;
  image_url: string | null;
  description: string | null;
  ingredients: string[] | null;
  serving_size: string | null;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  sugar: string;
  fiber: string | null;
  sodium: string | null;
  stock_quantity: number;
  rating: string;
  review_count: number;
  badges: string[] | null;
  is_featured: boolean;
  best_for: string | null;
}

function mapRowToProduct(row: ProductRow): Product {
  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    category: row.category as Product['category'],
    categoryName: row.category_name,
    price: parseFloat(row.price),
    originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
    image: row.image_url || '',
    description: row.description || '',
    ingredients: row.ingredients || [],
    nutrition: {
      servingSize: row.serving_size || '1 khẩu phần',
      calories: parseFloat(row.calories),
      protein: parseFloat(row.protein),
      carbs: parseFloat(row.carbs),
      fat: parseFloat(row.fat),
      sugar: parseFloat(row.sugar),
      fiber: row.fiber ? parseFloat(row.fiber) : undefined,
      sodium: row.sodium ? parseFloat(row.sodium) : undefined,
    },
    stock: row.stock_quantity,
    rating: parseFloat(row.rating),
    reviewCount: row.review_count,
    badges: row.badges || [],
    isFeatured: row.is_featured,
    bestFor: row.best_for || '',
  };
}

export async function findProducts(filter: ProductFilterQuery, requirePostgres = false, executeQuery = queryPostgres): Promise<Product[]> {
  if (requirePostgres || isDbConnected()) {
    try {
      const conditions: string[] = ['is_active = TRUE'];
      const values: unknown[] = [];
      let paramIdx = 1;

      if (filter.category && filter.category !== 'all') {
        conditions.push(`category = $${paramIdx++}`);
        values.push(filter.category);
      }

      if (filter.diet && filter.diet !== 'all') {
        conditions.push(`category = $${paramIdx++}`);
        values.push(filter.diet);
      }

      if (filter.maxCalories && filter.maxCalories > 0) {
        conditions.push(`calories <= $${paramIdx++}`);
        values.push(filter.maxCalories);
      }

      if (filter.minProtein && filter.minProtein > 0) {
        conditions.push(`protein >= $${paramIdx++}`);
        values.push(filter.minProtein);
      }

      if (filter.search && filter.search.trim() !== '') {
        conditions.push(`(LOWER(name) LIKE $${paramIdx} OR LOWER(description) LIKE $${paramIdx})`);
        values.push(`%${filter.search.trim().toLowerCase()}%`);
        paramIdx++;
      }

      const sql = `
        SELECT id, code, name, category, category_name, price, original_price,
               image_url, description, ingredients, serving_size, calories,
               protein, carbs, fat, sugar, fiber, sodium, stock_quantity,
               rating, review_count, badges, is_featured, best_for
        FROM products
        WHERE ${conditions.join(' AND ')}
        ORDER BY is_featured DESC, id ASC
        ${requirePostgres ? 'LIMIT 3' : ''}
      `;

      const result = await executeQuery<ProductRow>(sql, values);
      if (requirePostgres || result.rows.length > 0) {
        return result.rows.map(mapRowToProduct);
      }
    } catch (err: unknown) {
      if (requirePostgres) throw err;
      const msg = err instanceof Error ? err.message : 'Product query error';
      console.warn('[ProductRepository Fallback]:', msg);
    }
  }

  // Fallback in-memory filter
  let list = [...memoryProducts];

  if (filter.category && filter.category !== 'all') {
    list = list.filter((p) => p.category === filter.category);
  }

  if (filter.diet && filter.diet !== 'all') {
    list = list.filter((p) => p.category === filter.diet || p.badges.some((b) => b.toLowerCase().includes(filter.diet!.toLowerCase())));
  }

  if (filter.search && filter.search.trim() !== '') {
    const q = filter.search.toLowerCase().trim();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  if (filter.maxCalories && filter.maxCalories > 0) {
    list = list.filter((p) => p.nutrition.calories <= filter.maxCalories!);
  }

  if (filter.minProtein && filter.minProtein > 0) {
    list = list.filter((p) => p.nutrition.protein >= filter.minProtein!);
  }

  return list;
}

export async function findChatProducts(filter: ProductFilterQuery, executeQuery = queryPostgres): Promise<Product[]> {
  const schema = await executeQuery<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'products'`,
  );
  const columns = new Set(schema.rows.map(row => row.column_name));

  if (columns.has('id') && columns.has('calories') && columns.has('category')) {
    return findProducts(filter, true, executeQuery);
  }

  if (!columns.has('product_id')) {
    throw new Error('Schema PostgreSQL không có cấu trúc sản phẩm được NutriBot hỗ trợ.');
  }

  const conditions = ['TRUE'];
  const values: unknown[] = [];
  if (filter.category && filter.category !== 'all') {
    values.push(filter.category);
    conditions.push(`LOWER(c.name) LIKE '%' || LOWER($${values.length}) || '%'`);
  }
  if (filter.diet && filter.diet !== 'all') {
    values.push(filter.diet);
    conditions.push(`LOWER(c.name) LIKE '%' || LOWER($${values.length}) || '%'`);
  }
  if (filter.search?.trim()) {
    values.push(`%${filter.search.trim()}%`);
    conditions.push(`(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length})`);
  }
  if (filter.maxCalories && filter.maxCalories > 0) {
    values.push(filter.maxCalories);
    conditions.push(`nf.calories <= $${values.length}`);
  }
  if (filter.minProtein && filter.minProtein > 0) {
    values.push(filter.minProtein);
    conditions.push(`nf.protein >= $${values.length}`);
  }

  const result = await executeQuery<{
    id: number;
    name: string;
    category_name: string | null;
    price: string;
    description: string | null;
    image_url: string | null;
    serving_size: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    sugar: string;
    stock: number;
  }>(
    `SELECT p.product_id AS id, p.name, c.name AS category_name, p.price,
            p.description, p.image_url, nf.serving_size, nf.calories, nf.protein,
            nf.carbs, nf.fat, nf.sugar, COALESCE(stock.quantity, 0)::int AS stock
     FROM products p
     JOIN nutrition_facts nf ON nf.product_id = p.product_id
     LEFT JOIN categories c ON c.category_id = p.category_id
     LEFT JOIN LATERAL (
       SELECT SUM(i.quantity) AS quantity
       FROM inventory i
       WHERE i.product_id = p.product_id
     ) stock ON TRUE
     WHERE nf.serving_size IS NOT NULL
       AND nf.calories IS NOT NULL
       AND nf.protein IS NOT NULL
       AND nf.carbs IS NOT NULL
       AND nf.fat IS NOT NULL
       AND nf.sugar IS NOT NULL
       AND ${conditions.join(' AND ')}
     ORDER BY p.product_id
     LIMIT 3`,
    values,
  );

  return result.rows.map(row => ({
    id: String(row.id),
    code: '',
    name: row.name,
    category: 'all',
    categoryName: row.category_name || 'Khác',
    price: Number(row.price),
    image: row.image_url || '',
    description: row.description || '',
    ingredients: [],
    nutrition: {
      servingSize: row.serving_size,
      calories: Number(row.calories),
      protein: Number(row.protein),
      carbs: Number(row.carbs),
      fat: Number(row.fat),
      sugar: Number(row.sugar),
    },
    stock: row.stock,
    rating: 0,
    reviewCount: 0,
    badges: [],
    bestFor: '',
  }));
}

export async function findProductById(id: string): Promise<Product | null> {
  if (isDbConnected()) {
    try {
      const sql = `
        SELECT id, code, name, category, category_name, price, original_price,
               image_url, description, ingredients, serving_size, calories,
               protein, carbs, fat, sugar, fiber, sodium, stock_quantity,
               rating, review_count, badges, is_featured, best_for
        FROM products
        WHERE (id::text = $1 OR code = $1) AND is_active = TRUE
        LIMIT 1
      `;
      const result = await queryPostgres<ProductRow>(sql, [id]);
      const row = result.rows[0];
      if (row) {
        return mapRowToProduct(row);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Find product by id error';
      console.warn('[ProductRepository FindById Fallback]:', msg);
    }
  }

  const found = memoryProducts.find((p) => p.id === id || p.code === id);
  return found || null;
}

export async function createProduct(newProd: Product): Promise<Product> {
  if (isDbConnected()) {
    try {
      const sql = `
        INSERT INTO products (
          code, name, slug, category, category_name, price, original_price,
          stock_quantity, serving_size, calories, protein, carbs, fat, sugar,
          fiber, sodium, rating, review_count, badges, ingredients, description,
          best_for, image_url, is_featured
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24
        ) RETURNING id
      `;
      const slug = newProd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
      const values = [
        newProd.code,
        newProd.name,
        slug,
        newProd.category,
        newProd.categoryName,
        newProd.price,
        newProd.originalPrice || null,
        newProd.stock,
        newProd.nutrition.servingSize,
        newProd.nutrition.calories,
        newProd.nutrition.protein,
        newProd.nutrition.carbs,
        newProd.nutrition.fat,
        newProd.nutrition.sugar,
        newProd.nutrition.fiber || 0,
        newProd.nutrition.sodium || 0,
        newProd.rating,
        newProd.reviewCount,
        newProd.badges,
        newProd.ingredients,
        newProd.description,
        newProd.bestFor,
        newProd.image,
        newProd.isFeatured || false,
      ];
      const result = await queryPostgres<{ id: number }>(sql, values);
      const inserted = result.rows[0];
      if (inserted) {
        newProd.id = String(inserted.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Product insert error';
      console.warn('[ProductRepository Insert Fallback]:', msg);
    }
  }

  memoryProducts.unshift(newProd);
  return newProd;
}
