-- ─── NYP Scheduler — Seed Data ───────────────────────────────────────────────
-- Run AFTER schema.sql.
-- Inserts all 16 stores, demo employees, and current-week shifts.
-- Shifts use CURRENT_DATE so the schedule grid is always populated
-- regardless of when you run this.

-- ── Stores (all 16) ───────────────────────────────────────────────────────────
insert into stores (id, name, city, opening_time, closing_time, operating_days) values
  (1,  'Bilderdijkstraat',         'Amsterdam', '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (2,  'Blokmakersplaats',          'Amsterdam', '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (3,  'Buikslotermeerplein',       'Amsterdam', '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (4,  'Buitenveldertselaan',       'Amsterdam', '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (5,  'Burg. van Leeuwenlaan',     'Amsterdam', '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (6,  'Dotterbloemstraat',         'Amsterdam', '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (7,  'Jollemanhof',               'Amsterdam', '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (8,  'Linnaeustraat',             'Amsterdam', '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (9,  'Middenmolenplein',          'Amsterdam', '11:00', '22:30', array[0,1,2,3,4,5,6]),
  (10, 'Molenwijk',                 'Amsterdam', '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (11, 'Pieter Calandlaan',         'Amsterdam', '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (12, 'Van Limburg Stirumstraat',  'Amsterdam', '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (13, 'Vuurdoornlaan',             'Amsterdam', '11:00', '22:30', array[0,1,2,3,4,5,6]),
  (14, 'Deurningerstraat',          'Enschede',  '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (15, 'Wesseler-nering',           'Enschede',  '11:00', '23:00', array[0,1,2,3,4,5,6]),
  (16, 'Windmolenbroeksweg',        'Enschede',  '11:00', '22:30', array[0,1,2,3,4,5,6])
on conflict (id) do nothing;

-- ── Demo Employees ────────────────────────────────────────────────────────────
-- Use fixed UUIDs so we can reference them in the shifts inserts below.
insert into employees (id, first_name, last_name, email, password, phone, date_of_birth, role, contract_type, contract_hours_per_week, hourly_rate, store_id, user_role, is_active)
values
  ('00000001-0000-0000-0000-000000000001', 'Admin',   'Super',      'admin@nyp.nl',       'admin123',   '+31612345678', '1985-01-15', 'Manager',    'fixed',  40, 25.00, 1,  'superadmin',    true),
  ('00000001-0000-0000-0000-000000000002', 'Marco',   'Rossi',      'manager@nyp.nl',     'manager123', '+31612345679', '1990-03-15', 'Manager',    'fixed',  40, 20.00, 1,  'store_manager', true),
  ('00000001-0000-0000-0000-000000000003', 'Sophie',  'de Vries',   'backoffice@nyp.nl',  'back123',    '+31612345680', '1992-07-22', 'PizzaMaker', 'hourly', 24, 14.50, 1,  'backoffice',    true),
  ('00000001-0000-0000-0000-000000000004', 'Ahmed',   'Khalil',     'ahmed@nyp.nl',       'emp123',     '+31612345681', '1998-05-10', 'PizzaMaker', 'hourly', 24, 13.50, 1,  'employee',      true),
  ('00000001-0000-0000-0000-000000000005', 'Lisa',    'Bakker',     'lisa@nyp.nl',        'emp123',     '+31612345682', '2008-09-01', 'Rider',      'hourly', 12, 12.00, 1,  'employee',      true),
  ('00000001-0000-0000-0000-000000000006', 'Tom',     'Janssen',    'tom@nyp.nl',         'emp123',     '+31612345683', '2011-04-20', 'Rider',      'hourly',  8, 11.50, 1,  'employee',      true),
  ('00000001-0000-0000-0000-000000000007', 'Fatima',  'El Amrani',  'fatima@nyp.nl',      'emp123',     '+31612345684', '1995-12-03', 'PizzaMaker', 'hourly', 32, 14.50, 1,  'store_manager', true),
  ('00000001-0000-0000-0000-000000000008', 'Yusuf',   'Demir',      'yusuf@nyp.nl',       'emp123',     '+31612345685', '2000-08-14', 'PizzaMaker', 'hourly', 20, 13.00, 1,  'employee',      true),
  ('00000001-0000-0000-0000-000000000009', 'Elena',   'Popescu',    'elena@nyp.nl',       'emp123',     '+31612345686', '1997-02-28', 'Rider',      'hourly', 16, 12.50, 2,  'store_manager', true),
  ('00000001-0000-0000-0000-000000000010', 'Piet',    'van der Berg','piet@nyp.nl',       'emp123',     '+31612345687', '1993-11-05', 'Manager',    'fixed',  40, 19.00, 2,  'employee',      true)
on conflict (id) do nothing;

-- ── Current-week shifts for store 1 ───────────────────────────────────────────
-- date_trunc('week', CURRENT_DATE) gives Monday of the current ISO week.
-- We insert Mon–Fri for manager, Mon/Tue/Thu/Fri for Ahmed,
-- Mon/Wed/Fri for Lisa (ending ≤22:00, ok for under-18),
-- Saturday for Tom (ending 20:00, ok for under-16).

do $$
declare
  wk   date := date_trunc('week', current_date)::date;  -- current Monday
  marco_id    uuid := '00000001-0000-0000-0000-000000000002';
  ahmed_id    uuid := '00000001-0000-0000-0000-000000000004';
  lisa_id     uuid := '00000001-0000-0000-0000-000000000005';
  tom_id      uuid := '00000001-0000-0000-0000-000000000006';
  fatima_id   uuid := '00000001-0000-0000-0000-000000000007';
  yusuf_id    uuid := '00000001-0000-0000-0000-000000000008';
  sid         int  := 1;
begin
  -- Marco (Manager): Mon–Sat closing shift
  insert into shifts (employee_id, store_id, date, start_time, end_time, break_minutes, role)
  values
    (marco_id, sid, wk + 0, '16:00', '23:00', 30, 'Manager'),
    (marco_id, sid, wk + 1, '16:00', '23:00', 30, 'Manager'),
    (marco_id, sid, wk + 2, '16:00', '23:00', 30, 'Manager'),
    (marco_id, sid, wk + 3, '16:00', '23:00', 30, 'Manager'),
    (marco_id, sid, wk + 4, '16:00', '23:00', 30, 'Manager'),
    (marco_id, sid, wk + 5, '14:00', '23:00', 30, 'Manager')
  on conflict do nothing;

  -- Ahmed (PizzaMaker): Mon,Tue,Thu,Fri
  insert into shifts (employee_id, store_id, date, start_time, end_time, break_minutes, role)
  values
    (ahmed_id, sid, wk + 0, '11:00', '17:00', 30, 'PizzaMaker'),
    (ahmed_id, sid, wk + 1, '11:00', '17:00', 30, 'PizzaMaker'),
    (ahmed_id, sid, wk + 3, '11:00', '17:00', 30, 'PizzaMaker'),
    (ahmed_id, sid, wk + 4, '11:00', '17:00', 30, 'PizzaMaker')
  on conflict do nothing;

  -- Lisa (Rider, under-18 → max 22:00): Mon,Wed,Fri
  insert into shifts (employee_id, store_id, date, start_time, end_time, break_minutes, role)
  values
    (lisa_id, sid, wk + 0, '17:00', '22:00', 0, 'Rider'),
    (lisa_id, sid, wk + 2, '17:00', '22:00', 0, 'Rider'),
    (lisa_id, sid, wk + 4, '17:00', '22:00', 0, 'Rider')
  on conflict do nothing;

  -- Tom (Rider, under-16 → max 20:00): Saturday only, ends at 20:00
  insert into shifts (employee_id, store_id, date, start_time, end_time, break_minutes, role)
  values
    (tom_id, sid, wk + 5, '12:00', '20:00', 0, 'Rider')
  on conflict do nothing;

  -- Fatima (PizzaMaker): Tue,Wed,Thu,Sat
  insert into shifts (employee_id, store_id, date, start_time, end_time, break_minutes, role)
  values
    (fatima_id, sid, wk + 1, '11:00', '18:00', 30, 'PizzaMaker'),
    (fatima_id, sid, wk + 2, '11:00', '18:00', 30, 'PizzaMaker'),
    (fatima_id, sid, wk + 3, '11:00', '18:00', 30, 'PizzaMaker'),
    (fatima_id, sid, wk + 5, '11:00', '19:00', 30, 'PizzaMaker')
  on conflict do nothing;

  -- Yusuf (PizzaMaker): Wed,Fri,Sun
  insert into shifts (employee_id, store_id, date, start_time, end_time, break_minutes, role)
  values
    (yusuf_id, sid, wk + 2, '17:00', '23:00', 30, 'PizzaMaker'),
    (yusuf_id, sid, wk + 4, '17:00', '23:00', 30, 'PizzaMaker'),
    (yusuf_id, sid, wk + 6, '14:00', '23:00', 30, 'PizzaMaker')
  on conflict do nothing;

  -- Publish current week for store 1
  insert into week_schedules (store_id, week_start_date, status)
  values (sid, wk, 'published')
  on conflict (store_id, week_start_date) do update set status = 'published';

end $$;

-- ── Sample revenue for store 1 (last 7 days) ─────────────────────────────────
insert into daily_revenues (store_id, date, revenue_amount)
values
  (1, current_date - 1, 1850.00),
  (1, current_date - 2, 2100.00),
  (1, current_date - 3, 1640.00),
  (1, current_date - 4, 2350.00),
  (1, current_date - 5, 1920.00),
  (1, current_date - 6, 2480.00),
  (1, current_date - 7, 1760.00),
  (2, current_date - 1, 1400.00),
  (2, current_date - 2, 1550.00),
  (2, current_date - 3, 1300.00),
  (7, current_date - 1, 1750.00),
  (7, current_date - 2, 1900.00),
  (7, current_date - 3, 1600.00)
on conflict (store_id, date) do nothing;
