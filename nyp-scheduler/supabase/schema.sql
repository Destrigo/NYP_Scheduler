-- ─── NYP Scheduler — Supabase Schema ────────────────────────────────────────
-- Run this entire file in the Supabase SQL editor (Dashboard → SQL Editor).
-- Then run seed.sql to populate demo data.

-- ── Stores ───────────────────────────────────────────────────────────────────
create table if not exists stores (
  id              integer      primary key,
  name            text         not null,
  city            text         not null,
  opening_time    time         not null default '11:00',
  closing_time    time         not null default '23:00',
  operating_days  integer[]    not null default array[0,1,2,3,4,5,6]
);

-- ── Employees ────────────────────────────────────────────────────────────────
create table if not exists employees (
  id                        uuid         primary key default gen_random_uuid(),
  first_name                text         not null,
  last_name                 text         not null default '',
  email                     text         not null unique,
  password                  text         not null,
  phone                     text,
  date_of_birth             date,
  role                      text         not null check (role in ('Manager','PizzaMaker','Rider')),
  contract_type             text         not null check (contract_type in ('hourly','fixed')) default 'hourly',
  contract_hours_per_week   numeric      not null default 0,
  hourly_rate               numeric      not null default 0,
  store_id                  integer      references stores(id),
  user_role                 text         not null check (user_role in ('employee','store_manager','backoffice','superadmin')) default 'employee',
  is_active                 boolean      not null default true,
  created_at                timestamptz  default now()
);

-- ── Shifts ───────────────────────────────────────────────────────────────────
create table if not exists shifts (
  id              uuid         primary key default gen_random_uuid(),
  employee_id     uuid         not null references employees(id) on delete cascade,
  store_id        integer      not null references stores(id),
  date            date         not null,
  start_time      time         not null,
  end_time        time         not null,
  break_minutes   integer      not null default 0,
  role            text         not null check (role in ('Manager','PizzaMaker','Rider')),
  created_at      timestamptz  default now(),
  constraint no_zero_duration check (end_time > start_time)
);

create index if not exists shifts_store_date on shifts (store_id, date);
create index if not exists shifts_employee_date on shifts (employee_id, date);

-- ── Week Schedules ────────────────────────────────────────────────────────────
create table if not exists week_schedules (
  id                uuid   primary key default gen_random_uuid(),
  store_id          integer not null references stores(id),
  week_start_date   date    not null,
  status            text    not null default 'draft' check (status in ('draft','published')),
  unique (store_id, week_start_date)
);

-- ── Daily Revenues ────────────────────────────────────────────────────────────
create table if not exists daily_revenues (
  id               uuid         primary key default gen_random_uuid(),
  store_id         integer      not null references stores(id),
  date             date         not null,
  revenue_amount   numeric      not null check (revenue_amount >= 0),
  entered_by       uuid         references employees(id),
  entered_at       timestamptz  default now(),
  unique (store_id, date)
);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- The app uses simple email+password auth (not Supabase Auth).
-- We use the anon key with permissive RLS so all reads/writes go through.
-- For a production hardened setup, replace these with role-based policies.

alter table stores          enable row level security;
alter table employees       enable row level security;
alter table shifts          enable row level security;
alter table week_schedules  enable row level security;
alter table daily_revenues  enable row level security;

create policy "anon_all_stores"         on stores          for all using (true) with check (true);
create policy "anon_all_employees"      on employees       for all using (true) with check (true);
create policy "anon_all_shifts"         on shifts          for all using (true) with check (true);
create policy "anon_all_week_schedules" on week_schedules  for all using (true) with check (true);
create policy "anon_all_daily_revenues" on daily_revenues  for all using (true) with check (true);
