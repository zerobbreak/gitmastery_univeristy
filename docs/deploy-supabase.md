# Supabase + Vercel deployment

Use [Supabase](https://supabase.com) for hosted Postgres in production. Your app already uses `DATABASE_URL` with Drizzle and `pg`; you only need the right URLs and env vars.

## 1. Create the Supabase project

1. In the [Supabase Dashboard](https://supabase.com/dashboard), create a project and pick a region close to your Vercel region.
2. Wait until the database is **Healthy**.

## 2. Connection strings (two roles)

Supabase exposes several connection modes. For this stack:

| Use | String | When |
|-----|--------|------|
| **App runtime** (Vercel, serverless) | **Pooler** → **Transaction** mode (port **6543**) | `DATABASE_URL` in Vercel. Add `pgbouncer=true` so the pooler behaves well with `pg`. |
| **Migrations** (`npm run db:migrate`, `drizzle-kit`) | **Direct** connection to the DB host (port **5432**) or **Session** pooler | `DATABASE_DIRECT_URL` in `.env.local` **on your machine** (or CI). Avoid running DDL through Transaction pooler when possible. |

In **Project Settings → Database**:

- **Connection string → URI** (direct, port 5432) → copy for local migrations as `DATABASE_DIRECT_URL`.
- **Connection pooling → Transaction mode** (port 6543) → copy for production `DATABASE_URL`.

Append query params as needed, for example:

- Transaction pooler (Vercel):  
  `...?pgbouncer=true&sslmode=verify-full`
- Direct (migrations):  
  `...?sslmode=verify-full` (use `verify-full`, not `require`, to avoid Node `pg` SSL deprecation warnings)

Replace `[YOUR-PASSWORD]` with the database password from the same settings page.

## 3. Local environment (optional Supabase for dev)

Keep using Docker Postgres locally (see `.env.example`), or point `.env.local` at Supabase using the same rules: pooler URL for the app if you want; direct URL for `DATABASE_DIRECT_URL` when you run migrations.

## 4. Run migrations against Supabase

From your machine (or a GitHub Action with secrets):

1. Set `DATABASE_DIRECT_URL` to the **direct** `postgresql://...@db.<project-ref>.supabase.co:5432/postgres?sslmode=verify-full` URL (or Session pooler if you prefer).
2. Ensure `DATABASE_URL` is also set (drizzle-kit still loads `.env.local`; `drizzle.config.ts` prefers `DATABASE_DIRECT_URL` when present for migrate).
3. Run:

```bash
npm run db:migrate
```

Apply this once per new environment (staging, production) before traffic hits the app.

## 5. Vercel

1. Import the Git repo in [Vercel](https://vercel.com).
2. **Environment variables** (Production / Preview as needed):

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | Transaction pooler URI (`:6543`) with `pgbouncer=true` and `sslmode=verify-full` |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk |
   | `CLERK_SECRET_KEY` | From Clerk |
   | Other keys | See `.env.example` and [deploy-clerk.md](./deploy-clerk.md) |

3. Do **not** put `DATABASE_DIRECT_URL` in Vercel unless you run migrations from Vercel (unusual); migrate from CI or your laptop instead.

4. Deploy. The app uses a small connection pool suitable for serverless (`db/index.ts`).

## 6. Clerk URLs on production

In the Clerk dashboard, add your Vercel domain to **Allowed origins** and **Redirect URLs** (e.g. `https://your-app.vercel.app` and `https://your-domain.com`).

## Troubleshooting

- **SSL errors**: Connection strings should include `sslmode=verify-full` (preferred over `require` with current Node `pg`). Non-local pools in `db/index.ts` enable TLS for cloud hosts.
- **Too many connections**: On Vercel, pool size defaults to `1` per instance when `VERCEL` is set; override with `DATABASE_POOL_MAX` if you know what you’re doing.
- **Prepared statement errors** with the pooler: Ensure `pgbouncer=true` is on the **Transaction** pooler URL used by the app.
