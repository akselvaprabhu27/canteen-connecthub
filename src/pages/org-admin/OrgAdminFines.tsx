import React, { useState, useEffect } from "react";
import { DollarSign, FileText, Clock, CheckCircle, AlertTriangle, Loader2, CreditCard, X } from "lucide-react";
import { toast } from "sonner";

interface Fine {
  _id: string;
  fineId: string;
  reportId: {
    _id: string;
    reportId: string;
    issueType: string;
  };
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

const OrgAdminFines = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchMyFines();
  }, []);

  const fetchMyFines = async () => {
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch("/api/fines/my-fines", {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFines(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      toast.error("Failed to load fines");
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = async (fineId: string) => {
    setProcessing(true);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const res = await fetch(`/api/fines/pay/${fineId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ transactionId: "TEST_PAY_" + Date.now() })
      });
      
      if (res.ok) {
        setFines(prev => prev.map(f => f._id === fineId ? { ...f, status: "Paid" } : f));
        toast.success("Fine paid successfully!");
        setShowPayment(null);
      } else {
        toast.error("Payment failed");
      }
    } catch (err) {
      toast.error("Something went wrong during payment");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Cancelled": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <DollarSign className="h-10 w-10 text-primary" /> My Fines
          </h1>
          <p className="text-muted-foreground mt-2">History and pending penalties for your organization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <AlertTriangle className="h-24 w-24" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">Total Pending Amount</p>
          <p className="text-5xl font-black mb-6">
            ₹{fines.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0)}
          </p>
          <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
            <Clock className="h-3.5 w-3.5" /> Action Required Immediately
          </div>
        </div>

        <div className="p-8 rounded-[2rem] bg-card border border-border shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">Paid Fines</p>
          <p className="text-5xl font-black text-foreground mb-6">
            ₹{fines.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0)}
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-green-500 bg-green-500/10 w-fit px-3 py-1.5 rounded-full">
            <CheckCircle className="h-3.5 w-3.5" /> All history recorded
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
          Fine History <span className="text-xs text-muted-foreground font-medium">({fines.length} total)</span>
        </h2>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-border">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Retrieving history...</p>
          </div>
        ) : fines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-border border-dashed">
            <CheckCircle className="h-12 w-12 text-green-500/20 mb-4" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-center">
              Your organization is in good standing.<br/><span className="text-[10px] opacity-70">No fines issued.</span>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {fines.map(fine => (
              <div key={fine._id} className="group p-6 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all shadow-sm">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex gap-6">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 ${fine.status === 'Paid' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      <DollarSign className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{fine.fineId}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${getStatusColor(fine.status)}`}>
                          {fine.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-foreground">₹{fine.amount} - {fine.reason}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><FileText className="h-3 w-3" /> Report: {fine.reportId?.reportId}</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Issued: {new Date(fine.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0">
                    {fine.status === 'Pending' && (
                      <button 
                        onClick={() => setShowPayment(fine._id)}
                        className="w-full md:w-auto px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
                      >
                        <CreditCard className="h-4 w-4" /> Pay Now
                      </button>
                    )}
                    {fine.status === 'Paid' && (
                      <div className="text-green-500 font-black text-sm flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" /> PAID
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-card rounded-[2.5rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-border bg-gradient-to-br from-primary/10 to-purple-500/10">
              <div className="flex justify-between items-center mb-6">
                <div className="p-3 rounded-2xl bg-card border border-border">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <button 
                  onClick={() => !processing && setShowPayment(null)} 
                  className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-white transition-colors cursor-pointer border border-border/10 flex items-center justify-center"
                  title="Go Back"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h3 className="text-2xl font-black text-foreground">Fine Payment</h3>
              <p className="text-sm text-muted-foreground mt-1">Transaction for {fines.find(f => f._id === showPayment)?.fineId}</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="bg-muted/50 p-6 rounded-3xl border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Amount to pay</span>
                  <span className="text-xs font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">Secure</span>
                </div>
                <p className="text-4xl font-black text-foreground">₹{fines.find(f => f._id === showPayment)?.amount}</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-border bg-background flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">Test Payment Gateway</p>
                    <p className="text-[10px] text-slate-300">Mock environment enabled</p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
              </div>

              <button 
                onClick={() => handlePayFine(showPayment)}
                disabled={processing}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-6 w-6" />
                    Complete Payment
                  </>
                )}
              </button>
              
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                This is a simulated transaction
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgAdminFines;
