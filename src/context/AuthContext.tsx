import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole, BusinessSettings } from '../types';
import { supabase, isSupabaseConfigured, getLocalItem, setLocalItem, getLocalCollection, setLocalCollection } from '../lib/supabase';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: Profile | null;
  businessSettings: BusinessSettings | null;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  createInitialOwner: (name: string, email: string, companyName: string, currency: string) => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  usersList: Profile[];
  addUser: (staff: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateUserRole: (id: string, role: UserRole, isActive: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        // Fetch session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) setUser(profile);
        }

        const { data: settings } = await supabase
          .from('business_settings')
          .select('*')
          .limit(1)
          .single();
        if (settings) setBusinessSettings(settings);

        const { data: profiles } = await supabase.from('profiles').select('*');
        if (profiles) setUsersList(profiles);
      } else {
        // Local persistence fallback
        const localSettings = getLocalItem<BusinessSettings>('business_settings');
        if (localSettings) {
          setBusinessSettings(localSettings);
        }

        const localProfiles = getLocalCollection<Profile>('profiles');
        setUsersList(localProfiles);

        const activeUser = getLocalItem<Profile>('active_user');
        if (activeUser) {
          setUser(activeUser);
        }
      }
    } catch (e) {
      console.error('Error loading auth data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const createInitialOwner = async (name: string, email: string, companyName: string, currency: string) => {
    const newSettings: BusinessSettings = {
      id: Math.random().toString(36).substring(2, 9),
      company_name: companyName,
      currency: currency || 'USD',
      tax_rate: 0,
      setup_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const ownerProfile: Profile = {
      id: Math.random().toString(36).substring(2, 9),
      email: email.toLowerCase(),
      full_name: name,
      role: 'owner',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      await supabase.from('business_settings').insert([newSettings]);
      await supabase.from('profiles').insert([ownerProfile]);
    } else {
      setLocalItem('business_settings', newSettings);
      const existing = getLocalCollection<Profile>('profiles');
      const updated = [...existing, ownerProfile];
      setLocalCollection('profiles', updated);
      setUsersList(updated);
      setLocalItem('active_user', ownerProfile);
    }

    setBusinessSettings(newSettings);
    setUser(ownerProfile);
    showToast('Setup Complete!', 'Welcome to StockFlow. Your business has been configured.', 'success');
  };

  const login = async (email: string, requestedRole?: UserRole): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists in profiles list
    let targetUser = usersList.find((u) => u.email.toLowerCase() === cleanEmail && u.is_active);

    if (!targetUser) {
      // If no users exist at all, return false to trigger business setup
      if (usersList.length === 0) {
        return false;
      }
      
      // Auto-create profile if email not found for seamless testing
      targetUser = {
        id: Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        full_name: cleanEmail.split('@')[0],
        role: requestedRole || 'sales',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updated = [...usersList, targetUser];
      setUsersList(updated);
      if (!isSupabaseConfigured) {
        setLocalCollection('profiles', updated);
      }
    }

    // Update active role if requestedRole passed
    if (requestedRole && targetUser.role !== requestedRole && targetUser.role !== 'owner') {
      targetUser = { ...targetUser, role: requestedRole };
    }

    setUser(targetUser);
    setLocalItem('active_user', targetUser);
    showToast(`Logged in as ${targetUser.full_name}`, `Role: ${targetUser.role.toUpperCase()}`, 'success');
    return true;
  };

  const logout = () => {
    setUser(null);
    if (!isSupabaseConfigured) {
      localStorage.removeItem('stockflow_db_active_user');
    } else {
      supabase.auth.signOut();
    }
    showToast('Logged out successfully', '', 'info');
  };

  const updateBusinessSettings = async (settings: Partial<BusinessSettings>) => {
    if (!businessSettings) return;
    const updated = { ...businessSettings, ...settings, updated_at: new Date().toISOString() };
    setBusinessSettings(updated);

    if (isSupabaseConfigured) {
      await supabase.from('business_settings').update(updated).eq('id', updated.id);
    } else {
      setLocalItem('business_settings', updated);
    }
    showToast('Settings Updated', 'Business preferences saved.', 'success');
  };

  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) return;
    const updated = { ...user, ...profileData, updated_at: new Date().toISOString() };
    setUser(updated);

    const updatedList = usersList.map((u) => (u.id === user.id ? updated : u));
    setUsersList(updatedList);

    if (isSupabaseConfigured) {
      await supabase.from('profiles').update(updated).eq('id', user.id);
    } else {
      setLocalItem('active_user', updated);
      setLocalCollection('profiles', updatedList);
    }
    showToast('Profile Updated', 'Your profile info has been saved.', 'success');
  };

  const addUser = async (staff: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
    const newStaff: Profile = {
      ...staff,
      id: Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newStaff, ...usersList];
    setUsersList(updated);

    if (isSupabaseConfigured) {
      await supabase.from('profiles').insert([newStaff]);
    } else {
      setLocalCollection('profiles', updated);
    }
    showToast('Staff Added', `${newStaff.full_name} was added as ${newStaff.role.toUpperCase()}`, 'success');
  };

  const updateUserRole = async (id: string, role: UserRole, isActive: boolean) => {
    const updated = usersList.map((u) =>
      u.id === id ? { ...u, role, is_active: isActive, updated_at: new Date().toISOString() } : u
    );
    setUsersList(updated);

    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ role, is_active: isActive }).eq('id', id);
    } else {
      setLocalCollection('profiles', updated);
    }
    showToast('Role Updated', 'User access permissions updated.', 'success');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        businessSettings,
        isLoading,
        login,
        logout,
        updateBusinessSettings,
        createInitialOwner,
        updateProfile,
        usersList,
        addUser,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
