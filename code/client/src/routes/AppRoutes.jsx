import { Routes, Route } from 'react-router-dom';
import StorefrontLayout from '../layouts/StorefrontLayout.jsx';
import PortalLayout from '../layouts/PortalLayout.jsx';
import RoleProtectedRoute from '../components/common/RoleProtectedRoute.jsx';

// Storefront Pages (Phase 1)
import HomePage from '../pages/storefront/HomePage.jsx';
import CategoryPage from '../pages/storefront/CategoryPage.jsx';
import ProductDetailPage from '../pages/storefront/ProductDetailPage.jsx';
import ComparePage from '../pages/storefront/ComparePage.jsx';
import WarrantyCheckPage from '../pages/storefront/WarrantyCheckPage.jsx';
import CartPage from '../pages/storefront/CartPage.jsx';
import NotFoundPage from '../pages/storefront/NotFoundPage.jsx';
import CheckoutSuccessPage from '../pages/storefront/CheckoutSuccessPage.jsx';

// Auth Pages (P-00, P-16, P-17)
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx';

// Customer Account Pages (P-18)
import OrdersPage from '../pages/account/OrdersPage.jsx';
import OrderDetailPage from '../pages/account/OrderDetailPage.jsx';

// Branch & POS Portal Pages (Phase 2 & P-20)
import PosPage from '../pages/portal/PosPage.jsx';
import BranchInventoryPage from '../pages/portal/BranchInventoryPage.jsx';
import WarrantyReceptionPage from '../pages/portal/WarrantyReceptionPage.jsx';
import StockTransferPage from '../pages/portal/StockTransferPage.jsx';

// HQ Admin & Operations Pages (Phase 3)
import AdminProductsPage from '../pages/portal/AdminProductsPage.jsx';
import SerialImportPage from '../pages/portal/SerialImportPage.jsx';
import OrderDispatchPage from '../pages/portal/OrderDispatchPage.jsx';
import AdminBranchesUsersPage from '../pages/portal/AdminBranchesUsersPage.jsx';
import AdminAnalyticsPage from '../pages/portal/AdminAnalyticsPage.jsx';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Branch Portal & Web POS Routes (Phase 2 + Phase 3 + P-20) */}
      <Route element={<RoleProtectedRoute allowedRoles={['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN']} />}>
        <Route path="/portal" element={<PortalLayout />}>
          {/* Operations & Counter (Phase 2) */}
          <Route path="pos" element={<PosPage />} />
          <Route path="inventory" element={<BranchInventoryPage />} />
          <Route path="warranty-reception" element={<WarrantyReceptionPage />} />
          <Route path="branch/transfers" element={<StockTransferPage />} />

          {/* HQ Administration & Operations (Phase 3) */}
          <Route path="admin/products" element={<AdminProductsPage />} />
          <Route path="admin/import-serials" element={<SerialImportPage />} />
          <Route path="admin/orders-dispatch" element={<OrderDispatchPage />} />
          <Route path="admin/branches-rbac" element={<AdminBranchesUsersPage />} />
          <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
        </Route>
      </Route>

      {/* 2. Storefront Layout Routes */}
      <Route element={<StorefrontLayout />}>
        {/* Public Storefront */}
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/warranty-check" element={<WarrantyCheckPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />

        {/* Public Auth Routes (P-00, P-16, P-17) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Customer Protected Account Routes (P-18) */}
        <Route element={<RoleProtectedRoute allowedRoles={['CUSTOMER', 'SUPER_ADMIN']} />}>
          <Route path="/account/orders" element={<OrdersPage />} />
          <Route path="/account/orders/:id" element={<OrderDetailPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
