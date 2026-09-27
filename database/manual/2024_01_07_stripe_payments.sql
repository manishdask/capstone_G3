-- ---------------------------------------------------------------------------
-- SGH App — schema change for the Stripe payment gateway (FR36–FR40)
--
-- WHY THIS FILE EXISTS
-- The server has no shell, so `php artisan migrate` cannot be run there by the
-- team. This is the exact SQL that migration
--   2024_01_07_000001_add_stripe_fields_to_payments_table
-- produces (generated with `php artisan migrate --pretend`), for pasting into
-- phpMyAdmin (SQL tab) against the production database.
--
-- RUN THIS *BEFORE* UPLOADING THE NEW PHP FILES.
-- The new payment code writes to these columns. If the code goes up first,
-- every "Pay online" attempt fails with a SQL error until this has run.
--
-- Additive only: four NULLable columns and one index. Existing payment rows
-- are untouched. Running it twice errors with "Duplicate column name" — that
-- is harmless and means it was already applied.
-- ---------------------------------------------------------------------------

ALTER TABLE `payments`
  ADD COLUMN `provider` VARCHAR(20) NULL AFTER `gateway_reference`,
  ADD COLUMN `currency` CHAR(3) NULL AFTER `amount`,
  ADD COLUMN `paid_at` DATETIME NULL AFTER `received_at`,
  ADD COLUMN `failure_reason` VARCHAR(255) NULL AFTER `paid_at`,
  ADD INDEX `payments_invoice_id_status_index` (`invoice_id`, `status`);

-- Record the migration so Laravel never tries to re-apply it. The batch number
-- is one above whatever is already there; re-running inserts nothing.
INSERT INTO `migrations` (`migration`, `batch`)
SELECT '2024_01_07_000001_add_stripe_fields_to_payments_table', next_batch.b
FROM (SELECT COALESCE(MAX(`batch`), 0) + 1 AS b FROM `migrations`) AS next_batch
WHERE NOT EXISTS (
  SELECT 1 FROM `migrations` WHERE `migration` = '2024_01_07_000001_add_stripe_fields_to_payments_table'
);

-- Verify (should return 4 rows):
-- SHOW COLUMNS FROM `payments` WHERE Field IN ('provider', 'currency', 'paid_at', 'failure_reason');
