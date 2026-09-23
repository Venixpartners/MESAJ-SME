-- Campaign.segmentCount: how many SMS parts the message body encodes to,
-- captured at submit time. Billing moves to per part per recipient, and
-- refunds read this back so they can never disagree with the charge.
--
-- Default 1 is correct for every existing row: they were charged once per
-- recipient regardless of length, which is exactly what a one part
-- campaign costs under the new rule. Nothing is repriced retroactively.
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "segmentCount" INTEGER NOT NULL DEFAULT 1;
