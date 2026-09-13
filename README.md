# Liftrz

Premium fitness trainer marketplace for Pakistan — discover verified trainers, book protocols, and manage leads end-to-end.

## Features

- **Discovery** — Filter by goal, location, price, and experience
- **Trainer dashboard** — Track views, leads, response time, and client protocols
- **Client dashboard** — Nutrition logging, payment flow, and active protocol tracking
- **Admin panel** — Trainer verification, payment approval, and lead oversight
- **Booking flows** — General inquiries and protocol bookings with payment receipt upload

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** Express API
- **Persistence:** Supabase (production) or SQLite (local dev)
- **Email:** Resend

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in secrets locally — never commit this file
npm run dev
```

Open http://localhost:3000

### Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `LIFTRZ_AUTH_SECRET` | Yes | Random string (64+ chars) for JWT signing |
| `SUPABASE_URL` | Production | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Supabase service role key |
| `RESEND_API_KEY` | Optional | Transactional email via Resend |
| `CORS_ORIGIN` | Optional | Frontend origin for CORS |

For Supabase setup, run [supabase/schema.sql](./supabase/schema.sql) in your project SQL editor.

### Admin access

Register a user through the app, then promote them in Supabase:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server + Express API |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Project layout

```
src/          React pages and components
server.js     Express API
lib/          Auth, email, Supabase/SQLite stores
supabase/     Database schema
db.example.json   Local seed template (no credentials)
```

## Security

- Never commit `.env`, `.env.local`, `db.json`, or `*.sqlite`
- API keys and secrets belong in environment variables only
- See [MVP_PLAN.md](./MVP_PLAN.md) and [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for roadmap details
