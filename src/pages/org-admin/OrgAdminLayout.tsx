import { Outlet } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { LayoutDashboard, UtensilsCrossed, ShoppingCart, Wallet, FileText, ClipboardCheck, Building2, MessageSquare, ShieldAlert } from "lucide-react";

const navItems = [
  { label: "Dashboard", to: "/org-admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Canteen Approvals", to: "/org-admin/canteen-approvals", icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: "Canteens", to: "/org-admin/canteens", icon: <UtensilsCrossed className="h-4 w-4" /> },
  { label: "Orders", to: "/org-admin/orders", icon: <ShoppingCart className="h-4 w-4" /> },
  { label: "Wallet", to: "/org-admin/wallet", icon: <Wallet className="h-4 w-4" /> },
  { label: "Reports", to: "/org-admin/reports", icon: <FileText className="h-4 w-4" /> },
  { label: "Messages", to: "/org-admin/messages", icon: <MessageSquare className="h-4 w-4" /> },
  { label: "My Fine", to: "/org-admin/fines", icon: <Wallet className="h-4 w-4" /> },
  { label: "Take Action", to: "/org-admin/take-action", icon: <ShieldAlert className="h-4 w-4" /> },
];

const OrgAdminLayout = () => {
  const [orgName, setOrgName] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uid = user?._id || user?.id;
    return localStorage.getItem(`myOrgName_${uid}`) || "";
  });

  useEffect(() => {
    // Re-read from localStorage in case it was set after mount (e.g. on Dashboard load)
    const check = setInterval(() => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const uid = user?._id || user?.id;
      const stored = localStorage.getItem(`myOrgName_${uid}`);
      if (stored) { setOrgName(stored); clearInterval(check); }
    }, 300);
    return () => clearInterval(check);
  }, []);

  const coolTitle = (
    <div className="flex items-center gap-4 py-1">
      <div className="relative group">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-emerald-600 opacity-25 blur transition duration-300 group-hover:opacity-50"></div>
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-card border border-primary/20 shadow-xl">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
      </div>
      <div className="flex flex-col">
        <h1 className="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent font-heading">
          {orgName || "Organization"}
        </h1>
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
            Organization Dashboard
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title="Org Admin"
      navItems={navItems}
      themeClass="theme-org-admin"
      headerTitle={coolTitle}
    >
      <Outlet />
    </DashboardLayout>
  );
};

export default OrgAdminLayout;
