# Support Ticket Dashboard

A compact full-stack support ticket dashboard: view, create, filter, and update customer support tickets — including a drag-and-drop Kanban board. Built for the Aurexillion Full-Stack Software Engineer technical assessment.

**Login (seeded demo account):** `agent@example.com` / `Password123!`

## Technologies

| Layer    | Choice                                                              |
| -------- | ------------------------------------------------------------------- |
| Frontend | React 18 + TypeScript, Vite, React Router, plain CSS                |
| Backend  | Node.js, Express 4, TypeScript (run with `tsx`), Zod for validation |
| Database | SQLite via Node's built-in `node:sqlite` module (no native builds)  |
| Auth     | JWT (jsonwebtoken) + scrypt password hashing (built-in `node:crypto`) |
| Security | Helmet, CORS allowlist, express-rate-limit, strict Zod schemas      |
| Logging  | Winston (request logging + error logging)                           |
| Testing  | Vitest + Supertest (backend), Vitest + React Testing Library (frontend) |

> **Why `node:sqlite`?** It is built into Node 22.5+, so there is nothing to compile — `npm install` works even on machines without Xcode/build tools. It is marked experimental by Node but is stable for the SQL used here; swapping in `better-sqlite3` would only change `src/db.ts` and the repository layer.

## Requirements

- Node.js **>= 22.5** (developed on Node 24)
- npm

## Installation

```bash
# from the repository root
cd server && npm install
cd ../client && npm install
```

## Running the app

**1. Seed the database (optional but recommended):**

```bash
cd server
npm run seed   # inserts 6 sample tickets + a demo user; skips data that already exists
```

The seed creates the demo login: **`agent@example.com` / `Password123!`**

**2. Start the backend (port 4000):**

```bash
cd server
npm run dev
```

**3. Start the frontend (port 5173) in a second terminal:**

```bash
cd client
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to `http://localhost:4000`, so no CORS configuration is needed for local dev.

**Frontend environment:** copy `client/.env.example` to `client/.env` and set `VITE_APP_URL` to the public URL where the frontend is served (e.g. `http://localhost:5173` in dev, `http://localhost:8080` for Docker). If unset, the app falls back to `window.location.origin`.

The SQLite database file is created automatically at `server/data/tickets.db` on first run.

### Run with Docker (one command)

```bash
docker compose up --build
```

Then open http://localhost:8080 and sign in with the demo account. What this starts:

- **api** — the Express server compiled to plain JS, seeded automatically on first start (idempotent), with the SQLite file on a named volume (`ticket-data`) so data survives container restarts. Also exposed directly on port 4000 for curl/debugging.
- **web** — the static Vite bundle served by nginx, which proxies `/api/*` to the api container and provides the SPA fallback for client-side routes.

Set a real JWT secret for anything beyond local use: `JWT_SECRET=... docker compose up --build`.

### Production build

`tsx` is used for local development only; for production the server compiles to plain JavaScript and runs under `node` directly:

```bash
# backend: compile TypeScript to dist/ and run it
cd server
npm run build
NODE_ENV=production npm start        # node dist/index.js
npm run seed:prod                    # optional: seed using the compiled output

# frontend: static production bundle in client/dist/
cd client
npm run build
```

With `NODE_ENV=production` the logger emits structured JSON instead of colorized dev output. The client's `dist/` folder can be served by any static host; point `CORS_ORIGIN` at its origin.

### Environment variables

All server variables are optional — copy `server/.env.example` to `server/.env` to override `PORT`, `DB_PATH`, `CORS_ORIGIN`, `LOG_LEVEL`, `JWT_SECRET`, `TRUST_PROXY`, or the rate-limit thresholds. **Set a strong `JWT_SECRET` in any real deployment** — the dev default is intentionally obvious. `TRUST_PROXY` should be the number of reverse proxies in front of the app (the Docker setup sets it to 1 for nginx) so rate limiting keys on the real client IP.

