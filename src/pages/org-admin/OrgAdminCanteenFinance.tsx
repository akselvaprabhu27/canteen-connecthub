import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { 
  Store, 
  User as UserIcon, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  ArrowLeft,
  Settings,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Payout {
  _id: string;
  amount: number;
  status: string;
  paidAt: string;
}

interface CanteenFinanceDetail {
  canteenInfo: {
    name: string;
    owner: string;
    status: string;
  };
  stats: {
    todayOrders: number;
    overallOrders: number;
    todayRevenue: number;
    overallRevenue: number;
    grossSales: number;
    commissionPercent: number;
    pendingPayout: number;
    paidOutAmount: number;
  };
  payouts: Payout[];
}

const OrgAdminCanteenFinance = () => {
  const { canteenId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<CanteenFinanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [showCommissionDialog, setShowCommissionDialog] = useState(false);
  const [newCommission, setNewCommission] = useState("");
  const [payoutProcessing, setPayoutProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [canteenId]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/org-finance/canteen-detail/${canteenId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      setData(result);
      setNewCommission(result.stats.commissionPercent.toString());
      setLoading(false);
    } catch (error) {
      console.error("Error loading canteen finance detail:", error);
      setLoading(false);
    }
  };

  const handleUpdateCommission = async () => {
    try {
      const val = parseFloat(newCommission);
      if (isNaN(val) || val < 0 || val > 100) {
        toast.error("Please enter a valid commission percentage (0-100)");
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/org-finance/commission/${canteenId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ commissionPercent: val })
      });

      if (res.ok) {
        toast.success("Commission updated successfully");
        setShowCommissionDialog(false);
        loadData();
      } else {
        toast.error("Failed to update commission");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleProcessPayout = async () => {
    if (!data) return;
    setPayoutProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/org-finance/payout/${canteenId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ amount: Number(data.stats.pendingPayout.toFixed(2)) })
      });

      if (res.ok) {
        toast.success("Payout processed successfully");
        setShowPayoutDialog(false);
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to process payout");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setPayoutProcessing(false);
    }
  };

  if (loading) return <div className="text-muted-foreground py-10 text-center animate-pulse">Loading canteen financial details...</div>;
  if (!data) return <div className="text-center py-10">Data not found.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="default" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="rounded-full h-11 w-11 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 text-primary-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">{data.canteenInfo.name} Finance</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserIcon className="h-3.5 w-3.5" /> {data.canteenInfo.owner}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${data.canteenInfo.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                <ShieldCheck className="h-3 w-3" /> {data.canteenInfo.status}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowCommissionDialog(true)} 
            className="group relative overflow-hidden gap-2 h-11 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all px-5"
          >
            <Settings className="h-4 w-4 text-primary group-hover:rotate-90 transition-transform duration-500" />
            <span className="font-bold text-primary">Commission: {data.stats.commissionPercent}%</span>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </Button>
          <Button 
            onClick={() => setShowPayoutDialog(true)} 
            disabled={Math.round(data.stats.pendingPayout) <= 0}
            className="h-11 rounded-xl gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 px-6 font-bold"
          >
            <CreditCard className="h-4 w-4" /> Payout ₹{Math.max(0, data.stats.pendingPayout).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Orders" value={data.stats.todayOrders.toString()} icon={<Calendar className="h-5 w-5" />} />
        <StatCard title="Overall Orders" value={data.stats.overallOrders.toString()} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Today's Revenue" value={`₹${data.stats.todayRevenue.toLocaleString()}`} icon={<Clock className="h-5 w-5 text-emerald-500" />} />
        <StatCard title="Overall Revenue" value={`₹${data.stats.overallRevenue.toLocaleString()}`} icon={<TrendingUp className="h-5 w-5 text-blue-500" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="border-b border-border bg-muted/30 px-6 py-4">
              <h3 className="font-bold text-foreground font-heading">Financial Summary</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Gross Revenue</span>
                <span className="text-lg font-bold text-foreground">₹{(data.stats.grossSales || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Commission Deducted ({data.stats.commissionPercent}%)</span>
                <span className="text-lg font-bold text-rose-500">- ₹{((data.stats.grossSales || 0) * data.stats.commissionPercent / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-border pt-4">
                <span className="text-muted-foreground">Net Payout Potential</span>
                <span className="text-xl font-extrabold text-foreground">₹{((data.stats.grossSales || 0) * (1 - data.stats.commissionPercent / 100)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Amount Already Paid Out</span>
                <span className="text-lg font-bold text-blue-500">₹{data.stats.paidOutAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-amber-700">Net Pending Payout</span>
                </div>
                <span className="text-2xl font-black text-amber-600">₹{Math.max(0, data.stats.pendingPayout).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Payout History */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="border-b border-border bg-muted/30 px-6 py-4">
              <h3 className="font-bold text-foreground font-heading">Payout History</h3>
            </div>
            <div className="divide-y divide-border">
              {data.payouts.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground italic">No payout history found.</div>
              ) : (
                data.payouts.map((p) => (
                  <div key={p._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">₹{p.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.paidAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Info / Quick Actions */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-white shadow-xl shadow-primary/20">
            <Store className="h-10 w-10 mb-4 opacity-50" />
            <h3 className="text-lg font-bold mb-2">Payout Policy</h3>
            <p className="text-sm text-primary-foreground/90 leading-relaxed">
              Payouts are processed instantly from the organization's wallet. Please ensure sufficient balance is available before confirming a payout.
            </p>
          </div>
          
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4 font-heading">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-foreground transition-all group" onClick={() => setShowCommissionDialog(true)}>
                <Settings className="h-4 w-4 text-primary group-hover:rotate-90 transition-transform duration-500" /> Change Commission
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-12 rounded-xl text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                onClick={() => setShowPayoutDialog(true)}
                disabled={data.stats.pendingPayout <= 0.01}
              >
                <CreditCard className="h-4 w-4" /> Request Payout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Dialog */}
      <Dialog open={showCommissionDialog} onOpenChange={setShowCommissionDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Update Commission Percentage</DialogTitle>
            <DialogDescription>
              Set the percentage of gross revenue that the organization will retain.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4">
              <Input 
                type="number" 
                value={newCommission} 
                onChange={(e) => setNewCommission(e.target.value)} 
                placeholder="Enter percentage (e.g. 10)"
                className="rounded-xl h-12"
              />
              <span className="text-xl font-bold text-muted-foreground">%</span>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowCommissionDialog(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleUpdateCommission} className="rounded-xl px-8">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Confirmation Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Confirm Payout
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              Are you sure you want to payout <strong className="text-foreground text-lg">₹{Math.max(0, data.stats.pendingPayout).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</strong> to <strong className="text-foreground">{data.canteenInfo.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 my-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              This action will deduct the amount from your organization wallet and mark the canteen's pending payout as cleared.
            </p>
          </div>
          <DialogFooter className="mt-4 gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowPayoutDialog(false)} className="rounded-xl" disabled={payoutProcessing}>Cancel</Button>
            <Button 
              onClick={handleProcessPayout} 
              className="rounded-xl px-8 bg-amber-500 hover:bg-amber-600 text-white"
              disabled={payoutProcessing}
            >
              {payoutProcessing ? "Processing..." : "Confirm Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgAdminCanteenFinance;
