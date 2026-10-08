import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading, businessSettings } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  // If business hasn't completed initial owner setup, send to setup
  if (businessSettings && !businessSettings.setup_completed) {
    return <Navigate to="/setup" replace />;
  }

  // If no user logged in, send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If loader role tries to access non-loader pages, redirect to loader dashboard
  if (user.role === 'loader' && allowedRoles && !allowedRoles.includes('loader')) {
    return <Navigate to="/loading-tasks" replace />;
  }

  // Check role restrictions
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to default home per role
    if (user.role === 'sales') return <Navigate to="/products" replace />;
    if (user.role === 'loader') return <Navigate to="/loading-tasks" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
