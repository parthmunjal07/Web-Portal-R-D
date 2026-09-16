# R&D Fund Tracking Portal

Next.js App Router portal for academic R&D project budgets, invoice-backed transactions, and Dean/Super Admin approvals.

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `SESSION_SECRET`.
2. Install dependencies with `npm install`.
3. Generate the Prisma client and apply the schema: `npm run db:generate && npm run db:push`.
4. Seed the reviewable demo dataset: `npm run db:seed`.
5. Start the app with `npm run dev` and open `http://localhost:3000/login`.

Demo credentials use `Demo@12345`: `inspector@demo.edu`, `dean@demo.edu`, and `admin@demo.edu`.

## Production services

Set `DATABASE_URL` to Neon PostgreSQL, configure Resend or institutional SMTP for OTP/notifications, and configure Cloudflare R2 for invoice files. `DEMO_MODE` should be disabled in production.

## Verification

`npm run typecheck`, `npm test`, and `npm run build` are the local quality gates.
