import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, businessSettings } = useAuth();
  const {
    products,
    stocks,
    warehouses,
    movements,
    customerOrders,
    getProductTotalStock,
    createRestockRequest,
  } = useData();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  // Metrics Calculations
  const activeProducts = products.filter((p) => !p.is_archived);
  const totalStockUnits = activeProducts.reduce((sum, p) => sum + getProductTotalStock(p.id), 0);

  const stockValuation = activeProducts.reduce((sum, p) => {
    const qty = getProductTotalStock(p.id);
    return sum + qty * (p.cost_price || 0);
  }, 0);

  const lowStockItems = activeProducts.filter((p) => {
    const qty = getProductTotalStock(p.id);
    return qty > 0 && qty <= p.reorder_level;
  });

  const outOfStockItems = activeProducts.filter((p) => getProductTotalStock(p.id) === 0);

  // Today Sales & Revenue
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = customerOrders.filter((o) => o.created_at.startsWith(todayStr) && o.status !== 'cancelled');
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_amount, 0);

  // Warehouse Stock Distribution for Chart
  const warehouseChartData = warehouses.map((wh) => {
    const totalQty = stocks
      .filter((s) => s.warehouse_id === wh.id)
      .reduce((sum, s) => sum + s.quantity, 0);
    return { name: wh.name, stock: totalQty };
  });

  // Sales Trend Mock Data generator from real orders or last 7 days
  const salesTrendData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().slice(0, 10);
    const dayOrders = customerOrders.filter((o) => o.created_at.startsWith(dayStr) && o.status !== 'cancelled');
    const dayRev = dayOrders.reduce((sum, o) => sum + o.total_amount, 0);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: dayRev,
      orders: dayOrders.length,
    };
  });

  if (activeProducts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Overview Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Welcome to {businessSettings?.company_name || 'StockFlow'}. Start adding inventory to populate analytics.
          </p>
        </div>
        <EmptyState
          icon={Package}
          title="No Products in Inventory"
          description="Your catalog is currently empty. Add your first product to begin tracking stock levels, sales, and warehouse movements."
          actionLabel="Add Your First Product"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time stock monitoring, sales trends, and warehouse analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton variant="primary" onClick={() => navigate('/customer-orders')}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            New Customer Sale
          </GlassButton>
          <GlassButton variant="outline" onClick={() => navigate('/products')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </GlassButton>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Products */}
        <GlassCard hoverEffect>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Products</span>
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {activeProducts.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
            <span>{totalStockUnits.toLocaleString()} total units in stock</span>
          </p>
        </GlassCard>

        {/* Card 2: Stock Valuation or Total Units */}
        <GlassCard hoverEffect>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isOwnerOrManager ? 'Inventory Value' : 'Total Stock Units'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              {isOwnerOrManager ? <DollarSign className="w-5 h-5" /> : <Boxes className="w-5 h-5" />}
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {isOwnerOrManager ? formatCurrency(stockValuation, businessSettings?.currency) : totalStockUnits.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Across {warehouses.length} active warehouse location(s)
          </p>
        </GlassCard>

        {/* Card 3: Today Revenue */}
        <GlassCard hoverEffect>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today Sales</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(todayRevenue, businessSettings?.currency)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
            <span className="text-emerald-500 font-semibold">{todayOrders.length} order(s) placed today</span>
          </p>
        </GlassCard>

        {/* Card 4: Low & Out of Stock Alerts */}
        <GlassCard hoverEffect>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Alerts</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {lowStockItems.length}
            </span>
            <span className="text-xs text-slate-400">Low</span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 ml-2">
              {outOfStockItems.length}
            </span>
            <span className="text-xs text-slate-400">Out</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Requires immediate reorder attention
          </p>
        </GlassCard>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Line/Area Chart */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">7-Day Sales Trend</h3>
              <p className="text-xs text-slate-400">Revenue trajectory over the past week</p>
            </div>
            <Badge variant="brand">Live</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c8de4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0c8de4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0c8de4" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Warehouse Stock Bar Chart */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Warehouse Stock</h3>
              <p className="text-xs text-slate-400">Total units by warehouse</p>
            </div>
          </div>
          {warehouseChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warehouseChartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="stock" fill="#36a9f7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-12 text-center">No warehouse stock data available yet.</p>
          )}
        </GlassCard>
      </div>

      {/* Bottom Grid: Low Stock Alert Actions & Recent Movements Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts Panel with Quick Reorder Action */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Low-Stock Alert Panel</h3>
            </div>
            <Badge variant="warning">{lowStockItems.length + outOfStockItems.length} items</Badge>
          </div>

          {[...outOfStockItems, ...lowStockItems].length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {[...outOfStockItems, ...lowStockItems].slice(0, 6).map((item) => {
                const stock = getProductTotalStock(item.id);
                const suggestedReorder = Math.max(1, item.optimal_stock - stock);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        SKU: {item.sku} • Optimal: {item.optimal_stock} {item.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge variant={stock === 0 ? 'danger' : 'warning'}>
                          {stock === 0 ? 'OUT OF STOCK' : `${stock} left`}
                        </Badge>
                        <p className="text-[10px] text-slate-400 mt-1">Rec: +{suggestedReorder} {item.unit}</p>
                      </div>
                      <GlassButton
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const wh = warehouses[0];
                          if (wh) createRestockRequest(item.id, wh.id, suggestedReorder, 'high', 'Auto reorder from low stock alert');
                        }}
                      >
                        Restock
                      </GlassButton>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-emerald-500">All Stock Levels Healthy!</p>
              <p className="text-xs text-slate-400 mt-1">No products are currently below reorder thresholds.</p>
            </div>
          )}
        </GlassCard>

        {/* Recent Stock Movements Feed */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Stock Audit Movements</h3>
            <GlassButton size="sm" variant="ghost" onClick={() => navigate('/stock')}>
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </GlassButton>
          </div>

          {movements.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {movements.slice(0, 6).map((m) => {
                const prod = products.find((p) => p.id === m.product_id);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          m.movement_type === 'in'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : m.movement_type === 'out'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-brand-500/10 text-brand-500'
                        }`}
                      >
                        {m.movement_type === 'in' ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : m.movement_type === 'out' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <RefreshCw className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {prod?.name || 'Product'} ({m.movement_type.toUpperCase()})
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{m.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {m.movement_type === 'out' ? '-' : '+'}{m.quantity}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No stock movements recorded yet.
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
