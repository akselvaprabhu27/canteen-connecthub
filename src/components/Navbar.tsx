import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-heading text-lg sm:text-xl font-bold text-primary shrink-0">
          <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6" /> CanteenHub
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/login" className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
            Login
          </Link>
          <Link to="/register" className="rounded-xl bg-primary px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
