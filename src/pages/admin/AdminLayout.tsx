import { Outlet } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LayoutDashboard, ClipboardCheck, DollarSign, Settings, BarChart3, Shield, AlertTriangle, ShieldAlert } from "lucide-react";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Approvals", to: "/admin/approvals", icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: "Revenue", to: "/admin/revenue", icon: <DollarSign className="h-4 w-4" /> },
  { label: "Analytics", to: "/admin/analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "User Reports", to: "/admin/reports", icon: <AlertTriangle className="h-4 w-4" /> },
  { label: "Fine", to: "/admin/fines", icon: <DollarSign className="h-4 w-4" /> },
  { label: "Take Action", to: "/admin/take-action", icon: <ShieldAlert className="h-4 w-4" /> },
];

const AdminLayout = () => {
  const coolTitle = (
    <div className="flex items-center gap-4 py-1">
      <div className="relative group">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-purple-600 opacity-25 blur transition duration-300 group-hover:opacity-50"></div>
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-card border border-primary/20 shadow-xl">
          <Shield className="h-6 w-6 text-primary" />
        </div>
      </div>
      <div className="flex flex-col">
        <h1 className="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent font-heading">
          Super Admin
        </h1>
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
            System Control Center
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Super Admin" navItems={navItems} themeClass="theme-super-admin" headerTitle={coolTitle}>
      <Outlet />
    </DashboardLayout>
  );
};

export default AdminLayout;
