import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Order {
  _id: string;
  orderId: string;
  userId?: { name: string };
  canteenId?: { canteenName: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}

const OrgAdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uid = user?._id || user?.id;
    const token = localStorage.getItem("token");
    const orgId = localStorage.getItem(`myOrgId_${uid}`);
    if (!orgId) {
      // try to load via /my
      fetch("/api/organizations/my", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(orgs => {
          if (Array.isArray(orgs) && orgs.length > 0) {
            localStorage.setItem(`myOrgId_${uid}`, orgs[0]._id);
            return fetch(`/api/orders/org/${orgs[0]._id}`, { headers: { Authorization: `Bearer ${token}` } });
          }
          throw new Error("No org");
        })
        .then(r => r.json())
        .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      fetch(`/api/orders/org/${orgId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">All Orders</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Canteen</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No orders yet.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{o.orderId}</td>
                  <td className="px-4 py-3 text-foreground">{o.userId?.name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.canteenId?.canteenName || "—"}</td>
                  <td className="px-4 py-3 text-foreground">₹{o.totalAmount}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${o.status === "completed" ? "bg-success/10 text-success" : o.status === "preparing" ? "bg-warning/10 text-warning" : o.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-accent/20 text-accent-foreground"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrgAdminOrders;
