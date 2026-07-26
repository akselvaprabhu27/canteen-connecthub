import { StatCard } from "@/components/StatCard";
import { DollarSign, TrendingUp, Wallet, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EarningsData {
  pendingPayout: number;
  receivedEarnings: number;
  earningsPerDay: { day: string; amount: number }[];
  canteenId: string;
  organizationId: string;
}

const CanteenOwnerEarnings = () => {
  const [data, setData] = useState<EarningsData>({
    pendingPayout: 0,
    receivedEarnings: 0,
    earningsPerDay: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => ({ day: d, amount: 0 })),
    canteenId: "",
    organizationId: ""
  });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const fetchEarnings = (canteenId: string) => {
    const token = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${token}` };

    fetch(`/api/analytics/canteen-owner`, { headers: h })
      .then(r => r.json())
      .then(stats => {
        setData(prev => ({
          ...prev,
          pendingPayout: stats.pendingPayout || 0,
          receivedEarnings: stats.receivedEarnings || 0,
          earningsPerDay: stats.earningsPerDay || [],
          canteenId: canteenId
        }));
        
        // Also need organizationId for request
        fetch(`/api/canteens/my`, { headers: h })
          .then(r => r.json())
          .then(c => {
            setData(prev => ({ ...prev, organizationId: c.organizationId }));
            setLoading(false);
          });
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uid = user?._id || user?.id;
    const cachedId = localStorage.getItem(`myCanteenId_${uid}`);
    
    if (cachedId) {
      fetchEarnings(cachedId);
    } else {
      const token = localStorage.getItem("token");
      fetch("/api/canteens/my", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(c => {
          if (c?._id) { 
            localStorage.setItem(`myCanteenId_${uid}`, c._id); 
            fetchEarnings(c._id); 
          } else setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, []);

  const handleRequestPayment = async () => {
    if (data.pendingPayout <= 0.99) {
      toast.error("Minimum payout request is ₹1");
      return;
    }

    setRequesting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/payment-requests/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: data.pendingPayout,
          canteenId: data.canteenId,
          organizationId: data.organizationId
        })
      });

      if (res.ok) {
        toast.success("Payout request sent as message to organization!");
        // Refresh data to reflect potential changes if any
        fetchEarnings(data.canteenId);
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to send request");
      }
    } catch {
      toast.error("Error sending payment request");
    } finally {
      setRequesting(false);
    }
  };

  const maxAmount = Math.max(...data.earningsPerDay.map(d => d.amount), 1);

  if (loading) return <div className="text-muted-foreground py-20 text-center animate-pulse font-black uppercase tracking-widest">Loading financial data...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground">Financial Overview</h2>
          <p className="text-sm text-muted-foreground">Manage your earnings and request payouts</p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-amber-500/70 mb-1 sm:mb-2">Pending Payout</p>
              <h3 className="text-2xl sm:text-4xl font-black text-foreground">₹{data.pendingPayout.toLocaleString()}</h3>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="mt-6 sm:mt-8 relative z-10">
            <Button 
              onClick={handleRequestPayment}
              disabled={requesting || data.pendingPayout <= 0.99}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl h-11 sm:h-12 text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
            >
              {requesting ? "Processing Request..." : "Request Instant Payout"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors" />
        </div>
        
        <StatCard 
          title="Received Earnings" 
          value={`₹${data.receivedEarnings.toLocaleString()}`} 
          icon={<CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />} 
          className="bg-emerald-500/5 border-emerald-500/20 p-5 sm:p-8 rounded-2xl sm:rounded-3xl"
        />
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-black text-card-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> Earnings History
          </h3>
          <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">Last 7 Days</span>
        </div>
        
        <div className="flex h-48 sm:h-64 items-end gap-1.5 sm:gap-4 px-1 sm:px-2">
          {data.earningsPerDay.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2 sm:gap-3 group">
              <div className="relative w-full h-36 sm:h-48 flex flex-col justify-end items-center">
                <div
                  className="w-full rounded-xl sm:rounded-2xl bg-primary/20 group-hover:bg-primary transition-all duration-500 relative overflow-hidden"
                  style={{ height: `${maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0}%`, minHeight: "8px" }}
                  title={`₹${Math.round(d.amount)}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {d.amount > 0 && (
                  <span className="absolute -top-7 text-[9px] sm:text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1">
                    ₹{Math.round(d.amount)}
                  </span>
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">{d.day}</span>
            </div>
          ))}
        </div>
        
        {data.earningsPerDay.every(d => d.amount === 0) && (
          <div className="py-12 sm:py-20 text-center flex flex-col items-center gap-2">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/20" />
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">No earnings data yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanteenOwnerEarnings;
