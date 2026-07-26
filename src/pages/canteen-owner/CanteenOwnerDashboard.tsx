import { StatCard } from "@/components/StatCard";
import { ShoppingCart, DollarSign, Clock, CheckCircle2, TrendingUp, Bell, MessageSquare, ChevronRight, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CanteenStats {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalEarnings: number;
  todayEarnings: number;
  pendingPayout: number;
  receivedEarnings: number;
  avgRating: number;
  reviewCount: number;
  menuCount: number;
}

interface Order {
  _id: string;
  orderId: string;
  items: { itemName: string; quantity: number }[];
  status: string;
}

interface Message {
  _id: string;
  title: string;
  message: string;
  priority: string;
  createdAt: string;
}

const CanteenOwnerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CanteenStats>({
    totalOrders: 0, todayOrders: 0, pendingOrders: 0, completedOrders: 0,
    totalEarnings: 0, todayEarnings: 0, pendingPayout: 0, receivedEarnings: 0,
    avgRating: 0, reviewCount: 0, menuCount: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [latestMessage, setLatestMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState({ org: 0, admin: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${token}` };

    fetch("/api/canteens/my", { headers: h })
      .then(r => r.json())
      .then(async (canteen) => {
        if (!canteen || !canteen._id) { setLoading(false); return; }
        setWarnings({
          org: canteen.orgWarningsCount || 0,
          admin: canteen.adminWarningsCount || 0
        });
        const canteenId = canteen._id;
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const uid = user?._id || user?.id;
        localStorage.setItem(`myCanteenId_${uid}`, canteenId);

        const [statsRes, ordersRes, messagesRes] = await Promise.all([
          fetch(`/api/analytics/canteen-owner`, { headers: h }).then(r => r.json()),
          fetch(`/api/orders/canteen/${canteenId}`, { headers: h }).then(r => r.json()),
          fetch(`/api/messages/canteen/inbox`, { headers: h }).then(r => r.json())
        ]);
        setStats(statsRes);
        setRecentOrders(Array.isArray(ordersRes) ? ordersRes.slice(0, 3) : []);
        
        if (Array.isArray(messagesRes) && messagesRes.length > 0) {
          // Filter out messages sent by the owner themselves
          const fromOrg = messagesRes.filter(m => m.senderId?._id !== uid);
          if (fromOrg.length > 0) setLatestMessage(fromOrg[0]);
        }
        
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted-foreground py-10 text-center animate-pulse font-bold uppercase tracking-widest">Loading dashboard...</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top 3 Stats Grid - Compact 3 Column Row on Mobile */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Today's Orders */}
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-5 shadow-sm flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">Today</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <ShoppingCart className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <h3 className="text-lg sm:text-3xl font-extrabold text-foreground truncate">{stats.todayOrders}</h3>
            <p className="text-[9px] sm:text-xs text-muted-foreground font-medium hidden sm:block">Orders Today</p>
          </div>
        </div>

        {/* Pending from Org */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 sm:p-5 shadow-sm flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider truncate">Pending</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <Clock className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <h3 className="text-sm sm:text-3xl font-extrabold text-foreground truncate">₹{(stats.pendingPayout || 0).toLocaleString()}</h3>
            <p className="text-[9px] sm:text-xs text-muted-foreground font-medium hidden sm:block">From Org</p>
          </div>
        </div>

        {/* Organization Messages */}
        <div 
          onClick={() => navigate('/canteen-owner/messages')}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-w-0 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider truncate">Messages</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Bell className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            {latestMessage ? (
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">{latestMessage.title}</h4>
                <p className="text-[9px] sm:text-xs text-primary font-bold flex items-center mt-0.5">
                  View <ChevronRight className="h-3 w-3 ml-0.5" />
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-muted-foreground opacity-70">None</h3>
                <p className="text-[9px] sm:text-xs text-muted-foreground">Inbox Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          {/* Active Warnings Widget */}
          {(warnings.org > 0 || warnings.admin > 0) && (
            <div 
              onClick={() => navigate('/canteen-owner/warnings')}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all flex items-start gap-3 sm:gap-4 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-xs font-extrabold text-amber-500 uppercase tracking-wider">Account Warning Advisory</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                  Advisory warnings issued. Tap to review official reports.
                </p>
                <div className="flex flex-wrap gap-2 mt-2 pt-1 text-[10px] font-bold uppercase">
                  {warnings.org > 0 && (
                    <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md">
                      Org: {warnings.org}
                    </span>
                  )}
                  {warnings.admin > 0 && (
                    <span className="bg-red-500/10 text-red-600 px-2 py-0.5 rounded-md">
                      Admin: {warnings.admin}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base font-extrabold text-card-foreground">Recent Orders</h2>
              <button onClick={() => navigate('/canteen-owner/orders')} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {recentOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground font-medium italic opacity-60">No orders yet.</p>
              ) : (
                recentOrders.map((o) => (
                  <div key={o._id} className="flex items-center justify-between rounded-xl bg-muted/30 px-3.5 py-2.5 text-xs sm:text-sm hover:bg-muted/50 transition-colors gap-2">
                    <div className="min-w-0">
                      <span className="font-extrabold text-primary">{o.orderId}</span>
                      <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground font-medium truncate">{o.items?.map(i => `${i.itemName} ×${i.quantity}`).join(", ")}</p>
                    </div>
                    <Badge variant="outline" className={`font-bold text-[9px] sm:text-[10px] uppercase tracking-tight shrink-0 ${o.status === "completed" ? "bg-success/10 text-success border-success/20" : o.status === "preparing" ? "bg-warning/10 text-warning border-warning/20" : "bg-accent/20 text-accent-foreground"}`}>{o.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm sm:text-base font-extrabold text-card-foreground mb-3 sm:mb-4">Quick Overview</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-3">
            {[
              { label: "Avg Rating", value: stats.avgRating > 0 ? `${stats.avgRating} ★` : "—" },
              { label: "Total Reviews", value: String(stats.reviewCount) },
              { label: "Menu Items", value: String(stats.menuCount) },
              { label: "Total Orders", value: String(stats.totalOrders) },
            ].map((item) => (
              <div key={item.label} className="flex flex-col sm:flex-row sm:justify-between rounded-xl bg-muted/30 p-3 text-xs sm:text-sm">
                <span className="text-muted-foreground font-bold uppercase text-[9px] sm:text-[10px] tracking-wider">{item.label}</span>
                <span className="font-extrabold text-foreground mt-1 sm:mt-0">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanteenOwnerDashboard;
