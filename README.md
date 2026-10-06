# Vite + Express + Better Auth + shadcn/ui

A minimal full-stack TypeScript starter:

- **Client**: [Vite](https://vite.dev) + React 19, [React Router](https://reactrouter.com), [Tailwind CSS v4](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com)
- **Server**: [Express 5](https://expressjs.com)
- **Auth**: [Better Auth](https://better-auth.com) with email + password, stored in Postgres
- **Database**: [Prisma 7](https://www.prisma.io) ORM on Postgres, run locally with Docker Compose

It ships sign-up, sign-in, sign-out, a protected dashboard route and an example protected API route (`GET /api/me`).

**New to coding?** Start with [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md): a step-by-step guide to building a product here with an AI agent. Agents follow [`AGENTS.md`](AGENTS.md).

## Getting started

```bash
pnpm install                      # also generates the Prisma client
cp .env.example .env              # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose up -d              # starts Postgres on POSTGRES_PORT (default 5432)
pnpm db:migrate                   # applies prisma/migrations (creates the auth tables)
pnpm dev
```

Open http://localhost:5173.

## How it fits together

```
browser ──► Vite dev server :5173 ──/api──► Express :3000 ──Prisma──► Postgres
                                              ├─ /api/auth/*  Better Auth handler
                                              └─ /api/*       your routes
```

- In development, Vite proxies `/api` to Express, so the client and auth cookies share one origin.
- In production, Express serves the built client from `dist/client` as well as the API, so it is still one origin.
- `BETTER_AUTH_URL` must be the URL the browser uses (the Vite port in dev, the public URL in production); requests from other origins are rejected.

## Scripts

| Script            | What it does                                                     |
| ----------------- | ---------------------------------------------------------------- |
| `pnpm dev`        | Runs Express (`tsx watch`) and Vite together                     |
| `pnpm build`      | Type-checks, builds the client to `dist/client` and the server to `dist/server` |
| `pnpm start`      | Runs the production build (`NODE_ENV=production`)                |
| `pnpm db:migrate` | Creates/applies Prisma migrations in dev (`prisma migrate dev`)  |
| `pnpm db:deploy`  | Applies pending migrations in production (`prisma migrate deploy`) |
| `pnpm db:generate`| Regenerates the Prisma client after editing the schema           |
| `pnpm db:studio`  | Opens Prisma Studio to browse the data                           |
| `pnpm auth:generate` | Syncs the Better Auth models into `prisma/schema.prisma`      |
| `pnpm typecheck`  | Type-checks client and server                                    |
| `pnpm lint`       | Lints with oxlint                                                |

## Project layout

```
prisma/
  schema.prisma     Database schema (auth models + your models)
  migrations/       SQL migrations, committed to git
prisma.config.ts    Prisma CLI config (reads DATABASE_URL)
server/
  auth.ts           Better Auth config (Prisma adapter, auth methods)
  db.ts             Shared Prisma client
  generated/        Generated Prisma client (gitignored)
  index.ts          Express app: auth handler, API routes, static client in production
  services/         Third-party API clients (example: weather.ts)
src/
  components/ui/    shadcn/ui components
  lib/auth-client.ts  Better Auth React client
  pages/            sign-in, sign-up, dashboard
  main.tsx          routes
```

## Extending

- **Protect an API route**: call `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`, as `GET /api/me` in `server/index.ts` does.
- **Add a social provider or plugin**: edit `server/auth.ts` (and add the matching client plugin in `src/lib/auth-client.ts`), then run `pnpm auth:generate` and `pnpm db:migrate` if it adds tables.
- **Call a third-party API**: put the client in `server/services/` and call it from an `/api` route; see `GET /api/weather` and `server/services/weather.ts` (Open-Meteo, no key needed). Keys go in `.env`.
- **Add UI components**: `pnpm dlx shadcn@latest add <component>`.
- **Database**: `docker-compose.yml` runs Postgres with its data in the `postgres-data` volume; `DATABASE_URL` must match the `POSTGRES_*` values. If port 5432 is taken, change `POSTGRES_PORT` and the port in `DATABASE_URL`.
- **Add a table**: add a model to `prisma/schema.prisma`, run `pnpm db:migrate --name <what-changed>`, and use it through `prisma` from `server/db.ts`. See `AGENTS.md` for a worked example.
