-- Hack the Toon: "register your interest" table.
-- Run in the Supabase dashboard → SQL Editor. If your table already exists
-- with a different name or columns, adapt the names below (and set
-- SUPABASE_TABLE in Cloudflare to match).

create table if not exists public.interest (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 1 and 100),
  email      text not null check (
               char_length(email) <= 254
               and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
             ),
  created_at timestamptz not null default now()
);

-- One sign-up per email address, ignoring capitalisation.
create unique index if not exists interest_email_unique
  on public.interest (lower(email));

-- Close the table to the public. With RLS on and no policies, the public
-- (anon) and signed-in (authenticated) keys can't read, add, change or
-- delete anything. Only the Cloudflare function can write, because it uses
-- the project's secret key, which bypasses RLS.
alter table public.interest enable row level security;
revoke all on public.interest from anon, authenticated;
