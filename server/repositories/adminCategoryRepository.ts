import type { PoolClient } from 'pg';
import { getPool, queryPostgres } from '../db/index.js';

export class CategoryInputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function validateCategory(body: Record<string, unknown>) {
  if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 100 ||
      typeof body.description !== 'string' || body.description.trim().length > 5000 || typeof body.status !== 'boolean') {
    throw new CategoryInputError('Tên danh mục phải từ 2–100 ký tự, mô tả tối đa 5000 ký tự.');
  }
  return { name: body.name.trim(), description: body.description.trim(), status: body.status };

}

export async function listAdminCategories(executeQuery = queryPostgres) {
  const result = await executeQuery(`
    SELECT c.category_id::text AS id, c.code, c.name, COALESCE(c.description,'') AS description, c.status,
      COUNT(p.product_id)::int AS "productCount",
      COALESCE(json_agg(json_build_object(
        'id',p.product_id::text,'sku',p.code,'name',p.name,'price',p.price,'image',p.image_url,
        'status',CASE WHEN p.status THEN 'Đang bán' ELSE 'Tạm ngừng' END
      ) ORDER BY p.product_id) FILTER (WHERE p.product_id IS NOT NULL),'[]') AS products
    FROM categories c LEFT JOIN products p ON p.category_id=c.category_id
    GROUP BY c.category_id,c.name,c.description,c.status ORDER BY c.category_id
  `);
  return result.rows;
}

export async function writeCategory(client: PoolClient, input: ReturnType<typeof validateCategory>, id?: string) {
  // Serialize name checks even when administrators submit simultaneously.
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',['nutrimate.category.names']);
  const duplicate = await client.query(`SELECT category_id FROM categories
    WHERE LOWER(BTRIM(name))=LOWER($1) AND ($2::text IS NULL OR category_id::text<>$2)`,[input.name,id ?? null]);
  if (duplicate.rows.length) throw new CategoryInputError('Tên danh mục đã tồn tại.',409);
  const code = id ? '' : await nextCategoryCode(client);
  const result = id
    ? await client.query('UPDATE categories SET name=$1,description=$2,status=$3 WHERE category_id::text=$4 RETURNING category_id',[input.name,input.description,input.status,id])
    : await client.query('INSERT INTO categories (name,description,status,code) VALUES ($1,$2,$3,$4) RETURNING category_id',[input.name,input.description,input.status,code]);
  if (!result.rows[0]) throw new CategoryInputError('Không tìm thấy danh mục.',404);
  return String(result.rows[0].category_id);
}

export async function removeCategory(client: PoolClient, id: string) {
  const category = await client.query('SELECT category_id FROM categories WHERE category_id::text=$1 FOR UPDATE',[id]);
  if (!category.rows.length) throw new CategoryInputError('Không tìm thấy danh mục.',404);
  if ((await client.query('SELECT 1 FROM products WHERE category_id::text=$1 LIMIT 1',[id])).rows.length) {
    throw new CategoryInputError('Danh mục còn sản phẩm liên kết. Hãy chuyển sản phẩm sang danh mục khác trước khi xóa.',409);
  }
  await client.query('DELETE FROM categories WHERE category_id::text=$1',[id]);
}

export async function categoryTransaction<T>(action: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try { await client.query('BEGIN'); const result = await action(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

async function lockCategoryCodes(client: PoolClient) {
  await client.query("SELECT pg_advisory_xact_lock(hashtext('nutrimate.category.codes'))");
}

export async function getNextCategoryCode(executeQuery = queryPostgres): Promise<string> {
  const result = await executeQuery<{code:string}>(`
    SELECT 'CAT-' || LPAD(n::text,3,'0') AS code FROM generate_series(1,999) n
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE code='CAT-' || LPAD(n::text,3,'0'))
    ORDER BY n LIMIT 1
  `);
  if (!result.rows[0]) throw new CategoryInputError('Không còn mã danh mục trong phạm vi CAT-001 đến CAT-999.',409);
  return result.rows[0].code;
}

async function nextCategoryCode(client: PoolClient): Promise<string> {
  await lockCategoryCodes(client);
  return getNextCategoryCode(client.query.bind(client));
}
