import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassModal } from '../../components/ui/GlassModal';
import { UserRole } from '../../types';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Package, ChevronDown, ChevronUp, Copy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Demo credentials for all roles
const DEMO_ACCOUNTS = [
  {
    role: 'owner' as UserRole,
    email: 'owner@stockflow.com',
    password: 'owner123',
    label: 'Owner',
    description: 'Full access — financials, users, settings, all modules',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30',
    icon: '👑',
  },
  {
    role: 'manager' as UserRole,
    email: 'manager@stockflow.com',
    password: 'manager123',
    label: 'Manager',
    description: 'Full operations — no cost/profit, can manage staff (except Owner)',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: '🔧',
  },
  {
    role: 'sales' as UserRole,
    email: 'sales@stockflow.com',
    password: 'sales123',
    label: 'Sales Team',
    description: 'Stock view, today\'s prices, create orders, raise restock requests',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/30',
    icon: '🛒',
  },
  {
    role: 'loader' as UserRole,
    email: 'loader@stockflow.com',
    password: 'loader123',
    label: 'Loader',
    description: 'Assigned loading tasks only — tap items to mark as loaded',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    icon: '🚚',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, businessSettings } = useAuth();

  const [email, setEmail] = useState('owner@stockflow.com');
  const [password, setPassword] = useState('owner123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSelectAccount = (account: typeof DEMO_ACCOUNTS[0]) => {
    setSelectedRole(account.role);
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, selectedRole);
      if (!success) {
        navigate('/setup');
      } else {
        if (selectedRole === 'loader') navigate('/loading-tasks');
        else if (selectedRole === 'sales') navigate('/products');
        else navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotEmail) setForgotSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950">
      {/* Animated Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none animate-float" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        {/* App Logo & Branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-brand-500/20 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-500/10">
            <Package className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">StockFlow</h1>
          <p className="text-sm text-slate-400 mt-1">
            {businessSettings?.company_name || 'Inventory Management System'}
          </p>
        </div>

        {/* Demo Credentials Collapsible Panel */}
        <div className="mb-4 rounded-3xl overflow-hidden border border-slate-700/60 bg-slate-900/60 backdrop-blur-xl">
          <button
            onClick={() => setShowCredentials(!showCredentials)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-bold text-white">Demo Credentials — All 4 Roles</span>
            </div>
            {showCredentials
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />
            }
          </button>

          <AnimatePresence>
            {showCredentials && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 grid grid-cols-1 gap-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => handleSelectAccount(account)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                        selectedRole === account.role
                          ? account.bg + ' ring-1 ring-inset ring-white/20'
                          : 'border-slate-800 hover:border-slate-600 bg-slate-950/40'
                      }`}
                    >
                      {/* Icon */}
                      <span className="text-xl shrink-0">{account.icon}</span>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-wide ${account.color}`}>
                            {account.label}
                          </span>
                          {selectedRole === account.role && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                          {account.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono">
                          <span className="text-slate-300 truncate">{account.email}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{account.password}</span>
                        </div>
                      </div>

                      {/* Copy icon */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(`Email: ${account.email}\nPassword: ${account.password}`, account.role);
                        }}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                        title="Copy credentials"
                      >
                        {copiedField === account.role
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          : <Copy className="w-3.5 h-3.5" />
                        }
                      </button>
                    </button>
                  ))}

                  <p className="text-[10px] text-slate-500 text-center pt-1">
                    ✓ Click any role above to auto-fill credentials, then press Sign In
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Login Form Card */}
        <GlassCard className="backdrop-blur-3xl bg-slate-900/80 border-slate-800 shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <GlassInput
              label="Email Address"
              type="email"
              placeholder="owner@stockflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-medium text-brand-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <GlassInput
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            {/* Compact Role Pill Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                Signing In As
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-950/60 border border-slate-800">
                {(['owner', 'manager', 'sales', 'loader'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      const acc = DEMO_ACCOUNTS.find((a) => a.role === r)!;
                      handleSelectAccount(acc);
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all capitalize ${
                      selectedRole === r
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </GlassButton>
          </form>

          {/* First-install CTA */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Setting up StockFlow for the first time?{' '}
              <button
                onClick={() => navigate('/setup')}
                className="text-brand-400 font-bold hover:underline ml-1"
              >
                Setup Your Business
              </button>
            </p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Forgot Password Modal */}
      <GlassModal
        isOpen={isForgotModalOpen}
        onClose={() => { setIsForgotModalOpen(false); setForgotSubmitted(false); }}
        title="Reset Your Password"
        subtitle="Enter your email to receive password reset instructions"
        maxWidth="sm"
      >
        {forgotSubmitted ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Reset Link Sent</h4>
            <p className="text-xs text-slate-400">
              We sent reset instructions to{' '}
              <span className="text-brand-400 font-semibold">{forgotEmail}</span>.
            </p>
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => { setIsForgotModalOpen(false); setForgotSubmitted(false); }}
              className="mt-4 w-full"
            >
              Done
            </GlassButton>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4 py-2">
            <GlassInput
              label="Account Email"
              type="email"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <div className="flex gap-3 justify-end pt-2">
              <GlassButton variant="outline" type="button" onClick={() => setIsForgotModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Send Reset Link
              </GlassButton>
            </div>
          </form>
        )}
      </GlassModal>
    </div>
  );
};
