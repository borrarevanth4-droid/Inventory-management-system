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
import { OrderInvoiceModal } from './OrderInvoiceModal';
import { formatCurrency, formatDate } from '../../lib/utils';
import { CustomerOrder, CustomerOrderStatus, PaymentStatus } from '../../types';
import { ShoppingBag, Plus, Printer, CheckCircle2, DollarSign, Trash2, Tag, ArrowRight } from 'lucide-react';

export const CustomerOrdersPage: React.FC = () => {
  const { user, businessSettings } = useAuth();
  const {
    products,
    warehouses,
    customerOrders,
    getProductEffectivePrice,
    getProductStockInWarehouse,
    createCustomerOrder,
    updateOrderStatus,
    recordPayment,
  } = useData();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<CustomerOrder | null>(null);

  // New Order State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<
    { productId: string; warehouseId: string; quantity: number; unitPrice: number }[]
  >([]);

  // Payment Recording State
  const [payingOrder, setPayingOrder] = useState<CustomerOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  const activeProducts = products.filter((p) => !p.is_archived);

  const handleAddItem = () => {
    if (activeProducts.length === 0 || warehouses.length === 0) return;
    const prod = activeProducts[0];
    const price = getProductEffectivePrice(prod.id);
    setOrderItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        warehouseId: warehouses[0].id,
        quantity: 1,
        unitPrice: price,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || orderItems.length === 0) return;

    setIsLoading(true);
    try {
      const disc = parseFloat(discount) || 0;
      const order = await createCustomerOrder(customerName, customerPhone, orderItems, disc, notes);
      setIsCreateOpen(false);
      setOrderItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setSelectedInvoiceOrder(order);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingOrder) return;

    setIsLoading(true);
    try {
      const amt = parseFloat(paymentAmount) || 0;
      await recordPayment(payingOrder.id, amt);
      setPayingOrder(null);
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
            <ShoppingBag className="w-6 h-6 text-brand-500" />
            Customer Orders & Sales
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create sales orders using today's selling prices, manage order lifecycle, and print invoices
          </p>
        </div>
        <GlassButton
          variant="primary"
          onClick={() => {
            if (orderItems.length === 0) handleAddItem();
            setIsCreateOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Sale Order
        </GlassButton>
      </div>

      {/* Orders List */}
      {customerOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Customer Sales Orders"
          description="Place your first customer sales order to initiate fulfillment and revenue tracking."
          actionLabel="Create First Sale Order"
          onAction={() => {
            if (orderItems.length === 0) handleAddItem();
            setIsCreateOpen(true);
          }}
        />
      ) : (
        <div className="space-y-4">
          {customerOrders.map((order) => {
            return (
              <GlassCard key={order.id} hoverEffect className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">
                        {order.order_number}
                      </span>
                      <Badge
                        variant={
                          order.status === 'delivered'
                            ? 'success'
                            : order.status === 'cancelled'
                            ? 'danger'
                            : 'info'
                        }
                      >
                        STATUS: {order.status.toUpperCase()}
                      </Badge>
                      <Badge
                        variant={
                          order.payment_status === 'paid'
                            ? 'success'
                            : order.payment_status === 'partial'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        PAYMENT: {order.payment_status.toUpperCase()}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Customer: {order.customer_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Phone: {order.customer_phone || 'N/A'} • Created: {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Total Amount</span>
                      <p className="text-base font-black text-slate-900 dark:text-white">
                        {formatCurrency(order.total_amount, businessSettings?.currency)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Paid: {formatCurrency(order.amount_paid, businessSettings?.currency)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <GlassButton
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedInvoiceOrder(order)}
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" /> Invoice
                      </GlassButton>

                      {order.payment_status !== 'paid' && (
                        <GlassButton
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setPayingOrder(order);
                            setPaymentAmount(String(order.total_amount - order.amount_paid));
                          }}
                        >
                          <DollarSign className="w-3.5 h-3.5 mr-1" /> Pay
                        </GlassButton>
                      )}

                      {order.status === 'pending' && (
                        <GlassButton
                          size="sm"
                          variant="primary"
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        >
                          Confirm & Deduct Stock
                        </GlassButton>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items List */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {order.items.map((item) => {
                        const prod = products.find((p) => p.id === item.product_id);
                        const wh = warehouses.find((w) => w.id === item.warehouse_id);

                        return (
                          <div
                            key={item.id}
                            className="p-2 rounded-xl bg-white/40 dark:bg-slate-950/40 flex justify-between items-center"
                          >
                            <span>
                              <span className="font-bold text-slate-900 dark:text-white">{prod?.name}</span> ({wh?.name})
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {item.quantity} x {formatCurrency(item.unit_price, businessSettings?.currency)}
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

      {/* Create Sale Order Modal */}
      <GlassModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Customer Sales Order"
        subtitle="Select customer, line items (auto-priced with today's price), and warehouse"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Customer Full Name"
              placeholder="e.g. Alice Johnson"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <GlassInput
              label="Customer Phone Number"
              placeholder="+1 (555) 492-1029"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Order Line Items (Today's Price Applied)
              </label>
              <GlassButton type="button" size="sm" variant="outline" onClick={handleAddItem}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
              </GlassButton>
            </div>

            {orderItems.map((item, idx) => {
              const prod = products.find((p) => p.id === item.productId);
              const availStock = item.productId && item.warehouseId ? getProductStockInWarehouse(item.productId, item.warehouseId) : 0;

              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50">
                  <div className="col-span-4">
                    <GlassSelect
                      value={item.productId}
                      onChange={(e) => {
                        const updated = [...orderItems];
                        updated[idx].productId = e.target.value;
                        updated[idx].unitPrice = getProductEffectivePrice(e.target.value);
                        setOrderItems(updated);
                      }}
                      options={activeProducts.map((p) => ({ label: p.name, value: p.id }))}
                    />
                  </div>
                  <div className="col-span-3">
                    <GlassSelect
                      value={item.warehouseId}
                      onChange={(e) => {
                        const updated = [...orderItems];
                        updated[idx].warehouseId = e.target.value;
                        setOrderItems(updated);
                      }}
                      options={warehouses.map((w) => ({ label: `${w.name} (Avail: ${getProductStockInWarehouse(item.productId, w.id)})`, value: w.id }))}
                    />
                  </div>
                  <div className="col-span-2">
                    <GlassInput
                      type="number"
                      min="1"
                      max={availStock}
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...orderItems];
                        updated[idx].quantity = parseInt(e.target.value) || 1;
                        setOrderItems(updated);
                      }}
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400 block">
                      {formatCurrency(item.unitPrice * item.quantity, businessSettings?.currency)}
                    </span>
                    <span className="text-[10px] text-slate-400">@{formatCurrency(item.unitPrice, businessSettings?.currency)}</span>
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
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Order Discount ($)"
              type="number"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
            <GlassInput
              label="Notes"
              placeholder="Delivery instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <GlassButton variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" isLoading={isLoading}>
              Confirm Sale Order
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Record Payment Modal */}
      {payingOrder && (
        <GlassModal
          isOpen={Boolean(payingOrder)}
          onClose={() => setPayingOrder(null)}
          title={`Record Payment - ${payingOrder.order_number}`}
          subtitle="Record customer cash, card, or transfer payment"
          maxWidth="sm"
        >
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 text-xs">
              <span className="text-slate-400">Total Order Amount:</span>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(payingOrder.total_amount, businessSettings?.currency)}
              </p>
            </div>
            <GlassInput
              label="Payment Received Amount ($)"
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
            />
            <div className="flex gap-3 justify-end pt-2">
              <GlassButton variant="outline" type="button" onClick={() => setPayingOrder(null)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit" isLoading={isLoading}>
                Record Payment
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      )}

      {/* Invoice Modal */}
      <OrderInvoiceModal
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={() => setSelectedInvoiceOrder(null)}
        order={selectedInvoiceOrder}
      />
    </div>
  );
};
