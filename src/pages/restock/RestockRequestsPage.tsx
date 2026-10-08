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
import { formatDate } from '../../lib/utils';
import { RestockUrgency } from '../../types';
import { Clock, Plus, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export const RestockRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    products,
    warehouses,
    restockRequests,
    createRestockRequest,
    approveRestockRequest,
    rejectRestockRequest,
  } = useData();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '');
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0]?.id || '');
  const [quantityNeeded, setQuantityNeeded] = useState('50');
  const [urgency, setUrgency] = useState<RestockUrgency>('medium');
  const [note, setNote] = useState('');

  // Rejection modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedWarehouse) return;
    await createRestockRequest(selectedProduct, selectedWarehouse, parseInt(quantityNeeded) || 1, urgency, note);
    setIsModalOpen(false);
  };

  const handleConfirmReject = async () => {
    if (rejectingId && rejectReason) {
      await rejectRestockRequest(rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-500" />
            Restock Requests Inbox
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sales team request restocks for low items. Owner/Manager approves requests into Purchase Orders.
          </p>
        </div>
        <GlassButton variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Raise Restock Request
        </GlassButton>
      </div>

      {/* Inbox List */}
      {restockRequests.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Restock Requests"
          description="There are currently no active or historical restock requests."
          actionLabel="Raise Restock Request"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {restockRequests.map((req) => {
            const prod = products.find((p) => p.id === req.product_id);
            const wh = warehouses.find((w) => w.id === req.warehouse_id);

            return (
              <GlassCard key={req.id} hoverEffect className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          req.status === 'approved'
                            ? 'success'
                            : req.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {req.status.toUpperCase()}
                      </Badge>
                      <Badge
                        variant={
                          req.urgency === 'high'
                            ? 'danger'
                            : req.urgency === 'medium'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {req.urgency.toUpperCase()} URGENCY
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {prod?.name || 'Product'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Quantity Needed: <span className="font-bold text-slate-900 dark:text-white">{req.quantity_needed} {prod?.unit || 'pcs'}</span> • Destination Warehouse: <span className="font-semibold text-slate-700 dark:text-slate-300">{wh?.name}</span>
                    </p>
                    {req.note && <p className="text-xs text-slate-500 italic mt-1.5">"{req.note}"</p>}
                    {req.rejection_reason && (
                      <p className="text-xs text-rose-500 font-semibold mt-1">
                        Rejection reason: {req.rejection_reason}
                      </p>
                    )}
                  </div>

                  {/* Approve / Reject Actions for Owner & Manager */}
                  {isOwnerOrManager && req.status === 'requested' && (
                    <div className="flex items-center gap-2">
                      <GlassButton
                        size="sm"
                        variant="primary"
                        onClick={() => approveRestockRequest(req.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Create PO
                      </GlassButton>
                      <GlassButton
                        size="sm"
                        variant="ghost"
                        onClick={() => setRejectingId(req.id)}
                        className="text-rose-500 hover:bg-rose-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </GlassButton>
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Raise Restock Request"
        subtitle="Submit a formal request to management for stock replenishment"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <GlassSelect
            label="Product to Restock"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            options={products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }))}
          />

          <GlassSelect
            label="Destination Warehouse"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
          />

          <GlassInput
            label="Quantity Needed"
            type="number"
            min="1"
            value={quantityNeeded}
            onChange={(e) => setQuantityNeeded(e.target.value)}
            required
          />

          <GlassSelect
            label="Urgency Level"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as RestockUrgency)}
            options={[
              { label: 'Low - Standard Replenishment', value: 'low' },
              { label: 'Medium - Normal Priority', value: 'medium' },
              { label: 'High - Critical Stockout Risk', value: 'high' },
            ]}
          />

          <GlassInput
            label="Additional Notes"
            placeholder="e.g. Expected sales surge next week"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex gap-3 justify-end pt-3">
            <GlassButton variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit">
              Submit Restock Request
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Reject Modal */}
      <GlassModal
        isOpen={Boolean(rejectingId)}
        onClose={() => setRejectingId(null)}
        title="Reject Restock Request"
        subtitle="Provide a reason for rejecting this request"
        maxWidth="sm"
      >
        <div className="space-y-4 py-2">
          <GlassInput
            label="Rejection Reason"
            placeholder="e.g. Overstocked in secondary warehouse"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
          <div className="flex gap-3 justify-end pt-2">
            <GlassButton variant="outline" onClick={() => setRejectingId(null)}>
              Cancel
            </GlassButton>
            <GlassButton variant="danger" onClick={handleConfirmReject}>
              Confirm Reject
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};
