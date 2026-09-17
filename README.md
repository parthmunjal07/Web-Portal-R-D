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

Set `DATABASE_URL` to Neon PostgreSQL, configure Resend or institutional SMTP for OTP/notifications, and configure an Amazon S3 bucket with `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `S3_BUCKET_NAME` for private invoice files. Use `S3_ENDPOINT` only for an S3-compatible provider, and `S3_PUBLIC_BASE_URL` only when objects are intentionally public. `DEMO_MODE` should be disabled in production.

### Amazon S3 setup

1. In AWS Console, open S3, create a bucket in your preferred region, and keep Block Public Access enabled.
2. In IAM, create a dedicated user for this portal and attach a policy limited to this bucket. Allow `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` on `arn:aws:s3:::YOUR_BUCKET/invoices/*`.
3. Create an access key under the IAM user. Copy the access key ID and secret once; AWS will not show the secret again.
4. Copy `.env.example` to `.env`, set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `S3_BUCKET_NAME`, then restart `npm run dev`.

The server uploads invoices directly to S3 and stores only the private object key in the database. Never expose the secret key in browser code or commit `.env`.

## Verification

`npm run typecheck`, `npm test`, and `npm run build` are the local quality gates.
