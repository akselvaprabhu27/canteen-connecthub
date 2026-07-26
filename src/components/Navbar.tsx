import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, Menu, X, LogOut, Wallet, User } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
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

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-heading text-lg sm:text-xl font-bold text-primary shrink-0">
          <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6" /> CanteenHub
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-primary hover:bg-primary/20 transition-colors">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Profile
              </Link>
              <button onClick={logout} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
                Login
              </Link>
              <Link to="/register" className="rounded-xl bg-primary px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
