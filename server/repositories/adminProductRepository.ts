import type { PoolClient } from 'pg';
import { getPool, queryPostgres } from '../db/index.js';

export interface ProductInput {
  stock: number;
  sku: string; name: string; category: string; price: number; image: string;
  calo: number; protein: number; carbs: number; fat: number; sugar: number;
  status: 'Đang bán' | 'Tạm ngừng';
}
export class ProductInputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

function ingredients(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(item => typeof item === 'string');
  if (typeof value !== 'string' || !value) return [];
  try { const parsed: unknown = JSON.parse(value); if (Array.isArray(parsed)) return parsed.filter(item => typeof item === 'string'); } catch { /* Plain text is supported. */ }
  return value.split(/[,;\n]+/).map(item => item.trim()).filter(Boolean);
}

export async function listAdminProducts(executeQuery = queryPostgres) {
  const products = await executeQuery(`
    SELECT p.product_id::text AS id, COALESCE(p.code,'') AS sku, p.name,
      p.category_id::text AS "categoryId", COALESCE(c.name,'') AS category,
      p.price::float8 AS price, COALESCE(p.stock_quantity,0) AS stock,
      COALESCE(n.calories,0) AS calo, COALESCE(n.protein,0) AS protein,
      COALESCE(n.carbs,0) AS carbs, COALESCE(n.fat,0) AS fat, COALESCE(n.sugar,0) AS sugar,
      n.serving_size AS "servingSize", p.usage_instruction AS "usageInstruction",
      CASE WHEN p.status THEN 'Đang bán' ELSE 'Tạm ngừng' END AS status,
      COALESCE(p.image_url,'') AS image, COALESCE(p.description,'') AS description, p.ingredients,
      COALESCE(r.rating,0)::float8 AS rating, COALESCE(r.count,0)::int AS "reviewCount",
      COALESCE(s.sold,0)::int AS "soldCount"
    FROM products p LEFT JOIN categories c ON c.category_id=p.category_id
    LEFT JOIN nutrition_facts n ON n.product_id=p.product_id
    LEFT JOIN LATERAL (SELECT AVG(rating) AS rating, COUNT(*) AS count
      FROM product_reviews WHERE product_id=p.product_id) r ON TRUE
    LEFT JOIN LATERAL (SELECT SUM(oi.quantity) AS sold FROM order_items oi
      JOIN orders o ON o.id=oi.order_id
      WHERE oi.product_id=p.product_id AND o.status='delivered') s ON TRUE
    ORDER BY p.product_id DESC
  `);
  const categories = await executeQuery('SELECT category_id::text AS id,name FROM categories ORDER BY category_id');
  const sales = await executeQuery(`SELECT COALESCE(SUM(oi.quantity),0)::int AS total FROM order_items oi
    JOIN orders o ON o.id=oi.order_id WHERE o.status='delivered'`);
  return { products: products.rows.map(row => ({ ...row, ingredients: ingredients(row.ingredients) })),
    categories: categories.rows, totalSold: Number(sales.rows[0]?.total ?? 0) };
}

export function validateProduct(body: Record<string, unknown>): ProductInput {
  const stock = body.stock ?? 0;
  if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0 || stock > 2147483647) {
    throw new ProductInputError('Số lượng sản phẩm phải là số nguyên không âm hợp lệ.');
  }
  if (typeof body.sku !== 'string' || !body.sku.trim() || body.sku.trim().length > 50 ||
      typeof body.name !== 'string' || body.name.trim().length < 3 || body.name.trim().length > 200 ||
      typeof body.category !== 'string' || !/^\d+$/.test(body.category) ||
      !['Đang bán','Tạm ngừng'].includes(String(body.status))) {
    throw new ProductInputError('Thông tin sản phẩm hoặc danh mục không hợp lệ.');
  }
  for (const field of ['price','calo','protein','carbs','fat','sugar']) {
    const value = body[field];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (field === 'price' && value <= 0)) {
      throw new ProductInputError('Giá và chỉ số dinh dưỡng phải là số hợp lệ.');
    }
  }
  if (typeof body.image !== 'string' || body.image.length > 2000) throw new ProductInputError('Ảnh sản phẩm không hợp lệ.');
  return { stock, sku: body.sku.trim().toUpperCase(), name: body.name.trim(), category: body.category,
    price: body.price as number, calo: body.calo as number, protein: body.protein as number,
    carbs: body.carbs as number, fat: body.fat as number, sugar: body.sugar as number,
    status: body.status as ProductInput['status'], image: body.image.trim() };
}

export async function writeProduct(client: PoolClient, data: ProductInput, id?: string) {
  if (!(await client.query('SELECT category_id FROM categories WHERE category_id::text=$1', [data.category])).rows.length) {
    throw new ProductInputError('Danh mục không tồn tại.');
  }
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [data.sku]);
  if ((await client.query('SELECT product_id FROM products WHERE UPPER(code)=$1 AND ($2::text IS NULL OR product_id::text<>$2)', [data.sku,id ?? null])).rows.length) {
    throw new ProductInputError('Mã SKU đã tồn tại.',409);
  }
  const values = [data.sku,data.name,data.category,data.price,data.image,data.status === 'Đang bán'];
  const saved = id
    ? await client.query(`UPDATE products SET code=$1,name=$2,category_id=$3,price=$4,image_url=$5,status=$6,updated_at=NOW()
        WHERE product_id::text=$7 RETURNING product_id`, [...values,id])
    : await client.query(`INSERT INTO products (code,name,category_id,price,image_url,status,stock_quantity,ingredients)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'') RETURNING product_id`, [...values,data.stock]);
  const productId = saved.rows[0]?.product_id;
  if (!productId) throw new ProductInputError('Không tìm thấy sản phẩm.',404);
  await client.query(`INSERT INTO nutrition_facts (product_id,serving_size,calories,protein,carbs,fat,sugar)
    VALUES ($1,'100g',$2,$3,$4,$5,$6) ON CONFLICT (product_id) DO UPDATE SET
    calories=EXCLUDED.calories,protein=EXCLUDED.protein,carbs=EXCLUDED.carbs,fat=EXCLUDED.fat,sugar=EXCLUDED.sugar`,
    [productId,data.calo,data.protein,data.carbs,data.fat,data.sugar]);
  return String(productId);
}

export async function saveProduct(data: ProductInput, id?: string) {
  const client = await getPool().connect();
  try { await client.query('BEGIN'); const saved = await writeProduct(client,data,id); await client.query('COMMIT'); return saved; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function deleteProduct(id: string, executeQuery = queryPostgres) {
  const result = await executeQuery('DELETE FROM products WHERE product_id::text=$1 RETURNING product_id',[id]);
  if (!result.rows.length) throw new ProductInputError('Không tìm thấy sản phẩm.',404);
}
