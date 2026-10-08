import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ProductFormModal } from './ProductFormModal';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassSelect } from '../../components/ui/GlassSelect';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatCurrency } from '../../lib/utils';
import { Product } from '../../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  Eye,
  Tag,
  Boxes,
  Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProductsPage: React.FC = () => {
  const { user, businessSettings } = useAuth();
  const {
    products,
    categories,
    warehouses,
    getProductTotalStock,
    getProductStockInWarehouse,
    getProductEffectivePrice,
    archiveProduct,
  } = useData();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);

  // Filter & Search Logic
  const filteredProducts = products.filter((p) => {
    // Status Filter
    if (selectedStatus === 'active' && p.is_archived) return false;
    if (selectedStatus === 'archived' && !p.is_archived) return false;

    // Category Filter
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.name.toLowerCase().includes(q);
      const skuMatch = p.sku.toLowerCase().includes(q);
      const catMatch = p.category.toLowerCase().includes(q);
      if (!nameMatch && !skuMatch && !catMatch) return false;
    }

    // Warehouse stock availability filter
    if (selectedWarehouse !== 'all') {
      const qtyInWh = getProductStockInWarehouse(p.id, selectedWarehouse);
      if (qtyInWh <= 0) return false;
    }

    return true;
  });

  // Sort Logic
  filteredProducts.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'stock') return getProductTotalStock(b.id) - getProductTotalStock(a.id);
    if (sortBy === 'price') return getProductEffectivePrice(b.id) - getProductEffectivePrice(a.id);
    return 0;
  });

  const getStockBadge = (prod: Product) => {
    const qty = getProductTotalStock(prod.id);
    if (qty === 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (qty <= prod.reorder_level) return <Badge variant="warning">Low Stock ({qty})</Badge>;
    return <Badge variant="success">In Stock ({qty})</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Product Inventory Catalog
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage product specifications, pricing, stock rules, and multi-warehouse balances
          </p>
        </div>
        {isOwnerOrManager && (
          <GlassButton
            variant="primary"
            onClick={() => {
              setProductToEdit(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Product
          </GlassButton>
        )}
      </div>

      {/* Filter & Controls Toolbar */}
      <GlassCard className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <GlassInput
            placeholder="Search by name, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
          <GlassSelect
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { label: 'All Categories', value: 'all' },
              ...categories.map((c) => ({ label: c, value: c })),
            ]}
          />
          <GlassSelect
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            options={[
              { label: 'All Warehouses', value: 'all' },
              ...warehouses.map((w) => ({ label: w.name, value: w.id })),
            ]}
          />
          <GlassSelect
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { label: 'Active Catalog', value: 'active' },
              { label: 'Archived Items', value: 'archived' },
            ]}
          />
          <GlassSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            options={[
              { label: 'Sort by Name', value: 'name' },
              { label: 'Sort by Stock Level', value: 'stock' },
              { label: 'Sort by Price', value: 'price' },
            ]}
          />
        </div>
      </GlassCard>

      {/* Product List Content */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Products Found"
          description={
            searchQuery
              ? 'No products matched your search filter criteria.'
              : 'Your inventory catalog is empty. Click below to add your first real product.'
          }
          actionLabel={isOwnerOrManager ? 'Add Your First Product' : undefined}
          onAction={
            isOwnerOrManager
              ? () => {
                  setProductToEdit(null);
                  setIsFormOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredProducts.map((prod, index) => {
              const totalStock = getProductTotalStock(prod.id);
              const todayPrice = getProductEffectivePrice(prod.id);

              return (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                >
                  <GlassCard hoverEffect className="flex flex-col h-full justify-between p-5 space-y-4">
                    <div>
                      {/* Image & Header */}
                      <div className="flex items-start gap-3 mb-3">
                        {prod.images && prod.images.length > 0 ? (
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-white/50 dark:border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 flex items-center justify-center shrink-0 border border-brand-500/20">
                            <Package className="w-7 h-7" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              {prod.category}
                            </span>
                            {getStockBadge(prod)}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate mt-0.5">
                            {prod.name}
                          </h3>
                          <p className="text-xs font-mono text-slate-400">SKU: {prod.sku}</p>
                        </div>
                      </div>

                      {/* Details & Prices */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            Today Selling Price
                          </span>
                          <p className="text-sm font-black text-brand-600 dark:text-brand-400 mt-0.5">
                            {formatCurrency(todayPrice, businessSettings?.currency)}
                          </p>
                        </div>
                        {isOwnerOrManager ? (
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Cost Price</span>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                              {formatCurrency(prod.cost_price, businessSettings?.currency)}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Unit</span>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                              {prod.unit}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Stock breakdown across warehouses */}
                      <div className="mt-3 space-y-1">
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Warehouse Stock Breakdown:
                        </p>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1 text-xs">
                          {warehouses.map((wh) => {
                            const whQty = getProductStockInWarehouse(prod.id, wh.id);
                            return (
                              <div key={wh.id} className="flex justify-between text-slate-600 dark:text-slate-400 py-0.5 border-b border-slate-100 dark:border-slate-800/40">
                                <span className="truncate">{wh.name}</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {whQty} {prod.unit}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {isOwnerOrManager && (
                      <div className="flex gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <GlassButton
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setProductToEdit(prod);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                        </GlassButton>
                        {!prod.is_archived && (
                          <GlassButton
                            size="sm"
                            variant="ghost"
                            onClick={() => setArchiveTarget(prod)}
                            className="text-rose-500 hover:bg-rose-500/10"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </GlassButton>
                        )}
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Product Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productToEdit={productToEdit}
      />

      {/* Confirm Archive Dialog */}
      {archiveTarget && (
        <ConfirmDialog
          isOpen={Boolean(archiveTarget)}
          onClose={() => setArchiveTarget(null)}
          onConfirm={async () => {
            await archiveProduct(archiveTarget.id);
            setArchiveTarget(null);
          }}
          title="Archive Product"
          message={`Are you sure you want to archive "${archiveTarget.name}"? It will be hidden from active inventory.`}
          confirmLabel="Archive"
        />
      )}
    </div>
  );
};
