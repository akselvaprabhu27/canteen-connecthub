import { StatCard } from "@/components/StatCard";
import { UtensilsCrossed, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface OrgStats {
  canteenCount: number;
  totalOrders: number;
  totalRevenue: number;
  commissionPaid: number;
  totalEarnings: number;
}

interface Order {
  _id: string;
  orderId: string;
  userId?: { name: string };
  totalAmount: number;
  status: string;
}

const OrgAdminDashboard = () => {
  const [stats, setStats] = useState<OrgStats>({ canteenCount: 0, totalOrders: 0, totalRevenue: 0, commissionPaid: 0, totalEarnings: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${token}` };

    // First get orgs for this admin
    fetch("/api/organizations/my", { headers: h })
      .then(r => r.json())
      .then(async (orgs) => {
        if (!Array.isArray(orgs) || orgs.length === 0) {
          setLoading(false);
          return;
        }
        const orgId = orgs[0]._id;
        const uid = user?._id || user?.id;
        localStorage.setItem(`myOrgId_${uid}`, orgId);
        localStorage.setItem(`myOrgName_${uid}`, orgs[0].name || "");

        const [statsRes, ordersRes] = await Promise.all([
          fetch(`/api/analytics/org-admin`, { headers: h }).then(r => r.json()),
          fetch(`/api/orders/org/${orgId}`, { headers: h }).then(r => r.json())
        ]);
        setStats(statsRes);
        setRecentOrders(Array.isArray(ordersRes) ? ordersRes.slice(0, 3) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted-foreground py-10 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Canteens" value={String(stats.canteenCount)} icon={<UtensilsCrossed className="h-5 w-5" />} />
        <StatCard title="Total Orders" value={stats.totalOrders.toLocaleString()} icon={<ShoppingCart className="h-5 w-5" />} />
        <StatCard title="Total Earnings" value={`₹${Math.round(stats.totalEarnings || 0).toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-card-foreground">Recent Orders</h2>
        <div className="mt-4 space-y-3">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            recentOrders.map((o) => (
              <div key={o._id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-primary">{o.orderId}</span>
                  <span className="ml-2 text-muted-foreground">— {o.userId?.name || "Customer"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-foreground">₹{o.totalAmount}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${o.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgAdminDashboard;
