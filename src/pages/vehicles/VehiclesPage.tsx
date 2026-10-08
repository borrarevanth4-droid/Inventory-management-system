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
import { Vehicle } from '../../types';
import { Truck, Plus, ClipboardList, CheckCircle2, UserCheck } from 'lucide-react';

export const VehiclesPage: React.FC = () => {
  const { user } = useAuth();
  const {
    vehicles,
    addVehicle,
    warehouses,
    customerOrders,
    loadingTasks,
    createLoadingTask,
  } = useData();
  const { usersList } = useAuth();

  const loadersList = usersList.filter((u) => u.role === 'loader' || u.role === 'sales' || u.role === 'manager');

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [capacityKg, setCapacityKg] = useState('2000');
  const [isLoading, setIsLoading] = useState(false);

  // Loading Task Assignment Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(customerOrders[0]?.id || '');
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0]?.id || '');
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]?.id || '');
  const [selectedLoader, setSelectedLoader] = useState(loadersList[0]?.id || '');
  const [taskNotes, setTaskNotes] = useState('');

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !plateNumber) return;

    setIsLoading(true);
    try {
      await addVehicle({
        name,
        plate_number: plateNumber,
        driver_name: driverName || undefined,
        capacity_kg: parseFloat(capacityKg) || 2000,
        status: 'available',
      });
      setIsVehicleModalOpen(false);
      setName('');
      setPlateNumber('');
      setDriverName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedVehicle || !selectedLoader) return;

    setIsLoading(true);
    try {
      await createLoadingTask(selectedOrder, selectedWarehouse, selectedVehicle, selectedLoader, taskNotes);
      setIsTaskModalOpen(false);
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
            <Truck className="w-6 h-6 text-brand-500" />
            Vehicles & Dispatch Logistics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage transport vehicles, assign dispatch loading tasks to warehouse loaders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton variant="primary" onClick={() => setIsTaskModalOpen(true)}>
            <ClipboardList className="w-4 h-4 mr-2" />
            Assign Loading Task
          </GlassButton>
          <GlassButton variant="outline" onClick={() => setIsVehicleModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </GlassButton>
        </div>
      </div>

      {/* Fleet Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vehicles.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Truck}
              title="No Vehicles Registered"
              description="Register transport trucks or delivery vans to begin assigning vehicle loading tasks."
              actionLabel="Add First Vehicle"
              onAction={() => setIsVehicleModalOpen(true)}
            />
          </div>
        ) : (
          vehicles.map((v) => (
            <GlassCard key={v.id} hoverEffect className="p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 border border-brand-500/20">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{v.name}</h3>
                      <p className="text-xs font-mono text-slate-400">Plate: {v.plate_number}</p>
                    </div>
                  </div>
                  <Badge variant={v.status === 'available' ? 'success' : 'warning'}>
                    {v.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Driver: <strong className="text-slate-700 dark:text-slate-300">{v.driver_name || 'Unassigned'}</strong> • Payload Capacity: <strong className="text-slate-700 dark:text-slate-300">{v.capacity_kg} kg</strong>
                </p>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Active Loading Tasks */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Warehouse Loading Tasks</h2>
        {loadingTasks.length === 0 ? (
          <GlassCard className="py-8 text-center text-xs text-slate-400">
            No loading tasks currently assigned.
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {loadingTasks.map((task) => {
              const vehicle = vehicles.find((v) => v.id === task.vehicle_id);
              const loader = usersList.find((u) => u.id === task.assigned_loader_id);
              const order = customerOrders.find((o) => o.id === task.customer_order_id);

              return (
                <GlassCard key={task.id} hoverEffect className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-brand-500 text-sm">{task.task_number}</span>
                      <Badge variant={task.status === 'completed' ? 'success' : 'warning'}>
                        {task.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Assigned Loader: <strong className="text-slate-900 dark:text-white">{loader?.full_name || 'Loader'}</strong> • Vehicle: <strong className="text-slate-900 dark:text-white">{vehicle?.name}</strong> ({vehicle?.plate_number})
                    </p>
                    {order && <p className="text-xs text-slate-500">Order: {order.order_number} ({order.customer_name})</p>}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      <GlassModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        title="Add Vehicle to Fleet"
        maxWidth="md"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-4">
          <GlassInput
            label="Vehicle Model / Name"
            placeholder="e.g. Isuzu 5-Ton Freight Truck"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <GlassInput
            label="License Plate Number"
            placeholder="e.g. KCA-9281-X"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Assigned Driver Name"
              placeholder="e.g. Robert Miller"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
            <GlassInput
              label="Max Capacity (kg)"
              type="number"
              value={capacityKg}
              onChange={(e) => setCapacityKg(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end pt-3">
            <GlassButton variant="outline" type="button" onClick={() => setIsVehicleModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" isLoading={isLoading}>
              Register Vehicle
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Assign Task Modal */}
      <GlassModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Assign Loading Task to Staff"
        subtitle="Specify sales order, source warehouse, target vehicle, and assigned loader"
        maxWidth="md"
      >
        <form onSubmit={handleAssignTask} className="space-y-4">
          <GlassSelect
            label="Select Sales Order to Load"
            value={selectedOrder}
            onChange={(e) => setSelectedOrder(e.target.value)}
            options={customerOrders.map((o) => ({ label: `${o.order_number} (${o.customer_name})`, value: o.id }))}
          />
          <GlassSelect
            label="Source Warehouse"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
          />
          <GlassSelect
            label="Target Vehicle"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            options={vehicles.map((v) => ({ label: `${v.name} (${v.plate_number})`, value: v.id }))}
          />
          <GlassSelect
            label="Assigned Loader Staff"
            value={selectedLoader}
            onChange={(e) => setSelectedLoader(e.target.value)}
            options={loadersList.map((l) => ({ label: `${l.full_name} (${l.role.toUpperCase()})`, value: l.id }))}
          />
          <GlassInput
            label="Loading Instructions / Notes"
            placeholder="Handle fragile boxes with care..."
            value={taskNotes}
            onChange={(e) => setTaskNotes(e.target.value)}
          />
          <div className="flex gap-3 justify-end pt-3">
            <GlassButton variant="outline" type="button" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" isLoading={isLoading}>
              Assign Loading Task
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
