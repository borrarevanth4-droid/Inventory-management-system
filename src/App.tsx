import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Layout & Protection
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { BusinessSetupPage } from './pages/auth/BusinessSetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { StockPage } from './pages/stock/StockPage';
import { DailyPricesPage } from './pages/prices/DailyPricesPage';
import { RestockRequestsPage } from './pages/restock/RestockRequestsPage';
import { PurchaseOrdersPage } from './pages/purchase-orders/PurchaseOrdersPage';
import { CustomerOrdersPage } from './pages/customer-orders/CustomerOrdersPage';
import { WarehousesPage } from './pages/warehouses/WarehousesPage';
import { SuppliersPage } from './pages/suppliers/SuppliersPage';
import { VehiclesPage } from './pages/vehicles/VehiclesPage';
import { LoaderDashboardPage } from './pages/loading/LoaderDashboardPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { UserManagementPage } from './pages/users/UserManagementPage';
import { SettingsPage } from './pages/settings/SettingsPage';

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'loader') return <Navigate to="/loading-tasks" replace />;
  if (user.role === 'sales') return <Navigate to="/products" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/setup" element={<BusinessSetupPage />} />

                {/* Protected App Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<RootRedirect />} />

                  {/* Owner & Manager Pages */}
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager']}>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Shared Operational Pages */}
                  <Route
                    path="products"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager', 'sales']}>
                        <ProductsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="stock"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager', 'sales']}>
                        <StockPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="prices"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager', 'sales']}>
                        <DailyPricesPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="restock-requests"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager', 'sales']}>
                        <RestockRequestsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="purchase-orders"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager', 'sales']}>
                        <PurchaseOrdersPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="customer-orders"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager', 'sales']}>
                        <CustomerOrdersPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Management Only Pages */}
                  <Route
                    path="warehouses"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager']}>
                        <WarehousesPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="suppliers"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager']}>
                        <SuppliersPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="vehicles"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager']}>
                        <VehiclesPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Loader Page */}
                  <Route
                    path="loading-tasks"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager', 'loader']}>
                        <LoaderDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="reports"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager']}>
                        <ReportsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="users"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager']}>
                        <UserManagementPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="settings"
                    element={
                      <ProtectedRoute allowedRoles={['owner', 'manager']}>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<RootRedirect />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
