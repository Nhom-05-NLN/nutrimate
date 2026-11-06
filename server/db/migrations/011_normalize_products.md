Product normalization
=====================

`011_normalize_products.sql` is a one-time migration for the existing hybrid
PostgreSQL schema. It keeps `product_id`, `price`, `status` and `category_id`,
preserves existing nutrition_facts, and fills missing nutrition rows from the
legacy product columns. Review statistics are computed from product_reviews;
historical summary numbers are not converted into fabricated reviews.

The migration creates `products_legacy_backup_011` before removing columns.
Do not remove that backup until the migration has been accepted. It contains
the original values of all product columns. Foreign keys already target
product_id and are left intact. DROP uses no CASCADE: unexpected dependencies
abort the transaction instead of being removed silently.

Run once with the database configured through the existing PG environment variables:

    npx tsx scripts/normalizeProducts.ts
    npx tsx scripts/normalizeProducts.ts --apply

The default run rolls back all changes, including inserted verification reviews.
The apply run verifies catalog filters and review aggregation before committing,
then checks the detail, category and dashboard queries. An existing backup makes
a repeat run fail, avoiding replacement of the original backup.

The API continues exposing `id`, `category`, `categoryName`, `nutrition`, `rating`
and `reviewCount` for frontend compatibility. These are mapped from product_id
and related tables; they are not duplicate columns in products. Products without
reviews have rating 0 and reviewCount 0.

Recovery requires restoring the removed column definitions and values from
products_legacy_backup_011 using product_id as the key, together with the old
application version. Do not replace the live table with the backup: other tables
have foreign keys referencing the live products table, and new rows may have
been added after migration.
