# NYP Scheduler

React + Vite + Supabase shift scheduling app for NYP (Amsterdam & Enschede).

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Database / API | Supabase (PostgreSQL) |
| Deployment | Vercel (frontend) + Supabase (managed DB) |
| Styling | Plain CSS (no framework) |
| Auth | Simple email + password stored in `employees` table |

---

## Local Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Note your **Project URL** and **anon/public key** (Settings → API)

### 2. Run the SQL

In Supabase Dashboard → **SQL Editor**, run these two files in order:

```
supabase/schema.sql   ← creates tables + RLS policies
supabase/seed.sql     ← inserts 16 stores, demo employees, current-week shifts
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Demo Accounts (created by seed.sql)

| Email | Password | Role |
|-------|----------|------|
| admin@nyp.nl | admin123 | Super Admin |
| manager@nyp.nl | manager123 | Store Manager (store 1) |
| backoffice@nyp.nl | back123 | Back Office |
| ahmed@nyp.nl | emp123 | Employee |
| lisa@nyp.nl | emp123 | Employee (under-18 minor) |
| tom@nyp.nl | emp123 | Employee (under-16 minor) |

---

## Deploy to Vercel

```bash
npm run build     # produces dist/
```

1. Push this repo to GitHub
2. In Vercel → Import project → select the repo
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy — `vercel.json` already handles SPA routing

---

## Project Structure

```
src/
├── main.jsx                    entry point
├── App.jsx                     root component + role-based routing
├── supabase.js                 Supabase client
├── constants.js                STORES, ROLES, colours
├── utils.js                    date helpers, hour calculations
├── styles/main.css             full design system (CSS variables)
├── contexts/
│   ├── AuthContext.jsx         login / logout / user session
│   ├── ToastContext.jsx        global toast notifications
│   └── ConfirmContext.jsx      in-app confirm dialog (replaces window.confirm)
├── components/
│   ├── shared/                 Avatar, FormGroup, EmptyState
│   ├── navigation/             Sidebar (desktop), BottomNav (mobile)
│   ├── schedule/               ShiftChip, ShiftModal, WeekGrid
│   └── charts/                 BarChart (SVG), LineChart (SVG)
└── views/
    ├── LoginPage.jsx
    ├── employee/EmployeeView.jsx
    ├── manager/ManagerView.jsx
    ├── backoffice/             Dashboard, RevenueInput, Reports, BackOfficeView
    └── admin/                  UserManagement, StoreManagement, SystemOverview, AdminScheduleView, AdminView
supabase/
├── schema.sql
└── seed.sql
```

---

## Features

### All roles
- Email + password login
- Role-based views (employee / store manager / back office / super admin)
- Mobile-first (sidebar on desktop, bottom nav on mobile)

### Employee
- Published schedule for current + next week (card-based calendar)
- Hours progress bar vs contract (week + month)
- Manager WhatsApp contact

### Store Manager
- Week grid (employees × 7 days)
- Click cell → add / edit / delete shift with inline validation
- **Drag-to-copy**: drag a shift chip to another cell to copy it
- Today's column highlighted
- Employee contract utilisation bar per row
- Week summary panel (total hours, cost, warnings)
- Copy previous week, Publish / Unpublish, Print

### Back Office
- Labor cost dashboard (day / week / month filter, store filter)
- Period comparison metrics (vs prev period)
- **SVG horizontal bar chart**: labor % per store with threshold line
- Revenue input: single store or bulk all stores
- **SVG line chart**: labor % trend over last 8 weeks per store
- Sortable weekly breakdown table, high-labor rows highlighted

### Super Admin
- User CRUD (add, edit, deactivate) with avatar initials
- Sortable, filterable user table
- Store settings (opening/closing time, operating days)
- System overview (active staff per store with avatar row)
- Schedule view for any store + any week

### Business rules enforced
- Minor age restrictions: under-16 → 20:00, under-18 → 22:00 (blocks save)
- Double-booking prevention (checked against DB before save)
- No-manager-on-day warning in grid totals
- Over-contract-hours warning (utilisation bar turns red)
- Labor % > 35% alert in dashboard and reports
- Revenue entry only allowed for past dates
