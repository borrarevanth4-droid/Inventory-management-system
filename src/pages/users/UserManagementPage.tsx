import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassSelect } from '../../components/ui/GlassSelect';
import { GlassModal } from '../../components/ui/GlassModal';
import { Badge } from '../../components/ui/Badge';
import { UserRole, Profile } from '../../types';
import { Users, Plus, Shield, Mail, Phone, Building2, CheckCircle2 } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { user, usersList, addUser, updateUserRole } = useAuth();
  const { warehouses } = useData();

  const isOwner = user?.role === 'owner';
  const isOwnerOrManager = isOwner || user?.role === 'manager';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('sales');
  const [assignedWarehouseId, setAssignedWarehouseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openForm = (staff?: Profile) => {
    if (staff) {
      setEditingStaff(staff);
      setFullName(staff.full_name);
      setEmail(staff.email);
      setPhone(staff.phone || '');
      setRole(staff.role);
      setAssignedWarehouseId(staff.assigned_warehouse_id || '');
    } else {
      setEditingStaff(null);
      setFullName('');
      setEmail('');
      setPhone('');
      setRole('sales');
      setAssignedWarehouseId('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setIsLoading(true);
    try {
      if (editingStaff) {
        await updateUserRole(editingStaff.id, role, editingStaff.is_active);
      } else {
        await addUser({
          full_name: fullName,
          email,
          phone: phone || undefined,
          role,
          assigned_warehouse_id: assignedWarehouseId || undefined,
          is_active: true,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleVariant = (r: UserRole) => {
    switch (r) {
      case 'owner':
        return 'danger';
      case 'manager':
        return 'warning';
      case 'sales':
        return 'info';
      case 'loader':
        return 'success';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-500" />
            Staff & Role-Based Access Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage team accounts, assign operational roles (Owner, Manager, Sales Team, Loader), and assign warehouse locations
          </p>
        </div>
        {isOwnerOrManager && (
          <GlassButton variant="primary" onClick={() => openForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Staff Member
          </GlassButton>
        )}
      </div>

      {/* Staff List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {usersList.map((staff) => {
          const warehouse = warehouses.find((w) => w.id === staff.assigned_warehouse_id);

          return (
            <GlassCard key={staff.id} hoverEffect className="p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{staff.full_name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{staff.email}</p>
                  </div>
                  <Badge variant={getRoleVariant(staff.role)}>
                    <Shield className="w-3 h-3" />
                    {staff.role.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                  {staff.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{staff.phone}</span>
                    </div>
                  )}
                  {warehouse && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Assigned Wh: <strong className="text-slate-900 dark:text-white">{warehouse.name}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Role Actions */}
              {isOwnerOrManager && staff.role !== 'owner' && (
                <div className="flex gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                  <GlassButton
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => openForm(staff)}
                  >
                    Edit Role
                  </GlassButton>
                  <GlassButton
                    size="sm"
                    variant="ghost"
                    onClick={() => updateUserRole(staff.id, staff.role, !staff.is_active)}
                    className={staff.is_active ? 'text-rose-500' : 'text-emerald-500'}
                  >
                    {staff.is_active ? 'Deactivate' : 'Activate'}
                  </GlassButton>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Staff Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'Edit Staff Role' : 'Add New Staff Member'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <GlassInput
            label="Full Name"
            placeholder="e.g. Sarah Jenkins"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={Boolean(editingStaff)}
            required
          />
          <GlassInput
            label="Email Address"
            type="email"
            placeholder="sarah@stockflow.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={Boolean(editingStaff)}
            required
          />
          <GlassInput
            label="Phone Number"
            placeholder="+1 (555) 304-9182"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <GlassSelect
            label="Assign Role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={[
              { label: 'Sales Team (Catalog, Prices & Sales Orders)', value: 'sales' },
              { label: 'Loader (Restricted Vehicle Loading Dashboard)', value: 'loader' },
              { label: 'Manager (Full Operations & Staffing)', value: 'manager' },
              ...(isOwner ? [{ label: 'Owner (Full Access & Business Profile)', value: 'owner' }] : []),
            ]}
          />

          <GlassSelect
            label="Assigned Warehouse Location"
            value={assignedWarehouseId}
            onChange={(e) => setAssignedWarehouseId(e.target.value)}
            options={[
              { label: '-- All / Unassigned --', value: '' },
              ...warehouses.map((w) => ({ label: w.name, value: w.id })),
            ]}
          />

          <div className="flex gap-3 justify-end pt-3">
            <GlassButton variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" isLoading={isLoading}>
              {editingStaff ? 'Update Role' : 'Create Staff Account'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
