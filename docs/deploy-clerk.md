# Clerk setup for onboarding and GitHub repos

Complete these steps in the [Clerk Dashboard](https://dashboard.clerk.com/) for your application.

## Organizations (districts)

1. Open **Organizations** and enable organizations.
2. Choose roles your app needs (e.g. `admin`, `member`) or use defaults.

## GitHub OAuth

1. Open **User & Authentication** → **Social connections** → **GitHub**.
2. Enable GitHub and add a GitHub OAuth App (or use Clerk’s shared credentials in development).
3. Under **Scopes**, request at least what you need to list repositories:
   - `read:user`
   - `repo` (private repos) or `public_repo` (public only)

Users must **link GitHub** to their Clerk account (sign in with GitHub or add GitHub from **User profile** → **Connected accounts**) before `/api/repos` can return data.

## Environment variables (Vercel and local)

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Next.js client (public) |
| `CLERK_SECRET_KEY` | Server only — never expose to the client |
| `DATABASE_URL` | API routes (and Drizzle if `DATABASE_DIRECT_URL` is unset) |
| `DATABASE_DIRECT_URL` | Optional: direct Postgres URL for `drizzle-kit` migrations (recommended for Supabase — see [deploy-supabase.md](./deploy-supabase.md)) |

After changing GitHub scopes, users may need to **re-authorize** GitHub in Clerk.

## Local development

1. Start Postgres (e.g. `docker compose up -d`) and set `DATABASE_URL` in `.env.local`. For Supabase in production, see [deploy-supabase.md](./deploy-supabase.md).
2. Apply schema: `npm run db:migrate` (or `npm run db:push` during early development).
3. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local` (same values as Clerk dashboard).
4. Run the app: `npm run dev` — App Router serves pages and `/api/*` routes on the same origin.
