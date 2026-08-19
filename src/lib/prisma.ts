import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 removed the bundled Rust query engine in favor of driver
// adapters — `new PrismaClient()` with no arguments is no longer valid,
// it must be given an `adapter` (or `accelerateUrl`). We use the
// Postgres driver adapter here since this project connects directly to
// Supabase's Postgres via DATABASE_URL.
//
// Note: prisma.config.ts is a *separate*, CLI-only configuration (used by
// `prisma generate`/`migrate`) and is not read at runtime — the adapter
// below is what the running app actually connects through.
//
// SSL: the old Rust engine accepted Supabase's certificate by default;
// the node-pg adapter is stricter and can reject it (P1010 / self-signed
// certificate errors) unless told not to verify it. Supabase's pooled
// connection is already TLS-terminated at their edge, so this is safe —
// but ONLY for Supabase. A local/CI Postgres container (docker-compose,
// GitHub Actions services.postgres, etc.) has no TLS listener at all, and
// forcing ssl there fails with "the server does not support SSL
// connections". So: force ssl for everything except localhost/127.0.0.1.
function isLocalDatabase(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

// max: on Vercel each concurrent request can land on a separate serverless
// instance, and each instance gets its OWN pg Pool — `pg`'s default max
// (10) meant a handful of concurrent instances could open 30-40+ real
// Postgres connections between them. Supabase's pooler (especially Session
// Mode, pool_size 15 on smaller tiers) can't absorb that and starts
// rejecting new clients with EMAXCONNSESSION.
//
// Capping max here to a small number means one instance holds only 1-2
// slots; the pooler (must be Supabase's Transaction Mode pooler, port
// 6543 — see .env.example) is what multiplexes across all the concurrent
// instances, not this pool. Don't raise this without also confirming the
// pooler mode/size can take it.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ...(isLocalDatabase(process.env.DATABASE_URL) ? {} : { ssl: { rejectUnauthorized: false } }),
});

// Standard Next.js singleton pattern to avoid exhausting DB connections
// during dev-mode hot reloads.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
