-- Reuse an existing Customer-owned nutrition image for identical uploads.
BEGIN;

ALTER TABLE nutrition_images
  ADD COLUMN IF NOT EXISTS content_sha256 CHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nutrition_images_customer_content_sha256
  ON nutrition_images(customer_id, content_sha256)
  WHERE content_sha256 IS NOT NULL;

DROP INDEX IF EXISTS idx_chat_messages_nutrition_image;

CREATE INDEX IF NOT EXISTS idx_chat_messages_nutrition_image
  ON chat_messages(nutrition_image_id)
  WHERE nutrition_image_id IS NOT NULL;

COMMIT;
