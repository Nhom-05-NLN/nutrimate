-- Upgrade the legacy chat_sessions/chat_messages schema without deleting its data.
BEGIN;

DO $$
BEGIN
    IF to_regclass('public.chat_messages') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'chat_messages'
              AND column_name = 'conversation_id'
        ) THEN
            NULL;
        ELSIF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'chat_messages'
              AND column_name = 'session_id'
        ) AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'chat_messages'
              AND column_name = 'question'
        ) AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'chat_messages'
              AND column_name = 'response'
        ) THEN
            IF to_regclass('public.chat_messages_legacy') IS NOT NULL THEN
                RAISE EXCEPTION 'Both legacy chat_messages and chat_messages_legacy exist; resolve the existing archive before migrating';
            END IF;
            ALTER TABLE public.chat_messages RENAME TO chat_messages_legacy;
        ELSE
            RAISE EXCEPTION 'Unsupported public.chat_messages schema; no tables were changed';
        END IF;
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    guest_owner_hash CHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((user_id IS NOT NULL AND guest_owner_hash IS NULL)
        OR (user_id IS NULL AND guest_owner_hash IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user
    ON chat_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_guest
    ON chat_conversations(guest_owner_hash, updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL CONSTRAINT chat_messages_v2_pkey PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL CHECK (length(btrim(content)) BETWEEN 1 AND 12000),
    suggested_products JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_messages_v2_request_role_key UNIQUE (conversation_id, request_id, role)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_v2_conversation
    ON chat_messages(conversation_id, id DESC);

DO $$
DECLARE
    required_column TEXT;
BEGIN
    FOREACH required_column IN ARRAY ARRAY['id', 'user_id', 'guest_owner_hash', 'created_at', 'updated_at']
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'chat_conversations'
              AND column_name = required_column
        ) THEN
            RAISE EXCEPTION 'public.chat_conversations is missing required column %', required_column;
        END IF;
    END LOOP;

    FOREACH required_column IN ARRAY ARRAY['id', 'conversation_id', 'request_id', 'role', 'content', 'suggested_products', 'created_at']
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'chat_messages'
              AND column_name = required_column
        ) THEN
            RAISE EXCEPTION 'public.chat_messages is missing required column %', required_column;
        END IF;
    END LOOP;
END
$$;

COMMIT;
