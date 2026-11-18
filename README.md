# IIHGlobal HelpDesk

A support-ticket tracker with a NestJS, MongoDB, and JWT backend and a React, TypeScript, Vite, and Tailwind CSS frontend.

## Requirements

- Node.js 20 or newer and npm
- Docker with Docker Compose, or a MongoDB server

## Run locally

Open two terminals from the project root.

### 1. Configure and start the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` before starting the service:

- Set `JWT_SECRET` to a unique random value of at least 32 characters.
- Replace all four `SEED_*_PASSWORD` placeholders with unique passwords of at least 12 characters.
- Set `MONGODB_URI` if MongoDB is not using the local Docker Compose service.
- Set `FRONTEND_ORIGINS` if the frontend is served from a different origin.

Start MongoDB and install backend dependencies:

```bash
docker compose up -d mongodb
npm install
```

Create the initial accounts and start the API:

```bash
npm run seed
npm run start:dev
```

The API is available at `http://localhost:3000/api`.

### 2. Configure and start the frontend

In another terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Set `VITE_API_URL` in `frontend/.env` if the API is hosted elsewhere.

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `NODE_ENV` | No | Runtime mode; defaults to `development`. |
| `PORT` | No | API port; defaults to `3000`. |
| `MONGODB_URI` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | JWT signing secret; must be at least 32 characters. |
| `JWT_EXPIRES_IN` | No | Token lifetime such as `1h`; defaults to `1h`. |
| `BCRYPT_ROUNDS` | No | Password hashing cost from 10 to 15; defaults to `12`. |
| `FRONTEND_ORIGINS` | No | Comma-separated browser origin allowlist; defaults to `http://localhost:5173`. |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | For seeding | Admin seed account credentials. |
| `SEED_AGENT_EMAIL`, `SEED_AGENT_PASSWORD` | For seeding | Agent seed account credentials. |
| `SEED_EMPLOYEE_ONE_EMAIL`, `SEED_EMPLOYEE_ONE_PASSWORD` | For seeding | First employee seed account credentials. |
| `SEED_EMPLOYEE_TWO_EMAIL`, `SEED_EMPLOYEE_TWO_PASSWORD` | For seeding | Second employee seed account credentials. |

### Frontend (`frontend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | No | API base URL; defaults to `http://localhost:3000/api`. |

Never commit `.env` files or real credentials. Use the checked-in `.env.example` files as templates, and replace every example secret before use.

## Seed accounts

The backend seed script creates one admin, one agent, and two employees using the `SEED_*` email and password values in `backend/.env`:

```bash
cd backend
npm run seed
```

It is safe to rerun: existing matching accounts keep their passwords while their roles are updated to the configured seed roles. Signup through the app always creates an employee; only an admin can promote or change a user's role.

## What's implemented

- Password-hashed signup/login and bearer JWT authentication with a password-free profile endpoint.
- Role-aware access for employees, agents, and admins.
- Ticket creation, owner/staff visibility, title search, status/priority filters, and total-count pagination.
- Ticket comments, agent/admin self-assignment and status updates, and owner-only deletion of open tickets in the API.
- Admin-only user role changes and centralized API error handling.
- Frontend login/signup validation, protected routes, role-aware ticket dashboard, ticket creation, ticket detail/comments, agent/admin controls, and loading/empty/error states.
- API CORS configuration for the local frontend origin.

## Not implemented / limitations

- No automated unit or end-to-end test suite is included. The backend and frontend have been build-checked; key flows were manually exercised during development.
- The frontend does not currently expose ticket deletion or admin user-role management, although the backend provides the corresponding API capabilities.
- No password reset, email verification, refresh-token/session revocation, file attachments, notifications, or deployment/production infrastructure is included.
- JWTs are stored in browser local storage. Use HTTPS in production and review the authentication/storage approach against your deployment's security requirements.

## Build checks

```bash
cd backend && npm run build && npm run lint
cd frontend && npm run build
```

More API endpoint details are in [`backend/README.md`](./backend/README.md); frontend-specific notes are in [`frontend/README.md`](./frontend/README.md).
