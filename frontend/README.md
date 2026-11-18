# HelpDesk Lite frontend

React, TypeScript, Vite, Tailwind CSS, React Hook Form, and Zod UI for the support ticket API.

## Run locally

1. Start the API and MongoDB using the instructions in [`../backend/README.md`](../backend/README.md).
2. In this directory, copy `.env.example` to `.env` and set `VITE_API_URL` if the API is not at `http://localhost:3000/api`.
3. Install and start the frontend:

   ```bash
   npm install
   npm run dev
   ```

Vite prints the local URL (typically `http://localhost:5173`). Create accounts through signup or use the seeded accounts from the backend. Signup always creates an employee account.

## Build

```bash
npm run build
npm run preview
```

The app validates signup/login, stores the bearer token in browser local storage, fetches the authenticated profile on load, redirects unauthenticated/expired sessions to login, and clears invalid sessions when the API returns 401. Ticket permissions and available controls are based on the authenticated role and enforced by the API.
