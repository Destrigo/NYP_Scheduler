# NYP Shift Scheduler — Project Specification

## 1. Overview

Web application for **NYP** (pizza chain, Amsterdam & Enschede) to manage employee shift scheduling, labor cost tracking, and basic revenue reporting across all stores.

**Tech stack:** React SPA (single-page app), mobile-first responsive design.
**Auth:** Email + password.
**Language:** UI in English (staff is international).

---

## 2. User Roles

| Role | Access Level | Description |
|------|-------------|-------------|
| **Employee** | Read-only own data | Views own shifts, contract hours, personal schedule |
| **Store Manager** | Read/write own store | Creates/edits weekly schedules for their store, views own store labor cost |
| **Back Office** | Read/write all stores (financial) | Views labor cost per store/day, inputs daily revenue, views reports |
| **Super Admin** | Full access | Manages users, stores, roles, system settings |

A user belongs to **one store** (except Back Office and Super Admin who see all stores).

---

## 3. Stores

16 stores total. Each store has: name, city, operating hours.

| # | Store Name | City |
|---|-----------|------|
| 1 | Bilderdijkstraat | Amsterdam |
| 2 | Blokmakersplaats | Amsterdam |
| 3 | Buikslotermeerplein | Amsterdam |
| 4 | Buitenveldertselaan | Amsterdam |
| 5 | Burg. van Leeuwenlaan | Amsterdam |
| 6 | Dotterbloemstraat | Amsterdam |
| 7 | Jollemanhof | Amsterdam |
| 8 | Linnaeustraat | Amsterdam |
| 9 | Middenmolenplein | Amsterdam |
| 10 | Molenwijk | Amsterdam |
| 11 | Pieter Calandlaan | Amsterdam |
| 12 | Van Limburg Stirumstraat | Amsterdam |
| 13 | Vuurdoornlaan | Amsterdam |
| 14 | Deurningerstraat | Enschede |
| 15 | Wesseler-nering | Enschede |
| 16 | Windmolenbroeksweg | Enschede `[TBD: confirm city]` |

### Store Settings (per store)
- `opening_time` — default `[TBD: e.g. 11:00]`
- `closing_time` — default `[TBD: e.g. 23:00]`
- `operating_days` — default: Monday–Sunday (7/7)

---

## 4. Employee Roles (shift roles)

| Role | Description |
|------|-------------|
| **Manager** | Store manager on shift — fixed monthly salary |
| **PizzaMaker** | Kitchen staff — hourly contract |
| **Rider** | Delivery — hourly contract |

---

## 5. Employee / Contract Model

Each employee has:

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `first_name` | string | |
| `last_name` | string | |
| `email` | string | Login credential |
| `phone` | string | For WhatsApp contact |
| `date_of_birth` | date | Used for minor-age restrictions |
| `role` | enum | Manager / PizzaMaker / Rider |
| `contract_type` | enum | `hourly` or `fixed` |
| `contract_hours_per_week` | number | Theoretical hours (e.g. 24). For fixed contracts this is informational. |
| `hourly_rate` | decimal | Gross cost/hour. For fixed: derived from monthly salary ÷ avg monthly hours. |
| `store_id` | FK | Assigned store |
| `is_active` | boolean | Soft delete |
| `user_role` | enum | employee / store_manager / backoffice / superadmin |

### Minor Age Restrictions
- Employees under **18 years old** cannot work past **22:00** `[TBD: confirm age threshold and cutoff hour]`
- Employees under **16 years old** cannot work past **20:00** `[TBD: confirm]`
- The system must **warn** the store manager when scheduling a minor outside allowed hours and **block** saving the shift.

---

## 6. Shifts & Scheduling

### 6.1 Shift Model

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `employee_id` | FK | |
| `store_id` | FK | |
| `date` | date | |
| `start_time` | time | Either a specific time (e.g. 12:00) or store opening time |
| `end_time` | time | Either a specific time (e.g. 18:00) or store closing time |
| `role` | enum | Manager / PizzaMaker / Rider |
| `break_minutes` | integer | Default 0. `[TBD: auto-calculate breaks?]` |

