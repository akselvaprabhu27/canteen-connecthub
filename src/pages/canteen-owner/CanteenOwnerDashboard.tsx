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
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Today's Orders" value={String(stats.todayOrders)} icon={<ShoppingCart className="h-5 w-5" />} />
        <StatCard 
          title="Pending from Org" 
          value={`₹${(stats.pendingPayout || 0).toLocaleString()}`} 
          icon={<Clock className="h-5 w-5 text-amber-500" />} 
          className="bg-amber-500/5 border-amber-500/20"
        />
        
        {/* Organization Messages Card */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => navigate('/canteen-owner/messages')}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Bell className="h-4 w-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-primary">Org Messages</span>
            </div>
          </div>
          
          {latestMessage ? (
            <div className="space-y-1">
              <h4 className="text-sm font-black text-foreground truncate">{latestMessage.title}</h4>
              <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">{latestMessage.message}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{new Date(latestMessage.createdAt).toLocaleDateString()}</span>
                <span className="text-[10px] font-black text-primary flex items-center group-hover:translate-x-1 transition-transform">
                  View Inbox <ChevronRight className="h-3 w-3 ml-0.5" />
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 opacity-50">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">No new messages</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          {/* Active Warnings Widget */}
          {(warnings.org > 0 || warnings.admin > 0) && (
            <div 
              onClick={() => navigate('/canteen-owner/warnings')}
              className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm hover:shadow-md transition-all flex items-start gap-4 cursor-pointer group"
            >
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
                <AlertTriangle className="h-6 w-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-black text-amber-500 uppercase tracking-wider">Account Warning Advisory</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold">
                  Advisory warnings have been issued. Click here to review the official reports.
                </p>
                <div className="flex flex-wrap gap-2 mt-3 pt-2 text-[10px] font-black uppercase">
                  {warnings.org > 0 && (
                    <span className="bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-md">
                      Org Warnings: {warnings.org}
                    </span>
                  )}
                  {warnings.admin > 0 && (
                    <span className="bg-red-500/10 text-red-600 px-2.5 py-0.5 rounded-md">
                      Admin Warnings: {warnings.admin}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-black text-card-foreground">Recent Orders</h2>
          <div className="mt-4 space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground font-medium italic opacity-50">No orders yet.</p>
            ) : (
              recentOrders.map((o) => (
                <div key={o._id} className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3 text-sm hover:bg-muted/50 transition-colors">
                  <div className="max-w-[70%]">
                    <span className="font-black text-primary">{o.orderId}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground font-medium truncate">{o.items?.map(i => `${i.itemName} ×${i.quantity}`).join(", ")}</p>
                  </div>
                  <Badge variant="outline" className={`font-black text-[10px] uppercase tracking-tighter ${o.status === "completed" ? "bg-success/10 text-success border-success/20" : o.status === "preparing" ? "bg-warning/10 text-warning border-warning/20" : "bg-accent/20 text-accent-foreground"}`}>{o.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-black text-card-foreground">Quick Stats</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: "Avg Rating", value: stats.avgRating > 0 ? `${stats.avgRating} ★` : "—" },
              { label: "Total Reviews", value: String(stats.reviewCount) },
              { label: "Menu Items", value: String(stats.menuCount) },
              { label: "Total Orders", value: String(stats.totalOrders) },
            ].map((item) => (
              <div key={item.label} className="flex justify-between rounded-xl bg-muted/30 px-4 py-3 text-sm">
                <span className="text-muted-foreground font-bold uppercase text-[10px] tracking-wider">{item.label}</span>
                <span className="font-black text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanteenOwnerDashboard;
