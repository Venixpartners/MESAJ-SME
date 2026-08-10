-- Adds Campaign.autoApproved: true for campaigns that skipped human
-- review because their message passed every NCC hard-fail check at
-- submit time (see lib/campaignCompliance.ts and the shared
-- claimCampaignForSending() in lib/campaignSendProcessor.ts, used by
-- both the admin-approve route and the new auto-approve path in
-- /api/campaigns/submit).
--
-- IF NOT EXISTS / re-runnable in the same spirit as the CAC document
-- migration — safe to apply more than once.
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "autoApproved" BOOLEAN NOT NULL DEFAULT false;
