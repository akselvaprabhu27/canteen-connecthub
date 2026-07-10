import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Copy } from "lucide-react";
import { useState, useEffect } from "react";

const OrderSuccessPage = () => {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setUserData(d));
    }
  }, []);

  const lastOrderId = userData?.lastOrderId || "—";
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center animate-fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-bold text-foreground">Order Placed Successfully!</h1>
        <p className="mt-2 text-muted-foreground">Your food is being prepared</p>
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Order ID</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-primary">{lastOrderId}</span>
            <button className="text-muted-foreground hover:text-foreground transition-colors"><Copy className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between"><span>Status</span><span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">Preparing</span></div>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <Link to="/order-details" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Track Order <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Dashboard</Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
