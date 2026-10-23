-- Migration 010: contact_submissions table

create table if not exists public.contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text not null,
  message     text not null,
  ip_address  text,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Index for admin lookups
create index if not exists idx_contact_submissions_created_at
  on public.contact_submissions (created_at desc);

-- No RLS needed for writes (public form), but restrict reads to service role
alter table public.contact_submissions enable row level security;

-- Only service-role / admin can read submissions
create policy "service role only" on public.contact_submissions
  for all
  using (false)
  with check (false);
