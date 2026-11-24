-- Application stock is stored in products.stock_quantity.
-- Do not copy legacy inventory quantities over the current product stock.
BEGIN;
DROP TABLE IF EXISTS inventory;
COMMIT;
