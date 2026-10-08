import React, { useState } from 'react';
import { GlassModal } from '../../components/ui/GlassModal';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassSelect } from '../../components/ui/GlassSelect';
import { useData } from '../../context/DataContext';
import { MovementType } from '../../types';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({ isOpen, onClose }) => {
  const { products, warehouses, executeStockMovement, getProductStockInWarehouse } = useData();

  const [type, setType] = useState<MovementType>('transfer');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [sourceWhId, setSourceWhId] = useState(warehouses[0]?.id || '');
  const [destWhId, setDestWhId] = useState(warehouses[1]?.id || warehouses[0]?.id || '');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sourceQty = productId && sourceWhId ? getProductStockInWarehouse(productId, sourceWhId) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    setIsLoading(true);
    try {
      const qty = parseInt(quantity) || 1;
      const success = await executeStockMovement(
        productId,
        type === 'in' ? undefined : sourceWhId,
        type === 'out' ? undefined : destWhId,
        qty,
        type,
        reason || `${type.toUpperCase()} Movement`
      );
      if (success) onClose();
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
      title="Transfer & Move Stock"
      subtitle="Log warehouse transfers, stock in arrivals, or stock out dispatches"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <GlassSelect
          label="Movement Type"
          value={type}
          onChange={(e) => setType(e.target.value as MovementType)}
          options={[
            { label: 'Warehouse Transfer', value: 'transfer' },
            { label: 'Stock In (Incoming Batch)', value: 'in' },
            { label: 'Stock Out (Dispatch / Consumption)', value: 'out' },
          ]}
        />

        <GlassSelect
          label="Product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          options={products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }))}
        />

        {(type === 'transfer' || type === 'out') && (
          <GlassSelect
            label="Source Warehouse"
            value={sourceWhId}
            onChange={(e) => setSourceWhId(e.target.value)}
            options={warehouses.map((w) => ({ label: `${w.name} (Stock: ${getProductStockInWarehouse(productId, w.id)})`, value: w.id }))}
          />
        )}

        {(type === 'transfer' || type === 'in') && (
          <GlassSelect
            label="Destination Warehouse"
            value={destWhId}
            onChange={(e) => setDestWhId(e.target.value)}
            options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
          />
        )}

        {(type === 'transfer' || type === 'out') && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 font-medium">
            Available stock in selected source warehouse: {sourceQty} units.
          </div>
        )}

        <GlassInput
          label="Quantity to Move"
          type="number"
          min="1"
          max={type !== 'in' ? sourceQty : undefined}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <GlassInput
          label="Notes / Movement Reason"
          placeholder="e.g. Relocating stock to North Branch"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex gap-3 justify-end pt-3">
          <GlassButton variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </GlassButton>
          <GlassButton variant="primary" type="submit" isLoading={isLoading}>
            Execute Movement
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
};
