-- ============================================================
-- ZAI'S BILLIARD HALL & BAR — SUPABASE SQL SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users — same as event-gate)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  email text,
  phone_number text,
  role text default 'customer' check (role in ('customer', 'staff', 'owner')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Staff and owner can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','owner'))
  );

-- 2. TABLES (billiard tables)
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  table_number int not null unique,
  description text,
  price_per_hour numeric(10,2) default 50,
  status text default 'available' check (status in ('available','occupied','reserved','maintenance')),
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.tables enable row level security;
create policy "Anyone can view tables" on public.tables for select using (true);
create policy "Staff/owner can manage tables" on public.tables
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','owner'))
  );

-- 3. PRODUCTS (menu items — equivalent to event-gate "events" table)
create table public.products (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  category text check (category in ('Food','Beverages','Supplies')),
  price numeric(10,2) not null,
  image_url text,
  is_available boolean default true,
  created_at timestamptz default now()
);
alter table public.products enable row level security;
create policy "Anyone can view available products" on public.products
  for select using (true);
create policy "Staff/owner can manage products" on public.products
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','owner'))
  );

-- 4. STOCK MONITORING (inventory — linked to products)
create table public.stock_monitoring (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  quantity int default 0,
  reorder_level int default 10,
  last_updated timestamptz default now()
);
alter table public.stock_monitoring enable row level security;
create policy "Staff/owner can manage stock" on public.stock_monitoring
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','owner'))
  );

-- Add stock_quantity virtual column helper (view)
create or replace view public.products_with_stock as
  select p.*, coalesce(s.quantity, 0) as stock_quantity
  from public.products p
  left join public.stock_monitoring s on s.product_id = p.id;

-- 5. CUSTOMER RESERVATIONS (equivalent to event-gate "registrations" table)
create table public.customer_reservations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  table_id uuid references public.tables(id) on delete set null,
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  num_players int default 1,
  pre_order jsonb,           -- JSON array of cart items
  total_amount numeric(10,2) default 0,
  status text default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  created_at timestamptz default now()
);
alter table public.customer_reservations enable row level security;
create policy "Customers can view their own reservations" on public.customer_reservations
  for select using (auth.uid() = customer_id);
create policy "Customers can create reservations" on public.customer_reservations
  for insert with check (auth.uid() = customer_id);
create policy "Customers can update their own pending reservations" on public.customer_reservations
  for update using (auth.uid() = customer_id and status = 'pending');
create policy "Staff/owner can manage all reservations" on public.customer_reservations
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','owner'))
  );

-- 6. SALES TRANSACTIONS (POS transactions)
create table public.sales_transactions (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.profiles(id) on delete set null,
  reservation_id uuid references public.customer_reservations(id) on delete set null,
  items jsonb,               -- JSON array of ordered items
  total_amount numeric(10,2) default 0,
  payment_method text check (payment_method in ('Cash','GCash')),
  created_at timestamptz default now()
);
alter table public.sales_transactions enable row level security;
create policy "Staff/owner can manage sales" on public.sales_transactions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','owner'))
  );

-- 7. WASTE MANAGEMENT (supply chain — track expired/damaged items)
create table public.waste_management (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  expiration_date date,
  damage_quantity int default 0,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);
alter table public.waste_management enable row level security;
create policy "Staff/owner can manage waste records" on public.waste_management
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','owner'))
  );

-- 8. AUDIT LOGS (tamper-proof activity log)
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text,
  record_id text,
  details text,
  created_at timestamptz default now()
);
alter table public.audit_logs enable row level security;
-- Audit logs: insert allowed for all authenticated users, select only for owners
create policy "Authenticated users can insert audit logs" on public.audit_logs
  for insert with check (auth.uid() = user_id);
create policy "Owners can view audit logs" on public.audit_logs
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

-- ============================================================
-- SEED DATA — sample tables and products
-- ============================================================

insert into public.tables (table_number, price_per_hour, description) values
  (1, 55, 'Standard billiard table'),
  (2, 55, 'Standard billiard table'),
  (3, 52, 'Standard billiard table');

insert into public.products (product_name, category, price) values
  ('French Fries', 'Food', 120),
  ('Cheeseburger', 'Food', 95),
  ('Nachos', 'Food', 100),
  ('Tapsilog', 'Food', 100),
  ('Chicken Wings', 'Food', 250),
  ('Bacsilog', 'Food', 100),
  ('Softdrinks', 'Beverages', 45),
  ('Iced Tea', 'Beverages', 55),
  ('Beer (San Mig)', 'Beverages', 75),
  ('Mineral Water', 'Beverages', 30);

-- Stock for seeded products (run after products insert)
insert into public.stock_monitoring (product_id, quantity, reorder_level)
select id, 50, 10 from public.products;

-- ============================================================
-- TRIGGER: Auto-create profile on auth.users signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