| Variable (client) | Default | Purpose |
| ----------------- | ------- | ------- |
| `VITE_APP_URL` | current browser origin | Public frontend URL (used for session-expired redirects) |

## Running the tests

```bash
# backend: 27 tests (validation, creation, status workflow, 404s, filtering, auth, security)
cd server && npm test

# frontend: 6 tests (form validation, submission payload, list render, empty & error states)
cd client && npm test
```

## API

| Method | Route              | Auth | Description                                            |
| ------ | ------------------ | ---- | ------------------------------------------------------ |
| POST   | `/api/auth/login`  | —    | `{ email, password }` → `{ token, user }`. `401` for bad credentials. |
| GET    | `/api/tickets`     | ✔    | List tickets, newest first. Optional `?status=` and `?priority=` filters. |
| GET    | `/api/tickets/:id` | ✔    | Fetch a single ticket. `404` if missing.               |
| POST   | `/api/tickets`     | ✔    | Create a ticket. New tickets always start as `open`. `201` on success, `400` with field-level details on validation failure. |
| PATCH  | `/api/tickets/:id` | ✔    | Partially update a ticket (typically `{ "status": "…" }`). `400` for invalid input, `404` for missing tickets, `422` for a disallowed status transition. |

**Status workflow:** a ticket can only be moved to `resolved` from `in_progress` (open → in progress → resolved). Any other transition into `resolved` is rejected with `422`; the UI also disables/blocks it in the select control and on the board.

Authenticated routes require an `Authorization: Bearer <token>` header; missing or invalid tokens get a `401`. Tokens are JWTs signed with `JWT_SECRET` and expire after 12 hours.

Ticket shape:

```json
{
  "id": 1,
  "title": "Unable to complete payment",
  "description": "The customer receives an error after submitting the payment form.",
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "status": "open",
  "priority": "high",
  "createdAt": "2026-07-10T10:30:00.000Z"
}
```

Statuses: `open`, `in_progress`, `resolved`. Priorities: `low`, `medium`, `high`.

Validation error responses look like:

```json
{
  "error": "Validation failed",
  "details": [{ "field": "title", "message": "Title is required" }]
}
```

## Project structure

```
server/
  src/
    index.ts                    # entry point
    app.ts                      # composition root (middleware + layer wiring)
    config/                     # env-driven configuration
    db/                         # SQLite connection + schema, seed script
    domain/                     # Ticket types, Zod schemas, error classes
    routes/                     # tickets + auth route tables
    controllers/                # HTTP layer (tickets, auth)
    services/                   # business logic (tickets, auth/JWT)
    repositories/               # data access (tickets, users)
    middlewares/                # validation, auth guard, request logging, errors
    utils/                      # Winston logger, scrypt password hashing
  tests/                        # tickets, auth, security suites
client/
  src/
    api.ts                      # typed fetch client (attaches Bearer token, handles 401)
    config.ts                   # reads VITE_APP_URL (public frontend URL)
    auth.tsx                    # AuthProvider / useAuth context
    authStorage.ts              # token persistence in localStorage
    types.ts                    # shared ticket + auth types
    pages/                      # TicketList, Board (Kanban), TicketDetails, CreateTicket, Login
    components/                 # StatusSelect, Badges, Toast
    utils/                      # date formatting, ticket form validation
    test/                       # frontend tests
```

The backend flows one direction: **route → validation middleware → controller → service → repository → SQLite**. Validated input is attached to `req.validated`, so controllers never read raw request data. All errors funnel into a single error-handling middleware that maps them to JSON responses with appropriate status codes.

## Security

