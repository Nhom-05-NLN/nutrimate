BEGIN;

CREATE TABLE IF NOT EXISTS product_images (
  image_id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  image_url VARCHAR(2000) NOT NULL,
  sort_order INT NOT NULL CHECK (sort_order >= 0),
  UNIQUE (product_id, sort_order),
  UNIQUE (product_id, image_url)
);

-- Preserve each existing main image as the first image of its product.
INSERT INTO product_images (product_id, image_url, sort_order)
SELECT p.product_id, p.image_url, 0 FROM products p
WHERE p.image_url IS NOT NULL AND BTRIM(p.image_url) <> ''
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.product_id)
ON CONFLICT DO NOTHING;

COMMIT;
