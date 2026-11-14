BEGIN;

ALTER TABLE admin_notifications
    DROP CONSTRAINT IF EXISTS admin_notifications_type_check;

DELETE FROM admin_notifications
WHERE type = 'customer_logged_in';

ALTER TABLE admin_notifications
    ADD CONSTRAINT admin_notifications_type_check
    CHECK (type IN ('customer_registered', 'order_placed'));

COMMIT;
