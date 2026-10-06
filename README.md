# Vite + Express + Better Auth + shadcn/ui

A minimal full-stack TypeScript starter:

- **Client**: [Vite](https://vite.dev) + React 19, [React Router](https://reactrouter.com), [Tailwind CSS v4](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com)
- **Server**: [Express 5](https://expressjs.com)
- **Auth**: [Better Auth](https://better-auth.com) with email + password, stored in SQLite (`better-sqlite3`)

It ships sign-up, sign-in, sign-out, a protected dashboard route and an example protected API route (`GET /api/me`).

## Getting started

```bash
pnpm install
cp .env.example .env              # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm db:migrate                   # creates the Better Auth tables in sqlite.db
pnpm dev
```

Open http://localhost:5173.

## How it fits together

```
browser ──► Vite dev server :5173 ──/api──► Express :3000
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
| `pnpm db:migrate` | Applies the Better Auth schema to the database                   |
| `pnpm typecheck`  | Type-checks client and server                                    |
| `pnpm lint`       | Lints with oxlint                                                |

## Project layout

```
server/
  auth.ts           Better Auth config (database, auth methods)
  index.ts          Express app: auth handler, API routes, static client in production
src/
  components/ui/    shadcn/ui components
  lib/auth-client.ts  Better Auth React client
  pages/            sign-in, sign-up, dashboard
  main.tsx          routes
```

## Extending

- **Protect an API route**: call `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`, as `GET /api/me` in `server/index.ts` does.
- **Add a social provider or plugin**: edit `server/auth.ts` (and add the matching client plugin in `src/lib/auth-client.ts`), then run `pnpm db:migrate` again if it adds tables.
- **Add UI components**: `pnpm dlx shadcn@latest add <component>`.
- **Switch database**: replace the `better-sqlite3` instance in `server/auth.ts` with a Postgres/MySQL pool or a Drizzle/Prisma adapter — see the [Better Auth database docs](https://better-auth.com/docs/concepts/database).
