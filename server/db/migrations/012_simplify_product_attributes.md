Product attribute cleanup
=========================

Removes `best_for`, `is_featured`, `badges`, `original_price` (the database name
for originalPrice), and the product `slug`. Category slugs are unchanged.
The product API retains empty badges/bestFor for frontend compatibility but no
longer reads, writes or sorts by the removed product columns.

The DROP TABLE targets `products_legacy_backup_011`, created by migration 011
and explicitly confirmed by the user. No CASCADE is used.

With PostgreSQL available, first verify without persisting changes:

    npx tsx scripts/simplifyProducts.ts

Then apply the same transaction and catalog checks:

    npx tsx scripts/simplifyProducts.ts --apply
