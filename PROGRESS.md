# NYP Scheduler — Build Progress

## Status: Full Build COMPLETE ✓

---

## Project locations

| Path | Description |
|------|-------------|
| `nyp-scheduler/` | **Full build** — React + Vite + Supabase (use this) |
| `index.html` | Old single-file draft (keep for reference, superseded) |
| `NYP_SCHEDULER_SPEC.md` | Original product spec |
| `PROGRESS.md` | This file |

---

## Full Build — Completed

### Infrastructure
- [x] React + Vite project structure (proper component files)
- [x] `@supabase/supabase-js` — no other runtime dependencies
- [x] CSS design system with full CSS variables (`styles/main.css`)
- [x] Vercel config (`vercel.json`) for SPA routing on deploy
- [x] `.env.example` with required env vars documented
- [x] `.gitignore`

### Contexts / shared
- [x] `AuthContext` — login via Supabase query, session in sessionStorage
- [x] `ToastContext` — non-blocking toast notifications (replaces all `alert()`)
- [x] `ConfirmContext` — in-app modal dialog (replaces all `window.confirm()`)
- [x] `Avatar` — coloured initials circle (deterministic per name)
- [x] `FormGroup` — label + input + inline error
- [x] `EmptyState` — consistent empty state UI

### Navigation
- [x] `Sidebar` — desktop nav with logo, tabs, user info + sign out
- [x] `BottomNav` — mobile fixed bottom navigation

### Schedule components
- [x] `ShiftChip` — role-coloured, shows time + worked hours, draggable
- [x] `ShiftModal` — add/edit/delete, shift types (custom/opening/closing/full day), live cost preview, minor age block, double-booking check via Supabase
- [x] `WeekGrid` — full week grid with:
  - Today column highlighted
  - Employee contract utilisation bar per row
  - **Drag-to-copy** (HTML5 drag API, validates on drop)
  - Totals row with staff count, hours, cost, no-manager warning
  - Week summary panel (passed up via callback)
  - Publish / Unpublish via `week_schedules` table
  - Copy previous week (smart — skips existing shifts)
  - Print button

### Charts (pure SVG, no library)
- [x] `BarChart` — horizontal bars for labor % per store, threshold line at 35%
- [x] `LineChart` — labor % trend lines per store, threshold line, legend

### Views
- [x] `LoginPage` — clean login with demo account hints
- [x] `EmployeeView` — card-based week calendar (current + next week), hours progress bars, manager WhatsApp link
- [x] `ManagerView` — week grid + week summary sidebar
- [x] `BackOfficeView` — tab shell (Dashboard / Revenue / Reports)
- [x] `Dashboard` — metrics with period comparison + SVG bar chart + data table
- [x] `RevenueInput` — single store or bulk all-stores mode
- [x] `Reports` — store selector for chart, SVG line chart (8-week trend), sortable table
- [x] `AdminView` — tab shell (Users / Stores / Schedule / Overview)
- [x] `UserManagement` — sortable/filterable table, avatar initials, add/edit/deactivate modal
- [x] `StoreManagement` — store list + settings panel (open/close times, operating days)
- [x] `SystemOverview` — staff per store with avatar row, last-scheduled date on hover
- [x] `AdminScheduleView` — store selector + week grid for any store

### Database
- [x] `supabase/schema.sql` — all 5 tables, indexes, permissive RLS policies
- [x] `supabase/seed.sql` — 16 stores, 10 demo employees, current-week shifts (always current regardless of when run), 3 days of sample revenue

### Documentation
- [x] `README.md` — full setup guide (Supabase project, SQL, env vars, npm, Vercel deploy)

---

## How to run (quick)

```bash
cd nyp-scheduler
cp .env.example .env        # fill in Supabase URL + anon key
npm install
npm run dev
```

Then in Supabase SQL Editor, run `supabase/schema.sql` then `supabase/seed.sql`.

---

## Demo login credentials

| Email | Password | Role |
|-------|----------|------|
| admin@nyp.nl | admin123 | Super Admin |
| manager@nyp.nl | manager123 | Store Manager (store 1) |
| backoffice@nyp.nl | back123 | Back Office |
| ahmed@nyp.nl | emp123 | Employee |
| lisa@nyp.nl | emp123 | Employee (under-18 — minor restrictions apply) |
| tom@nyp.nl | emp123 | Employee (under-16 — stricter minor restrictions) |

---

## What's NOT done (Phase 2+)

- [ ] CSV bulk import of employees
- [ ] Schedule templates (save & reuse patterns)
- [ ] Break auto-calculation (> 6h → 30 min break)
- [ ] Email/push notifications on schedule publish
- [ ] Multi-language (NL/EN)
- [ ] Print to PDF
- [ ] Advanced reporting (trends, forecasting)
- [ ] Real authentication (JWT, bcrypt passwords)
- [ ] WhatsApp integration
- [ ] Mobile PWA / React Native

---

## If resuming this project

Tell Claude: **"Read PROGRESS.md in /home/mtaranti/sgoinfre/scheduler/ — the full build is in nyp-scheduler/. I want to add [feature]."**
