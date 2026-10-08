import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassSelect } from '../../components/ui/GlassSelect';
import { Settings, Building2, User, Sun, Moon, Plus, CheckCircle2, ShieldAlert } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, businessSettings, updateBusinessSettings, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { categories, units, addCategory, addUnit } = useData();

  const isOwner = user?.role === 'owner';

  // Business Form State
  const [companyName, setCompanyName] = useState(businessSettings?.company_name || '');
  const [currency, setCurrency] = useState(businessSettings?.currency || 'USD');
  const [taxRate, setTaxRate] = useState(String(businessSettings?.tax_rate || 0));

  // User Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Category & Unit State
  const [newCat, setNewCat] = useState('');
  const [newUnit, setNewUnit] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setIsLoading(true);
    try {
      await updateBusinessSettings({
        company_name: companyName,
        currency,
        tax_rate: parseFloat(taxRate) || 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile({
        full_name: fullName,
        phone: phone || undefined,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCat) {
      addCategory(newCat);
      setNewCat('');
    }
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUnit) {
      addUnit(newUnit);
      setNewUnit('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-500" />
          System Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure business details, operational currency, theme appearance, and product taxonomy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Profile (Owner Only) */}
        <GlassCard className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
            <Building2 className="w-5 h-5 text-brand-500" />
            Business Profile & Tax
          </h3>

          {!isOwner && (
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Only the business Owner can modify company settings.</span>
            </div>
          )}

          <form onSubmit={handleSaveBusiness} className="space-y-4">
            <GlassInput
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={!isOwner}
              required
            />
            <GlassSelect
              label="Default Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={!isOwner}
              options={[
                { label: 'USD ($)', value: 'USD' },
                { label: 'EUR (€)', value: 'EUR' },
                { label: 'GBP (£)', value: 'GBP' },
                { label: 'CAD ($)', value: 'CAD' },
                { label: 'INR (₹)', value: 'INR' },
              ]}
            />
            <GlassInput
              label="Default Sales Tax Rate (%)"
              type="number"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              disabled={!isOwner}
            />

            {isOwner && (
              <GlassButton type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Save Business Settings
              </GlassButton>
            )}
          </form>
        </GlassCard>

        {/* User Profile */}
        <GlassCard className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
            <User className="w-5 h-5 text-brand-500" />
            My Personal Account
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <GlassInput
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <GlassInput
              label="Email Address"
              value={user?.email || ''}
              disabled
            />
            <GlassInput
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <GlassButton type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Update Profile
            </GlassButton>
          </form>
        </GlassCard>

        {/* Theme Appearance */}
        <GlassCard className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-brand-500" /> : <Sun className="w-5 h-5 text-brand-500" />}
            Liquid Glass Theme
          </h3>
          <p className="text-xs text-slate-400">
            Current Theme: <strong className="text-slate-900 dark:text-white capitalize">{theme} Mode</strong>
          </p>
          <GlassButton variant="outline" onClick={toggleTheme} className="w-full">
            Switch to {theme === 'dark' ? 'Light Liquid Glass' : 'Dark Liquid Glass'}
          </GlassButton>
        </GlassCard>

        {/* Categories & Units */}
        <GlassCard className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
            Product Taxonomy & Units
          </h3>

          <form onSubmit={handleAddCat} className="flex gap-2">
            <GlassInput
              placeholder="Add Custom Category..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
            <GlassButton type="submit" variant="outline" size="sm">
              <Plus className="w-4 h-4" />
            </GlassButton>
          </form>

          <form onSubmit={handleAddUnit} className="flex gap-2 pt-2">
            <GlassInput
              placeholder="Add Custom Unit (e.g. barrels)..."
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
            />
            <GlassButton type="submit" variant="outline" size="sm">
              <Plus className="w-4 h-4" />
            </GlassButton>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};
