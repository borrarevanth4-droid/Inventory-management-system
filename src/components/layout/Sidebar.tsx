import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Building2,
  TrendingUp,
  Tag,
  Clock,
  ShoppingBag,
  Truck,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const role = user?.role || 'sales';

  // Navigation Items per Role
  const navItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['owner', 'manager'],
    },
    {
      title: 'Products',
      path: '/products',
      icon: Package,
      roles: ['owner', 'manager', 'sales'],
    },
    {
      title: 'Stock Tracking',
      path: '/stock',
      icon: Boxes,
      roles: ['owner', 'manager', 'sales'],
    },
    {
      title: 'Daily Prices',
      path: '/prices',
      icon: Tag,
      roles: ['owner', 'manager', 'sales'],
    },
    {
      title: 'Restock Requests',
      path: '/restock-requests',
      icon: Clock,
      roles: ['owner', 'manager', 'sales'],
    },
    {
      title: 'Purchase Orders',
      path: '/purchase-orders',
      icon: PackageCheck,
      roles: ['owner', 'manager', 'sales'],
    },
    {
      title: 'Customer Orders',
      path: '/customer-orders',
      icon: ShoppingBag,
      roles: ['owner', 'manager', 'sales'],
    },
    {
      title: 'Warehouses',
      path: '/warehouses',
      icon: Building2,
      roles: ['owner', 'manager'],
    },
    {
      title: 'Suppliers',
      path: '/suppliers',
      icon: TrendingUp,
      roles: ['owner', 'manager'],
    },
    {
      title: 'Vehicles & Logistics',
      path: '/vehicles',
      icon: Truck,
      roles: ['owner', 'manager'],
    },
    {
      title: 'Loading Tasks',
      path: '/loading-tasks',
      icon: ClipboardList,
      roles: ['loader'], // Exclusive view for loader
    },
    {
      title: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['owner', 'manager'],
    },
    {
      title: 'Staff Management',
      path: '/users',
      icon: Users,
      roles: ['owner', 'manager'],
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['owner', 'manager'],
    },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] backdrop-blur-2xl bg-white/60 dark:bg-slate-950/60 border-r border-white/50 dark:border-slate-800/60 p-4 transition-all duration-300 z-20',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 p-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-brand-500 shadow-md transition-transform"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1 mt-2">
        {allowedNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group min-h-[44px]',
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Sliding highlight pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/30 rounded-2xl z-0"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={cn('w-5 h-5 shrink-0 z-10', isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300')} />
                  {!isCollapsed && <span className="z-10 truncate">{item.title}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
