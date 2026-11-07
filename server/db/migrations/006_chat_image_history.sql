-- Link authenticated nutrition image analyses to their chat history.
BEGIN;

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS nutrition_image_id INTEGER
  REFERENCES nutrition_images(image_id) ON DELETE SET NULL;

DROP INDEX IF EXISTS idx_chat_messages_nutrition_image;

CREATE INDEX IF NOT EXISTS idx_chat_messages_nutrition_image
  ON chat_messages(nutrition_image_id)
  WHERE nutrition_image_id IS NOT NULL;

COMMIT;
