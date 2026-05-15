create table if not exists public.Liftrz_state (
  id integer primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.Liftrz_state (id, payload)
values (
  1,
  '{
    "platformSettings": { "commissionRate": 0.15, "currency": "PKR" },
    "users": [],
    "trainers": [],
    "trainerDocuments": [],
    "leads": [],
    "reviews": [],
    "protocols": [],
    "bookings": [],
    "payments": [],
    "payouts": [],
    "disputes": [],
    "statsEvents": []
  }'::jsonb
)
on conflict (id) do nothing;