- **Input validation** — every request's body, query, and params are validated with strict Zod schemas (`.strict()` rejects unknown fields, preventing mass assignment). The database adds `CHECK` constraints as a second layer.
- **SQL injection** — all values are bound through parameterized statements (`?` placeholders); the only dynamic SQL fragments are column names taken from a hard-coded whitelist, never from input keys. Covered by tests that fire classic injection payloads at every input surface (body values, update fields, id param, filter query).
- **XSS** — the API returns `application/json` only (never reflects input into HTML), Helmet sets `X-Content-Type-Options: nosniff` and a restrictive Content-Security-Policy, and React escapes all rendered text by default (no `dangerouslySetInnerHTML` anywhere).
- **CSRF** — the API is stateless (no cookies or sessions), so classic CSRF does not apply. Defense in depth anyway: only `application/json` bodies are parsed (cross-site HTML forms cannot produce them), and CORS restricts browser origins.
- **CORS** — allowlist via `CORS_ORIGIN` (default `http://localhost:5173`), limited to `GET`/`POST`/`PATCH` and the `Content-Type` header.
- **Rate limiting** — 300 requests / 15 min per IP overall, 60 / 15 min for writes (`POST`/`PATCH`); exceeded requests get a JSON `429` with standard `RateLimit-*` headers.
- **DoS via large payloads** — JSON bodies are capped at 16 KB (a valid ticket is ~6 KB max) and rejected with `413`.
- **Information leakage** — `X-Powered-By` is disabled; unexpected errors return a generic 500 while full stack traces go to the server log only.
- **Authentication** — all ticket routes require a JWT (12 h expiry) issued by `/api/auth/login`. Passwords are hashed with scrypt (memory-hard) and compared in constant time; unknown emails and wrong passwords return the same `401` message to prevent account enumeration. Login attempts are rate-limited to 20 per 15 minutes per IP against brute force.

## Logging

Winston logs every request (method, path, status, duration, IP) — successes at `http` level, 4xx at `warn`, 5xx at `error` — plus startup info and full stack traces for unexpected errors. In production (`NODE_ENV=production`) output switches from colorized lines to structured JSON. Logging is silenced during tests.

## Design notes

- **Status updates** are available in three places: an accessible `<select>` on each row of the ticket list, on the ticket details page, and by dragging cards on the Kanban board. All persist via `PATCH` and show a success/error toast.
- **Kanban board** (`/board`) — drag a ticket between Open / In Progress / Resolved columns. Updates are optimistic and roll back with an error toast if the API call fails; the saved status survives a page refresh.
- **Authentication flow** — unauthenticated visitors are redirected to `/login`; the JWT and user info are kept in `localStorage`, attached to every API call, and a `401` (expired/invalid token) clears the session and returns to login.
- **Filtering** supports both status and priority, applied server-side via query parameters.
- **Frontend states**: loading, empty, error (with retry), and success states are all handled; forms validate required fields and email format client-side, and the API enforces the same rules server-side.
- **Responsive**: the ticket table collapses to stacked cards on narrow screens.

## Assumptions and trade-offs

- **Single-role auth** — there is one user role (support agent) and no registration endpoint; users are provisioned via the seed script. Role-based access would be the next step.
- **JWT in `localStorage`** — simple and stateless; the trade-off vs. httpOnly cookies is documented XSS exposure, mitigated by React's escaping and the strict CSP. Cookies would add CSRF concerns instead.
- **PATCH accepts any ticket field**, not just `status`. The UI only uses it for status changes, but this keeps the endpoint useful without extra routes.
- **No DELETE endpoint** — not part of the required flows.
- **`node:sqlite` over an ORM** — the data model is a single table; a query builder or ORM would add dependency weight without much benefit at this size.
- **Vite proxy instead of CORS config** — in development the client proxies API calls via relative `/api` paths. `VITE_APP_URL` documents the public frontend origin and is used for absolute redirects (e.g. after a 401). CORS is still enabled on the server for direct API access.
- **Timestamps** are stored as ISO-8601 UTC strings, matching the JSON representation directly.

## What I would improve with more time

- Pagination and sorting on the list endpoint, plus text search on title/customer.
- Role-based access control (admin vs. agent) and a user-management flow.
- Refresh tokens / httpOnly-cookie sessions instead of localStorage JWTs.
- OpenAPI (Swagger) documentation generated from the Zod schemas.
- E2E test coverage with Playwright.
- Keyboard-accessible alternative for the drag-and-drop board (the select control already covers this).
