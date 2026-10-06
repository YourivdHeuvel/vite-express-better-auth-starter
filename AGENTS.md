# AGENTS.md

Guide for AI coding agents (and humans) working in this repo. Read it before changing anything.

The person you're working with may be a complete beginner following [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md). Explain what you did in plain language, keep changes small, and never assume they can spot a bug in the code themselves.

## What this is

A full-stack TypeScript starter: one repo, one origin.

```
browser ──► Vite dev server :5173 ──/api──► Express :3000 ──Prisma──► Postgres (Docker)
                                              ├─ /api/auth/*  Better Auth
                                              └─ /api/*       your routes ──► third-party APIs
```

- **Client** (`src/`): React 19 + Vite, React Router, Tailwind CSS v4, shadcn/ui (`base-nova` style, built on **Base UI**, not Radix).
- **Server** (`server/`): Express 5, run with `tsx` in dev.
- **Auth**: Better Auth, email + password, stored in Postgres through its Prisma adapter.
- **Database**: Postgres 18 from `docker-compose.yml`, accessed with **Prisma 7** (ORM + migrations).
- **Tooling**: pnpm, TypeScript (strict), oxlint.

## Setup (first time)

You need Node 22+, pnpm and Docker (OrbStack or Docker Desktop).

```bash
pnpm install                      # also generates the Prisma client (postinstall)
cp .env.example .env              # then set BETTER_AUTH_SECRET: openssl rand -base64 32
docker compose up -d              # starts Postgres
pnpm db:migrate                   # applies the migrations in prisma/migrations
pnpm dev                          # Express + Vite together
```

Open http://localhost:5173 and sign up.

### Ports already in use?

Other projects often use 3000, 5173 or 5432. Don't kill their processes; move this project instead:

- **Postgres**: set `POSTGRES_PORT=5436` (any free port) in `.env` **and** change the port in `DATABASE_URL` to match. Then `docker compose up -d` again.
- **App**: set `PORT` and `CLIENT_PORT` in `.env`, and set `BETTER_AUTH_URL` to `http://localhost:<CLIENT_PORT>`. Vite uses `strictPort`, so it fails instead of quietly moving to another port.

Check what's in use with `lsof -iTCP -sTCP:LISTEN -n -P | grep -E ':(3000|5173|5432)'`.

## Everyday commands

| Command                  | What it does                                       |
| ------------------------ | -------------------------------------------------- |
| `pnpm dev`               | Runs server + client with hot reload               |
| `docker compose up -d`   | Starts Postgres in the background                  |
| `docker compose down`    | Stops Postgres (data is kept)                      |
| `pnpm db:migrate`        | Creates + applies Prisma migrations (dev only)     |
| `pnpm db:deploy`         | Applies existing migrations (production/CI)        |
| `pnpm db:generate`       | Regenerates the Prisma client                      |
| `pnpm db:studio`         | Opens Prisma Studio, a browser UI for your data    |
| `pnpm auth:generate`     | Syncs Better Auth's models into the Prisma schema  |
| `pnpm typecheck`         | Type-checks client and server                      |
| `pnpm lint`              | Lints with oxlint                                  |
| `pnpm build`             | Production build into `dist/`                      |
| `pnpm start`             | Runs the production build                          |

## How to work on a task

Follow this loop for every feature or fix. It's the same loop the human sees in `docs/WORKFLOWS.md`.

1. **Clarify.** If the request is vague ("make it better"), ask one or two concrete questions or propose a small, specific first version. Build one small feature at a time.
2. **Plan.** For anything beyond a one-file change, say which files you'll touch and whether the database schema changes before writing code.
3. **Build.** Follow the best practices below. Schema changes go through `prisma/schema.prisma` + `pnpm db:migrate --name <change>`.
4. **Check.** `pnpm typecheck` and `pnpm lint` must pass.
5. **Test in a real browser** with `agent-browser` (see below), or delegate to the **`browser-tester`** subagent. API-only changes can be checked with `curl`, but anything visible must be clicked through.
6. **Review.** For non-trivial changes, run the **`code-reviewer`** subagent (or `/code-review`) and fix real findings. Before anything goes live, also run `/security-review`.
7. **Report** in plain language: what changed, how you tested it, anything left open. Offer to commit; don't commit or push unless asked.

