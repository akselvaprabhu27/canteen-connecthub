import { Navbar } from "@/components/Navbar";
import { ReportIssueModal } from "@/components/ReportIssueModal";
import { Link, useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, Package, Search, ChevronRight, IndianRupee, Heart, UtensilsCrossed, AlertTriangle } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

interface OrderItem {
  itemName: string;
  price: number;
  quantity: number;
}

interface Canteen {
  _id: string;
  canteenName: string;
}

interface Order {
  _id: string;
  orderId: string;
  canteenId: Canteen;
  organizationId: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed": return "text-green-500 bg-green-500/10";
    case "preparing": return "text-amber-500 bg-amber-500/10";
    case "cancelled": return "text-red-500 bg-red-500/10";
    default: return "text-blue-500 bg-blue-500/10";
  }
};

const OrderDetailsPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForReport, setSelectedOrderForReport] = useState<Order | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(stored);
    const userId = user._id || user.id;

    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders/user/${userId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setOrders(Array.isArray(data) ? data : []);
        } else {
          toast.error("Failed to load orders");
        }
      } catch (err) {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Order History</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">You have {orders.length} total orders</p>
          </div>
          <Link to="/dashboard" className="rounded-xl border border-border bg-card px-4 py-2 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition-colors text-center w-full sm:w-auto">
            Go to Dashboard
          </Link>
        </div>

        {/* Order Summary Banner - Compact 3 column grid on mobile */}
        {!loading && orders.length > 0 && (
          <div className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/70 p-4 sm:p-6 shadow-lg shadow-primary/20 text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)] pointer-events-none" />
            <div className="grid grid-cols-3 gap-2 sm:gap-6 text-center relative z-10">
              {/* Total Orders */}
              <div className="flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                  <UtensilsCrossed className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-sm sm:text-3xl font-bold truncate">{orders.length}</p>
                  <p className="text-[10px] sm:text-sm text-primary-foreground/80 truncate">Orders Placed</p>
                </div>
              </div>
              {/* Total Money Spent */}
              <div className="flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                  <IndianRupee className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-sm sm:text-3xl font-bold truncate">₹{orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}</p>
                  <p className="text-[10px] sm:text-sm text-primary-foreground/80 truncate">Total Spent</p>
                </div>
              </div>
              {/* Favorite Canteen */}
              <div className="flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                  <Heart className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-xs sm:text-xl font-bold truncate">
                    {(() => {
                      const counts: Record<string, number> = {};
                      orders.forEach(o => {
                        const name = o.canteenId?.canteenName || "Unknown";
                        counts[name] = (counts[name] || 0) + 1;
                      });
                      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
                    })()}
                  </p>
                  <p className="text-[10px] sm:text-sm text-primary-foreground/80 truncate">Top Canteen</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12 text-center">
            <Package className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">No Orders Yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-5">You haven't placed any orders yet.</p>
            <Link to="/dashboard" className="inline-block rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Browse Canteens
            </Link>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-muted/30 p-4 sm:px-6 sm:py-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                        {order.canteenId?.canteenName || "Canteen"}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5 truncate">
                        Order #{order.orderId || order._id.slice(-6)} <span className="font-normal text-[10px] sm:text-xs text-muted-foreground">· {new Date(order.createdAt).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-border/50">
                    <span className="text-base sm:text-lg font-bold text-foreground">₹{order.totalAmount}</span>
                    <span className={`rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status || "Pending"}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 sm:px-6 sm:py-4">
                  <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">Items Ordered:</h4>
                  <div className="space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground truncate pr-2">{item.quantity} × {item.itemName}</span>
                        <span className="font-medium text-foreground shrink-0">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    
                    {/* GST Breakdown */}
                    <div className="pt-2 mt-2 border-t border-border flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">GST (5%)</span>
                      <span className="font-medium text-foreground">
                        ₹{order.totalAmount - (order.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-end gap-2">
                    <Link 
                      to="/review" 
                      state={{ 
                        canteenId: order.canteenId?._id, 
                        canteenName: order.canteenId?.canteenName,
                        orderId: order._id 
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Search className="h-3.5 w-3.5" /> Leave Review
                    </Link>
                    <button 
                      onClick={() => setSelectedOrderForReport(order)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-500/10 transition-colors"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Report Issue
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrderForReport && (
        <ReportIssueModal 
          isOpen={!!selectedOrderForReport}
          onClose={() => setSelectedOrderForReport(null)}
          order={selectedOrderForReport}
        />
      )}
    </div>
  );
};

export default OrderDetailsPage;
