import { Outlet } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LayoutDashboard, UtensilsCrossed, ShoppingCart, DollarSign, Star, Clock, User, Store, MessageSquare, FileText, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Dashboard", to: "/canteen-owner", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Menu Management", to: "/canteen-owner/menu", icon: <UtensilsCrossed className="h-4 w-4" /> },
  { label: "Incoming Orders", to: "/canteen-owner/orders", icon: <ShoppingCart className="h-4 w-4" /> },
  { label: "Order History", to: "/canteen-owner/history", icon: <Clock className="h-4 w-4" /> },
  { label: "Food Safety Reports", to: "/canteen-owner/reports", icon: <FileText className="h-4 w-4" /> },
  { label: "Earnings", to: "/canteen-owner/earnings", icon: <DollarSign className="h-4 w-4" /> },
  { label: "Messages", to: "/canteen-owner/messages", icon: <MessageSquare className="h-4 w-4" /> },
  { label: "Reviews", to: "/canteen-owner/reviews", icon: <Star className="h-4 w-4" /> },
  { label: "Profile", to: "/canteen-owner/profile", icon: <User className="h-4 w-4" /> },
  { label: "Warnings", to: "/canteen-owner/warnings", icon: <AlertTriangle className="h-4 w-4" /> },
];

const CanteenOwnerLayout = () => {
  const [canteen, setCanteen] = useState<any>(null);
  const [canteenName, setCanteenName] = useState<string>("Canteen Owner");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("/api/canteens/my", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) {
          throw new Error("Failed to fetch canteen details");
        }
        return r.json();
      })
      .then(data => {
        if (data) {
          setCanteen(data);
          if (data.canteenName) {
            setCanteenName(data.canteenName);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching canteen details:", err);
        setLoading(false);
      });
  }, []);

  const coolTitle = (
    <div className="flex items-center gap-2.5 sm:gap-4 py-1 min-w-0">
      <div className="relative group shrink-0">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-orange-600 opacity-25 blur transition duration-300 group-hover:opacity-50"></div>
        <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-card border border-primary/20 shadow-xl">
          <Store className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
        </div>
      </div>
      <div className="flex flex-col min-w-0">
        <h1 className="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-base sm:text-2xl font-extrabold tracking-tight text-transparent font-heading truncate">
          {canteenName}
        </h1>
        <div className="flex items-center gap-1.5">
          <span className="flex h-1.5 w-1.5 rounded-full bg-success animate-pulse shrink-0"></span>
          <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground/70 truncate">
            Canteen Dashboard
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (canteen && canteen.isBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100 p-6 relative overflow-hidden">
        {/* Decorative subtle background gradients */}
        <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-red-600/10 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-orange-600/10 blur-[100px]" />

        <div className="relative w-full max-w-xl rounded-2xl border border-red-500/20 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl md:p-12">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute -inset-1 rounded-full bg-red-600 opacity-25 blur-sm animate-pulse"></div>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-950 border border-red-500/50 shadow-inner">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-red-500 mb-2">
              Access Restricted
            </h1>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-red-400/70 mb-6">
              Canteen Account Suspended
            </p>

            <div className="w-full text-left rounded-xl bg-slate-950/70 border border-slate-800 p-6 mb-8">
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Suspension Source
                </span>
                <p className="text-sm font-semibold text-slate-300 mt-1">
                  {canteen.blockedBy === "super_admin" 
                    ? "System Superadmin" 
                    : "Organization Administration"}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Reason Provided
                </span>
                <p className="text-sm font-medium text-slate-300 mt-2 bg-slate-900 border border-red-950/50 p-4 rounded-lg italic">
                  "{canteen.blockReason || "No specific reason provided by the administrator."}"
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm mb-8 leading-relaxed">
              Your canteen dashboard operations (menu management, incoming orders, and earnings tracking) have been locked. Please contact your organization administration for review or appeal.
            </p>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 border border-slate-700 transition duration-150 shadow-md cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title={canteenName} navItems={navItems} themeClass="theme-canteen-owner" headerTitle={coolTitle}>
      <Outlet />
    </DashboardLayout>
  );
};

export default CanteenOwnerLayout;
