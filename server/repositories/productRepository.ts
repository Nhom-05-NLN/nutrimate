import { Product, ProductFilterQuery } from '../types/index.js';
import type { ChatSuggestedProduct } from '../types/chat.js';
import { INITIAL_PRODUCTS } from '../db/seedData.js';
import { getPool, isDbConnected, queryPostgres } from '../db/index.js';

let memoryProducts: Product[] = INITIAL_PRODUCTS.map((p) => ({
  ...p,
  basePrice: p.price,
  imageURL: p.image,
  usageInstruction: 'Bảo quản nơi thoáng mát, dùng trực tiếp sau khi mở bao bì.',
  status: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

const productReadSql = `
  SELECT p.product_id AS id, p.code, p.name, c.category_id::text AS category,
         c.name AS category_name, p.price, p.image_url,
         p.description, p.ingredients, p.usage_instruction, p.status,
         p.created_at, p.updated_at, nf.serving_size, nf.calories, nf.protein,
         nf.carbs, nf.fat, nf.sugar, nf.fiber, nf.sodium, p.stock_quantity,
         COALESCE(reviews.rating, 0)::text AS rating,
         COALESCE(reviews.review_count, 0)::int AS review_count,
         COALESCE((SELECT SUM(oi.quantity) FROM order_items oi
                   JOIN orders o ON o.order_id = oi.order_id
                   WHERE oi.product_id = p.product_id AND o.status = 'delivered'), 0) AS sold_count
  FROM products p
  LEFT JOIN categories c ON c.category_id = p.category_id
  LEFT JOIN nutrition_facts nf ON nf.product_id = p.product_id
  LEFT JOIN LATERAL (
    SELECT AVG(r.rating) AS rating, COUNT(*) AS review_count
    FROM product_reviews r WHERE r.product_id = p.product_id
  ) reviews ON TRUE
`;

function parseIngredients(value: string[] | string | null): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
  } catch { /* Plain text ingredients are also supported. */ }
  return value.split(/[,;\n]+/).map(item => item.trim()).filter(Boolean);
}

interface ProductRow {
  variants?: Product['variants'];
  id: string;
  code: string;
  name: string;
  category: string;
  category_name: string;
  price: string;
  image_url: string | null;
  description: string | null;
  ingredients: string[] | string | null;
  usage_instruction?: string | null;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
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
  sold_count: string | number;
}

function mapRowToProduct(row: ProductRow): Product {
  const priceNum = parseFloat(row.price);
  return {
    id: String(row.id),
    variants: row.variants,
    code: row.code,
    name: row.name,
    category: row.category || 'all',
    categoryName: row.category_name || '',
    price: priceNum,
    basePrice: priceNum,
    image: row.image_url || '',
    imageURL: row.image_url || '',
    description: row.description || '',
    ingredients: parseIngredients(row.ingredients),
    usageInstruction: row.usage_instruction || '',
    status: row.status ?? true,
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
    soldCount: Number(row.sold_count ?? 0),
    badges: [],
    bestFor: '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
      const conditions: string[] = ['status = TRUE'];
      const values: unknown[] = [];
      let paramIdx = 1;

      if (filter.categories?.length) {
        conditions.push(`category = ANY($${paramIdx++}::text[])`);
        values.push(filter.categories);
      }

      if (!filter.categories?.length && filter.category && filter.category !== 'all') {
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

      if (filter.maxCarbs && filter.maxCarbs > 0) {
        conditions.push(`carbs <= $${paramIdx++}`);
        values.push(filter.maxCarbs);
      }

      if (filter.maxSugar && filter.maxSugar > 0) {
        conditions.push(`sugar <= $${paramIdx++}`);
        values.push(filter.maxSugar);
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

      const countSql = `SELECT COUNT(*) AS count FROM (${productReadSql}) products WHERE ${conditions.join(' AND ')}`;
      const countResult = await executeQuery<{ count: string }>(countSql, values);
      const total = parseInt(countResult.rows[0]?.count || '0', 10);

      let orderBy = 'ORDER BY id ASC';
      if (filter.sort === 'price_asc') orderBy = 'ORDER BY price ASC';
      else if (filter.sort === 'price_desc') orderBy = 'ORDER BY price DESC';
      else if (filter.sort === 'calories_asc') orderBy = 'ORDER BY calories ASC';
      else if (filter.sort === 'calories_desc') orderBy = 'ORDER BY calories DESC';
      else if (filter.sort === 'protein_desc') orderBy = 'ORDER BY protein DESC';
      else if (filter.sort === 'carbs_asc') orderBy = 'ORDER BY carbs ASC';
      else if (filter.sort === 'sugar_asc') orderBy = 'ORDER BY sugar ASC';
      else if (filter.sort === 'sold_desc') orderBy = 'ORDER BY sold_count DESC, id ASC';
      else if (filter.sort === 'rating_desc') orderBy = 'ORDER BY rating DESC';
      else if (filter.sort === 'newest') orderBy = 'ORDER BY id DESC';

      const sql = `
        SELECT * FROM (${productReadSql}) products
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

  let list = [...memoryProducts].filter((p) => p.status !== false);

  if (filter.categories?.length) {
    list = list.filter((product) => filter.categories!.includes(product.category));
  }

  if (!filter.categories?.length && filter.category && filter.category !== 'all') {
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

  if (filter.sort === 'price_asc') list.sort((a, b) => a.price - b.price);
  else if (filter.sort === 'price_desc') list.sort((a, b) => b.price - a.price);
  else if (filter.sort === 'calories_asc') list.sort((a, b) => a.nutrition.calories - b.nutrition.calories);
  else if (filter.sort === 'calories_desc') list.sort((a, b) => b.nutrition.calories - a.nutrition.calories);
  else if (filter.sort === 'protein_desc') list.sort((a, b) => b.nutrition.protein - a.nutrition.protein);
  else if (filter.sort === 'carbs_asc') list.sort((a, b) => a.nutrition.carbs - b.nutrition.carbs);
  else if (filter.sort === 'sugar_asc') list.sort((a, b) => a.nutrition.sugar - b.nutrition.sugar);
  else if (filter.sort === 'sold_desc') list.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0) || a.id.localeCompare(b.id));
  else if (filter.sort === 'rating_desc') list.sort((a, b) => b.rating - a.rating);
  else if (filter.sort === 'newest') list.sort((a, b) => b.id.localeCompare(a.id));

  const total = list.length;
  return { products: list.slice(offset, offset + limit), total };
}

export async function getTotalSoldProducts(executeQuery = queryPostgres): Promise<number> {
  const result = await executeQuery<{ total_sold: string }>(`
    SELECT COALESCE(SUM(oi.quantity), 0) AS total_sold
    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.status = 'delivered'
  `);
  return Number(result.rows[0]?.total_sold ?? 0);
}

export async function findChatProducts(filter: ProductFilterQuery, executeQuery = queryPostgres): Promise<ChatSuggestedProduct[]> {
  const result = await findProducts({ ...filter, limit: 50, page: 1 }, true, executeQuery);
  return result.products.filter(product => [product.nutrition.calories, product.nutrition.protein,
    product.nutrition.carbs, product.nutrition.fat, product.nutrition.sugar].every(Number.isFinite)).slice(0, 3);
}

export async function findProductById(id: string, executeQuery = queryPostgres): Promise<Product | null> {
  const result = await executeQuery<ProductRow>(`
    SELECT products.*, COALESCE((
      SELECT json_agg(json_build_object(
        'id', v.variant_id::text, 'productId', v.product_id::text,
        'name', v.variant_name, 'weight', v.weight, 'price', v.price,
        'status', COALESCE(v.status, FALSE)
      ) ORDER BY v.variant_id)
      FROM product_variants v WHERE v.product_id = products.id
    ), '[]'::json) AS variants
    FROM (${productReadSql}) products
    WHERE (id::text = $1 OR code = $1) AND status = TRUE
    LIMIT 1
  `, [id]);
  const row = result.rows[0];
  return row ? mapRowToProduct(row) : null;
}

export async function createProduct(newProd: Product): Promise<Product> {
  if (!isDbConnected()) {
    memoryProducts.unshift(newProd);
    return newProd;
  }
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const category = await client.query<{ category_id: number }>(
      'SELECT category_id FROM categories WHERE category_id::text = $1 LIMIT 1', [newProd.category]
    );
    if (!category.rows[0]) throw new Error('Product category does not exist.');
    const inserted = await client.query<{ product_id: number }>(`
      INSERT INTO products (code, name, category_id, price, stock_quantity,
        ingredients, description, image_url, status, usage_instruction)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING product_id
    `, [newProd.code, newProd.name, category.rows[0].category_id, newProd.price,
      newProd.stock, JSON.stringify(newProd.ingredients), newProd.description,
      newProd.image, newProd.status ?? true, newProd.usageInstruction ?? '']);
    const insertedProduct = inserted.rows[0];
    if (!insertedProduct) throw new Error('Product insert returned no ID.');
    const id = insertedProduct.product_id;
    const n = newProd.nutrition;
    await client.query(`
      INSERT INTO nutrition_facts (product_id, serving_size, calories, protein, carbs, fat, sugar, fiber, sodium)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [id, n.servingSize, n.calories, n.protein, n.carbs, n.fat, n.sugar, n.fiber ?? 0, n.sodium ?? 0]);
    await client.query('COMMIT');
    const { originalPrice: _originalPrice, isFeatured: _isFeatured, ...product } = newProd;
    return { ...product, badges: [], bestFor: '', id: String(id), rating: 0, reviewCount: 0, soldCount: 0 };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
