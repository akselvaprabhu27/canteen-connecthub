import { StatCard } from "@/components/StatCard";
import { Building2, UtensilsCrossed, ShoppingCart, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";

interface AdminStats {
  totalOrgs: number;
  totalCanteens: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  ordersToday: number;
  avgOrderValue: number;
  avgRating: number;
  recentActivity: string[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalOrgs: 0, totalCanteens: 0, totalOrders: 0, totalRevenue: 0,
    totalUsers: 0, ordersToday: 0, avgOrderValue: 0, avgRating: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated. Please log in as super admin.");
      setLoading(false);
      return;
    }
    fetch("/api/analytics/super-admin", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then(data => { setStats(data); setLoading(false); })
      .catch(err => { 
        console.error("Error fetching admin stats:", err);
        setError(err.message || "Failed to load dashboard");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-muted-foreground py-10 text-center">Loading dashboard...</div>;
  if (error) return <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Organizations" value={String(stats.totalOrgs)} icon={<Building2 className="h-5 w-5" />} />
        <StatCard title="Total Canteens" value={String(stats.totalCanteens)} icon={<UtensilsCrossed className="h-5 w-5" />} />
        <StatCard title="Total Orders" value={stats.totalOrders.toLocaleString()} icon={<ShoppingCart className="h-5 w-5" />} />
        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-card-foreground">Recent Activity</h2>
          <div className="mt-4 space-y-3">
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              stats.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  {activity}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-card-foreground">Platform Overview</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: "Active Users", value: stats.totalUsers.toLocaleString() },
              { label: "Orders Today", value: String(stats.ordersToday) },
              { label: "Avg Order Value", value: stats.avgOrderValue > 0 ? `₹${stats.avgOrderValue}` : "—" },
              { label: "Avg Rating", value: stats.avgRating > 0 ? `${stats.avgRating} ★` : "—" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