**Only say "done" after steps 4 and 5 passed.** If you couldn't test something, say exactly what wasn't tested.

### Testing in the browser with agent-browser

`agent-browser` drives a real Chromium. Use an **isolated session** (this app only runs locally, so never use the user's own browser profile):

```bash
export AGENT_BROWSER_SESSION=app-test
agent-browser open http://localhost:5173/sign-up   # use CLIENT_PORT from .env
agent-browser snapshot -i                          # interactive elements with refs (@e4, @e5, …)
agent-browser fill @e4 "Test User"
agent-browser fill @e5 "test-$(date +%s)@example.com"
agent-browser fill @e6 "password1234"
agent-browser click @e7                            # Sign up → lands on the dashboard
agent-browser get url
agent-browser errors                               # must be empty
agent-browser screenshot /tmp/check.png            # then look at it
agent-browser close
```

- Refs go stale after navigation or re-render; run `snapshot -i` again before the next click.
- Add `--headed` to `open` when the user wants to watch.
- `agent-browser set viewport 390 844` checks the mobile layout.
- Run `agent-browser skills get core` for the full command guide.
- Delete throwaway test users afterwards if they clutter the user's data (`pnpm db:studio`, or ask).

### Subagents

Project subagents live in `.claude/agents/`. Use them for independent second opinions; they start with fresh context and don't edit code.

| Subagent          | Use it for                                                                   |
| ----------------- | ---------------------------------------------------------------------------- |
| `code-reviewer`   | Reviewing the diff for bugs, security holes and AGENTS.md violations          |
| `browser-tester`  | Clicking through a feature with agent-browser and reporting ✅/❌ with screenshots |

For a big change, run both **in parallel** (one message, two subagent calls): they don't depend on each other. Treat their reports as input: verify a finding before fixing it, and don't let a subagent's "looks good" replace your own browser check.

Other agents (Codex, Cursor) don't load `.claude/agents/`; they can read those files as checklists and do the same steps themselves.

## Where things go

```
prisma/
  schema.prisma       THE database schema: Better Auth models + your models
  migrations/         Generated SQL migrations. Commit them, never edit old ones
prisma.config.ts      Prisma CLI config (schema path, DATABASE_URL)
server/
  auth.ts             Better Auth config: Prisma adapter, auth methods, plugins
  db.ts               The shared Prisma client: `import { prisma } from './db.ts'`
  services/           One file per third-party API (example: weather.ts)
  generated/prisma/   Generated Prisma client. Gitignored, never edit
  index.ts            Express app: auth handler, API routes, static files in prod
src/
  main.tsx            All client routes
  pages/              One file per page (sign-in, sign-up, dashboard)
  components/         App components (auth-layout, protected-route)
  components/ui/      shadcn/ui components. Generated, so edit sparingly
  lib/auth-client.ts  Better Auth React client (signIn, signUp, signOut, useSession)
  lib/utils.ts        cn() helper for class names
docker-compose.yml    Postgres for local dev
docs/WORKFLOWS.md     Beginner guide: the build loop, prompts, troubleshooting
.claude/agents/       Subagents: code-reviewer, browser-tester
.env.example          Every env var the app reads, with comments
```

## Best practices

### Server and API

- **Every API route lives under `/api`.** The Vite proxy only forwards `/api`, and in production anything else falls through to the React app.
- **Protect routes by checking the session on the server.** Copy the pattern from `GET /api/me`:
  ```ts
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  ```
  Use `session.user.id` to decide whose data to read or write. Never trust a user id sent by the client.
- **Keep the Better Auth handler above `express.json()`** in `server/index.ts`. If `express.json()` comes first, it consumes the request body and auth breaks.
- **Validate request bodies** before using them (check types, required fields, lengths). Return `400` with a clear message when they're invalid.
- **Talk to the database through Prisma** (`prisma.note.findMany(...)`). If you really need raw SQL, use the tagged template ``prisma.$queryRaw`select ... where id = ${id}` ``, which escapes values. Never use `$queryRawUnsafe` with user input.
- When `server/index.ts` gets crowded, move routes into `server/routes/<thing>.ts` with an `express.Router()` and mount them in `index.ts`.
- Server imports use the `.ts` extension (`import { auth } from './auth.ts'`). The build rewrites them.

### Client

- **Add pages** in `src/pages/` and register the route in `src/main.tsx`. Wrap pages that need login in the `<ProtectedRoute />` group.
- **Call the API with relative URLs** (`fetch('/api/things')`). Never hard-code `http://localhost:3000`. Same-origin is what makes the auth cookies work.
- **Use the auth helpers** from `@/lib/auth-client` (`useSession`, `signIn`, `signOut`). Don't write your own fetch calls to `/api/auth/*`.
- **Add UI components with the CLI**: `pnpm dlx shadcn@latest add dialog`. They land in `src/components/ui/`. Reuse them before writing custom UI.
- **Style with Tailwind classes** and the theme variables in `src/index.css` (`bg-background`, `text-muted-foreground`, …). Use `cn()` to merge class names.
- **Import with the `@/` alias** (`@/components/ui/button`), not long `../../` paths.
- Show errors to users with `toast` from `sonner`. Don't swallow errors silently.
- These components use **Base UI** (`@base-ui/react`), not Radix. Radix-only props such as `asChild` don't exist here. Base UI uses a `render` prop instead. Check the generated component before guessing its API.

### Database (Prisma)

**What is Prisma?** Prisma is the layer between the code and Postgres. You describe your tables once in `prisma/schema.prisma`, and Prisma then:

1. **writes the SQL migrations** that create or change those tables (`pnpm db:migrate`), and
2. **generates a fully typed client** (`prisma`), so `prisma.note.findMany()` autocompletes and TypeScript catches typos in field names.

So the schema file is the single source of truth. You never create tables by hand.

**How it's wired here:**

- `prisma/schema.prisma` holds the models. Better Auth's tables (`User`, `Session`, `Account`, `Verification`) live there too, next to yours.
- `server/db.ts` creates **one** `PrismaClient` (Prisma 7 uses the `@prisma/adapter-pg` driver). Import it from there everywhere.
- `server/auth.ts` hands that client to Better Auth via `prismaAdapter`, so auth and your code share one connection pool.
- `prisma.config.ts` tells the Prisma CLI where the schema and migrations are and reads `DATABASE_URL` from `.env`.
- The client is generated into `server/generated/prisma` (gitignored). `pnpm install` and `pnpm build` regenerate it automatically.

**Recipe: add a table (example: notes per user)**

1. Add a model to `prisma/schema.prisma`, and add the back-relation on `User`:
   ```prisma
   model User {
     // ...existing fields...
     notes Note[]
   }

   model Note {
     id        String   @id @default(cuid())
     title     String
     createdAt DateTime @default(now())
     userId    String
     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

     @@index([userId])
   }
   ```
2. Create and apply the migration. Give it a name that describes the change:
   ```bash
   pnpm db:migrate --name add-notes
   ```
   This writes `prisma/migrations/<timestamp>_add-notes/migration.sql`, applies it, and regenerates the client.
3. Use it in a route, **always scoped to the logged-in user**:
   ```ts
   import { prisma } from './db.ts'

   app.get('/api/notes', async (req, res) => {
     const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
     if (!session) {
       res.status(401).json({ error: 'Unauthorized' })
       return
     }
     const notes = await prisma.note.findMany({
       where: { userId: session.user.id },
       orderBy: { createdAt: 'desc' },
     })
     res.json(notes)
   })
   ```
4. Commit `schema.prisma` **and** the new migration folder together.

**Changing an existing table** works the same way: edit the model, run `pnpm db:migrate --name <what-changed>`, and commit. If Prisma warns about data loss (dropping a column, making a field required), stop and decide on purpose. Adding a required field to a table that already has rows needs a `@default(...)` or a two-step migration.

**Better Auth and the schema:** after you add a Better Auth plugin or change auth options in `server/auth.ts`, run `pnpm auth:generate` (updates the auth models in `schema.prisma`, keeps your models and your extra fields) and then `pnpm db:migrate --name <plugin-name>`.

**Production:** run `pnpm db:deploy` (applies committed migrations, never creates new ones) before starting the new version.

**Data lives** in the `postgres-data` Docker volume. It survives `docker compose down` but **not** `docker compose down -v`. Browse it with `pnpm db:studio`.

### Third-party APIs (weather, payments, AI, email, …)

**Working example:** `GET /api/weather` in `server/index.ts` calls the free [Open-Meteo](https://open-meteo.com) API through `server/services/weather.ts`. Copy that pattern:

```
browser ──fetch('/api/weather')──► Express route ──► server/services/weather.ts ──► api.open-meteo.com
           (no keys here)          (auth + validation)   (URL, key, timeout, mapping)
```

1. **Call external APIs from the server, never from `src/`.** The browser calls your `/api/...` route; the route calls the service. That's the only way to keep an API key secret, and it lets you check the user is logged in first.
2. **One file per service in `server/services/`** (`weather.ts`, `stripe.ts`, `openai.ts`). It owns the base URL, the key, the timeout and the response mapping. Routes just call `getCurrentWeather(lat, lon)`.
3. **Prefer the official SDK** when the service has one (`pnpm add stripe`, `pnpm add openai`). Use plain `fetch` (built into Node) when it doesn't.
4. **Always set a timeout** (`signal: AbortSignal.timeout(5000)`) and **check `res.ok`**. Other people's servers are slow and fail.
5. **Map the response to your own type.** The rest of the app shouldn't know the provider's field names, so switching providers stays a one-file change.
6. **Handle failures in the route:** log the real error with `console.error`, return a generic message with status `502`. Never send the provider's raw error (it can contain keys or internals) to the browser.
7. **Validate input** before passing it on (numbers in range, strings not empty or huge).
8. **Protect paid APIs.** Require a session, and think about limits (per user, per minute). An open endpoint that calls a paid AI API is a credit-card drain.
9. **Cache when the data doesn't change often** (weather, exchange rates): store the result for a few minutes instead of calling on every request. Respect the provider's rate limits.

**With an API key** (most services), the service file reads it from the environment:

```ts
// server/services/example.ts
const API_KEY = process.env.EXAMPLE_API_KEY

export async function getThing(id: string) {
  if (!API_KEY) throw new Error('EXAMPLE_API_KEY is not set')
  const res = await fetch(`https://api.example.com/v1/things/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`Example API responded ${res.status}`)
  return (await res.json()) as { id: string; name: string }
}
```

Then add `EXAMPLE_API_KEY=` (empty, with a comment on where to get it) to `.env.example`, put the real key in `.env` only, and restart `pnpm dev` (env files are read at startup). Tell the user exactly which variable to fill in and where to get the key; don't ask them to paste it into the chat.

**Webhooks** (the service calls *you*, e.g. Stripe "payment succeeded"): add a route under `/api/webhooks/<service>`, **verify the signature** with the provider's SDK before trusting the body, and mount it above `express.json()` if the provider needs the raw body for verification (Stripe does). In local dev the provider can't reach `localhost`; use the provider's CLI (`stripe listen`) or a tunnel.

### Environment variables

- Every new variable goes in **`.env.example` too**, with a comment and a safe placeholder value. `.env` is for real values and is gitignored.
- The server reads `.env` through `--env-file`. The client can only read variables that start with `VITE_`, and those end up **public** in the browser bundle.

## Don't do this

- ❌ **Don't commit `.env`** or paste secrets (API keys, `BETTER_AUTH_SECRET`, database passwords) into code, README or chat. Put them in `.env` only.
- ❌ **Don't put secrets in `VITE_*` variables.** Anyone can read them in the browser.
- ❌ **Don't call third-party APIs that need a key from `src/`.** Go through a server route and `server/services/`.
- ❌ **Don't log API keys or full request headers**, and don't send a provider's raw error message to the browser.
- ❌ **Don't trust a webhook without verifying its signature.**
- ❌ **Don't rely on hiding things in the UI for security.** `ProtectedRoute` only redirects. The real check is `getSession` on the server, on every protected route.
- ❌ **Don't hard-code `localhost` URLs or ports** in client code. Use relative `/api/...` paths.
- ❌ **Don't mount routes outside `/api`** (except the production static fallback that's already there).
- ❌ **Don't move `express.json()` above the auth handler.**
- ❌ **Don't kill other projects' processes or containers** to free a port. Change this project's ports in `.env`.
- ❌ **Don't run `docker compose down -v`** unless you really want to wipe the database.
- ❌ **Don't change the database by hand** (`psql`, a GUI, `prisma db push`). Every change goes through `schema.prisma` + `pnpm db:migrate`, or the next person's database won't match yours.
- ❌ **Don't edit or delete migrations that are already committed.** Make a new migration that fixes things.
- ❌ **Don't run `prisma migrate reset` or `prisma migrate dev` against a production database.** Production only gets `pnpm db:deploy`.
- ❌ **Don't create a `new PrismaClient()` anywhere else.** Import `prisma` from `server/db.ts`. Extra clients each open their own connection pool.
- ❌ **Don't import Prisma (or anything from `server/`) in `src/`.** The browser can't reach the database; go through an `/api` route.
- ❌ **Don't edit `server/generated/`.** It's overwritten on every `prisma generate`.
- ❌ **Don't query user data without a `where: { userId: session.user.id }`** (or equivalent). Otherwise one user can read another user's data.
- ❌ **Don't upgrade Prisma to v8 yet.** Better Auth supports Prisma up to 7.
- ❌ **Don't edit `node_modules`, `dist/`, `server/generated/` or `pnpm-lock.yaml` by hand.** Use `pnpm add` / `pnpm remove`.
- ❌ **Don't use npm or yarn.** This is a pnpm project, and mixing lockfiles causes chaos.
- ❌ **Don't add a second UI library, CSS framework or router.** Use shadcn/ui, Tailwind and React Router.
- ❌ **Don't silence TypeScript** with `any`, `@ts-ignore` or `!` to make errors go away. Fix the type.
- ❌ **Don't rewrite or reformat files you weren't asked to touch.** Keep changes small and focused.
- ❌ **Don't say "done" without running `pnpm typecheck` and `pnpm lint`** and checking the change in the browser.
- ❌ **Don't make a test pass by weakening it**: no deleting checks, skipping tests or `@ts-ignore` to get green.
- ❌ **Don't drive the user's personal browser profile** to test this app. Use an isolated `agent-browser` session.
- ❌ **Don't build several features in one go.** One feature, tested and reviewed, then offer to commit.

## Troubleshooting

| Symptom                                          | Likely cause and fix                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `Port 5173 is already in use`                    | Another app uses it. Set `CLIENT_PORT` and `BETTER_AUTH_URL` in `.env`.               |
| `ECONNREFUSED ...:5432` / auth returns 500       | Postgres isn't running (`docker compose up -d`) or `DATABASE_URL` has the wrong port.  |
| `relation "user" does not exist`                 | Tables are missing. Run `pnpm db:migrate`.                                            |
| `Cannot find module './generated/prisma/client'` | Client not generated yet. Run `pnpm db:generate`.                                     |
| `Property 'note' does not exist on PrismaClient` | Schema changed but the client is stale. Run `pnpm db:migrate` or `pnpm db:generate`.  |
| Prisma says "drift detected" / wants to reset    | Someone changed the DB by hand. Locally it's fine to accept the reset (wipes local data); **never** on production. |
| Sign-in returns 403 / "invalid origin"           | `BETTER_AUTH_URL` doesn't match the URL in your browser bar.                          |
| `/api/...` returns the React page or 404 in dev  | Route isn't under `/api`, or Express isn't running (check the `[server]` log lines).  |
| `/api/me` returns 401 while logged in            | Request went to a different origin. Use relative URLs so the cookie is sent.          |
