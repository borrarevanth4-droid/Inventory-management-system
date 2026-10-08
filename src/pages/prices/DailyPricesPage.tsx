import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassSelect } from '../../components/ui/GlassSelect';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Tag, Calendar, CheckCircle2, RefreshCw, History, Percent, DollarSign, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const DailyPricesPage: React.FC = () => {
  const { user, businessSettings } = useAuth();
  const {
    products,
    categories,
    dailyPrices,
    priceLogs,
    setDailyPrice,
    bulkUpdateDailyPrices,
    getProductEffectivePrice,
    hasPriceConfirmedForToday,
  } = useData();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'prices' | 'history'>('prices');

  // Bulk Edit Form State
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [bulkAdjustmentValue, setBulkAdjustmentValue] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  const activeProducts = products.filter((p) => !p.is_archived && (selectedCategory === 'all' || p.category === selectedCategory));

  const handlePriceChange = (productId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setPriceOverrides((prev) => ({ ...prev, [productId]: num }));
  };

  const handleApplyBulkRules = () => {
    const val = parseFloat(bulkAdjustmentValue) || 0;
    if (val === 0) return;

    const newOverrides: Record<string, number> = { ...priceOverrides };
    for (const prod of activeProducts) {
      const currentPrice = getProductEffectivePrice(prod.id, selectedDate);
      if (bulkAdjustmentType === 'percentage') {
        newOverrides[prod.id] = parseFloat((currentPrice * (1 + val / 100)).toFixed(2));
      } else {
        newOverrides[prod.id] = Math.max(0, parseFloat((currentPrice + val).toFixed(2)));
      }
    }
    setPriceOverrides(newOverrides);
  };

  const handleSavePrices = async () => {
    setIsLoading(true);
    try {
      const updates = Object.entries(priceOverrides).map(([productId, price]) => ({
        productId,
        price,
      }));

      // If no override typed, preserve existing/default
      for (const prod of activeProducts) {
        if (priceOverrides[prod.id] === undefined) {
          updates.push({
            productId: prod.id,
            price: getProductEffectivePrice(prod.id, selectedDate),
          });
        }
      }

      await bulkUpdateDailyPrices(selectedDate, updates);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-500" />
            Daily Selling Prices Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Set and override daily selling prices per product. Sales orders strictly use prices effective for the date of sale.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {hasPriceConfirmedForToday ? (
            <Badge variant="success" size="md">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Today's Prices Confirmed
            </Badge>
          ) : (
            <Badge variant="warning" size="md">
              <AlertCircle className="w-4 h-4 mr-1" />
              Today's Prices Unconfirmed
            </Badge>
          )}
        </div>
      </div>

      {/* Date & Category Selection Toolbar */}
      <GlassCard className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar className="w-5 h-5 text-brand-500 shrink-0" />
          <div className="w-full sm:w-48">
            <GlassInput
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full sm:w-64">
          <GlassSelect
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { label: 'All Product Categories', value: 'all' },
              ...categories.map((c) => ({ label: c, value: c })),
            ]}
          />
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex border-b border-slate-200/60 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('prices')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'prices'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Daily Price Grid for {selectedDate}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Price Change Audit Log ({priceLogs.length})
        </button>
      </div>

      {/* Tab 1: Price Grid & Bulk Tools */}
      {activeTab === 'prices' && (
        <div className="space-y-6">
          {/* Bulk Update Controls for Owner/Manager */}
          {isOwnerOrManager && (
            <GlassCard className="p-4 bg-brand-500/5 dark:bg-brand-500/10 border-brand-500/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-3">
                Bulk Price Adjustment Utility
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <GlassSelect
                  label="Adjustment Type"
                  value={bulkAdjustmentType}
                  onChange={(e) => setBulkAdjustmentType(e.target.value as any)}
                  options={[
                    { label: 'Percentage Change (%)', value: 'percentage' },
                    { label: 'Fixed Amount ($)', value: 'fixed' },
                  ]}
                />
                <GlassInput
                  label="Value (+ or -)"
                  type="number"
                  step="0.1"
                  placeholder="e.g. +5 or -2.50"
                  value={bulkAdjustmentValue}
                  onChange={(e) => setBulkAdjustmentValue(e.target.value)}
                />
                <GlassButton variant="outline" type="button" onClick={handleApplyBulkRules}>
                  Apply to {activeProducts.length} Product(s)
                </GlassButton>
                <GlassButton variant="primary" type="button" onClick={handleSavePrices} isLoading={isLoading}>
                  Confirm & Save All Prices
                </GlassButton>
              </div>
            </GlassCard>
          )}

          {/* Inline Table */}
          <GlassCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/5 dark:bg-white/5 uppercase text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Default Selling</th>
                    <th className="p-4">Effective Price for {selectedDate}</th>
                    {isOwnerOrManager && <th className="p-4">Set Price Override ($)</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                  {activeProducts.map((prod) => {
                    const effective = getProductEffectivePrice(prod.id, selectedDate);
                    const isOverride = dailyPrices.some(
                      (dp) => dp.product_id === prod.id && dp.date === selectedDate
                    );

                    return (
                      <tr key={prod.id} className="hover:bg-slate-500/5 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          {prod.name}
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-400">{prod.sku}</td>
                        <td className="p-4 text-slate-400">{prod.category}</td>
                        <td className="p-4 text-slate-500">
                          {formatCurrency(prod.default_selling_price, businessSettings?.currency)}
                        </td>
                        <td className="p-4 font-extrabold text-brand-600 dark:text-brand-400">
                          {formatCurrency(effective, businessSettings?.currency)}
                          {isOverride && (
                            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
                              Override
                            </span>
                          )}
                        </td>
                        {isOwnerOrManager && (
                          <td className="p-4 w-48">
                            <GlassInput
                              type="number"
                              step="0.01"
                              placeholder={String(effective)}
                              value={priceOverrides[prod.id] ?? ''}
                              onChange={(e) => handlePriceChange(prod.id, e.target.value)}
                            />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab 2: Price History Log */}
      {activeTab === 'history' && (
        <GlassCard>
          {priceLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No price adjustments logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {priceLogs.map((log) => {
                const prod = products.find((p) => p.id === log.product_id);
                return (
                  <div
                    key={log.id}
                    className="flex justify-between items-center p-3.5 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{prod?.name || 'Product'}</p>
                      <p className="text-slate-400 mt-0.5">Date: {log.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 line-through mr-2">
                        {formatCurrency(log.old_price || 0, businessSettings?.currency)}
                      </span>
                      <span className="font-black text-brand-600 dark:text-brand-400 text-sm">
                        ➔ {formatCurrency(log.new_price, businessSettings?.currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
};
