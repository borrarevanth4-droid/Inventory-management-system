import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassSelect } from '../../components/ui/GlassSelect';
import { GlassModal } from '../../components/ui/GlassModal';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../lib/utils';
import { PurchaseOrder, POStatus } from '../../types';
import { PackageCheck, Plus, CheckCircle2, XCircle, Truck, Calendar, Trash2 } from 'lucide-react';

export const PurchaseOrdersPage: React.FC = () => {
  const { user, businessSettings } = useAuth();
  const {
    products,
    suppliers,
    warehouses,
    purchaseOrders,
    createPurchaseOrder,
    receivePurchaseOrder,
    cancelPurchaseOrder,
  } = useData();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);

  // New PO Form State
  const [selectedSupplier, setSelectedSupplier] = useState(suppliers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState('');
  const [poItems, setPoItems] = useState<
    { productId: string; warehouseId: string; quantity: number; unitCost: number }[]
  >([]);

  // Receive Form State
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleAddItem = () => {
    if (products.length === 0 || warehouses.length === 0) return;
    setPoItems((prev) => [
      ...prev,
      {
        productId: products[0].id,
        warehouseId: warehouses[0].id,
        quantity: 50,
        unitCost: products[0].cost_price || 10,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || poItems.length === 0) return;

    setIsLoading(true);
    try {
      await createPurchaseOrder(selectedSupplier, poItems, expectedDate || undefined);
      setIsCreateOpen(false);
      setPoItems([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPO) return;

    setIsLoading(true);
    try {
      await receivePurchaseOrder(receivingPO.id, receivedQtys);
      setReceivingPO(null);
      setReceivedQtys({});
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
            <PackageCheck className="w-6 h-6 text-brand-500" />
            Purchase Orders & Reordering
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Issue supplier purchase orders and automatically update stock levels upon receiving delivery
          </p>
        </div>
        {isOwnerOrManager && (
          <GlassButton
            variant="primary"
            onClick={() => {
              if (poItems.length === 0) handleAddItem();
              setIsCreateOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Purchase Order
          </GlassButton>
        )}
      </div>

      {/* Orders List */}
      {purchaseOrders.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title="No Purchase Orders"
          description="Create your first supplier purchase order to replenish warehouse stock."
          actionLabel={isOwnerOrManager ? 'Create Purchase Order' : undefined}
          onAction={
            isOwnerOrManager
              ? () => {
                  if (poItems.length === 0) handleAddItem();
                  setIsCreateOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {purchaseOrders.map((po) => {
            const supplier = suppliers.find((s) => s.id === po.supplier_id);

            return (
              <GlassCard key={po.id} hoverEffect className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">
                        {po.po_number}
                      </span>
                      <Badge
                        variant={
                          po.status === 'received'
                            ? 'success'
                            : po.status === 'partially_received'
                            ? 'warning'
                            : po.status === 'cancelled'
                            ? 'danger'
                            : 'info'
                        }
                      >
                        {po.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Supplier: {supplier?.name || 'Supplier'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Expected Arrival: {formatDate(po.expected_date)} • Created: {formatDate(po.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Financial Cost (Hidden for sales role) */}
                    {isOwnerOrManager && (
                      <div className="text-right">
                        <span className="text-xs text-slate-400 uppercase font-semibold">Total Cost</span>
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {formatCurrency(po.total_cost, businessSettings?.currency)}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {isOwnerOrManager && po.status !== 'received' && po.status !== 'cancelled' && (
                      <div className="flex items-center gap-2">
                        <GlassButton
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setReceivingPO(po);
                            const initialMap: Record<string, number> = {};
                            po.items?.forEach((item) => {
                              initialMap[item.id] = item.quantity_ordered - item.quantity_received;
                            });
                            setReceivedQtys(initialMap);
                          }}
                        >
                          <Truck className="w-4 h-4 mr-1.5" /> Receive Stock
                        </GlassButton>
                        <GlassButton
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelPurchaseOrder(po.id)}
                          className="text-rose-500 hover:bg-rose-500/10"
                        >
                          Cancel
                        </GlassButton>
                      </div>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                {po.items && po.items.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="space-y-1.5">
                      {po.items.map((item) => {
                        const prod = products.find((p) => p.id === item.product_id);
                        const wh = warehouses.find((w) => w.id === item.warehouse_id);

                        return (
                          <div
                            key={item.id}
                            className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 p-2 rounded-xl bg-white/40 dark:bg-slate-950/40"
                          >
                            <span>
                              <span className="font-bold text-slate-900 dark:text-white">{prod?.name}</span> (Wh: {wh?.name})
                            </span>
                            <span className="font-semibold">
                              Received: {item.quantity_received} / {item.quantity_ordered} {prod?.unit || 'pcs'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Create Purchase Order Modal */}
      <GlassModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Purchase Order"
        subtitle="Select supplier, destination warehouse, and quantities to order"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreatePO} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassSelect
              label="Select Supplier"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              options={suppliers.map((s) => ({ label: s.name, value: s.id }))}
            />
            <GlassInput
              label="Expected Arrival Date"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Order Line Items
              </label>
              <GlassButton type="button" size="sm" variant="outline" onClick={handleAddItem}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
              </GlassButton>
            </div>

            {poItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50">
                <div className="col-span-4">
                  <GlassSelect
                    value={item.productId}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].productId = e.target.value;
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod) updated[idx].unitCost = prod.cost_price;
                      setPoItems(updated);
                    }}
                    options={products.map((p) => ({ label: p.name, value: p.id }))}
                  />
                </div>
                <div className="col-span-3">
                  <GlassSelect
                    value={item.warehouseId}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].warehouseId = e.target.value;
                      setPoItems(updated);
                    }}
                    options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
                  />
                </div>
                <div className="col-span-2">
                  <GlassInput
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].quantity = parseInt(e.target.value) || 1;
                      setPoItems(updated);
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <GlassInput
                    type="number"
                    step="0.01"
                    value={item.unitCost}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].unitCost = parseFloat(e.target.value) || 0;
                      setPoItems(updated);
                    }}
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <GlassButton variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" isLoading={isLoading}>
              Issue Purchase Order
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Receive Goods Modal */}
      {receivingPO && (
        <GlassModal
          isOpen={Boolean(receivingPO)}
          onClose={() => setReceivingPO(null)}
          title={`Receive Goods - ${receivingPO.po_number}`}
          subtitle="Confirm quantities delivered into warehouse stock"
          maxWidth="lg"
        >
          <form onSubmit={handleReceiveGoods} className="space-y-4">
            <div className="space-y-3">
              {receivingPO.items?.map((item) => {
                const prod = products.find((p) => p.id === item.product_id);
                const wh = warehouses.find((w) => w.id === item.warehouse_id);
                const maxRem = item.quantity_ordered - item.quantity_received;

                return (
                  <div key={item.id} className="p-4 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                      <span>{prod?.name} (Wh: {wh?.name})</span>
                      <span className="text-xs font-semibold text-slate-400">
                        Remaining to receive: {maxRem} {prod?.unit}
                      </span>
                    </div>
                    <GlassInput
                      label="Quantity Received in this Batch"
                      type="number"
                      min="0"
                      max={maxRem}
                      value={receivedQtys[item.id] ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setReceivedQtys((prev) => ({ ...prev, [item.id]: val }));
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <GlassButton variant="outline" type="button" onClick={() => setReceivingPO(null)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit" isLoading={isLoading}>
                Confirm Delivery & Update Stock
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      )}
    </div>
  );
};
