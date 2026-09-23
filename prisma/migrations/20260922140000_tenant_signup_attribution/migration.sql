-- Records which campaign produced a signup. Written once, when
-- /api/onboarding creates the Tenant, from a first party cookie set on
-- the public pages (see src/lib/attribution.ts).
--
-- All nullable with no default: existing tenants signed up before this
-- existed and genuinely have no known source, which is different from
-- "arrived directly". IF NOT EXISTS for the same reason as the earlier
-- migrations here, so re-running is harmless.
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "utmContent" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "adClickId" TEXT;
