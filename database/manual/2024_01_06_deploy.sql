-- ---------------------------------------------------------------------------
-- SGH App — schema changes for the RBAC / notifications / lab-approval release
--
-- WHY THIS FILE EXISTS
-- The server has no shell, so `php artisan migrate` cannot be run there by the
-- team. This is the exact SQL those two migrations produce, for pasting into
-- phpMyAdmin (SQL tab) against the production database.
--
-- RUN THIS *BEFORE* UPLOADING THE NEW PHP FILES.
-- The new backend code writes to the columns created below. If the code goes up
-- first, every booking and every lab action will fail with a SQL error until
-- this has run.
--
-- Safe to run once. Running it twice will error on "duplicate column" — that is
-- harmless and means it was already applied.
--
-- After running, also insert the two migration rows at the bottom so Laravel
-- does not try to re-apply them if migrate is ever run later.
-- ---------------------------------------------------------------------------

-- 1. Notifications: in-app channel, read state, and honest delivery outcomes.
--    (migration 2024_01_06_000001_add_delivery_columns_to_notifications_table)

ALTER TABLE `notifications`
  MODIFY `channel` ENUM('sms','email','push','in_app') NOT NULL DEFAULT 'in_app';

ALTER TABLE `notifications`
  ADD COLUMN `read_at` DATETIME NULL AFTER `sent_at`,
  ADD COLUMN `failure_reason` VARCHAR(255) NULL AFTER `read_at`,
  ADD COLUMN `attempts` SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER `failure_reason`;

ALTER TABLE `notifications`
  ADD INDEX `notifications_recipient_user_id_read_at_index` (`recipient_user_id`, `read_at`);


-- 2. Lab orders: the patient-request approval gate.
--    (migration 2024_01_06_000002_add_patient_request_flow_to_lab_orders_table)

ALTER TABLE `lab_orders`
  MODIFY `status` ENUM('pending_approval','requested','in_progress','completed','cancelled','declined')
  NOT NULL DEFAULT 'requested';

ALTER TABLE `lab_orders`
  ADD COLUMN `requested_by_user_id` BIGINT UNSIGNED NULL AFTER `requester_staff_id`,
  ADD COLUMN `request_reason` TEXT NULL AFTER `test_type`,
  ADD COLUMN `decision_note` TEXT NULL AFTER `request_reason`,
  ADD COLUMN `decided_at` DATETIME NULL AFTER `decision_note`,
  ADD COLUMN `decided_by_staff_id` BIGINT UNSIGNED NULL AFTER `decided_at`;

ALTER TABLE `lab_orders`
  ADD CONSTRAINT `lab_orders_requested_by_user_id_foreign`
    FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `lab_orders_decided_by_staff_id_foreign`
    FOREIGN KEY (`decided_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL;


-- 3. Tell Laravel these two migrations are already applied.
--    Both belong to ONE batch, which is what `php artisan migrate` would have
--    written — so the batch number is worked out once, up front, rather than
--    re-read between the two inserts (which would land them in two batches and
--    make a later `migrate:rollback` undo only half the release).

SET @next_batch := (SELECT COALESCE(MAX(`batch`), 0) + 1 FROM `migrations`);

INSERT INTO `migrations` (`migration`, `batch`) VALUES
  ('2024_01_06_000001_add_delivery_columns_to_notifications_table', @next_batch),
  ('2024_01_06_000002_add_patient_request_flow_to_lab_orders_table', @next_batch);


-- ---------------------------------------------------------------------------
-- VERIFY (run these after; both should return rows)
--
--   SHOW COLUMNS FROM `notifications` LIKE 'read_at';
--   SHOW COLUMNS FROM `lab_orders`    LIKE 'requested_by_user_id';
--   SHOW COLUMNS FROM `lab_orders`    LIKE 'status';   -- must list pending_approval
-- ---------------------------------------------------------------------------
