import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassSelect } from '../../components/ui/GlassSelect';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { StockMovementModal } from './StockMovementModal';
import { formatDate } from '../../lib/utils';
import {
  Boxes,
  ArrowLeftRight,
  SlidersHorizontal,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Building2,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const StockPage: React.FC = () => {
  const { user } = useAuth();
  const {
    products,
    warehouses,
    movements,
    getProductTotalStock,
    getProductStockInWarehouse,
  } = useData();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [activeTab, setActiveTab] = useState<'levels' | 'audit'>('levels');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [movementFilter, setMovementFilter] = useState<string>('all');

  // Modal Controls
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [targetProdId, setTargetProdId] = useState<string | undefined>();
  const [targetWhId, setTargetWhId] = useState<string | undefined>();

  const activeProducts = products.filter((p) => !p.is_archived);

  // Filtered Inventory Stock Items
  const filteredProducts = activeProducts.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    if (selectedWarehouse !== 'all') {
      const whQty = getProductStockInWarehouse(p.id, selectedWarehouse);
      if (whQty === 0) return false;
    }
    return true;
  });

  // Filtered Movements Log
  const filteredMovements = movements.filter((m) => {
    if (movementFilter !== 'all' && m.movement_type !== movementFilter) return false;
    if (searchQuery) {
      const prod = products.find((p) => p.id === m.product_id);
      const q = searchQuery.toLowerCase();
      if (!prod?.name.toLowerCase().includes(q) && !m.reason.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Title & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Stock Levels & Movements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track product balance per warehouse location, adjust stock, and review audit trail
          </p>
        </div>
        {isOwnerOrManager && (
          <div className="flex items-center gap-3">
            <GlassButton variant="primary" onClick={() => setIsMovementModalOpen(true)}>
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Transfer / Move Stock
            </GlassButton>
            <GlassButton variant="outline" onClick={() => setIsAdjustModalOpen(true)}>
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Adjust Stock
            </GlassButton>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200/60 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('levels')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'levels'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Warehouse Stock Matrix
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Audit Movement Log ({movements.length})
        </button>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-72">
          <GlassInput
            placeholder="Search product or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        {activeTab === 'levels' ? (
          <div className="w-full sm:w-64">
            <GlassSelect
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              options={[
                { label: 'All Warehouses', value: 'all' },
                ...warehouses.map((w) => ({ label: w.name, value: w.id })),
              ]}
            />
          </div>
        ) : (
          <div className="w-full sm:w-64">
            <GlassSelect
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              options={[
                { label: 'All Movement Types', value: 'all' },
                { label: 'Stock Transfers', value: 'transfer' },
                { label: 'Stock In', value: 'in' },
                { label: 'Stock Out', value: 'out' },
                { label: 'Manual Adjustments', value: 'adjustment' },
              ]}
            />
          </div>
        )}
      </GlassCard>

      {/* Tab 1: Stock Matrix */}
      {activeTab === 'levels' && (
        <>
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No Stock Items Found"
              description="No product stock records match your filters."
            />
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((prod) => {
                const totalStock = getProductTotalStock(prod.id);
                const optimal = prod.optimal_stock || 100;
                const percent = Math.min(100, Math.round((totalStock / optimal) * 100));

                return (
                  <GlassCard key={prod.id} hoverEffect className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Product Header */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 font-bold border border-brand-500/20">
                          <Boxes className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{prod.name}</h3>
                            <span className="text-xs font-mono text-slate-400">({prod.sku})</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Category: {prod.category} • Reorder Threshold: {prod.reorder_level} {prod.unit}
                          </p>
                        </div>
                      </div>

                      {/* Animated Stock Progress Bar */}
                      <div className="flex-1 max-w-xs">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-slate-400">Optimal Fill:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {totalStock} / {optimal} {prod.unit} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              totalStock === 0
                                ? 'bg-rose-500'
                                : totalStock <= prod.reorder_level
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Stock Quick Actions */}
                      {isOwnerOrManager && (
                        <div className="flex items-center gap-2">
                          <GlassButton
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTargetProdId(prod.id);
                              setIsAdjustModalOpen(true);
                            }}
                          >
                            Adjust
                          </GlassButton>
                        </div>
                      )}
                    </div>

                    {/* Warehouse Breakdowns Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                      {warehouses.map((wh) => {
                        const qty = getProductStockInWarehouse(prod.id, wh.id);
                        return (
                          <div
                            key={wh.id}
                            className="p-2.5 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/40 text-center"
                          >
                            <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                              {wh.name}
                            </span>
                            <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
                              {qty} {prod.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Audit Trail Feed */}
      {activeTab === 'audit' && (
        <GlassCard>
          {filteredMovements.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No movement audit logs found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMovements.map((m) => {
                const prod = products.find((p) => p.id === m.product_id);
                const srcWh = warehouses.find((w) => w.id === m.source_warehouse_id);
                const destWh = warehouses.find((w) => w.id === m.destination_warehouse_id);

                return (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {prod?.name || 'Product'}
                          </span>
                          <Badge
                            variant={
                              m.movement_type === 'in'
                                ? 'success'
                                : m.movement_type === 'out'
                                ? 'danger'
                                : 'info'
                            }
                          >
                            {m.movement_type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Reason: {m.reason} • Path:{' '}
                          {srcWh ? srcWh.name : 'External'} ➔ {destWh ? destWh.name : 'External'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {m.movement_type === 'out' ? '-' : '+'}{m.quantity} {prod?.unit || 'units'}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* Modals */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        productId={targetProdId}
        warehouseId={targetWhId}
      />

      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
      />
    </div>
  );
};
