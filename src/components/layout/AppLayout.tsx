import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNavbar } from './MobileNavbar';
import { GlassSheet } from '../ui/GlassSheet';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  TrendingUp,
  Truck,
  BarChart3,
  Users,
  Settings,
  Clock,
  PackageCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const role = user?.role || 'sales';

  const extraMobileNav = [
    { title: 'Restock Requests', path: '/restock-requests', icon: Clock, roles: ['owner', 'manager', 'sales'] },
    { title: 'Purchase Orders', path: '/purchase-orders', icon: PackageCheck, roles: ['owner', 'manager', 'sales'] },
    { title: 'Warehouses', path: '/warehouses', icon: Building2, roles: ['owner', 'manager'] },
    { title: 'Suppliers', path: '/suppliers', icon: TrendingUp, roles: ['owner', 'manager'] },
    { title: 'Vehicles & Logistics', path: '/vehicles', icon: Truck, roles: ['owner', 'manager'] },
    { title: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['owner', 'manager'] },
    { title: 'Staff Management', path: '/users', icon: Users, roles: ['owner', 'manager'] },
    { title: 'Settings', path: '/settings', icon: Settings, roles: ['owner', 'manager'] },
  ].filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <Header />
      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <MobileNavbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* Mobile More Options Sheet */}
      <GlassSheet isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} title="Menu & Navigation">
        <div className="grid grid-cols-2 gap-3 pt-2">
          {extraMobileNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 p-3.5 rounded-2xl border text-sm font-medium transition-all active:scale-95 min-h-[48px]',
                    isActive
                      ? 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400 font-bold'
                      : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  )
                }
              >
                <Icon className="w-5 h-5 text-brand-500 shrink-0" />
                <span className="truncate">{item.title}</span>
              </NavLink>
            );
          })}
        </div>
      </GlassSheet>
    </div>
  );
};
