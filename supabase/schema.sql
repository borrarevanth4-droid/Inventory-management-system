-- ========================================================
-- STOCKFLOW INVENTORY MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'manager', 'sales', 'loader');
    CREATE TYPE movement_type AS ENUM ('in', 'out', 'transfer', 'adjustment');
    CREATE TYPE restock_status AS ENUM ('requested', 'approved', 'ordered', 'received', 'rejected');
    CREATE TYPE restock_urgency AS ENUM ('low', 'medium', 'high');
    CREATE TYPE po_status AS ENUM ('draft', 'ordered', 'partially_received', 'received', 'cancelled');
    CREATE TYPE customer_order_status AS ENUM ('pending', 'confirmed', 'packed', 'loaded', 'delivered', 'cancelled');
    CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid');
    CREATE TYPE vehicle_status AS ENUM ('available', 'on_route', 'maintenance');
    CREATE TYPE loading_task_status AS ENUM ('assigned', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES

-- Business Settings
CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL DEFAULT 'My Business',
    logo_url TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    setup_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'sales',
    assigned_warehouse_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add Foreign key constraint to profiles for assigned_warehouse_id
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS fk_profiles_warehouse;
ALTER TABLE public.profiles
    ADD CONSTRAINT fk_profiles_warehouse
    FOREIGN KEY (assigned_warehouse_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE,
    category TEXT NOT NULL DEFAULT 'General',
    unit TEXT NOT NULL DEFAULT 'pcs',
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    default_selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reorder_level INT NOT NULL DEFAULT 10,
    optimal_stock INT NOT NULL DEFAULT 100,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    description TEXT,
    images TEXT[] DEFAULT '{}',
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Warehouse Stock
CREATE TABLE IF NOT EXISTS public.warehouse_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(warehouse_id, product_id)
);

-- Daily Selling Prices
CREATE TABLE IF NOT EXISTS public.daily_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, date)
);

-- Price History Log
CREATE TABLE IF NOT EXISTS public.price_history_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    old_price NUMERIC(12, 2),
    new_price NUMERIC(12, 2) NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stock Movements
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    source_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    destination_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    movement_type movement_type NOT NULL,
    reason TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Restock Requests (Sales team -> Owner/Manager)
CREATE TABLE IF NOT EXISTS public.restock_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    quantity_needed INT NOT NULL CHECK (quantity_needed > 0),
    urgency restock_urgency NOT NULL DEFAULT 'medium',
    note TEXT,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status restock_status NOT NULL DEFAULT 'requested',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase Orders (Reordering)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number TEXT UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    status po_status NOT NULL DEFAULT 'draft',
    total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    expected_date DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    quantity_ordered INT NOT NULL CHECK (quantity_ordered > 0),
    quantity_received INT NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- Customer Orders & Sales
CREATE TABLE IF NOT EXISTS public.customer_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    status customer_order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer Order Items
CREATE TABLE IF NOT EXISTS public.customer_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_order_id UUID NOT NULL REFERENCES public.customer_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0)
);

-- Vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    plate_number TEXT UNIQUE NOT NULL,
    driver_name TEXT,
    capacity_kg NUMERIC(10, 2),
    status vehicle_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loading Tasks (Assign to Loader)
CREATE TABLE IF NOT EXISTS public.loading_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_number TEXT UNIQUE NOT NULL,
    customer_order_id UUID REFERENCES public.customer_orders(id) ON DELETE CASCADE,
    source_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    assigned_loader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status loading_task_status NOT NULL DEFAULT 'assigned',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loading Task Items
