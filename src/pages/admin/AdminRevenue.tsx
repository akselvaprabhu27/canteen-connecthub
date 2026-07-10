import { StatCard } from "@/components/StatCard";
import { DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

interface RevenueStats {
  totalRevenue: number;
  thisMonth: number;
  monthlyData: { month: string; revenue: number }[];
}

const AdminRevenue = () => {
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0, thisMonth: 0,
    monthlyData: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => ({ month: m, revenue: 0 }))
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/analytics/revenue", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const maxRevenue = Math.max(...stats.monthlyData.map(d => d.revenue), 1);

  if (loading) return <div className="text-muted-foreground py-10 text-center">Loading revenue...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Revenue Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Total Platform Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Revenue This Month" value={`₹${stats.thisMonth.toLocaleString()}`} icon={<ArrowUpRight className="h-5 w-5" />} />
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-card-foreground">Monthly Revenue</h3>
        {stats.totalRevenue === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No revenue data yet. Revenue will appear here when orders are placed.</p>
        ) : (
          <div className="mt-4 flex h-48 items-end gap-2">
            {stats.monthlyData.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-primary/20 hover:bg-primary/40 transition-colors"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: d.revenue > 0 ? "4px" : "0" }}
                  title={`₹${d.revenue.toLocaleString()}`}
                />
                <span className="text-[10px] text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRevenue;
