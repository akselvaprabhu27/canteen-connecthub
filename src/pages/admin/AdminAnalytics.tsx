import { StatCard } from "@/components/StatCard";
import { Users, TrendingUp, ShoppingCart, Star } from "lucide-react";
import { useEffect, useState } from "react";

interface AnalyticsStats {
  totalUsers: number;
  avgOrderValue: number;
  ordersToday: number;
  avgRating: number;
}

interface TopCanteen { name: string; orders: number; }
interface PopularItem  { name: string; sold: number; }

const AdminAnalytics = () => {
  const [stats, setStats] = useState<AnalyticsStats>({ totalUsers: 0, avgOrderValue: 0, ordersToday: 0, avgRating: 0 });
  const [topCanteens, setTopCanteens] = useState<TopCanteen[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/analytics/super-admin", { headers: h }).then(r => r.json()),
      fetch("/api/analytics/top-canteens", { headers: h }).then(r => r.json()),
      fetch("/api/analytics/popular-items", { headers: h }).then(r => r.json()),
    ]).then(([s, tc, pi]) => {
      setStats({ totalUsers: s.totalUsers, avgOrderValue: s.avgOrderValue, ordersToday: s.ordersToday, avgRating: s.avgRating });
      setTopCanteens(Array.isArray(tc) ? tc : []);
      setPopularItems(Array.isArray(pi) ? pi : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted-foreground py-10 text-center">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Users" value={stats.totalUsers.toLocaleString()} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Avg Order Value" value={stats.avgOrderValue > 0 ? `₹${stats.avgOrderValue.toFixed(2)}` : "—"} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Orders Today" value={stats.ordersToday !== undefined ? String(stats.ordersToday) : "0"} icon={<ShoppingCart className="h-5 w-5" />} />
        <StatCard title="Avg Rating" value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"} icon={<Star className="h-5 w-5" />} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-card-foreground">Top Canteens</h3>
          <div className="mt-4 space-y-3">
            {topCanteens.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet. Top canteens will appear here.</p>
            ) : (
              topCanteens.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="text-muted-foreground">{c.orders} orders</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-card-foreground">Popular Items</h3>
          <div className="mt-4 space-y-3">
            {popularItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet. Popular items will appear here.</p>
            ) : (
              popularItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="text-muted-foreground">{item.sold} sold</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
