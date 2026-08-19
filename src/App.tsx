import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OrgRegisterPage from "./pages/OrgRegisterPage";
import CanteenRegisterPage from "./pages/CanteenRegisterPage";
import CanteensPage from "./pages/CanteensPage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import PaymentPage from "./pages/PaymentPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import ReviewPage from "./pages/ReviewPage";
import MyReviewsPage from "./pages/MyReviewsPage";
import MyWalletPage from "./pages/MyWalletPage";
import WalletTopupPaymentPage from "./pages/WalletTopupPaymentPage";
import UserDashboard from "./pages/UserDashboard";
import UserProfile from "./pages/UserProfile";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminApprovalManagement from "./pages/admin/AdminApprovalManagement";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminReports from "./pages/admin/AdminReports";
import AdminFineManagement from "./pages/admin/AdminFineManagement";
import AdminTakeAction from "./pages/admin/AdminTakeAction";

import OrgAdminLayout from "./pages/org-admin/OrgAdminLayout";
import OrgAdminDashboard from "./pages/org-admin/OrgAdminDashboard";
import OrgAdminCanteens from "./pages/org-admin/OrgAdminCanteens";
import OrgAdminCanteenApprovals from "./pages/org-admin/OrgAdminCanteenApprovals";
import OrgAdminOrders from "./pages/org-admin/OrgAdminOrders";
import OrgAdminWallet from "./pages/org-admin/OrgAdminWallet";
import OrgAdminReports from "./pages/org-admin/OrgAdminReports";
import OrgAdminCanteenFinance from "./pages/org-admin/OrgAdminCanteenFinance";
import OrgAdminMessages from "./pages/org-admin/OrgAdminMessages";
import OrgAdminFines from "./pages/org-admin/OrgAdminFines";
import OrgAdminTakeAction from "./pages/org-admin/OrgAdminTakeAction";

import CanteenOwnerLayout from "./pages/canteen-owner/CanteenOwnerLayout";
import CanteenOwnerDashboard from "./pages/canteen-owner/CanteenOwnerDashboard";
import CanteenOwnerMenu from "./pages/canteen-owner/CanteenOwnerMenu";
import CanteenOwnerOrders from "./pages/canteen-owner/CanteenOwnerOrders";
import CanteenOwnerHistory from "./pages/canteen-owner/CanteenOwnerHistory";
import CanteenOwnerEarnings from "./pages/canteen-owner/CanteenOwnerEarnings";
import CanteenOwnerReviews from "./pages/canteen-owner/CanteenOwnerReviews";
import CanteenOwnerProfile from "./pages/canteen-owner/CanteenOwnerProfile";
import CanteenOwnerMessages from "./pages/canteen-owner/CanteenOwnerMessages";
import CanteenOwnerReports from "./pages/canteen-owner/CanteenOwnerReports";
import CanteenOwnerWarnings from "./pages/canteen-owner/CanteenOwnerWarnings";

import BackButtonHandler from "./components/BackButtonHandler";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BackButtonHandler />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/org-register" element={<OrgRegisterPage />} />
          <Route path="/register-organization" element={<OrgRegisterPage />} />
          <Route path="/canteen-register" element={<CanteenRegisterPage />} />
          <Route path="/register-canteen" element={<CanteenRegisterPage />} />
          <Route path="/canteens" element={<CanteensPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/order-details" element={<OrderDetailsPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/my-reviews" element={<MyReviewsPage />} />
          <Route path="/my-wallet" element={<MyWalletPage />} />
          <Route path="/wallet-topup-payment" element={<WalletTopupPaymentPage />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/profile" element={<UserProfile />} />

          {/* Super Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="approvals" element={<AdminApprovalManagement />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="fines" element={<AdminFineManagement />} />
            <Route path="take-action" element={<AdminTakeAction />} />
          </Route>

          {/* Org Admin */}
          <Route path="/org-admin" element={<OrgAdminLayout />}>
            <Route index element={<OrgAdminDashboard />} />
            <Route path="canteen-approvals" element={<OrgAdminCanteenApprovals />} />
            <Route path="canteens" element={<OrgAdminCanteens />} />
            <Route path="orders" element={<OrgAdminOrders />} />
            <Route path="wallet" element={<OrgAdminWallet />} />
            <Route path="reports" element={<OrgAdminReports />} />
            <Route path="canteen-finance/:canteenId" element={<OrgAdminCanteenFinance />} />
            <Route path="messages" element={<OrgAdminMessages />} />
            <Route path="fines" element={<OrgAdminFines />} />
            <Route path="take-action" element={<OrgAdminTakeAction />} />
          </Route>

          {/* Canteen Owner */}
          <Route path="/canteen-owner" element={<CanteenOwnerLayout />}>
            <Route index element={<CanteenOwnerDashboard />} />
            <Route path="menu" element={<CanteenOwnerMenu />} />
            <Route path="orders" element={<CanteenOwnerOrders />} />
            <Route path="history" element={<CanteenOwnerHistory />} />
            <Route path="earnings" element={<CanteenOwnerEarnings />} />
            <Route path="reviews" element={<CanteenOwnerReviews />} />
            <Route path="profile" element={<CanteenOwnerProfile />} />
            <Route path="messages" element={<CanteenOwnerMessages />} />
            <Route path="reports" element={<CanteenOwnerReports />} />
            <Route path="warnings" element={<CanteenOwnerWarnings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
