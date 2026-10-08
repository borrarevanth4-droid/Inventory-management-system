import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassSelect } from '../../components/ui/GlassSelect';
import { Building2, User, Mail, DollarSign, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const BusinessSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { createInitialOwner } = useAuth();

  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName || !ownerEmail || !companyName) return;

    setIsLoading(true);
    try {
      await createInitialOwner(ownerName, ownerEmail, companyName, currency);
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const currencyOptions = [
    { label: 'USD ($) - US Dollar', value: 'USD' },
    { label: 'EUR (€) - Euro', value: 'EUR' },
    { label: 'GBP (£) - British Pound', value: 'GBP' },
    { label: 'CAD ($) - Canadian Dollar', value: 'CAD' },
    { label: 'AUD ($) - Australian Dollar', value: 'AUD' },
    { label: 'INR (₹) - Indian Rupee', value: 'INR' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950">
      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg z-10"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-3xl bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-3 border border-brand-500/30">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black text-white">Set Up Your Business</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create your owner account & initialize your StockFlow system
          </p>
        </div>

        <GlassCard className="backdrop-blur-3xl bg-slate-900/85 border-slate-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                1. Owner Profile
              </h3>
              <GlassInput
                label="Owner Full Name"
                placeholder="John Doe"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                required
              />
              <GlassInput
                label="Owner Email Address"
                type="email"
                placeholder="owner@yourcompany.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                2. Business Details
              </h3>
              <GlassInput
                label="Company / Business Name"
                placeholder="Acme Global Logistics"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                icon={<Building2 className="w-4 h-4" />}
                required
              />
              <GlassSelect
                label="Operating Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={currencyOptions}
              />
            </div>

            <div className="pt-4">
              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Complete Setup & Launch Dashboard
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
};
