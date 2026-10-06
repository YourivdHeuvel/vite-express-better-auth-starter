# Building a product with this starter: a step-by-step guide

This guide assumes you know **nothing**. You'll describe what you want in plain English, an AI coding agent (Claude Code, Codex, Cursor, …) writes the code, and you check the result. The guide shows you how to do that safely, one small step at a time.

> The AI reads `AGENTS.md` automatically. That file holds the technical rules. This file is for **you**.

---

## 1. The 2-minute mental model

Your app has four parts:

| Part         | What it is                                          | Where it lives        |
| ------------ | --------------------------------------------------- | --------------------- |
| **Frontend** | The pages people see and click (React)               | `src/`                |
| **Backend**  | The server that handles requests and rules (Express)| `server/`             |
| **Database** | Where data is stored permanently (Postgres)          | Docker container      |
| **Prisma**   | The translator between the backend and the database | `prisma/`             |

Login and sign-up already work (Better Auth). You build *your* product on top.

**The golden rule:** the frontend never talks to the database directly. It asks the backend (`/api/...`), and the backend checks *who you are* before touching any data.

---

## 2. One-time setup

Install these once per computer:

1. **Node.js 22+**: https://nodejs.org (pick "LTS").
2. **pnpm**: in a terminal: `npm install -g pnpm`
3. **Docker**: [OrbStack](https://orbstack.dev) (Mac, recommended) or [Docker Desktop](https://www.docker.com/products/docker-desktop/). Open it once so it's running.
4. **An AI coding agent**, e.g. [Claude Code](https://claude.com/claude-code): `npm install -g @anthropic-ai/claude-code`
5. **agent-browser** (lets the AI test your app in a real browser): `npm install -g agent-browser && agent-browser install`

Then, in the project folder:

```bash
pnpm install
cp .env.example .env
```

Open `.env` and replace `change-me` after `BETTER_AUTH_SECRET=` with the output of `openssl rand -base64 32`. Then:

```bash
docker compose up -d     # start the database
pnpm db:migrate          # create the tables
```

> 💡 **Lazy option:** start your agent in this folder and say: *"Set this project up for me following AGENTS.md and tell me when the app is running."*

---

## 3. Every day: start working

```bash
docker compose up -d     # database (skip if already running)
pnpm dev                 # the app
```

Open http://localhost:5173. Leave that terminal running. Start your AI agent in a **second** terminal (`claude`).

If something says "port already in use", tell the agent: *"Port X is in use, move this project to a free port as AGENTS.md describes."*

---

## 4. The build loop (do this for every feature)

This is the whole method. Repeat it for every feature, however small.

```
 ① Describe  →  ② Plan  →  ③ Build  →  ④ Test in browser  →  ⑤ Review  →  ⑥ Save (commit)
      ↑                                                                            │
      └──────────────────────────── next feature ─────────────────────────────────┘
```

### ① Describe ONE small feature

Small is the secret. "Build me a CRM" fails; "let logged-in users add a contact with a name and email, and see their list" works.

Good feature description template:

> **Feature:** Users can save notes.
> **Who:** Only logged-in users, and they only see their own notes.
> **Screens:** A "Notes" page with a text box, an "Add" button and a list of notes, newest first. A delete button on each note.
> **Data:** A note has a title and a created date.
> **Done when:** I can add, see and delete notes, and another user can't see mine.

### ② Ask for a plan first

Don't let the agent write code straight away. In Claude Code, press **Shift+Tab** until you see **plan mode**, then paste your description and add:

> *"Make a plan first. Follow AGENTS.md. Tell me which files you'll change and whether the database changes."*

Read the plan. If it does something you didn't ask for, say so. When it looks right, approve it.

### ③ Let it build

The agent writes the code. For database changes it will edit `prisma/schema.prisma` and run `pnpm db:migrate`. That's expected.

When it says it's done, ask:

> *"Did `pnpm typecheck` and `pnpm lint` pass?"*

### ④ Test it in a real browser

Two ways, do both:

**You click through it yourself** at http://localhost:5173. Try the normal way, then try to break it: empty fields, very long text, refresh the page, the back button.

**The AI clicks through it** with agent-browser:

> *"Use the browser-tester agent to test the notes feature: add, list and delete notes, and check that a second user can't see the first user's notes."*

It opens a browser, fills in forms, takes screenshots and reports ✅/❌ per step. Paste any ❌ back to the agent: *"Fix these."*

<details>
<summary>What agent-browser does under the hood (optional)</summary>

```bash
export AGENT_BROWSER_SESSION=app-test        # separate test browser, not your own
agent-browser open http://localhost:5173/sign-up
agent-browser snapshot -i                    # lists the buttons/inputs with refs like @e4
agent-browser fill @e4 "Test User"
agent-browser fill @e5 "test@example.com"
agent-browser fill @e6 "password1234"
agent-browser click @e7                      # "Sign up"
agent-browser get url                        # → http://localhost:5173/ (the dashboard)
agent-browser errors                         # any JavaScript errors?
agent-browser screenshot /tmp/after-signup.png
agent-browser close
```

Add `--headed` to `open` if you want to *watch* the browser do it.
</details>

### ⑤ Get a second opinion (code review)

AI writes bugs too, especially security bugs that don't show up when you click around. Before saving, ask a **separate** agent to review. It starts fresh, so it isn't biased by having written the code:

> *"Use the code-reviewer agent to review my changes."*

Other built-in review commands in Claude Code:

| Command            | What it does                                                    |
| ------------------ | --------------------------------------------------------------- |
| `/code-review`     | Looks for bugs in your current changes                          |
| `/security-review` | Focuses on security holes (do this before going live)           |
| `/simplify`        | Cleans up messy or duplicated code (doesn't hunt bugs)          |

Then: *"Fix the high and medium findings."* Then go back to ④ briefly to check nothing broke.

### ⑥ Save your progress (commit)

A commit is a save point you can always go back to. Commit after **every** working feature:

> *"Commit these changes with a clear message."*

Or yourself:

```bash
git add -A
git commit -m "Add notes: create, list, delete"
```

Now start the next feature at ①. To keep the AI focused, type `/clear` between unrelated features.

---

## 5. Using other services (third-party APIs)

Most products use other companies' services: payments (Stripe), AI (Claude, OpenAI), email (Resend), maps, weather… You talk to them through their **API**: your server sends a request, they send data back.

**There's a working example in this project:** log in, then open http://localhost:5173/api/weather. You'll see the current weather in Amsterdam, fetched from the free [Open-Meteo](https://open-meteo.com) service. Try `/api/weather?lat=40.71&lon=-74.01` for New York.

How it flows:

```
Your page  ──►  your server (/api/weather)  ──►  Open-Meteo
           ◄──  clean result                ◄──  raw data
```

Why the detour through your server? Because most services give you a secret **API key** (like a password that costs money if stolen). Anything in the frontend can be read by every visitor; the server is the only safe place for it.

### Adding a service that needs a key, step by step

1. **Sign up** on the service's website and create an API key (look for "API keys" or "Developers" in their dashboard).
2. **Ask the agent** to set it up, *without* giving it the key:
   > *"I want to use <service> to <do what>. Their docs are at <link>. Add it following the third-party API pattern in AGENTS.md, use an env var for the key, and tell me which variable to fill in."*
3. **Paste the key yourself** into `.env` (e.g. `RESEND_API_KEY=re_123…`). Never in the chat, never in code.
4. **Restart** `pnpm dev` (stop it with Ctrl+C, start it again) so the server picks up the new key.
5. **Test** it through the build loop (④ browser test, ⑤ review) like any feature.

> 💸 **Paid services:** set a spending limit in the service's dashboard *before* you start. A bug that calls an AI API in a loop can get expensive fast.

**Prompts that work:**

| You want…                                 | Say this                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Show the weather on the dashboard          | *"Show the weather from /api/weather as a card on the dashboard, with a loading and error state."* |
| Send a welcome email                       | *"When someone signs up, send a welcome email with Resend. Key goes in RESEND_API_KEY."*        |
| Add an AI feature                          | *"Add an endpoint that summarizes a note with Claude. Only logged-in users, max 20 calls per user per day."* |
| Take payments                              | *"Add a Stripe Checkout page for a €10 one-time payment, with a webhook that marks the user as paid."* |

---

## 6. Ready-to-copy prompts

| You want to…                     | Say this                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| Add a page                       | *"Add a Settings page at /settings, only for logged-in users, linked from the dashboard header."* |
| Store new data                   | *"Add a Project model (name, description, owner = current user) with a migration and API routes to create, list, update and delete my projects."* |
| Show data on a page              | *"Show my projects on the dashboard as cards, newest first, with an empty state when there are none."* |
| Add a UI component               | *"Add a confirmation dialog before deleting a project. Use the shadcn dialog component."*          |
| Change the look                  | *"Make the dashboard use a two-column layout on desktop and one column on mobile."*                |
| Add Google login                 | *"Add Google sign-in with Better Auth. Tell me which env vars I need to fill in."*                 |
| Understand code                  | *"Explain what `server/index.ts` does as if I'm new to programming."*                              |
| Something's broken               | *"When I click Save I get this error: <paste error>. Find the cause and fix it, then test it in the browser."* |
| Look at the data                 | Run `pnpm db:studio`. It opens a browser UI showing every table.                                   |

---

## 7. When things go wrong

**The app shows an error or a blank page.**
Copy the error from the terminal running `pnpm dev` (or the browser's console: right-click → Inspect → Console) and paste it to the agent.

**The agent made a mess and you want to go back.**
- Not committed yet, and you want to undo the agent's last steps: in Claude Code press **Esc twice** to rewind.
- Throw away *all* changes since the last commit: tell the agent *"discard all uncommitted changes"* (it will ask you to confirm; this can't be undone).
- Go back to an older commit: *"show me the last 10 commits"*, then *"undo the commit about X"*.

**The agent keeps going in circles.**
Stop it (Esc), type `/clear`, and describe the problem again from scratch in one message, including the exact error text.

**Database problems** ("relation does not exist", "can't reach database").
Is Docker running? Then `docker compose up -d` and `pnpm db:migrate`. Still stuck: *"Diagnose the database setup following the troubleshooting table in AGENTS.md."*

---

## 8. Never do this

- ❌ Paste passwords, API keys or the contents of `.env` into the chat or into code. Put them in `.env` only.
- ❌ Use a paid API without a spending limit set in its dashboard.
- ❌ Accept a huge change you don't understand. Ask *"explain what you changed and why, in plain language"*.
- ❌ Skip testing because "the AI said it works". It's often wrong.
- ❌ Build five features before committing. One feature, one commit.
- ❌ Run `docker compose down -v`. It deletes your database.
- ❌ Run commands the AI suggests against a *live/production* database unless you know exactly what they do.
- ❌ Let the AI "fix" an error by deleting the test, disabling the check or adding `@ts-ignore`. Ask for the real fix.

---

## 9. Going live (short version)

When you want real users, ask your agent:

> *"Help me deploy this app. I want Postgres hosted at <provider>. Walk me through it step by step and run `/security-review` first."*

Things the agent must handle (they're in `AGENTS.md` too): set real env vars on the server (new `BETTER_AUTH_SECRET`, real `BETTER_AUTH_URL`, `DATABASE_URL`), run `pnpm build`, run `pnpm db:deploy` (never `db:migrate`) against the live database, then `pnpm start`.

---

## Glossary

- **API / endpoint / route**: a URL on the backend the frontend calls, like `/api/notes`.
- **Third-party API**: another company's service your server talks to (weather, payments, AI).
- **API key**: a secret password for a third-party API. Lives in `.env`, never in the frontend.
- **Webhook**: the reverse: a third-party service calling *your* server when something happens (e.g. "payment succeeded").
- **Commit**: a saved snapshot of the code you can go back to.
- **Migration**: a file that changes the database structure (adds a table or column). Created by `pnpm db:migrate`.
- **Model (Prisma)**: the description of one table, e.g. `Note`, in `prisma/schema.prisma`.
- **Session**: proof that someone is logged in; the backend checks it on every protected request.
- **Subagent**: a separate AI helper with one job (review, test), started by your main agent.
- **`.env`**: a private file with secrets and settings. Never shared, never committed.
- **Typecheck / lint**: automatic checks that catch many mistakes before you even run the app.