CREATE TABLE IF NOT EXISTS public.loading_task_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loading_task_id UUID NOT NULL REFERENCES public.loading_tasks(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity_to_load INT NOT NULL CHECK (quantity_to_load > 0),
    quantity_loaded INT NOT NULL DEFAULT 0 CHECK (quantity_loaded >= 0),
    is_loaded BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_stock_wh_prod ON public.warehouse_stock(warehouse_id, product_id);
CREATE INDEX IF NOT EXISTS idx_daily_prices_prod_date ON public.daily_prices(product_id, date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_restock_req_status ON public.restock_requests(status);
CREATE INDEX IF NOT EXISTS idx_po_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_cust_orders_status ON public.customer_orders(status);
CREATE INDEX IF NOT EXISTS idx_loading_tasks_loader ON public.loading_tasks(assigned_loader_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loading_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loading_task_items ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = user_id AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Universal Read Access for authenticated active users
CREATE POLICY "Auth Users Read Settings" ON public.business_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Users Read Profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Users Read Warehouses" ON public.warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Users Read Products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Users Read Stock" ON public.warehouse_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Users Read Daily Prices" ON public.daily_prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Users Read Vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);

-- Financial Restrictions: Sales & Loader cannot see Suppliers or PO costs directly unless permitted
CREATE POLICY "Owner & Manager Read Suppliers" ON public.suppliers FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager'));
CREATE POLICY "Sales Read Basic Suppliers" ON public.suppliers FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'sales');

CREATE POLICY "Owner & Manager & Sales Read POs" ON public.purchase_orders FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager', 'sales'));

CREATE POLICY "Owner & Manager Read Restock Requests" ON public.restock_requests FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager') OR requested_by = auth.uid());

-- Customer Orders Read
CREATE POLICY "Owner Manager Sales Read Orders" ON public.customer_orders FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager', 'sales'));

-- Loading Tasks Read
CREATE POLICY "Loader Read Assigned Tasks" ON public.loading_tasks FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager') OR assigned_loader_id = auth.uid());

CREATE POLICY "Loader Read Assigned Task Items" ON public.loading_task_items FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.loading_tasks lt
            WHERE lt.id = loading_task_items.loading_task_id
            AND (lt.assigned_loader_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('owner', 'manager'))
        )
    );

-- Write Access Policies
-- Business Settings: Owner only
CREATE POLICY "Owner Write Settings" ON public.business_settings FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'owner');

-- Profiles Write: Owner can update all; Manager can update non-owners; Users can update own profile name/phone
CREATE POLICY "Owner & Manager Write Profiles" ON public.profiles FOR ALL TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'owner' OR
        (public.get_user_role(auth.uid()) = 'manager' AND role != 'owner') OR
        id = auth.uid()
    );

-- Operations (Products, Warehouses, Suppliers, POs, Daily Prices): Owner & Manager
CREATE POLICY "Owner Manager Write Warehouses" ON public.warehouses FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager'));

CREATE POLICY "Owner Manager Write Products" ON public.products FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager'));

CREATE POLICY "Owner Manager Write Suppliers" ON public.suppliers FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager'));

CREATE POLICY "Owner Manager Write Daily Prices" ON public.daily_prices FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager'));

CREATE POLICY "Owner Manager Write Purchase Orders" ON public.purchase_orders FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager'));

CREATE POLICY "Owner Manager Write PO Items" ON public.purchase_order_items FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager'));

-- Restock Requests: Sales can insert; Owner/Manager can update status
CREATE POLICY "Sales Create Restock Request" ON public.restock_requests FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role(auth.uid()) IN ('sales', 'owner', 'manager'));

CREATE POLICY "Owner Manager Update Restock Request" ON public.restock_requests FOR UPDATE TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager'));

-- Customer Orders: Sales, Manager, Owner can insert & update
CREATE POLICY "Sales Owner Manager Write Orders" ON public.customer_orders FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('sales', 'owner', 'manager'));

CREATE POLICY "Sales Owner Manager Write Order Items" ON public.customer_order_items FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('sales', 'owner', 'manager'));

-- Loading Tasks & Loader Update
CREATE POLICY "Owner Manager Write Vehicles" ON public.vehicles FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager'));

