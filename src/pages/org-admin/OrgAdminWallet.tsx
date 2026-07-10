import { StatCard } from "@/components/StatCard";
import { Wallet, TrendingUp, Clock, CheckCircle, Store, ArrowRight, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface OrgWallet {
  balance: number;
  totalRevenue: number;
  realizedEarnings: number;
  pendingPayouts: number;
}

interface CanteenFinance {
  canteenId: string;
  canteenName: string;
  todayOrders: number;
  overallOrders: number;
  todayRevenue: number;
  overallRevenue: number;
  pendingPayout: number;
  commissionPercent: number;
}

const OrgAdminWallet = () => {
  const [wallet, setWallet] = useState<OrgWallet | null>(null);
  const [canteens, setCanteens] = useState<CanteenFinance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uid = user?._id || user?.id;
    const token = localStorage.getItem("token");
    const orgId = localStorage.getItem(`myOrgId_${uid}`);

    const loadData = async (id: string) => {
      try {
        const [walletRes, canteensRes] = await Promise.all([
          fetch(`/api/org-finance/wallet/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/org-finance/canteens/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const walletData = await walletRes.json();
        const canteensData = await canteensRes.json();
        
        setWallet(walletData);
        setCanteens(canteensData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading wallet data:", error);
        setLoading(false);
      }
    };

    if (orgId) {
      loadData(orgId);
    } else {
      fetch("/api/organizations/my", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(orgs => {
          if (Array.isArray(orgs) && orgs.length > 0) {
            localStorage.setItem(`myOrgId_${uid}`, orgs[0]._id);
            loadData(orgs[0]._id);
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    }
  }, []);

  if (loading) return <div className="text-muted-foreground py-10 text-center animate-pulse text-lg font-medium">Loading organization wallet...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">Organization Wallet</h1>
        <p className="text-muted-foreground">Manage your organization's total revenue and canteen payouts.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Wallet Balance" 
          value={`₹${(wallet?.balance || 0).toLocaleString()}`} 
          icon={<Wallet className="h-5 w-5" />} 
          className="bg-primary/5 border-primary/20"
        />
        <StatCard 
          title="Total Earnings" 
          value={`₹${(wallet?.realizedEarnings || 0).toLocaleString()}`} 
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} 
          className="bg-emerald-500/5 border-emerald-500/20"
        />
        <StatCard 
          title="Net Payout Pending" 
          value={`₹${Math.max(0, Math.round(canteens.reduce((acc, c) => acc + c.pendingPayout, 0))).toLocaleString()}`} 
          icon={<Clock className="h-5 w-5 text-amber-500" />} 
          className="bg-amber-500/5 border-amber-500/20"
        />
        <StatCard 
          title="Today's Revenue" 
          value={`₹${canteens.reduce((acc, c) => acc + c.todayRevenue, 0).toLocaleString()}`} 
          icon={<DollarSign className="h-5 w-5 text-blue-500" />} 
          className="bg-blue-500/5 border-blue-500/20"
        />
      </div>

      {/* Canteens List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground font-heading">Canteen Finances</h2>
          <span className="text-sm text-muted-foreground">{canteens.length} canteens active</span>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {canteens.map((c) => (
            <Link 
              key={c.canteenId} 
              to={`/org-admin/canteen-finance/${c.canteenId}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{c.canteenName}</h3>
                    <p className="text-xs text-muted-foreground">Commission: {c.commissionPercent}%</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Today's Revenue</p>
                  <p className="text-lg font-bold text-emerald-500">₹{c.todayRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending Payout</p>
                  <p className="text-lg font-bold text-amber-500">₹{Math.max(0, Math.round(c.pendingPayout)).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Overall Revenue</p>
                  <p className="text-sm font-semibold text-foreground">₹{c.overallRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Orders</p>
                  <p className="text-sm font-semibold text-foreground">{c.overallOrders}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrgAdminWallet;
