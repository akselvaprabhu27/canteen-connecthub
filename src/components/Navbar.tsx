import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, Menu, X, LogOut, Wallet, User } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchUserData = () => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      
      // Fetch fresh balance
      fetch("/api/wallet/details", {
        headers: { Authorization: `Bearer ${u.token}` }
      })
      .then(r => r.json())
      .then(d => {
        if (d.walletBalance !== undefined) setBalance(d.walletBalance);
      })
      .catch(() => {});
    } else {
      setUser(null);
      setBalance(null);
    }
  };

  useEffect(() => {
    fetchUserData();
    // Listen for storage changes (e.g. from other tabs or local updates)
    window.addEventListener("storage", fetchUserData);
    return () => window.removeEventListener("storage", fetchUserData);
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setBalance(null);
    navigate("/login");
  };

  const initials = user?.name ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "??";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 font-heading text-xl font-bold text-primary">
          <UtensilsCrossed className="h-6 w-6" /> CanteenHub
        </div>
        
        <div className="hidden items-center gap-6 md:flex">
          {user ? (
            <>
              <button onClick={logout} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Login</Link>
              <Link to="/register" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">Get Started</Link>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden space-y-3 animate-in slide-in-from-top-2">
          {user ? (
            <>

              <button onClick={logout} className="flex w-full items-center gap-2 text-sm font-medium text-destructive p-2">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>Login</Link>
              <Link to="/register" className="block rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground" onClick={() => setOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
