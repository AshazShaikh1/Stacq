-- Waitlist Table Definition
create table public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.waitlist enable row level security;

-- Policy to allow ANYONE to insert into waitlist (essential for public signups)
create policy "Anyone can insert into waitlist"
  on public.waitlist
  for insert
  to public
  with check (true);

-- Policy to allow ONLY service roles (or admins) to view the waitlist
create policy "Only service role can select waitlist"
  on public.waitlist
  for select
  to service_role
  using (true);
