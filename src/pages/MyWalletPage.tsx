import { Link, useNavigate } from "react-router-dom";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, ChevronRight, AlertCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Transaction {
  _id: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'success' | 'failed' | 'pending';
  description: string;
  createdAt: string;
}

const MyWalletPage = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState("");

  const quickAmounts = [100, 200, 500, 1000];

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const fetchWalletDetails = async () => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(stored);
    if (user.role === "super_admin") {
      navigate("/admin");
      return;
    }
    const token = user.token;

    try {
      const res = await fetch("/api/wallet/details", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.walletBalance);
        setTransactions(data.transactions);
      } else {
        toast.error(data.message || "Failed to load wallet details");
      }
    } catch (err) {
      toast.error("An error occurred while fetching wallet details");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = () => {
    const amt = parseFloat(amountToAdd);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    localStorage.setItem("walletTopupAmount", amt.toString());
    navigate("/wallet-topup-payment");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">My Wallet</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your funds and view transactions</p>
          </div>
          <Link to="/dashboard" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors text-center">
            Go to Dashboard
          </Link>
        </div>

        {/* Wallet Balance Card */}
        <div className="relative mb-8 rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 text-primary-foreground shadow-xl shadow-primary/20 overflow-hidden animate-fade-in">
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_60%)]" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-primary-foreground/70 mb-2">
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Current Balance</span>
            </div>
            <h2 className="text-5xl font-bold mb-8">₹{balance.toLocaleString()}</h2>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setShowAddMoney(true)}
                className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-primary shadow-lg hover:bg-primary-foreground transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" /> Add Cash to Wallet
              </button>
              {balance < 100 && (
                <div className="flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur-md px-4 py-3 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 text-amber-300" />
                  <span className="text-white">Low balance! Add money now.</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="absolute top-8 right-8 animate-pulse text-white/20">
            <Sparkles className="h-12 w-12" />
          </div>
        </div>

        {/* Add Money Section (Collapsible/Conditional) */}
        {showAddMoney && (
          <div className="mb-8 rounded-3xl border border-border bg-card p-8 shadow-sm animate-in slide-in-from-top duration-300">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Add Money</h3>
              <button onClick={() => setShowAddMoney(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            </div>
            
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-foreground">Enter Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amountToAdd}
                  onChange={(e) => setAmountToAdd(e.target.value)}
                  className="w-full rounded-2xl border border-input bg-background pl-10 pr-4 py-4 text-2xl font-bold text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>
            </div>
            
            <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmountToAdd(amt.toString())}
                  className={`rounded-xl border border-border py-3 text-sm font-bold transition-all hover:border-primary hover:text-primary ${amountToAdd === amt.toString() ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground'}`}
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleProceedToPayment}
                className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                Proceed to Payment
              </button>
              
              <div className="flex items-center justify-center gap-2 rounded-xl bg-green-500/10 p-3 text-xs font-semibold text-green-600">
                <Sparkles className="h-4 w-4" />
                <span>Get ₹10 cashback on adding ₹500 or more!</span>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden animate-fade-in delay-100">
          <div className="flex items-center justify-between border-b border-border px-6 py-5 bg-muted/30">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Transaction History
            </h3>
            <span className="text-xs font-medium text-muted-foreground">{transactions.length} Transactions</span>
          </div>
          
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-10 text-center space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : transactions.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground/30">
                  <Clock className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-1">No transactions yet</h4>
                <p className="text-sm text-muted-foreground mb-6">Your wallet activity will appear here</p>
                <button onClick={() => setShowAddMoney(true)} className="text-sm font-bold text-primary hover:underline">Add money to get started</button>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx._id} className="group flex items-center justify-between px-6 py-5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tx.type === 'credit' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'} transition-transform group-hover:scale-110`}>
                      {tx.type === 'credit' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <span className="h-1 w-1 rounded-full bg-border" />
                        {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-foreground'}`}>
                      {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                    </p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${tx.status === 'success' ? 'text-green-500' : tx.status === 'failed' ? 'text-red-500' : 'text-amber-500'}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {transactions.length > 0 && (
            <div className="bg-muted/30 px-6 py-4 text-center border-t border-border">
              <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5">
                End of history
                <ChevronRight className="h-3 w-3" />
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyWalletPage;