CREATE POLICY "Owner Manager Write Loading Tasks" ON public.loading_tasks FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('owner', 'manager'));

CREATE POLICY "Loader Update Loading Task Items" ON public.loading_task_items FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.loading_tasks lt
            WHERE lt.id = loading_task_items.loading_task_id
            AND (lt.assigned_loader_id = auth.uid() OR public.get_user_role(auth.uid()) IN ('owner', 'manager'))
        )
    );

-- 5. ATOMIC PROCEDURES FOR SAFE STOCK CALCULATIONS (Preventing Negative Stock & Race Conditions)

CREATE OR REPLACE FUNCTION public.execute_stock_movement(
    p_product_id UUID,
    p_source_wh_id UUID,
    p_dest_wh_id UUID,
    p_quantity INT,
    p_type movement_type,
    p_reason TEXT,
    p_user_id UUID
) RETURNS VOID AS $$
DECLARE
    v_source_qty INT := 0;
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than zero.';
    END IF;

    -- Validate source warehouse stock if deduction is required
    IF p_type IN ('out', 'transfer') THEN
        IF p_source_wh_id IS NULL THEN
            RAISE EXCEPTION 'Source warehouse is required for % movement.', p_type;
        END IF;

        SELECT quantity INTO v_source_qty
        FROM public.warehouse_stock
        WHERE warehouse_id = p_source_wh_id AND product_id = p_product_id;

        IF v_source_qty IS NULL OR v_source_qty < p_quantity THEN
            RAISE EXCEPTION 'Insufficient stock in source warehouse. Available: %, Requested: %', COALESCE(v_source_qty, 0), p_quantity;
        END IF;

        -- Deduct source stock
        UPDATE public.warehouse_stock
        SET quantity = quantity - p_quantity, updated_at = NOW()
        WHERE warehouse_id = p_source_wh_id AND product_id = p_product_id;
    END IF;

    -- Add destination warehouse stock if addition is required
    IF p_type IN ('in', 'transfer') THEN
        IF p_dest_wh_id IS NULL THEN
            RAISE EXCEPTION 'Destination warehouse is required for % movement.', p_type;
        END IF;

        INSERT INTO public.warehouse_stock (warehouse_id, product_id, quantity, updated_at)
        VALUES (p_dest_wh_id, p_product_id, p_quantity, NOW())
        ON CONFLICT (warehouse_id, product_id)
        DO UPDATE SET quantity = warehouse_stock.quantity + p_quantity, updated_at = NOW();
    END IF;

    -- Adjustment override
    IF p_type = 'adjustment' THEN
        IF p_dest_wh_id IS NULL THEN
            RAISE EXCEPTION 'Warehouse is required for stock adjustment.';
        END IF;

        INSERT INTO public.warehouse_stock (warehouse_id, product_id, quantity, updated_at)
        VALUES (p_dest_wh_id, p_product_id, p_quantity, NOW())
        ON CONFLICT (warehouse_id, product_id)
        DO UPDATE SET quantity = p_quantity, updated_at = NOW();
    END IF;

    -- Record Movement Log
    INSERT INTO public.stock_movements (
        product_id, source_warehouse_id, destination_warehouse_id, quantity, movement_type, reason, user_id
    ) VALUES (
        p_product_id, p_source_wh_id, p_dest_wh_id, p_quantity, p_type, p_reason, p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FIRST USER AUTO OWNER SETUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_user_count INT;
    v_role user_role;
BEGIN
    SELECT COUNT(*) INTO v_user_count FROM public.profiles;
    
    -- If first user ever, assign owner role
    IF v_user_count = 0 THEN
        v_role := 'owner';
    ELSE
        v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'sales');
    END IF;

    INSERT INTO public.profiles (id, email, full_name, phone, role, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone',
        v_role,
        TRUE
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. STORAGE BUCKET CREATION INSTRUCTIONS
-- Create a public bucket 'product-photos' in Supabase Storage with public access policy for images.
