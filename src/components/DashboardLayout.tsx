import { Link, useLocation } from "react-router-dom";
import { ReactNode, useState } from "react";
import { Menu, X, LogOut, UtensilsCrossed } from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  title: string;
  navItems: NavItem[];
  children: ReactNode;
  themeClass?: string;
  headerTitle?: ReactNode;
}

export function DashboardLayout({ title, navItems, children, themeClass, headerTitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (to: string) => {
    if (to.endsWith("/") || navItems.findIndex(n => n.to === to) === 0) {
      return location.pathname === to || location.pathname === to.replace(/\/$/, "");
    }
    return location.pathname.startsWith(to);
  };

  return (
    <div className={`h-screen ${themeClass || ""}`}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
            <UtensilsCrossed className="h-5 w-5 text-sidebar-primary" />
            <span className="font-heading text-lg font-bold text-sidebar-foreground">{title}</span>
            <button className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-sidebar-border p-3">
            <Link to="/login" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <LogOut className="h-4 w-4" /> Logout
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
            <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1">
              {typeof headerTitle === "string" ? (
                <h1 className="font-heading text-lg font-semibold text-foreground">{headerTitle}</h1>
              ) : (
                headerTitle ?? (
                  <h1 className="font-heading text-lg font-semibold text-foreground">{title} Panel</h1>
                )
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
