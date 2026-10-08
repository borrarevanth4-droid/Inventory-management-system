import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassModal } from '../../components/ui/GlassModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Warehouse } from '../../types';
import { Building2, Plus, MapPin, Edit2, Boxes, ShieldCheck } from 'lucide-react';

export const WarehousesPage: React.FC = () => {
  const { user } = useAuth();
  const { warehouses, addWarehouse, updateWarehouse, stocks, products } = useData();
  const { usersList } = useAuth();

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [managerId, setManagerId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openForm = (wh?: Warehouse) => {
    if (wh) {
      setEditingWh(wh);
      setName(wh.name);
      setLocation(wh.location);
      setManagerId(wh.manager_id || '');
    } else {
      setEditingWh(null);
      setName('');
      setLocation('');
      setManagerId('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) return;

    setIsLoading(true);
    try {
      const payload = {
        name,
        location,
        manager_id: managerId || undefined,
        is_active: true,
      };

      if (editingWh) {
        await updateWarehouse(editingWh.id, payload);
      } else {
        await addWarehouse(payload);
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
            <Building2 className="w-6 h-6 text-brand-500" />
            Warehouses & Facilities
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage multi-warehouse storage facilities, assigned managers, and local stock holdings
          </p>
        </div>
        {isOwnerOrManager && (
          <GlassButton variant="primary" onClick={() => openForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Warehouse Location
          </GlassButton>
        )}
      </div>

      {/* Warehouse Grid */}
      {warehouses.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Warehouses Created"
          description="You have not added any warehouse locations yet. Add your primary warehouse."
          actionLabel={isOwnerOrManager ? 'Add Warehouse Location' : undefined}
          onAction={isOwnerOrManager ? () => openForm() : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {warehouses.map((wh) => {
            const totalUnits = stocks
              .filter((s) => s.warehouse_id === wh.id)
              .reduce((sum, s) => sum + s.quantity, 0);

            const manager = usersList.find((u) => u.id === wh.manager_id);

            return (
              <GlassCard key={wh.id} hoverEffect className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 border border-brand-500/20">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{wh.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {wh.location}
                        </p>
                      </div>
                    </div>
                    {isOwnerOrManager && (
                      <button
                        onClick={() => openForm(wh)}
                        className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-slate-500/10 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {manager && (
                    <div className="p-2.5 rounded-xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Manager: <strong className="text-slate-900 dark:text-white">{manager.full_name}</strong></span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5" /> Total Stock Units:
                  </span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    {totalUnits.toLocaleString()} units
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWh ? 'Edit Warehouse' : 'Add New Warehouse'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <GlassInput
            label="Warehouse Name"
            placeholder="e.g. Central Logistics Hub"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <GlassInput
            label="Location / Address"
            placeholder="e.g. Building 4, North Cargo Port"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />

          <div className="flex gap-3 justify-end pt-3">
            <GlassButton variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" isLoading={isLoading}>
              {editingWh ? 'Save Changes' : 'Create Warehouse'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
