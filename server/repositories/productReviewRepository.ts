import { queryPostgres } from '../db/index.js';

interface ReviewRow {
  review_id: number;
  author: string;
  rating: number;
  comment: string | null;
  created_at: Date | string;
}

export async function listProductReviews(productId: string, executeQuery = queryPostgres) {
  const result = await executeQuery<ReviewRow>(`
    SELECT r.review_id, COALESCE(u.full_name, 'Khách hàng') AS author,
           r.rating, r.comment, r.created_at
    FROM product_reviews r
    JOIN products p ON p.product_id = r.product_id
    LEFT JOIN users u ON u.id = COALESCE(r.user_id, r.customer_id)
    WHERE (p.product_id::text = $1 OR p.code = $1) AND p.status = TRUE
    ORDER BY r.created_at DESC, r.review_id DESC
    LIMIT 100
  `, [productId]);
  return result.rows.map(row => ({
    id: String(row.review_id), author: row.author, rating: row.rating,
    content: row.comment || '', createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function insertProductReview(productId: string, userId: string, rating: number, content: string, executeQuery = queryPostgres) {
  const result = await executeQuery<{ review_id: number }>(`
    INSERT INTO product_reviews (product_id, user_id, rating, comment)
    SELECT p.product_id, u.id, $3, $4
    FROM products p JOIN users u ON u.id::text = $2
    WHERE (p.product_id::text = $1 OR p.code = $1) AND p.status = TRUE
    RETURNING review_id
  `, [productId, userId, rating, content]);
  return result.rows[0] ? String(result.rows[0].review_id) : null;
}
