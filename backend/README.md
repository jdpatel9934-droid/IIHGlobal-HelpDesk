# Support Ticket Tracker API

NestJS REST API using MongoDB, bcrypt password hashing, and bearer JWT authentication.

## Requirements

- Node.js 20+
- npm
- MongoDB 7+ (or Docker Compose)

## Setup

```bash
cp .env.example .env
# Replace all example passwords and JWT_SECRET with unique, strong values.
npm install
docker compose up -d mongodb
npm run seed
npm run start:dev
```

The API listens on `http://localhost:3000/api` by default. `FRONTEND_ORIGINS` is a comma-separated allowlist of browser origins (default `http://localhost:5173`). The seed command idempotently creates an admin, an agent, and two employees from the `SEED_*` values in `.env`. Existing seeded accounts keep their existing passwords; their roles are synchronized.

## Authentication

Send `Authorization: Bearer <accessToken>` on protected endpoints.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Create employee account; body: `{ "email", "password" }` |
| POST | `/api/auth/login` | Public | Log in; body: `{ "email", "password" }` |
| GET | `/api/auth/profile` | Authenticated | Return the current profile, excluding password |

Passwords must be 12-128 characters on signup. Role assignment during signup is always `employee`.
Login is limited to five attempts per minute per client IP; further attempts receive HTTP 429 until the limit window resets.

## Tickets

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/tickets` | Authenticated | Create a ticket |
| GET | `/api/tickets` | Authenticated | List tickets; employees see only their own |
| GET | `/api/tickets/:id` | Authenticated | View ticket and populated comments; employees see only their own |
| PATCH | `/api/tickets/:id/status` | Agent, admin | Change status with `{ "status": "in_progress" }` |
| PATCH | `/api/tickets/:id/assign-to-me` | Agent, admin | Assign ticket to current user |
| POST | `/api/tickets/:id/comments` | Owner, agent, admin | Add comment with `{ "text": "..." }` |
| DELETE | `/api/tickets/:id` | Owner, while open | Delete an open ticket |

Ticket creation requires `title` (5-120 characters) and `description`; priority defaults to `medium`. Status defaults to `open`. Supported priorities are `low`, `medium`, `high`; supported statuses are `open`, `in_progress`, `resolved`, `closed`.

List filters: `search` (case-insensitive title substring), `status`, `priority`, `page` (1-based, default 1), and `limit` (default 20, maximum 100). Responses include `data` and `meta` with `total`, `page`, `limit`, and `totalPages`.

## User administration

| Method | Endpoint | Access | Description |
|---|---|---|---|
| PATCH | `/api/users/:id/role` | Admin | Change a user's role with `{ "role": "agent" }` |

## Error responses

Validation and malformed identifiers return 400, unauthenticated requests return 401, insufficient permissions return 403, missing resources return 404, and duplicate emails return 409. Errors use a consistent JSON shape with `statusCode`, `message`, `path`, and `timestamp`.
