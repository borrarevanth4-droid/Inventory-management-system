import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  ClipboardList,
  Tag,
  Menu,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const MobileNavbar: React.FC<{ onOpenMobileMenu: () => void }> = ({ onOpenMobileMenu }) => {
  const { user } = useAuth();
  const role = user?.role || 'sales';

  if (role === 'loader') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-2xl bg-white/80 dark:bg-slate-950/80 border-t border-white/40 dark:border-slate-800/60 p-2 px-4 flex justify-around items-center">
        <NavLink
          to="/loading-tasks"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center min-h-[44px] min-w-[64px] rounded-2xl p-1 text-xs font-medium transition-colors',
              isActive ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-400'
            )
          }
        >
          <ClipboardList className="w-5 h-5 mb-0.5" />
          <span>My Loading Tasks</span>
        </NavLink>
      </div>
    );
  }

  const mobileNav = [
    { title: 'Home', path: role === 'sales' ? '/products' : '/dashboard', icon: LayoutDashboard },
    { title: 'Products', path: '/products', icon: Package },
    { title: 'Stock', path: '/stock', icon: Boxes },
    { title: 'Prices', path: '/prices', icon: Tag },
    { title: 'Sales', path: '/customer-orders', icon: ShoppingBag },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-3xl bg-white/85 dark:bg-slate-950/85 border-t border-white/50 dark:border-slate-800/80 p-1.5 px-3 flex justify-around items-center shadow-2xl">
      {mobileNav.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center min-h-[44px] min-w-[56px] rounded-2xl px-2 py-1 text-[11px] font-medium transition-all duration-200 active:scale-95',
                isActive
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10 dark:bg-brand-500/20 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              )
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="truncate">{item.title}</span>
          </NavLink>
        );
      })}

      {/* Menu Drawer Toggle */}
      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center min-h-[44px] min-w-[56px] rounded-2xl px-2 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 active:scale-95"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>More</span>
      </button>
    </div>
  );
};
