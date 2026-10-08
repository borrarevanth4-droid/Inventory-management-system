import React, { useState } from 'react';
import { GlassModal } from '../../components/ui/GlassModal';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassSelect } from '../../components/ui/GlassSelect';
import { useData } from '../../context/DataContext';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  warehouseId?: string;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  productId,
  warehouseId,
}) => {
  const { products, warehouses, executeStockMovement, getProductStockInWarehouse } = useData();

  const [selectedProduct, setSelectedProduct] = useState(productId || products[0]?.id || '');
  const [selectedWh, setSelectedWh] = useState(warehouseId || warehouses[0]?.id || '');
  const [newQuantity, setNewQuantity] = useState('0');
  const [reason, setReason] = useState('Inventory Correction');
  const [isLoading, setIsLoading] = useState(false);

  const currentQty = selectedProduct && selectedWh ? getProductStockInWarehouse(selectedProduct, selectedWh) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedWh) return;

    setIsLoading(true);
    try {
      const qty = parseInt(newQuantity) || 0;
      await executeStockMovement(
        selectedProduct,
        undefined,
        selectedWh,
        qty,
        'adjustment',
        `Adjustment: ${reason}`
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Level Adjustment"
      subtitle="Manually override inventory quantity in a warehouse (with audit log)"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <GlassSelect
          label="Target Product"
          value={selectedProduct}
          onChange={(e) => {
            setSelectedProduct(e.target.value);
            const qty = getProductStockInWarehouse(e.target.value, selectedWh);
            setNewQuantity(String(qty));
          }}
          options={products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }))}
        />

        <GlassSelect
          label="Warehouse Location"
          value={selectedWh}
          onChange={(e) => {
            setSelectedWh(e.target.value);
            const qty = getProductStockInWarehouse(selectedProduct, e.target.value);
            setNewQuantity(String(qty));
          }}
          options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
        />

        <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center text-xs">
          <span className="text-slate-400">Current Recorded Stock:</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{currentQty} units</span>
        </div>

        <GlassInput
          label="New Adjusted Total Quantity"
          type="number"
          value={newQuantity}
          onChange={(e) => setNewQuantity(e.target.value)}
          required
        />

        <GlassSelect
          label="Adjustment Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={[
            { label: 'Inventory Correction', value: 'Inventory Correction' },
            { label: 'Damaged / Expired Goods', value: 'Damaged / Expired Goods' },
            { label: 'Customer Return', value: 'Customer Return' },
            { label: 'Supplier Audit Count', value: 'Supplier Audit Count' },
            { label: 'Shrinkage / Theft Loss', value: 'Shrinkage / Theft Loss' },
          ]}
        />

        <div className="flex gap-3 justify-end pt-3">
          <GlassButton variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </GlassButton>
          <GlassButton variant="primary" type="submit" isLoading={isLoading}>
            Confirm Adjustment
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
};
