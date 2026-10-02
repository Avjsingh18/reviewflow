# ReviewFlow

ReviewFlow is a QR-to-Google-Review SaaS MVP. It is prepared to deploy as one Next.js application on Vercel with Supabase for authentication and PostgreSQL.

## Production architecture

- **Vercel:** Next.js web app, protected API routes, public QR redirect endpoint, and HTTPS.
- **Supabase Auth:** account creation, sign-in, password management, and JWT sessions.
- **Supabase Postgres:** businesses, QR codes, scan events, and manually verified review snapshots.
- **GitHub:** private source repository and Vercel deployment trigger.

The QR payload is a public ReviewFlow tracking URL, for example `https://app.example.com/r/cafe-1234abcd`. It records an anonymous scan event and immediately redirects to the business's saved Google review URL. The destination URL never needs to contain localhost.

## Deploy to Supabase and Vercel

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [supabase/migrations/20261002_initial_reviewflow.sql](supabase/migrations/20261002_initial_reviewflow.sql).
3. In Supabase Auth, configure the Site URL and redirect URL as your final Vercel domain, for example `https://app.example.com/login`. Enable email confirmation if you want owners to verify their email before first sign-in.
4. Copy `.env.example` to `.env.local` and add the values from Supabase. Never commit `.env.local`.
5. Push this repository to a **private** GitHub repository.
6. Import the repository into Vercel and configure the same four environment variables for Production, Preview, and Development:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — server-only secret; never prefix it with `NEXT_PUBLIC_`
   - `NEXT_PUBLIC_SITE_URL` — the final HTTPS domain, without a trailing slash

7. Add your custom domain in Vercel. Vercel provisions and renews HTTPS automatically.
8. Create one account, finish onboarding, download its QR image, and scan it from another device. Confirm the scan redirects to Google and increments the QR scan count.

## Security model

- Every private API route validates the Supabase bearer token before accessing data.
- The schema enables Row Level Security so each owner can only read their own business data.
- The service-role key is used only in server-side route handlers; it is never sent to the browser.
- Passwords are handled by Supabase Auth, not stored in application tables.
- QR scan IP addresses are SHA-256 hashed before storage; the raw IP is not persisted.
- The public redirect performs one action only: record the scan and redirect to the business's stored review URL.

## Local development

```bash
npm install
cp .env.example .env.local
# fill in the four Supabase values
npm run dev
```

Open `http://localhost:3000`. For local QR testing, set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`; for any printed/customer QR, use the deployed HTTPS domain.

## Current scope

- One business location and one active QR code per owner.
- Manual verified review snapshots are supported; Google automatic sync can be added later.
- The legacy Spring Boot service remains in `backend/` as a reference implementation but is no longer required for the Vercel + Supabase deployment path.
