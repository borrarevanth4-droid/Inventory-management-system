import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassSelect } from '../../components/ui/GlassSelect';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, downloadCSV } from '../../lib/utils';
import { BarChart3, Download, Printer, TrendingUp, DollarSign, Boxes, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const ReportsPage: React.FC = () => {
  const { user, businessSettings } = useAuth();
  const {
    products,
    categories,
    warehouses,
    suppliers,
    customerOrders,
    purchaseOrders,
    movements,
    getProductTotalStock,
  } = useData();

  const [reportType, setReportType] = useState<
    'valuation' | 'turnover' | 'sales' | 'lowstock' | 'movements' | 'suppliers'
  >('valuation');

  const activeProducts = products.filter((p) => !p.is_archived);

  // Valuation Data
  const valuationRows = activeProducts.map((p) => {
    const qty = getProductTotalStock(p.id);
    const value = qty * p.cost_price;
    return { name: p.name, sku: p.sku, category: p.category, stock: qty, cost: p.cost_price, value };
  });
  const totalValuation = valuationRows.reduce((sum, r) => sum + r.value, 0);

  // Inventory Turnover Data (COGS / Inventory)
  const turnoverRows = activeProducts.map((p) => {
    const qty = getProductTotalStock(p.id);
    const avgInvValue = Math.max(1, qty * p.cost_price);
    // Sold qty
    const soldQty = customerOrders.reduce((sum, order) => {
      const line = order.items?.find((i) => i.product_id === p.id);
      return sum + (line ? line.quantity : 0);
    }, 0);
    const cogs = soldQty * p.cost_price;
    const turnoverRatio = parseFloat((cogs / avgInvValue).toFixed(2));
    return { name: p.name, category: p.category, soldQty, cogs, turnoverRatio };
  });

  const handleExportCSV = () => {
    if (reportType === 'valuation') {
      const headers = ['Product Name', 'SKU', 'Category', 'Stock Quantity', 'Unit Cost Price', 'Total Valuation'];
      const rows = valuationRows.map((r) => [r.name, r.sku, r.category, r.stock, r.cost, r.value]);
      downloadCSV('Stock_Valuation_Report.csv', headers, rows);
    } else if (reportType === 'turnover') {
      const headers = ['Product Name', 'Category', 'Units Sold', 'COGS', 'Turnover Ratio'];
      const rows = turnoverRows.map((r) => [r.name, r.category, r.soldQty, r.cogs, r.turnoverRatio]);
      downloadCSV('Inventory_Turnover_Report.csv', headers, rows);
    } else if (reportType === 'sales') {
      const headers = ['Order Number', 'Customer', 'Date', 'Status', 'Total Amount', 'Payment'];
      const rows = customerOrders.map((o) => [o.order_number, o.customer_name, o.created_at, o.status, o.total_amount, o.payment_status]);
      downloadCSV('Sales_Report.csv', headers, rows);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-500" />
            Inventory Analytics & Financial Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Turnover ratios, stock valuation audit, sales metrics, and export capabilities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </GlassButton>
          <GlassButton variant="primary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print / PDF
          </GlassButton>
        </div>
      </div>

      {/* Report Selector Controls */}
      <GlassCard className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-80">
          <GlassSelect
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            options={[
              { label: 'Stock Valuation Report', value: 'valuation' },
              { label: 'Inventory Turnover Ratio', value: 'turnover' },
              { label: 'Sales & Revenue Summary', value: 'sales' },
              { label: 'Low Stock & Reorder Report', value: 'lowstock' },
              { label: 'Supplier Purchasing Summary', value: 'suppliers' },
            ]}
          />
        </div>

        {reportType === 'valuation' && (
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Stock Valuation</span>
            <p className="text-2xl font-black text-emerald-500">
              {formatCurrency(totalValuation, businessSettings?.currency)}
            </p>
          </div>
        )}
      </GlassCard>

      {/* Valuation Report */}
      {reportType === 'valuation' && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/5 dark:bg-white/5 uppercase text-[11px] font-bold text-slate-400">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Units in Stock</th>
                  <th className="p-4 text-right">Unit Cost</th>
                  <th className="p-4 text-right">Total Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {valuationRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-500/5">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{r.name}</td>
                    <td className="p-4 font-mono text-xs text-slate-400">{r.sku}</td>
                    <td className="p-4 text-slate-400">{r.category}</td>
                    <td className="p-4 text-right font-bold">{r.stock}</td>
                    <td className="p-4 text-right">{formatCurrency(r.cost, businessSettings?.currency)}</td>
                    <td className="p-4 text-right font-black text-brand-600 dark:text-brand-400">
                      {formatCurrency(r.value, businessSettings?.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Turnover Report */}
      {reportType === 'turnover' && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/5 dark:bg-white/5 uppercase text-[11px] font-bold text-slate-400">
                <tr>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Units Sold</th>
                  <th className="p-4 text-right">Cost of Goods Sold (COGS)</th>
                  <th className="p-4 text-right">Turnover Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {turnoverRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-500/5">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{r.name}</td>
                    <td className="p-4 text-slate-400">{r.category}</td>
                    <td className="p-4 text-right font-bold">{r.soldQty}</td>
                    <td className="p-4 text-right">{formatCurrency(r.cogs, businessSettings?.currency)}</td>
                    <td className="p-4 text-right font-black text-brand-600 dark:text-brand-400">
                      {r.turnoverRatio}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
