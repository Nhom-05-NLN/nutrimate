BEGIN;

ALTER TABLE admin_notifications
    DROP CONSTRAINT IF EXISTS admin_notifications_type_check;

ALTER TABLE admin_notifications
    ADD CONSTRAINT admin_notifications_type_check
    CHECK (type IN ('customer_registered', 'customer_logged_in'));

COMMIT;
