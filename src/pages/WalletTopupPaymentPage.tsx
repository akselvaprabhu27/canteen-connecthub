import { Navbar } from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronLeft, CreditCard, Landmark, Smartphone, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const WalletTopupPaymentPage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const amt = localStorage.getItem("walletTopupAmount");
    if (!amt) {
      navigate("/my-wallet");
      return;
    }
    setAmount(parseFloat(amt));
  }, [navigate]);

  const handlePayment = async () => {
    setProcessing(true);
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(stored);
    const token = user.token;

    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          amount: amount,
          description: `Added via ${paymentMethod.toUpperCase()}`
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success(`₹${amount} added successfully to your wallet.`);
        // Optional cashback simulation
        if (amount >= 500) {
          await fetch("/api/wallet/topup", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
              amount: 10,
              description: `Cashback for ₹${amount} top-up`
            })
          });
        }
        window.dispatchEvent(new Event("storage"));
        localStorage.removeItem("walletTopupAmount");
        setTimeout(() => navigate("/my-wallet"), 3000);
      } else {
        toast.error(data.message || "Top-up failed");
        setProcessing(false);
      }
    } catch (err) {
      toast.error("An error occurred during payment");
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-3xl p-8 border border-border shadow-xl text-center animate-in zoom-in duration-300">
          <div className="mx-auto w-24 h-24 bg-green-500/10 text-green-500 flex items-center justify-center rounded-full mb-6 animate-bounce">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Top-up Successful!</h1>
          <p className="text-muted-foreground mb-8">
            ₹{amount.toLocaleString()} has been added to your wallet.
          </p>
          <div className="bg-primary/5 rounded-2xl p-4 mb-8 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-xs font-semibold text-primary text-left">
              Redirecting you to your wallet page in a few seconds...
            </p>
          </div>
          <button 
            onClick={() => navigate("/my-wallet")}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            Back to Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <button 
          onClick={() => navigate("/my-wallet")}
          className="mb-6 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Wallet
        </button>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Complete Payment</h1>
        <p className="text-sm text-muted-foreground mb-8">Choose a payment method to add money</p>

        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-muted-foreground">Amount to Add</span>
            <span className="text-2xl font-bold text-foreground">₹{amount.toLocaleString()}</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Select Method</p>
            
            <button 
              onClick={() => setPaymentMethod("upi")}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${paymentMethod === 'upi' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-background hover:bg-muted/50'}`}
            >
              <div className={`h-10 w-10 flex items-center justify-center rounded-xl ${paymentMethod === 'upi' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Test UPI</p>
                <p className="text-[10px] text-muted-foreground">Pay via any UPI App</p>
              </div>
            </button>

            <button 
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/30 opacity-60 cursor-not-allowed"
              disabled
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Card (Coming Soon)</p>
                <p className="text-[10px] text-muted-foreground">Credit / Debit Cards</p>
              </div>
            </button>

            <button 
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/30 opacity-60 cursor-not-allowed"
              disabled
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Net Banking (Coming Soon)</p>
                <p className="text-[10px] text-muted-foreground">Direct Bank Transfer</p>
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full rounded-2xl bg-primary py-5 text-lg font-bold text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Payment...
            </span>
          ) : (
            `Pay ₹${amount.toLocaleString()}`
          )}
        </button>
        
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your payment is secured by industry standard encryption.
        </p>
      </div>
    </div>
  );
};

export default WalletTopupPaymentPage;
