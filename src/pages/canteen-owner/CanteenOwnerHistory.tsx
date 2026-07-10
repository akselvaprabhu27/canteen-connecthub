import { useEffect, useState } from "react";

interface Order {
  _id: string;
  orderId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const CanteenOwnerHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const load = (canteenId: string) => {
      fetch(`/api/orders/canteen/${canteenId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => setLoading(false));
    };

    const cachedId = localStorage.getItem("myCanteenId");
    if (cachedId) {
      load(cachedId);
    } else {
      fetch("/api/canteens/my", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(c => {
          if (c?._id) { localStorage.setItem("myCanteenId", c._id); load(c._id); }
          else setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Order History</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No orders yet.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{o.orderId}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-foreground">₹{o.totalAmount}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${o.status === "completed" ? "bg-success/10 text-success" : o.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{o.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CanteenOwnerHistory;
