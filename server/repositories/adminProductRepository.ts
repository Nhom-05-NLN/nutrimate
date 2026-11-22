import type { PoolClient } from 'pg';
import { getPool, queryPostgres } from '../db/index.js';
import { randomUUID } from 'node:crypto';

export interface ProductInput {
  description?: string;
  ingredients?: string[];
  usageInstruction?: string;
  skuReservation?: string;
  galleryImages: string[];
  unit: string;
  package_size: string;
  stock: number;
  sku: string; name: string; category: string; price: number; image: string;
  calo: number; protein: number; carbs: number; fat: number; sugar: number;
  fiber: number; sodium: number;
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
      p.price::float8 AS price, p.unit, p.package_size, COALESCE(p.stock_quantity,0) AS stock,
      COALESCE(n.calories,0) AS calo, COALESCE(n.protein,0) AS protein,
      COALESCE(n.carbs,0) AS carbs, COALESCE(n.fat,0) AS fat, COALESCE(n.sugar,0) AS sugar,
      COALESCE(n.fiber,0) AS fiber, COALESCE(n.sodium,0) AS sodium,
      p.usage_instruction AS "usageInstruction",
      CASE WHEN p.status THEN 'Đang bán' ELSE 'Tạm ngừng' END AS status,
      COALESCE(p.image_url,'') AS image, COALESCE((SELECT json_agg(i.image_url ORDER BY i.sort_order, i.image_id)
        FROM product_images i WHERE i.product_id=p.product_id), '[]'::json) AS "galleryImages",
      COALESCE(p.description,'') AS description, p.ingredients,
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

export function validateProduct(body: Record<string, unknown>, requireSku = true): ProductInput {
  for (const field of ['description', 'usageInstruction']) {
    if (body[field] !== undefined && (typeof body[field] !== 'string' || (body[field] as string).length > 10000)) {
      throw new ProductInputError('Mô tả và hướng dẫn sử dụng phải là văn bản tối đa 10.000 ký tự.');
    }
  }
  if (body.ingredients !== undefined && (!Array.isArray(body.ingredients) || body.ingredients.length > 200 ||
      body.ingredients.some(value => typeof value !== 'string' || value.length > 10000) ||
      body.ingredients.join('\n').length > 10000)) {
    throw new ProductInputError('Thành phần phải là danh sách tối đa 200 mục và tổng cộng 10.000 ký tự.');
  }
  let reservedSku = '';
  if (!requireSku && body.skuReservation !== undefined) {
    if (typeof body.sku !== 'string' || typeof body.skuReservation !== 'string' || !/^NM-PRD-\d{4}$/.test(body.sku)) {
      throw new ProductInputError('Mã SKU được cấp không hợp lệ. Vui lòng mở lại form.');
    }
    reservedSku = body.sku;
  }
  const fiber = body.fiber ?? 0;
  const sodium = body.sodium ?? 0;
  if ([fiber, sodium].some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
    throw new ProductInputError('Chất xơ và natri phải là số không âm hợp lệ.');
  }
  const unit = body.unit ?? '';
  const packageSize = body.package_size ?? '';
  if (typeof unit !== 'string' || unit.trim().length > 50 ||
      typeof packageSize !== 'string' || packageSize.trim().length > 100) {
    throw new ProductInputError('Đơn vị bán tối đa 50 ký tự, quy cách đóng gói tối đa 100 ký tự.');
  }
  const stock = body.stock ?? 0;
  if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0 || stock > 2147483647) {
    throw new ProductInputError('Số lượng sản phẩm phải là số nguyên không âm hợp lệ.');
  }
  if ((requireSku && (typeof body.sku !== 'string' || !body.sku.trim() || body.sku.trim().length > 50)) ||
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
  const images = body.galleryImages === undefined ? (body.image.trim() ? [body.image.trim()] : []) : body.galleryImages;
  if (!Array.isArray(images) || images.length > 20 || images.some(image => {
    if (typeof image !== 'string' || !image.trim() || image.trim().length > 2000) return true;
    try { return !['https:', 'http:'].includes(new URL(image.trim()).protocol); } catch { return true; }
  })) throw new ProductInputError('Chọn tối đa 20 ảnh với đường dẫn HTTP hoặc HTTPS hợp lệ.');
  const galleryImages = [...new Set((images as string[]).map(image => image.trim()))];
  return { skuReservation: reservedSku ? body.skuReservation as string : undefined, galleryImages, unit: unit.trim(), package_size: packageSize.trim(), stock, sku: requireSku ? (body.sku as string).trim().toUpperCase() : reservedSku, name: body.name.trim(), category: body.category,
    price: body.price as number, calo: body.calo as number, protein: body.protein as number,
    carbs: body.carbs as number, fat: body.fat as number, sugar: body.sugar as number,
    fiber: fiber as number, sodium: sodium as number,
    description: body.description === undefined ? undefined : (body.description as string).trim(),
    usageInstruction: body.usageInstruction === undefined ? undefined : (body.usageInstruction as string).trim(),
    ingredients: body.ingredients === undefined ? undefined : (body.ingredients as string[]).map(value => value.trim()).filter(Boolean),
    status: body.status as ProductInput['status'], image: galleryImages[0] ?? '' };
}

async function lockSkuAllocation(client: PoolClient) {
  await client.query("SELECT pg_advisory_xact_lock(hashtext('nutrimate.product-sku-allocation'))");
  await client.query('DELETE FROM product_sku_reservations WHERE expires_at <= NOW()');
}

export async function reserveProductSku() {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const sku = await generateProductSku(client);
    const skuReservation = randomUUID();
    await client.query('INSERT INTO product_sku_reservations (sku,token) VALUES ($1,$2)', [sku,skuReservation]);
    await client.query('COMMIT');
    return { sku, skuReservation };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function releaseProductSku(token: string) {
  await queryPostgres('DELETE FROM product_sku_reservations WHERE token::text=$1', [token]);
}

export async function generateProductSku(client: PoolClient): Promise<string> {
  await lockSkuAllocation(client);
  const result = await client.query<{ sku: string }>(`
    SELECT 'NM-PRD-' || LPAD(n::text,4,'0') AS sku FROM generate_series(1,9999) n
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE UPPER(code)='NM-PRD-' || LPAD(n::text,4,'0'))
      AND NOT EXISTS (SELECT 1 FROM product_sku_reservations WHERE sku='NM-PRD-' || LPAD(n::text,4,'0'))
    ORDER BY n LIMIT 1
  `);
  if (!result.rows[0]) throw new ProductInputError('Không còn mã SKU trống trong phạm vi 0001–9999.',409);
  return result.rows[0].sku;
}

export async function writeProduct(client: PoolClient, data: ProductInput, id?: string) {
  if (!(await client.query('SELECT category_id FROM categories WHERE category_id::text=$1', [data.category])).rows.length) {
    throw new ProductInputError('Danh mục không tồn tại.');
  }
  await lockSkuAllocation(client);
  if (!id && data.skuReservation) {
    const reservation = await client.query('SELECT sku FROM product_sku_reservations WHERE sku=$1 AND token::text=$2 AND expires_at>NOW()', [data.sku,data.skuReservation]);
    if (!reservation.rows.length) throw new ProductInputError('Mã SKU giữ chỗ đã hết hạn. Vui lòng mở lại form.',409);
  }
  const sku = id || data.skuReservation ? data.sku : await generateProductSku(client);
  if (!/^NM-PRD-\d{4}$/.test(sku)) throw new ProductInputError('Mã SKU phải có dạng NM-PRD-xxxx.');
  if (id && (await client.query('SELECT sku FROM product_sku_reservations WHERE sku=$1', [sku])).rows.length) {
    throw new ProductInputError('Mã SKU đang được giữ cho một sản phẩm mới.',409);
  }
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [sku]);
  if ((await client.query('SELECT product_id FROM products WHERE UPPER(code)=$1 AND ($2::text IS NULL OR product_id::text<>$2)', [sku,id ?? null])).rows.length) {
    throw new ProductInputError('Mã SKU đã tồn tại.',409);
  }
  const values = [sku,data.name,data.category,data.price,data.image,data.status === 'Đang bán',data.unit,data.package_size];
  const saved = id
    ? await client.query(`UPDATE products SET code=$1,name=$2,category_id=$3,price=$4,image_url=$5,status=$6,unit=$7,package_size=$8,
        description=COALESCE($10,description),ingredients=COALESCE($11,ingredients),usage_instruction=COALESCE($12,usage_instruction),updated_at=NOW()
        WHERE product_id::text=$9 RETURNING product_id`, [...values,id,data.description ?? null,
          data.ingredients === undefined ? null : JSON.stringify(data.ingredients),data.usageInstruction ?? null])
    : await client.query(`INSERT INTO products (code,name,category_id,price,image_url,status,unit,package_size,stock_quantity,description,ingredients,usage_instruction)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING product_id`,
        [...values,data.stock,data.description ?? '',JSON.stringify(data.ingredients ?? []),data.usageInstruction ?? '']);
  const productId = saved.rows[0]?.product_id;
  if (!productId) throw new ProductInputError('Không tìm thấy sản phẩm.',404);
  await client.query('DELETE FROM product_images WHERE product_id=$1', [productId]);
  for (const [index, url] of data.galleryImages.entries()) {
    await client.query('INSERT INTO product_images (product_id,image_url,sort_order) VALUES ($1,$2,$3)', [productId,url,index]);
  }
  await client.query(`INSERT INTO nutrition_facts (product_id,calories,protein,carbs,fat,sugar,fiber,sodium)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (product_id) DO UPDATE SET
    calories=EXCLUDED.calories,protein=EXCLUDED.protein,carbs=EXCLUDED.carbs,fat=EXCLUDED.fat,sugar=EXCLUDED.sugar,
    fiber=EXCLUDED.fiber,sodium=EXCLUDED.sodium`,
    [productId,data.calo,data.protein,data.carbs,data.fat,data.sugar,data.fiber,data.sodium]);
  if (!id && data.skuReservation) await client.query('DELETE FROM product_sku_reservations WHERE token::text=$1', [data.skuReservation]);
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
