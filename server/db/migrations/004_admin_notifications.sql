BEGIN;

CREATE TABLE IF NOT EXISTS admin_notifications (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(40) NOT NULL CHECK (type IN ('customer_registered')),
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created
    ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread
    ON admin_notifications(created_at DESC)
    WHERE read_at IS NULL;

COMMIT;
