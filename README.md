# R&D Fund Tracking Portal

Next.js App Router portal for academic R&D project budgets, invoice-backed transactions, and Dean/Super Admin approvals.

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `SESSION_SECRET`.
2. Install dependencies with `npm install`.
3. Generate the Prisma client and apply the schema: `npm run db:generate && npm run db:push`.
4. Seed the reviewable demo dataset: `npm run db:seed`.
5. Start the app with `npm run dev` and open `http://localhost:3000/login`.

Demo credentials use `Demo@12345`: `inspector@demo.edu`, `dean@demo.edu`, and `admin@demo.edu`.

The login screen includes role cards for each demo account. After verification, the Inspector dashboard focuses on owned projects and new transactions, the Dean dashboard focuses on the approval queue, and the Super Admin dashboard exposes final approvals plus `/admin/users` and `/admin/audit`.

## Production services

Set `DATABASE_URL` to Neon PostgreSQL, configure Resend or institutional SMTP for OTP/notifications, and add a Vercel Blob `BLOB_READ_WRITE_TOKEN` for invoice files. `DEMO_MODE` should be disabled in production.

## Verification

`npm run typecheck`, `npm test`, and `npm run build` are the local quality gates.
