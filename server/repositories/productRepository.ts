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
  ingredients: string[] | string | null;
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
    ingredients: Array.isArray(row.ingredients)
      ? row.ingredients
      : row.ingredients
        ? row.ingredients.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
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
    soldCount: Number(row.sold_count ?? 0),
    badges: row.badges || [],
    isFeatured: row.is_featured,
    bestFor: row.best_for || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const productCategoryCode = `CASE
  WHEN LOWER(COALESCE(c.name, '')) LIKE '%low-carb%' THEN 'low-carb'
  WHEN LOWER(COALESCE(c.name, '')) LIKE '%high-protein%' THEN 'high-protein'
  WHEN LOWER(COALESCE(c.name, '')) LIKE '%sugar-free%' THEN 'sugar-free'
  ELSE 'all'
END`;

const productQueryFrom = `
  FROM products p
  LEFT JOIN categories c ON c.category_id = p.category_id
  LEFT JOIN LATERAL (
    SELECT serving_size, calories, protein, carbs, fat, sugar, fiber, sodium
    FROM nutrition_facts
    WHERE product_id = p.product_id
    ORDER BY nutrition_fact_id DESC
    LIMIT 1
  ) nf ON TRUE
`;

function productSelectSql(where: string, orderBy?: string): string {
  return `
    SELECT p.product_id::text AS id, p.code, p.name, ${productCategoryCode} AS category,
           c.name AS category_name, p.price, NULL::numeric AS original_price,
           p.image_url, p.description, p.ingredients, nf.serving_size,
           COALESCE(nf.calories, 0)::text AS calories,
           COALESCE(nf.protein, 0)::text AS protein,
           COALESCE(nf.carbs, 0)::text AS carbs,
           COALESCE(nf.fat, 0)::text AS fat,
           COALESCE(nf.sugar, 0)::text AS sugar,
           nf.fiber::text AS fiber, nf.sodium::text AS sodium,
           p.stock_quantity, 0::text AS rating, 0 AS review_count,
           ARRAY[]::text[] AS badges, FALSE AS is_featured,
           NULL::text AS best_for,
           COALESCE((
             SELECT SUM(oi.quantity)
             FROM order_items oi
             JOIN orders o ON o.order_id = oi.order_id
             WHERE oi.product_id = p.product_id AND o.status = 'delivered'
           ), 0) AS sold_count
    ${productQueryFrom}
    WHERE ${where}
    ${orderBy ?? ''}
  `;
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
      const conditions: string[] = ['p.status IS TRUE'];
      const values: unknown[] = [];
      let paramIdx = 1;

      if (filter.categories?.length) {
        conditions.push(`${productCategoryCode} = ANY($${paramIdx++}::text[])`);
        values.push(filter.categories);
      }

      if (!filter.categories?.length && filter.category && filter.category !== 'all') {
        conditions.push(`${productCategoryCode} = $${paramIdx++}`);
        values.push(filter.category);
      }

      if (filter.diet && filter.diet !== 'all') {
        conditions.push(`${productCategoryCode} = $${paramIdx++}`);
        values.push(filter.diet);
      }

      if (filter.maxCalories && filter.maxCalories > 0) {
        conditions.push(`COALESCE(nf.calories, 0) <= $${paramIdx++}`);
        values.push(filter.maxCalories);
      }

      if (filter.maxCarbs && filter.maxCarbs > 0) {
        conditions.push(`COALESCE(nf.carbs, 0) <= $${paramIdx++}`);
        values.push(filter.maxCarbs);
      }

      if (filter.maxSugar && filter.maxSugar > 0) {
        conditions.push(`COALESCE(nf.sugar, 0) <= $${paramIdx++}`);
        values.push(filter.maxSugar);
      }

      if (filter.minProtein && filter.minProtein > 0) {
        conditions.push(`COALESCE(nf.protein, 0) >= $${paramIdx++}`);
        values.push(filter.minProtein);
      }

      if (filter.search && filter.search.trim() !== '') {
        conditions.push(`(LOWER(p.name) LIKE $${paramIdx} OR LOWER(p.description) LIKE $${paramIdx})`);
        values.push(`%${filter.search.trim().toLowerCase()}%`);
        paramIdx++;
      }

      const countSql = `SELECT COUNT(*) ${productQueryFrom} WHERE ${conditions.join(' AND ')}`;
      const countResult = await executeQuery<{ count: string }>(countSql, values);
      const total = parseInt(countResult.rows[0]?.count || '0', 10);

      let orderBy = 'ORDER BY p.product_id ASC';
      if (filter.sort === 'price_asc') orderBy = 'ORDER BY p.price ASC';
      else if (filter.sort === 'price_desc') orderBy = 'ORDER BY p.price DESC';
      else if (filter.sort === 'calories_asc') orderBy = 'ORDER BY nf.calories ASC NULLS LAST';
      else if (filter.sort === 'calories_desc') orderBy = 'ORDER BY nf.calories DESC NULLS LAST';
      else if (filter.sort === 'protein_desc') orderBy = 'ORDER BY nf.protein DESC NULLS LAST';
      else if (filter.sort === 'carbs_asc') orderBy = 'ORDER BY nf.carbs ASC NULLS LAST';
      else if (filter.sort === 'sugar_asc') orderBy = 'ORDER BY nf.sugar ASC NULLS LAST';
      else if (filter.sort === 'sold_desc') orderBy = 'ORDER BY sold_count DESC, p.product_id ASC';
      else if (filter.sort === 'newest') orderBy = 'ORDER BY p.product_id DESC';

      const sql = `${productSelectSql(conditions.join(' AND '), orderBy)}
        LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
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

  // In-memory sorting
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
  const paginatedList = list.slice(offset, offset + limit);

  return {
    products: paginatedList,
    total,
  };
}

export async function getTotalSoldProducts(executeQuery = queryPostgres): Promise<number> {
  const result = await executeQuery<{ total_sold: string }>(`
    SELECT COALESCE(SUM(oi.quantity), 0) AS total_sold
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'delivered'
  `);
  return Number(result.rows[0]?.total_sold ?? 0);
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
    const res = await findProducts({ ...filter, limit: 50, page: 1 }, true, executeQuery);
    return res.products.filter(product => [product.nutrition.calories, product.nutrition.protein, product.nutrition.carbs,
      product.nutrition.fat, product.nutrition.sugar].every(Number.isFinite)).slice(0, 3);
  }

  if (!columns.has('product_id') || !columns.has('price') || !columns.has('status')) {
    throw new Error('Schema PostgreSQL không có cấu trúc sản phẩm được NutriBot hỗ trợ.');
  }

  const conditions = ['p.status IS TRUE'];
  const values: unknown[] = [];
  if (filter.categories?.length) {
    values.push(filter.categories);
    conditions.push(`${productCategoryCode} = ANY($${values.length}::text[])`);
  } else if (filter.category && filter.category !== 'all') {
    values.push(filter.category);
    conditions.push(`${productCategoryCode} = $${values.length}`);
  }
  if (filter.diet && filter.diet !== 'all') {
    values.push(filter.diet);
    conditions.push(`${productCategoryCode} = $${values.length}`);
  }
  if (filter.search?.trim()) {
    values.push(`%${filter.search.trim()}%`);
    conditions.push(`(p.name ILIKE $${values.length} OR COALESCE(p.description, '') ILIKE $${values.length})`);
  }
  if (filter.maxCalories && filter.maxCalories > 0) {
    values.push(filter.maxCalories);
    conditions.push(`nf.calories <= $${values.length}`);
  }
  if (filter.maxCarbs && filter.maxCarbs > 0) {
    values.push(filter.maxCarbs);
    conditions.push(`nf.carbs <= $${values.length}`);
  }
  if (filter.maxSugar && filter.maxSugar > 0) {
    values.push(filter.maxSugar);
    conditions.push(`nf.sugar <= $${values.length}`);
  }
  if (filter.minProtein && filter.minProtein > 0) {
    values.push(filter.minProtein);
    conditions.push(`nf.protein >= $${values.length}`);
  }

  const result = await executeQuery<{
    id: number;
    name: string;
    category: string;
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
    `SELECT p.product_id AS id, p.name, ${productCategoryCode} AS category,
            c.name AS category_name, p.price,
            p.description, p.image_url, nf.serving_size, nf.calories, nf.protein,
            nf.carbs, nf.fat, nf.sugar, p.stock_quantity::int AS stock
     FROM products p
     LEFT JOIN categories c ON c.category_id = p.category_id
     LEFT JOIN LATERAL (
       SELECT serving_size, calories, protein, carbs, fat, sugar
       FROM nutrition_facts
       WHERE product_id = p.product_id
       ORDER BY nutrition_fact_id DESC
       LIMIT 1
     ) nf ON TRUE
     WHERE ${conditions.join(' AND ')}
       AND nf.serving_size IS NOT NULL AND nf.calories IS NOT NULL
       AND nf.protein IS NOT NULL AND nf.carbs IS NOT NULL
       AND nf.fat IS NOT NULL AND nf.sugar IS NOT NULL
     ORDER BY ${filter.sort === 'protein_desc' ? 'nf.protein DESC' : filter.sort === 'carbs_asc' ? 'nf.carbs ASC' : filter.sort === 'sugar_asc' ? 'nf.sugar ASC' : filter.sort === 'calories_desc' ? 'nf.calories DESC' : filter.sort === 'calories_asc' ? 'nf.calories ASC' : 'p.product_id'}
     LIMIT 3`,
    values,
  );

  return result.rows.map(row => ({
    id: String(row.id),
    code: '',
    name: row.name,
    category: (row.category as Product['category']) || 'all',
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
      const sql = `${productSelectSql('(p.product_id::text = $1 OR p.code = $1) AND p.status IS TRUE')}
        LIMIT 1`;
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
        ) RETURNING product_id AS id
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
