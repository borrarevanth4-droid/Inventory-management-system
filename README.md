# StockFlow - Liquid Glass Inventory Management System

StockFlow is a production-grade, iOS "Liquid Glass" styled Inventory Management System built with React 18, Vite, TypeScript, Tailwind CSS, and Supabase.

---

## 🌟 Key Features

1. **iOS "Liquid Glass" Aesthetic:** Translucent frosted glass panels (`backdrop-blur-2xl`), smooth 60fps Framer Motion micro-animations, semantic stock badges, and seamless Light/Dark mode.
2. **Multi-Warehouse Stock Tracking:** Track live stock per warehouse with atomic stock movement procedures and zero negative stock enforcement.
3. **Daily Selling Prices:** Set daily selling price overrides per product for any date with bulk percentage/fixed calculation tools and price change audit logs.
4. **Role-Based Access Control (RBAC):**
   - **Owner:** Complete access to financials, profit estimates, settings, user management, and business profile.
   - **Manager:** Full operational access to inventory, pricing, warehouses, POs, and staff role assignment (except Owner).
   - **Sales Team:** Live stock lookup, daily prices, customer order placement, and restock requests. Cost/profit data hidden.
   - **Loader:** Restricted dedicated mobile task view to tick loaded items for assigned vehicles.
5. **Reordering & Purchase Orders:** Low-stock alerts automatically generate supplier purchase order suggestions with single-tap PO creation and inventory stock-in upon receiving.
6. **Customer Orders & Invoicing:** Sales orders use date-effective daily pricing, deduct stock upon confirmation, track payment status, and offer printable invoices.
7. **Vehicle Dispatch & Logistics:** Manage transport vehicles and assign loading tasks directly to loaders.
8. **Comprehensive Reports:** Inventory turnover ratios (COGS / Average Inventory), stock valuation audit, sales reports, and CSV export.

---

## 🛠️ Tech Stack & Setup Steps

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

### 2. Installation & Quick Start

```bash
# 1. Clone or navigate to repository directory
cd "StockFlow"

# 2. Install dependencies
npm install

# 3. Configure Environment Variables
# Copy .env.example to .env and insert your Supabase project credentials
cp .env.example .env

# 4. Start local Vite development server
npm run dev
```

---

## 🗄️ Database Setup (Supabase SQL)

1. Open your [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor**.
3. Copy the contents of [`supabase/schema.sql`](./supabase/schema.sql) and paste them into the SQL editor.
4. Run the query. This sets up all database tables, UUID extensions, RLS policies, atomic stock movement procedures, and user auto-role triggers.
5. In Supabase **Storage**, create a new public bucket named `product-photos`.

---

## 🚀 Testing & Usage Workflow

1. **First-Time Business Setup:**
   - Launch the application and click **Setup Your Business** or navigate to `/setup`.
   - Enter your Owner details and Company Name to initialize the owner profile.

2. **Populate Inventory & Pricing:**
   - Go to **Warehouses** to define storage locations.
   - Go to **Products** and click **Add New Product** to upload photos, set SKU, cost price, and stock reorder thresholds.
   - Go to **Daily Prices** to set or bulk update selling prices for today.

3. **Restocking & Purchasing:**
   - Go to **Stock** or **Restock Requests** to raise a replenishment request.
   - Go to **Purchase Orders** to issue a PO to a supplier, and click **Receive Stock** upon arrival to automatically update inventory.

4. **Customer Sales & Invoicing:**
   - Go to **Customer Orders** and click **Create New Sale Order**.
   - Select items (auto-priced with today's price) and confirm order to deduct warehouse stock and view/print the invoice.

5. **Vehicle Dispatch:**
   - Go to **Vehicles & Logistics** to register delivery trucks and assign loading tasks to Loaders.
   - Log in as a **Loader** to see the dedicated checklist UI and mark items loaded into vehicles.
