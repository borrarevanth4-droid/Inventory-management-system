import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, Shield, Warehouse, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useData } from '../../context/DataContext';

export const Header: React.FC = () => {
  const { user, logout, businessSettings } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { hasPriceConfirmedForToday } = useData();

  const getRoleVariant = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'danger';
      case 'manager':
        return 'warning';
      case 'sales':
        return 'info';
      case 'loader':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-2xl bg-white/60 dark:bg-slate-950/60 border-b border-white/50 dark:border-slate-800/60 px-4 sm:px-8 py-3 transition-colors duration-300">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left Company Name / Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-sky-500 to-indigo-600 text-xl tracking-tight">
              {businessSettings?.company_name || 'StockFlow'}
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              Pro v1.0
            </span>
          </div>

          {/* Today's Price Warning Indicator for Owner/Manager */}
          {(user?.role === 'owner' || user?.role === 'manager') && !hasPriceConfirmedForToday && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-medium animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Today's Prices Pending</span>
            </div>
          )}
        </div>

        {/* Right Actions: Theme Toggle + User Profile */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl backdrop-blur-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* User Info & Role Badge */}
          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200/50 dark:border-slate-800/50">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user.full_name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {user.email}
                </span>
              </div>
              <Badge variant={getRoleVariant(user.role)}>
                <Shield className="w-3 h-3" />
                {user.role.toUpperCase()}
              </Badge>

              <button
                onClick={logout}
                className="p-2.5 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
