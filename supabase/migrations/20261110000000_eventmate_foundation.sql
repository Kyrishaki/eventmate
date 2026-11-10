-- EventMate: Foundation Migration Schema
-- Workspace-scoped, multi-tenant merchandise sales platform for artists & tour crews

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE workspace_role AS ENUM (
  'owner',
  'admin',
  'manager',
  'cashier',
  'inventory_staff',
  'viewer'
);

CREATE TYPE event_status AS ENUM (
  'draft',
  'upcoming',
  'active',
  'completed',
  'cancelled'
);

CREATE TYPE booth_status AS ENUM (
  'active',
  'paused',
  'closed'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'qr_manual',
  'gateway'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

CREATE TYPE sync_status AS ENUM (
  'synced',
  'pending_sync',
  'conflict'
);

CREATE TYPE invitation_status AS ENUM (
  'pending',
  'accepted',
  'expired',
  'revoked'
);

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  currency TEXT NOT NULL DEFAULT 'VND',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. WORKSPACE MEMBERS
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(workspace_id, user_id)
);

-- 5. WORKSPACE INVITATIONS
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role workspace_role NOT NULL DEFAULT 'cashier',
  token TEXT NOT NULL UNIQUE,
  status invitation_status NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status event_status NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. BOOTHS
CREATE TABLE IF NOT EXISTS public.booths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  status booth_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(event_id, code)
);

-- 8. BOOTH STAFF ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.booth_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(booth_id, user_id)
);

-- 9. PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL, -- e.g. "Size L - Black"
  price NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
  barcode TEXT,
  total_inventory INT NOT NULL DEFAULT 0 CHECK (total_inventory >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(workspace_id, sku)
);

-- 12. INVENTORY ALLOCATIONS (allocated stock per booth)
CREATE TABLE IF NOT EXISTS public.inventory_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  allocated_quantity INT NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0),
  sold_quantity INT NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(booth_id, variant_id),
  CONSTRAINT valid_stock_usage CHECK (sold_quantity <= allocated_quantity)
);

-- 13. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE RESTRICT,
  cashier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL,
  subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  final_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (final_amount >= 0),
  payment_method payment_method NOT NULL DEFAULT 'cash',
  payment_status payment_status NOT NULL DEFAULT 'completed',
  sync_status sync_status NOT NULL DEFAULT 'synced',
  idempotency_key TEXT NOT NULL UNIQUE,
  notes TEXT,
  offline_created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 14. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(15, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 15. PAYMENTS & GATEWAY VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method payment_method NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  status payment_status NOT NULL DEFAULT 'completed',
  transaction_ref TEXT,
  provider_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 16. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 17. DEVICE REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.device_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  booth_id UUID REFERENCES public.booths(id) ON DELETE SET NULL,
  device_name TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(workspace_id, device_fingerprint)
);

-- ----------------------------------------------------
-- HELPER FUNCTIONS FOR WORKSPACE-BASED AUTHORIZATION
-- ----------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_auth_user_workspace_role(target_workspace_id UUID)
RETURNS workspace_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.workspace_members
  WHERE workspace_id = target_workspace_id
    AND user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member(target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = target_workspace_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin_or_owner(target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = target_workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_manager(target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = target_workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager')
  );
$$;

-- ----------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles, but only update their own
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Workspaces: Members can view their workspaces
CREATE POLICY "Workspaces viewable by members"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(id));

CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Workspace owners and admins can update workspace"
  ON public.workspaces FOR UPDATE
  TO authenticated
  USING (public.is_workspace_admin_or_owner(id))
  WITH CHECK (public.is_workspace_admin_or_owner(id));

-- Workspace Members
CREATE POLICY "Members viewable by fellow workspace members"
  ON public.workspace_members FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Owners and admins can manage members"
  ON public.workspace_members FOR ALL
  TO authenticated
  USING (public.is_workspace_admin_or_owner(workspace_id))
  WITH CHECK (public.is_workspace_admin_or_owner(workspace_id));

-- Events: Viewable by workspace members, manageable by managers/admins/owners
CREATE POLICY "Events viewable by workspace members"
  ON public.events FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Events manageable by managers/admins/owners"
  ON public.events FOR ALL
  TO authenticated
  USING (public.is_workspace_manager(workspace_id))
  WITH CHECK (public.is_workspace_manager(workspace_id));

-- Booths
CREATE POLICY "Booths viewable by workspace members"
  ON public.booths FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Booths manageable by managers/admins/owners"
  ON public.booths FOR ALL
  TO authenticated
  USING (public.is_workspace_manager(workspace_id))
  WITH CHECK (public.is_workspace_manager(workspace_id));

-- Products & Variants
CREATE POLICY "Products viewable by workspace members"
  ON public.products FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Products manageable by managers/admins/owners"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_workspace_manager(workspace_id))
  WITH CHECK (public.is_workspace_manager(workspace_id));

CREATE POLICY "Product variants viewable by workspace members"
  ON public.product_variants FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Product variants manageable by managers/admins/owners"
  ON public.product_variants FOR ALL
  TO authenticated
  USING (public.is_workspace_manager(workspace_id))
  WITH CHECK (public.is_workspace_manager(workspace_id));

-- Inventory Allocations
CREATE POLICY "Allocations viewable by workspace members"
  ON public.inventory_allocations FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Allocations manageable by inventory staff/managers"
  ON public.inventory_allocations FOR ALL
  TO authenticated
  USING (
    public.is_workspace_manager(workspace_id) OR
    public.get_auth_user_workspace_role(workspace_id) = 'inventory_staff'
  )
  WITH CHECK (
    public.is_workspace_manager(workspace_id) OR
    public.get_auth_user_workspace_role(workspace_id) = 'inventory_staff'
  );

-- Orders: Cashiers can insert orders; workspace members can view
CREATE POLICY "Orders viewable by workspace members"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Orders insertable by cashiers and staff"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_workspace_member(workspace_id) AND
    auth.uid() = cashier_id
  );

-- Order Items
CREATE POLICY "Order items viewable by workspace members"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Order items insertable by workspace members"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));

-- Payments
CREATE POLICY "Payments viewable by workspace members"
  ON public.payments FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- Audit Logs
CREATE POLICY "Audit logs viewable by owners and admins"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_workspace_admin_or_owner(workspace_id));

CREATE POLICY "Audit logs insertable by workspace members"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));
