import { CheckCircle2, ChefHat, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface OrderItem { itemName: string; quantity: number; price: number; }
interface Order {
  _id: string;
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  userId?: { name: string };
}

/** Returns a human-readable date label relative to today */
const getDateLabel = (iso: string): string => {
  const orderDate = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(orderDate, today)) return "Today";
  if (sameDay(orderDate, yesterday)) return "Yesterday";

  return orderDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/** Returns ISO date string (YYYY-MM-DD) for bucketing */
const getDateKey = (iso: string): string => iso.slice(0, 10);

const CanteenOwnerOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const fetchOrders = async (canteenId: string) => {
    const res = await fetch(`/api/orders/canteen/${canteenId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    const cachedId = localStorage.getItem("myCanteenId");
    if (cachedId) {
      fetchOrders(cachedId);
    } else {
      fetch("/api/canteens/my", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((c) => {
          if (c?._id) {
            localStorage.setItem("myCanteenId", c._id);
            fetchOrders(c._id);
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    }
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/updateStatus/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
        toast.success(`Order marked as ${status}`);
      } else {
        toast.error("Failed to update order status");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // --- Group orders by date, newest first ---
  const today = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 6); // today + 6 previous days = 7 days total

  const withinWeek = orders.filter((o) => new Date(o.createdAt) >= oneWeekAgo);

  // Build ordered groups: sort by date descending
  const groupMap = new Map<string, Order[]>();
  withinWeek.forEach((o) => {
    const key = getDateKey(o.createdAt);
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(o);
  });

  // Sort keys newest first
  const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8 relative">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 -mx-4 px-4 border-b border-transparent">
        <h2 className="text-lg font-semibold text-foreground">Incoming Orders</h2>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-10">Loading orders...</p>
      ) : sortedKeys.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">No orders in the past 7 days.</p>
      ) : (
        sortedKeys.map((key) => {
          const group = groupMap.get(key)!;
          // Use first order's timestamp for the label
          const label = getDateLabel(group[0].createdAt);

          return (
            <div key={key}>
              {/* ── Date section header ── */}
              <div className="flex items-center gap-3 mb-4">
                <CalendarDays className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-bold text-primary uppercase tracking-wide">
                  {label}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  {group.length} order{group.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* ── Orders in this date group ── */}
              <div className="space-y-3">
                {group.map((o) => (
                  <div
                    key={o._id}
                    className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow animate-fade-in"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-primary truncate">{o.orderId}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold capitalize shrink-0 ${
                          o.status === "completed"
                            ? "bg-success/10 text-success"
                            : o.status === "preparing"
                            ? "bg-warning/10 text-warning"
                            : "bg-accent/20 text-accent-foreground"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Ordered at {formatTime(o.createdAt)}
                      {o.userId?.name ? ` • ${o.userId.name}` : ""}
                    </p>

                    <ul className="mt-2.5 space-y-1 border-t border-b border-border/50 py-2.5 my-2.5">
                      {o.items?.map((item, i) => (
                        <li key={i} className="text-xs sm:text-sm text-foreground/80 flex items-center justify-between">
                          <span className="truncate pr-2">{item.itemName}</span>
                          <span className="font-semibold text-muted-foreground shrink-0">×{item.quantity}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <span className="text-xs text-muted-foreground uppercase font-medium">Total:</span>
                        <span className="text-base font-extrabold text-foreground">₹{o.totalAmount}</span>
                      </div>

                      {o.status === "pending" && (
                        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => updateStatus(o._id, "preparing")}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-warning px-3 py-2 text-xs font-bold text-warning-foreground hover:bg-warning/90 transition-colors shadow-sm active:scale-95"
                          >
                            <ChefHat className="h-4 w-4" /> Preparing
                          </button>
                          <button
                            onClick={() => updateStatus(o._id, "completed")}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-success px-3 py-2 text-xs font-bold text-success-foreground hover:bg-success/90 transition-colors shadow-sm active:scale-95"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Complete
                          </button>
                        </div>
                      )}

                      {o.status === "preparing" && (
                        <button
                          onClick={() => updateStatus(o._id, "completed")}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-success px-3.5 py-2 text-xs font-bold text-success-foreground hover:bg-success/90 transition-colors shadow-sm active:scale-95"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CanteenOwnerOrders;
