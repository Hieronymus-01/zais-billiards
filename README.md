# Zai's Billiard Hall & Bar — Management System

## Tech Stack
- **React 19** + Vite (same as Event-Gate)
- **Tailwind CSS v4** + DaisyUI (same as Event-Gate)
- **Supabase** (same as Event-Gate — auth + database)
- **react-router-dom v7** (same as Event-Gate)
- **react-icons** (same as Event-Gate)

---

## Setup Instructions

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Supabase
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```
Then edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
```

### 3. Run the SQL schema
Go to your **Supabase Dashboard → SQL Editor** and run the contents of `SUPABASE_SCHEMA.sql`.

This creates all tables, RLS policies, seed data, and the auto-profile trigger.

### 4. Set user roles manually (for Staff / Owner accounts)
After creating accounts via Sign Up, go to **Supabase Dashboard → Table Editor → profiles** and manually set:
- `role = 'staff'` for staff accounts
- `role = 'owner'` for owner/admin accounts
- `role = 'customer'` is the default for all new sign-ups

### 5. Run the dev server
```bash
npm run dev
```

---

## Project Structure
```
src/
├── utils/
│   └── Supabase.js              ← Supabase client (same as Event-Gate)
├── Contexts/
│   └── SessionContexts.js       ← Session context (same as Event-Gate)
├── Layouts/
│   ├── MainLayouts.jsx          ← Customer layout (NavBar + Footer)
│   └── AdminLayout.jsx          ← Admin layout (Sidebar)
├── components/
│   ├── NavBar.jsx               ← Customer navbar (HOME, BOOK, MY RESERVATION)
│   ├── Sidebar.jsx              ← Admin sidebar (Dashboard, POS, Tables, etc.)
│   ├── Footer.jsx
│   ├── Forms/
│   │   └── Input.jsx            ← Reused from Event-Gate
│   └── UI/
│       └── Card.jsx             ← Reused from Event-Gate
├── pages/
│   ├── auth/
│   │   ├── Login.jsx            ← Adapted from Event-Gate Login.jsx
│   │   └── SignUp.jsx           ← Adapted from Event-Gate SignUp.jsx
│   ├── customer/
│   │   ├── HomePage.jsx         ← Landing page (hero, features, how to book)
│   │   ├── BookTable.jsx        ← 3-step booking wizard
│   │   └── MyReservations.jsx   ← Customer reservation management
│   └── admin/
│       ├── Dashboard.jsx        ← KPI cards + charts overview
│       ├── POS.jsx              ← Point-of-Sale with cart and payment
│       ├── Tables.jsx           ← Billiard table management (CRUD)
│       ├── Bookings.jsx         ← Reservation management for staff
│       ├── Sales.jsx            ← Transaction history and daily sales
│       ├── Inventory.jsx        ← Product/stock management with low-stock alerts
│       ├── Analytics.jsx        ← Sales trends, top products, reports
│       └── AuditTrail.jsx       ← Activity log with search and filter
```

---

## User Roles

| Role | Access |
|------|--------|
| `customer` | Homepage, Book Table, My Reservations |
| `staff` | All admin pages except Analytics and Audit Trail |
| `owner` | All pages including Analytics and Audit Trail |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (extended from auth.users) |
| `tables` | Billiard tables with status and pricing |
| `products` | Menu items (food, beverages, supplies) |
| `stock_monitoring` | Real-time stock levels per product |
| `customer_reservations` | Table bookings made by customers |
| `sales_transactions` | POS transactions recorded by staff |
| `waste_management` | Expired/damaged item records |
| `audit_logs` | Tamper-proof activity log |

---

## Key Code Patterns (From Event-Gate, Reused Here)

```js
// Fetch data — same as event-gate fetchEvents()
const { data, error } = await supabase.from('table_name').select();

// Insert — same as event-gate insertEvent()
const { data, error } = await supabase.from('table_name').insert({...}).select().single();

// Update — same as event-gate updateEvent()
const { error } = await supabase.from('table_name').update({...}).eq('id', id);

// Auth — same as event-gate
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// Session — same context pattern
const { session, profile } = useContext(SessionContext);
```
