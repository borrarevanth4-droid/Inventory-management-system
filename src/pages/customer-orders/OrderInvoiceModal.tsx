import React from 'react';
import { GlassModal } from '../../components/ui/GlassModal';
import { GlassButton } from '../../components/ui/GlassButton';
import { CustomerOrder } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Printer, CheckCircle2, Building2 } from 'lucide-react';

interface OrderInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: CustomerOrder | null;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({ isOpen, onClose, order }) => {
  const { products, warehouses } = useData();
  const { businessSettings } = useAuth();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} maxWidth="2xl">
      <div className="space-y-6 p-2 printable-area">
        {/* Invoice Top Header */}
        <div className="flex justify-between items-start pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-brand-500" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {businessSettings?.company_name || 'StockFlow'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Official Sales Invoice & Receipt</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-brand-600 dark:text-brand-400">
              {order.order_number}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">Date: {formatDate(order.created_at)}</p>
          </div>
        </div>

        {/* Customer & Payment Info Grid */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Billed To:</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{order.customer_name}</p>
            {order.customer_phone && <p className="text-slate-400 mt-0.5">Phone: {order.customer_phone}</p>}
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Payment Status:</span>
            <p className="text-sm font-bold text-emerald-500 uppercase mt-0.5">{order.payment_status}</p>
            <p className="text-slate-400 mt-0.5">
              Paid: {formatCurrency(order.amount_paid, businessSettings?.currency)} / {formatCurrency(order.total_amount, businessSettings?.currency)}
            </p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/5 dark:bg-white/5 uppercase text-[10px] font-bold text-slate-400">
              <tr>
                <th className="p-3">Item Description</th>
                <th className="p-3">Warehouse</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              {order.items?.map((item) => {
                const prod = products.find((p) => p.id === item.product_id);
                const wh = warehouses.find((w) => w.id === item.warehouse_id);
                const lineTotal = item.quantity * item.unit_price;

                return (
                  <tr key={item.id}>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{prod?.name || 'Item'}</td>
                    <td className="p-3 text-slate-400">{wh?.name}</td>
                    <td className="p-3 text-right font-bold">{item.quantity}</td>
                    <td className="p-3 text-right">{formatCurrency(item.unit_price, businessSettings?.currency)}</td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(lineTotal, businessSettings?.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary */}
        <div className="flex flex-col items-end pt-4 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
          {order.discount > 0 && (
            <div className="flex justify-between w-48 text-slate-400">
              <span>Discount Applied:</span>
              <span className="font-semibold text-rose-500">
                -{formatCurrency(order.discount, businessSettings?.currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between w-48 text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>Grand Total:</span>
            <span className="text-brand-600 dark:text-brand-400">
              {formatCurrency(order.total_amount, businessSettings?.currency)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-200/50 dark:border-slate-800/50 no-print">
          <GlassButton variant="outline" onClick={onClose}>
            Close
          </GlassButton>
          <GlassButton variant="primary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print Invoice
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
};
