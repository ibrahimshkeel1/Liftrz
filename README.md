# Liftrz

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-API-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)

Premium fitness trainer marketplace for Pakistan — discover verified trainers, book training protocols, and manage leads from inquiry to payment.

## Features

- **Discovery engine** — Filter by goal, location, price, and experience
- **Trainer dashboard** — Track views, leads, response time, and client protocols
- **Client dashboard** — Nutrition logging, payment flow, and active protocol tracking
- **Admin panel** — Trainer verification, payment approval, and lead oversight
- **Booking flows** — General inquiries and protocol bookings with receipt upload
- **Local payments** — JazzCash, EasyPaisa, and bank transfer support

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Express API |
| Persistence | Supabase (production) or SQLite (local dev) |
| Email | Resend |

## Quick start

```bash
npm install
cp .env.example .env.local   # never commit this file
npm run dev
```

Open http://localhost:3000

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LIFTRZ_AUTH_SECRET` | Yes | Random string (64+ chars) for JWT signing |
| `SUPABASE_URL` | Production | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Supabase service role key |
| `RESEND_API_KEY` | Optional | Transactional email via Resend |
| `CORS_ORIGIN` | Optional | Frontend origin for CORS |

Run [supabase/schema.sql](./supabase/schema.sql) in your Supabase SQL editor for production persistence.

### Admin access

Register through the app, then promote in Supabase:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server + Express API |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Project layout

```
src/              React pages and components
server.js         Express API
lib/              Auth, email, Supabase/SQLite stores
supabase/         Database schema
db.example.json   Local seed template (no credentials)
```

## Documentation

| Doc | Description |
|-----|-------------|
| [MVP_PLAN.md](./MVP_PLAN.md) | Product roadmap |
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | Architecture and next steps |

## Security

- Never commit `.env`, `.env.local`, `db.json`, or `*.sqlite`
- API keys belong in environment variables only
- No default passwords — all accounts require explicit registration
