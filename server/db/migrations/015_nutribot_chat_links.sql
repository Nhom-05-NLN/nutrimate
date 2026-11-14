-- Link each chat conversation to the NutriBot configuration that owns it.
BEGIN;

CREATE TABLE IF NOT EXISTS nutribot (
    bot_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(80) NOT NULL DEFAULT 'openai-compatible',
    model VARCHAR(150) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE nutribot
    ADD COLUMN IF NOT EXISTS provider VARCHAR(80) NOT NULL DEFAULT 'openai-compatible',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

INSERT INTO nutribot (name, provider, model, description, is_active)
SELECT 'NutriBot', 'openai-compatible', 'unconfigured',
       'Cấu hình model được quản lý qua biến môi trường; không lưu API key trong cơ sở dữ liệu.',
       TRUE
WHERE NOT EXISTS (SELECT 1 FROM nutribot WHERE is_active IS TRUE);

ALTER TABLE chat_conversations
    ADD COLUMN IF NOT EXISTS bot_id INTEGER;

UPDATE chat_conversations
SET bot_id = (
    SELECT bot_id
    FROM nutribot
    WHERE is_active IS TRUE
    ORDER BY bot_id
    LIMIT 1
)
WHERE bot_id IS NULL;

ALTER TABLE chat_conversations
    ALTER COLUMN bot_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chat_conversations_bot_id_fkey'
          AND conrelid = 'chat_conversations'::regclass
    ) THEN
        ALTER TABLE chat_conversations
            ADD CONSTRAINT chat_conversations_bot_id_fkey
            FOREIGN KEY (bot_id) REFERENCES nutribot(bot_id) ON DELETE RESTRICT;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_chat_conversations_bot_updated
    ON chat_conversations(bot_id, updated_at DESC);

COMMENT ON TABLE nutribot IS
    'Lưu metadata nhà cung cấp và model NutriBot; API key chỉ cấu hình qua biến môi trường.';
COMMENT ON COLUMN chat_conversations.bot_id IS
    'NutriBot xử lý hội thoại; tin nhắn liên kết gián tiếp qua conversation_id.';

COMMIT;
