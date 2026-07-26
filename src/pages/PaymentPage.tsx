import { Link, useNavigate } from "react-router-dom";
import { Smartphone, CreditCard, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface CartItem {
  _id: string;
  itemName: string;
  qty: number;
  price: number;
  [key: string]: unknown;
}

const PaymentPage = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Test UPI");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("/api/wallet/details", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setWalletBalance(data.walletBalance);
    } catch (err) {}
  };
  
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const uid = user?._id || user?.id;

  const total = localStorage.getItem("orderTotal") || "0";
  const cartDetailsStr = localStorage.getItem("cartDetails");
  const cartDetails = cartDetailsStr ? JSON.parse(cartDetailsStr) : [];
  
  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // already handled above via user and uid variables
      if (!user?._id && !user?.id) {
        toast.error("Please log in to place an order");
        navigate("/login");
        return;
      }
      
      const payload = {
        userId: user._id,
        organizationId: localStorage.getItem(`selectedOrgId_${uid}`),
        canteenId: localStorage.getItem(`selectedCanteenId_${uid}`),
        items: cartDetails.map((i: CartItem) => ({
          menuId: i._id,
          itemName: i.itemName,
          quantity: i.qty,
          price: i.price
        })),
        totalAmount: Number(total),
        paymentMethod: paymentMethod === "Wallet" ? "Wallet" : "UPI"
      };
      
      const token = localStorage.getItem("token");
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success("Order placed successfully!");
        
        // Sync Session with DB
        fetch("/api/auth/sync-session", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ lastOrderId: data.orderId })
        });

        const canteenId = localStorage.getItem(`selectedCanteenId_${uid}`);
        
        // Sync with Backend (Clear Cart)
        if (canteenId) {
          fetch(`/api/carts/${canteenId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        
        localStorage.removeItem(`selectedCanteenId_${uid}`);
        localStorage.removeItem(`selectedOrgId_${uid}`);
        localStorage.removeItem("cartDetails");
        localStorage.removeItem("orderTotal");
        window.dispatchEvent(new Event("storage"));
        navigate("/order-success");
      } else {
        toast.error(data.message || "Failed to place order");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
      setShowConfirm(false);
    }
  };

  const onPayClick = () => {
    if (paymentMethod === "Wallet") {
      if (walletBalance === null) return;
      if (walletBalance < Number(total)) {
        toast.error("Insufficient wallet balance");
        return;
      }
      setShowConfirm(true);
    } else {
      handlePayment();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Payment</h1>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm animate-fade-in">
          <h2 className="text-sm font-semibold text-foreground">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            {cartDetails.map((item: CartItem) => (
              <div key={item._id} className="flex justify-between">
                <span>{item.itemName} × {item.qty}</span>
                <span>₹{item.price * item.qty}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between font-semibold text-foreground">
              <span>Total</span><span>₹{total}</span>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Payment Method</h2>
          <div className="space-y-3">
            {[
              { icon: <Smartphone className="h-5 w-5" />, label: "Test UPI", desc: "Always succeeds" },
              { icon: <Wallet className="h-5 w-5" />, label: "Wallet", desc: walletBalance !== null ? `Balance: ₹${walletBalance}` : "Loading balance...", available: true },
              { icon: <CreditCard className="h-5 w-5" />, label: "Card", desc: "Coming soon", available: false },
            ].map((m) => (
              <label 
                key={m.label} 
                className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all ${paymentMethod === m.label ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-background hover:bg-muted/50'} ${!m.available && m.label !== "Test UPI" ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (m.available || m.label === "Test UPI") setPaymentMethod(m.label);
                }}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  className="h-4 w-4 accent-primary" 
                  checked={paymentMethod === m.label}
                  onChange={() => {}} 
                  disabled={!m.available && m.label !== "Test UPI"}
                />
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${paymentMethod === m.label ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>{m.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
                {m.label === "Wallet" && walletBalance !== null && walletBalance < Number(total) && (
                  <Link to="/my-wallet" onClick={(e) => e.stopPropagation()} className="text-[10px] font-bold text-primary hover:underline">ADD MONEY</Link>
                )}
              </label>
            ))}
          </div>

          {paymentMethod === "Wallet" && walletBalance !== null && walletBalance < Number(total) && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 flex items-center gap-2">
              <span className="font-bold">Low Balance!</span> Add ₹{Number(total) - walletBalance} more to pay using wallet.
            </div>
          )}

          <button 
            onClick={onPayClick} 
            disabled={isProcessing || (paymentMethod === "Wallet" && walletBalance !== null && walletBalance < Number(total))}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : `Pay ₹${total}`}
          </button>
        </div>

        {/* Wallet Confirmation Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-card p-8 border border-border shadow-2xl animate-in zoom-in duration-200">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-6">
                <Wallet className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-center text-foreground mb-2">Wallet Payment</h3>
              <p className="text-sm text-muted-foreground text-center mb-8">
                Confirm payment of <span className="font-bold text-foreground">₹{total}</span> using your wallet?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="rounded-xl border border-border bg-background py-3 text-sm font-bold text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

export default PaymentPage;
