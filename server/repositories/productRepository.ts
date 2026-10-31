import { Product, ProductFilterQuery } from '../types/index.js';
import type { ChatSuggestedProduct } from '../types/chat.js';
import { INITIAL_PRODUCTS } from '../db/seedData.js';
import { isDbConnected, queryPostgres } from '../db/index.js';

// In-memory runtime cache when DB is in fallback mode
let memoryProducts: Product[] = INITIAL_PRODUCTS.map((p) => ({
  ...p,
  basePrice: p.price,
  imageURL: p.image,
  usageInstruction: 'Bảo quản nơi thoáng mát, dùng trực tiếp sau khi mở bao bì.',
  status: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

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
  const priceNum = parseFloat(row.price);
  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    category: row.category as Product['category'],
    categoryName: row.category_name,
    price: priceNum,
    basePrice: priceNum,
    originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
    image: row.image_url || '',
    imageURL: row.image_url || '',
    description: row.description || '',
    ingredients: row.ingredients || [],
    usageInstruction: 'Bảo quản nơi thoáng mát, dùng trực tiếp sau khi mở bao bì.',
    status: true,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function findProducts(
  filter: ProductFilterQuery,
  requirePostgres = false,
  executeQuery = queryPostgres,
): Promise<{ products: Product[]; total: number }> {
  const page = filter.page && filter.page > 0 ? Number(filter.page) : 1;
  const limit = filter.limit && filter.limit > 0 ? Number(filter.limit) : 12;
  const offset = (page - 1) * limit;

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

      // Count query
      const countSql = `SELECT COUNT(*) FROM products WHERE ${conditions.join(' AND ')}`;
      const countResult = await executeQuery<{ count: string }>(countSql, values);
      const total = parseInt(countResult.rows[0]?.count || '0', 10);

      // Sorting
      let orderBy = 'ORDER BY is_featured DESC, id ASC';
      if (filter.sort === 'price_asc') orderBy = 'ORDER BY price ASC';
      else if (filter.sort === 'price_desc') orderBy = 'ORDER BY price DESC';
      else if (filter.sort === 'calories_asc') orderBy = 'ORDER BY calories ASC';
      else if (filter.sort === 'calories_desc') orderBy = 'ORDER BY calories DESC';
      else if (filter.sort === 'rating_desc') orderBy = 'ORDER BY rating DESC';
      else if (filter.sort === 'newest') orderBy = 'ORDER BY id DESC';

      const sql = `
        SELECT id, code, name, category, category_name, price, original_price,
               image_url, description, ingredients, serving_size, calories,
               protein, carbs, fat, sugar, fiber, sodium, stock_quantity,
               rating, review_count, badges, is_featured, best_for
        FROM products
        WHERE ${conditions.join(' AND ')}
        ${orderBy}
        LIMIT $${paramIdx++} OFFSET $${paramIdx++}
      `;
      values.push(limit, offset);

      const result = await executeQuery<ProductRow>(sql, values);
      return {
        products: result.rows.map(mapRowToProduct),
        total,
      };
    } catch (err: unknown) {
      if (requirePostgres) throw err;
      const msg = err instanceof Error ? err.message : 'Product query error';
      console.warn('[ProductRepository Fallback]:', msg);
    }
  }

  // Fallback in-memory filter
  let list = [...memoryProducts].filter((p) => p.status !== false);

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

  // In-memory sorting
  if (filter.sort === 'price_asc') list.sort((a, b) => a.price - b.price);
  else if (filter.sort === 'price_desc') list.sort((a, b) => b.price - a.price);
  else if (filter.sort === 'calories_asc') list.sort((a, b) => a.nutrition.calories - b.nutrition.calories);
  else if (filter.sort === 'calories_desc') list.sort((a, b) => b.nutrition.calories - a.nutrition.calories);
  else if (filter.sort === 'rating_desc') list.sort((a, b) => b.rating - a.rating);
  else if (filter.sort === 'newest') list.sort((a, b) => b.id.localeCompare(a.id));

  const total = list.length;
  const paginatedList = list.slice(offset, offset + limit);

  return {
    products: paginatedList,
    total,
  };
}

export async function findChatProducts(filter: ProductFilterQuery, executeQuery = queryPostgres): Promise<ChatSuggestedProduct[]> {
  const schema = await executeQuery<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'products'`,
  );
  const columns = new Set(schema.rows.map(row => row.column_name));

  if (columns.has('id') && columns.has('calories') && columns.has('category')) {
    const res = await findProducts(filter, true, executeQuery);
    return res.products as ChatSuggestedProduct[];
  }

  if (!columns.has('product_id') || !columns.has('base_price') || !columns.has('status')) {
    throw new Error('Schema PostgreSQL không có cấu trúc sản phẩm được NutriBot hỗ trợ.');
  }

  const conditions = ['p.status IS TRUE'];
  const values: unknown[] = [];
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
    serving_size: string | null;
    calories: string | null;
    protein: string | null;
    carbs: string | null;
    fat: string | null;
    sugar: string | null;
    stock: number;
  }>(
    `SELECT p.product_id AS id, p.name, p.base_price AS price,
            NULL::text AS category_name,
            p.description, p.image_url, nf.serving_size, nf.calories, nf.protein,
            nf.carbs, nf.fat, nf.sugar, COALESCE(stock.quantity, 0)::int AS stock
     FROM products p
     LEFT JOIN LATERAL (
       SELECT serving_size, calories, protein, carbs, fat, sugar
       FROM nutrition_facts
       WHERE product_id = p.product_id
       ORDER BY nutrition_fact_id DESC
       LIMIT 1
     ) nf ON TRUE
     LEFT JOIN LATERAL (
       SELECT SUM(i.quantity) AS quantity
       FROM inventory i
       WHERE i.product_id = p.product_id
     ) stock ON TRUE
     WHERE ${conditions.join(' AND ')}
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
    ...(row.serving_size !== null && row.calories !== null && row.protein !== null
      && row.carbs !== null && row.fat !== null && row.sugar !== null
      ? { nutrition: {
        servingSize: row.serving_size,
        calories: Number(row.calories),
        protein: Number(row.protein),
        carbs: Number(row.carbs),
        fat: Number(row.fat),
        sugar: Number(row.sugar),
      } }
      : {}),
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
