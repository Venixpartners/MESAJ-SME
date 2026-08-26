-- Closes a Supabase Security Advisor finding: "RLS Disabled in Public" on
-- public._prisma_migrations.
--
-- This table isn't part of schema.prisma (it's created and managed
-- entirely by Prisma itself to track which migrations have run — names,
-- timestamps, checksums; no application/tenant data), so it was simply out
-- of scope for prisma/migrations/20260727100000_enable_row_level_security,
-- which only covers this project's own models.
--
-- Same "internal/operational table" pattern that migration already uses
-- for RateLimitHit / AdminAuditLog / PortedNumberOverride: RLS enabled,
-- zero policies added below. That means default-deny for Supabase's
-- anon/authenticated roles (closing the public-read gap Advisor flagged),
-- while Prisma's own connection (DATABASE_URL, which bypasses RLS as the
-- table-owning role on Supabase — see verify-rls.ts) is completely
-- unaffected, so `prisma migrate deploy` keeps working exactly as before.
--
-- FORCE ROW LEVEL SECURITY is deliberately NOT used, for the same reason
-- the original RLS migration avoids it: that would apply RLS even to the
-- table owner, which is the role Prisma migrates as, and would break
-- migrations.
-- Guarded with a table-existence check: on the real database this
-- migration is meant for, _prisma_migrations obviously already exists
-- (migrations have been running there). But CI's migration-check job
-- replays every migration from scratch against a throwaway shadow
-- database via `prisma migrate diff`, which applies these migration.sql
-- files as raw SQL without going through Prisma's normal bookkeeping that
-- creates _prisma_migrations first — so an unconditional ALTER TABLE here
-- fails there with "relation does not exist" even though it's correct
-- against the real target. This DO block makes it a no-op in that
-- shadow-DB context while still applying for real everywhere the table
-- actually exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = '_prisma_migrations'
  ) THEN
    EXECUTE 'ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