**Computed fields:**
- `worked_hours` = (end_time - start_time) - break_minutes
- `shift_cost` = worked_hours × employee.hourly_rate

### 6.2 Shift Types (start/end options)

When creating a shift, the manager can choose:
- **Custom hours**: manual start and end time (e.g. 12:00–18:00)
- **Opening shift**: start = store opening time, end = custom
- **Closing shift**: start = custom, end = store closing time
- **Full day**: start = opening, end = closing

### 6.3 Weekly Schedule View (Store Manager)

The primary interface for the store manager. A **week grid**:

```
              Mon 12/5   Tue 13/5   Wed 14/5   Thu 15/5   Fri 16/5   Sat 17/5   Sun 18/5
Mario (PM)    11-18      11-18      OFF        11-18      11-18      OFF        OFF
Ahmed (PM)    OFF        OFF        11-22      OFF        OFF        11-22      11-22
Lisa (Rider)  17-22      17-22      17-22      OFF        17-22      17-22      OFF
...
──────────────────────────────────────────────────────────────────────────────────────────
TOTALS        3 staff    3 staff    2 staff    ...
Daily cost    €285       €285       €190       ...
```

**Features:**
- Click cell → create/edit shift (modal with start time, end time, break)
- Drag to copy a shift across days
- **Copy previous week** button → duplicates last week's schedule, manager then adjusts
- Color coding by role (Manager = blue, PizzaMaker = red, Rider = green)
- Warning badges for: minor working late, employee exceeding contract hours, no manager scheduled
- Daily totals row: staff count, total hours, estimated daily cost

### 6.4 Week Status

Each week per store has a status:
- `draft` — manager is editing
- `published` — visible to employees

Manager clicks **"Publish"** to make the week visible to employees.

---

## 7. Employee View

The employee sees:

### 7.1 My Schedule (default view)
- Current week and next week calendar view
- Each shift shows: date, start time, end time, role, worked hours
- Days off clearly marked

### 7.2 My Hours Summary
- **This week:** scheduled hours vs contract hours (e.g. "22 / 24 hours")
- **This month:** total scheduled hours vs theoretical monthly hours
- Simple progress bar visual

### 7.3 No edit capability
- Communication for changes happens via WhatsApp (external)
- Phone number of store manager visible for quick contact

---

## 8. Back Office

### 8.1 Daily Revenue Input

Simple form:
- Select store (dropdown, or list all stores)
- Select date (defaults to yesterday)
- Input **revenue** (single € amount)
- Save

Bulk mode: input revenue for all stores for one day on a single screen.

### 8.2 Labor Cost Dashboard

**Per store, per day:**

| Date | Store | Staff Count | Total Hours | Labor Cost (€) | Revenue (€) | Labor % |
|------|-------|-------------|-------------|-----------------|-------------|---------|
| 12/5 | Bilderdijkstraat | 5 | 38h | €485 | €1,200 | 40.4% |
| 12/5 | Jollemanhof | 4 | 32h | €392 | €980 | 40.0% |

**Filters:**
- Date range (day / week / month)
- Store (single / all)

**Key metrics (cards at top):**
- Total labor cost (period)
- Total revenue (period)
- Average labor cost %
- Comparison vs previous period (week-over-week or month-over-month)

### 8.3 Reports (MVP)

**Labor Cost % Report:**
- Line chart: daily labor % per store over time
- Table: weekly labor cost breakdown per store
- Highlight stores where labor % exceeds threshold (e.g. > 35%) `[TBD: confirm threshold]`

---

## 9. Super Admin

### 9.1 User Management
- CRUD employees (create, read, update, deactivate)
- Assign user role (employee / store_manager / backoffice / superadmin)
- Assign store
- Set contract details (hours, hourly rate, contract type)
- Bulk import via CSV `[Phase 2]`

### 9.2 Store Management
- CRUD stores (name, city, opening hours, operating days)
- Assign store manager(s) to a store

### 9.3 System Overview
- Total active employees per store
- Quick links to any store's schedule

---

## 10. Data Model (entities)

