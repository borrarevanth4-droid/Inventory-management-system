import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassModal } from '../../components/ui/GlassModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Supplier } from '../../types';
import { TrendingUp, Plus, Phone, Mail, MapPin, Edit2, User } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const { user } = useAuth();
  const { suppliers, addSupplier, updateSupplier, purchaseOrders } = useData();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openForm = (sup?: Supplier) => {
    if (sup) {
      setEditingSup(sup);
      setName(sup.name);
      setContactPerson(sup.contact_person || '');
      setPhone(sup.phone || '');
      setEmail(sup.email || '');
      setAddress(sup.address || '');
      setNotes(sup.notes || '');
    } else {
      setEditingSup(null);
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsLoading(true);
    try {
      const payload = {
        name,
        contact_person: contactPerson || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        notes: notes || undefined,
      };

      if (editingSup) {
        await updateSupplier(editingSup.id, payload);
      } else {
        await addSupplier(payload);
      }
      setIsModalOpen(false);
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
            <TrendingUp className="w-6 h-6 text-brand-500" />
            Supplier Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain supplier contact records, terms, and track order fulfillment history
          </p>
        </div>
        {isOwnerOrManager && (
          <GlassButton variant="primary" onClick={() => openForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </GlassButton>
        )}
      </div>

      {/* Supplier Grid */}
      {suppliers.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No Suppliers Found"
          description="Your supplier directory is empty. Add your first supplier."
          actionLabel={isOwnerOrManager ? 'Add First Supplier' : undefined}
          onAction={isOwnerOrManager ? () => openForm() : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((sup) => {
            const poCount = purchaseOrders.filter((p) => p.supplier_id === sup.id).length;

            return (
              <GlassCard key={sup.id} hoverEffect className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{sup.name}</h3>
                    {isOwnerOrManager && (
                      <button
                        onClick={() => openForm(sup)}
                        className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-slate-500/10 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    {sup.contact_person && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Contact: {sup.contact_person}</span>
                      </div>
                    )}
                    {sup.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{sup.phone}</span>
                      </div>
                    )}
                    {sup.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{sup.email}</span>
                      </div>
                    )}
                    {sup.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{sup.address}</span>
                      </div>
                    )}
                  </div>

                  {sup.notes && (
                    <p className="text-xs text-slate-400 italic mt-3 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                      "{sup.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-xs font-bold text-brand-600 dark:text-brand-400 flex justify-between items-center">
                  <span>PO History:</span>
                  <span>{poCount} order(s) issued</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSup ? 'Edit Supplier' : 'Add New Supplier'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <GlassInput
            label="Supplier Company Name"
            placeholder="e.g. Apex Electronics Ltd"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <GlassInput
            label="Contact Person"
            placeholder="e.g. Jane Smith"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Phone Number"
              placeholder="+1 (555) 019-2834"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <GlassInput
              label="Email Address"
              type="email"
              placeholder="sales@apex.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <GlassInput
            label="Physical Address"
            placeholder="123 Industrial Way, Sector 4"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <GlassInput
            label="Notes / Terms"
            placeholder="Payment terms, delivery schedules, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-3 justify-end pt-3">
            <GlassButton variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" isLoading={isLoading}>
              {editingSup ? 'Save Changes' : 'Create Supplier'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
