import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ClipboardList, CheckSquare, Square, Truck, Building2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoaderDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const {
    loadingTasks,
    vehicles,
    warehouses,
    products,
    toggleTaskItemLoaded,
    completeLoadingTask,
  } = useData();

  // Filter tasks assigned to current logged-in loader user
  const myTasks = loadingTasks.filter(
    (t) => t.assigned_loader_id === user?.id || user?.role === 'owner' || user?.role === 'manager'
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
          <ClipboardList className="w-6 h-6 text-brand-500" />
          My Vehicle Loading Tasks
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Tick off each item as you load it into the vehicle, then tap Complete Load.
        </p>
      </div>

      {myTasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No Assigned Loading Tasks"
          description="You currently have no pending loading tasks assigned to you."
        />
      ) : (
        <div className="space-y-6">
          {myTasks.map((task) => {
            const vehicle = vehicles.find((v) => v.id === task.vehicle_id);
            const warehouse = warehouses.find((w) => w.id === task.source_warehouse_id);
            const allLoaded = task.items?.every((i) => i.is_loaded);

            return (
              <GlassCard key={task.id} className="p-6 space-y-4">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-brand-600 dark:text-brand-400 text-base">
                        {task.task_number}
                      </span>
                      <Badge variant={task.status === 'completed' ? 'success' : 'warning'}>
                        {task.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-brand-500" /> Pick From:{' '}
                        <strong className="text-slate-900 dark:text-white">{warehouse?.name}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-brand-500" /> Load Into:{' '}
                        <strong className="text-slate-900 dark:text-white">{vehicle?.name} ({vehicle?.plate_number})</strong>
                      </span>
                    </div>
                  </div>

                  {task.status !== 'completed' && (
                    <GlassButton
                      variant="primary"
                      size="sm"
                      disabled={!allLoaded}
                      onClick={() => completeLoadingTask(task.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Complete Load
                    </GlassButton>
                  )}
                </div>

                {/* Checklist items */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Item Checklist:
                  </p>
                  {task.items?.map((item) => {
                    const prod = products.find((p) => p.id === item.product_id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (task.status !== 'completed') {
                            toggleTaskItemLoaded(task.id, item.id, !item.is_loaded);
                          }
                        }}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none min-h-[48px] ${
                          item.is_loaded
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-white/40 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-500/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.is_loaded ? (
                            <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400 shrink-0" />
                          )}
                          <span className="text-sm font-bold">{prod?.name || 'Item'}</span>
                        </div>
                        <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-slate-900/10 dark:bg-white/10">
                          {item.quantity_to_load} {prod?.unit || 'pcs'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