```
Store
  ├── id, name, city, opening_time, closing_time, operating_days

Employee
  ├── id, first_name, last_name, email, password_hash, phone
  ├── date_of_birth, role, contract_type, contract_hours_per_week
  ├── hourly_rate, store_id (FK), user_role, is_active

Shift
  ├── id, employee_id (FK), store_id (FK), date
  ├── start_time, end_time, break_minutes, role

WeekSchedule
  ├── id, store_id (FK), week_start_date, status (draft/published)

DailyRevenue
  ├── id, store_id (FK), date, revenue_amount
  ├── entered_by (FK → Employee), entered_at (timestamp)
```

---

## 11. Business Rules & Validations

1. **Minor restrictions:** Block shifts past allowed hours based on age (see §5)
2. **Contract hours warning:** Warn if scheduled hours > contract hours for the week (soft warning, not blocking)
3. **No manager alert:** Warn if a day has shifts but no Manager role scheduled
4. **Double booking:** Prevent same employee scheduled at overlapping times
5. **Published schedule:** Employees only see published weeks; draft is manager-only
6. **Revenue input:** Only for past dates (cannot input future revenue)
7. **Labor cost calculation:** Sum of (worked_hours × hourly_rate) for all shifts in a store on a day

---

## 12. UI / UX Guidelines

- **Mobile-first** responsive design
- Clean, minimal UI — the store manager uses this on a tablet or phone
- Navigation: bottom tab bar on mobile, sidebar on desktop
- Color palette: `[TBD: NYP brand colors — suggest neutral dark + accent]`
- Weekly schedule grid must be horizontally scrollable on mobile
- Fast interactions: copy week, quick shift creation, minimal clicks

---

## 13. Technical Architecture

### Option A: Full React SPA with persistent storage API
- React frontend (single artifact)
- Uses `window.storage` API for data persistence across sessions
- All logic client-side
- No backend server needed
- **Limitation:** single-user per browser, no real multi-user sync

### Option B: React + Anthropic API backend `[Recommended for MVP]`
- React frontend
- Uses Anthropic API for any AI-assisted features (schedule suggestions)
- `window.storage` for persistence
- Still no true backend, but functional MVP to validate UX

### Option C: Full stack (Phase 2)
- React frontend + Node.js/Python backend + PostgreSQL
- Real authentication, multi-user, API
- Deployment to cloud

**MVP approach:** Start with **Option A** — a fully functional React SPA using `window.storage` for persistence. This allows validating all UX flows immediately. Migrate to Option C when ready for production.

---

## 14. MVP Scope & Phases

### Phase 1 — MVP (current)
- [x] All 4 user role views
- [x] Store list (hardcoded 16 stores)
- [x] Weekly schedule grid with shift CRUD
- [x] Copy previous week
- [x] Employee schedule view with hours summary
- [x] Revenue input (single daily value per store)
- [x] Labor cost dashboard with labor %
- [x] User management (CRUD)
- [x] Minor age restriction warnings
- [x] Login/logout (simulated auth with stored credentials)

### Phase 2 — Enhancements
- [ ] CSV bulk import employees
- [ ] Schedule templates (save & reuse patterns)
- [ ] Break auto-calculation (e.g. >6h = 30min break)
- [ ] Email/push notifications when schedule published
- [ ] Multi-language (NL/EN)
- [ ] Print schedule PDF
- [ ] Advanced reporting (trends, forecasting)

### Phase 3 — Production
- [ ] Real backend + database
- [ ] Proper authentication (JWT)
- [ ] WhatsApp integration for notifications
- [ ] Mobile app (PWA or React Native)

---

## 15. Open Items `[TBD]`

| # | Question | Default Assumption |
|---|----------|--------------------|
| 1 | Windmolenbroeksweg city | Enschede |
| 2 | Store operating hours | 11:00–23:00 all stores |
| 3 | Minor age cutoff hour | Under 18 → max 22:00, Under 16 → max 20:00 |
| 4 | Labor cost % warning threshold | 35% |
| 5 | Break rules | Manual input, no auto-calc in MVP |
| 6 | Hourly rate per person or per role | Per person (set in employee profile) |
| 7 | NYP brand colors | TBD — using neutral palette for MVP |
