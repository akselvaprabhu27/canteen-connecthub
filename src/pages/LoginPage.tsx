import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, Clock, CheckCircle2, XCircle, Building2, ChefHat } from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [statusScreen, setStatusScreen] = useState<null | {
    type: string;
    message: string;
    orgApprovalStatus?: string;
    canteenOrgStatus?: string;
    canteenAdminStatus?: string;
    orgRejectionReason?: string;
    adminRejectionReason?: string;
    entityId?: string;
    token?: string;
    role?: string;
  }>(null);
  const [confirming, setConfirming] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Invalid credentials");
        return;
      }

      if (data.approvalRequired) {
        setStatusScreen({
          type: data.approvalStatus,
          message: data.message,
          orgApprovalStatus: data.approvalStatus,
          canteenOrgStatus: data.organizationApprovalStatus,
          canteenAdminStatus: data.superAdminApprovalStatus,
          orgRejectionReason: data.orgRejectionReason,
          adminRejectionReason: data.adminRejectionReason,
          entityId: data.organizationId || data.canteenId,
          token: data.token,
          role: data.role,
        });
        return;
      }

      toast.success("Login successful!");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      
      // Clear legacy global keys to prevent dashboard sharing
      ["favoriteCarts", "multiCart", "cart", "selectedCanteenId", "selectedOrgId", "cartDetails", "orderTotal", "lastOrderId", "myOrgId", "myCanteenId", "myOrgName"].forEach(k => localStorage.removeItem(k));

      if (data.role === "super_admin") navigate("/admin");
      else if (data.role === "org_admin") navigate("/org-admin");
      else if (data.role === "canteen_owner") navigate("/canteen-owner");
      else navigate("/dashboard");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!statusScreen?.entityId || !statusScreen?.token) return;
    setConfirming(true);
    try {
      const endpoint = statusScreen.type === "approved_unconfirmed"
        ? `/api/organizations/confirm/${statusScreen.entityId}`
        : `/api/canteens/confirm/${statusScreen.entityId}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${statusScreen.token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Account activated!");
        localStorage.setItem("token", statusScreen.token!);
        const userObj = {
          token: statusScreen.token,
          role: statusScreen.role,
        };
        localStorage.setItem("user", JSON.stringify(userObj));
        if (statusScreen.role === "org_admin") navigate("/org-admin");
        else navigate("/canteen-owner");
      } else {
        toast.error(data.message || "Confirmation failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setConfirming(false);
    }
  };

  // --- Status screens ---
  if (statusScreen) {
    const { type } = statusScreen;

    // Org pending or Canteen pending
    if (type === "pending" || type === "canteen_pending") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md text-center animate-fade-in">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Registration in Process</h1>
            <p className="text-muted-foreground mb-6">Your registration is in process.</p>
            <div className="rounded-2xl border border-border bg-card p-6 mb-6">
              <div className="flex items-center justify-center gap-2 text-amber-500">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Status: Pending Approval</span>
              </div>
            </div>
            <button onClick={() => setStatusScreen(null)} className="text-sm text-primary hover:underline">← Back to login</button>
          </div>
        </div>
      );
    }

    // Org rejected
    if (type === "rejected") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md text-center animate-fade-in">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Request Rejected</h1>
            <p className="text-muted-foreground mb-4">Your organization request has been rejected by Super Admin.</p>
            {statusScreen.orgRejectionReason && (
              <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 mb-6 text-left">
                <p className="text-sm text-red-700 dark:text-red-400"><span className="font-semibold">Reason:</span> {statusScreen.orgRejectionReason}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">Please contact support for more information or register again.</p>
            <button onClick={() => setStatusScreen(null)} className="text-sm text-primary hover:underline">← Back to login</button>
          </div>
        </div>
      );
    }

    // Org approved but not confirmed
    if (type === "approved_unconfirmed") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md text-center animate-fade-in">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">🎉 You're Approved!</h1>
            <p className="text-muted-foreground mb-6">
              Your organization has been approved by Super Admin. Please confirm to start using CanteenHub.
            </p>
            <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Status: Approved by Super Admin</span>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 mb-3"
            >
              {confirming ? "Activating..." : "Confirm & Continue →"}
            </button>
            <button onClick={() => setStatusScreen(null)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
          </div>
        </div>
      );
    }



    // Canteen approved but not confirmed
    if (type === "canteen_approved_unconfirmed") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md text-center animate-fade-in">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">🎉 Canteen Approved!</h1>
            <p className="text-muted-foreground mb-6">
              Your canteen has been fully approved. Please confirm to start using CanteenHub.
            </p>
            <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4 mb-6 space-y-2 text-left">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Organization: Approved</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Super Admin: Approved</span>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 mb-3"
            >
              {confirming ? "Activating..." : "Confirm & Continue →"}
            </button>
            <button onClick={() => setStatusScreen(null)} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
          </div>
        </div>
      );
    }
  }

  // --- Normal login form ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 font-heading text-2xl font-bold text-primary">
            <UtensilsCrossed className="h-7 w-7" /> CanteenHub
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Welcome back! Log in to continue.</p>
        </div>
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <input
                type="email" required value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <input
                type="password" required value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">Register as User</Link>
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 border-t border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/register-organization"
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Building2 className="h-3.5 w-3.5 text-primary" /> Register Organization
              </Link>
              <Link
                to="/register-canteen"
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <ChefHat className="h-3.5 w-3.5 text-primary" /> Register Canteen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
