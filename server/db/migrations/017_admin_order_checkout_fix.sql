-- Fix Admin order checkout customer synchronization to prevent fk_order_customer constraint violation
BEGIN;

CREATE OR REPLACE FUNCTION fn_sync_order_customer_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id := COALESCE(NEW.id, NEW.order_id);
    NEW.receiver_name := COALESCE(NEW.receiver_name, NEW.customer_name, 'Khách hàng');
    NEW.customer_name := COALESCE(NEW.customer_name, NEW.receiver_name);
    NEW.receiver_phone := COALESCE(NEW.receiver_phone, NEW.customer_phone, '');
    NEW.customer_phone := COALESCE(NEW.customer_phone, NEW.receiver_phone);
    NEW.receiver_email := COALESCE(NEW.receiver_email, NEW.customer_email, '');
    NEW.customer_email := COALESCE(NEW.customer_email, NEW.receiver_email);
    NEW.note := COALESCE(NEW.note, NEW.notes);
    NEW.notes := COALESCE(NEW.notes, NEW.note);
    NEW.user_id := COALESCE(NEW.user_id, NEW.customer_id);
    IF NEW.customer_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM customers WHERE user_id = NEW.customer_id) THEN
        NEW.customer_id := NULL;
    END IF;
    IF NEW.customer_id IS NULL
       AND NEW.user_id IS NOT NULL
       AND EXISTS (SELECT 1 FROM customers WHERE user_id = NEW.user_id) THEN
        NEW.customer_id := NEW.user_id;
    END IF;
    NEW.created_at := COALESCE(NEW.created_at, NEW.order_date, CURRENT_TIMESTAMP);
    NEW.order_date := COALESCE(NEW.order_date, NEW.created_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
