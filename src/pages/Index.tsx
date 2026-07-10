import { Navbar } from "@/components/Navbar";
import { Link } from "react-router-dom";
import {
  UtensilsCrossed, Building2, ShoppingCart, CheckCircle2,
  GraduationCap, Briefcase, Hospital, Hotel, Landmark, ArrowRight, X, Info, PlusCircle
} from "lucide-react";
import { useState } from "react";

const LandingPage = () => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showRegisterBusiness, setShowRegisterBusiness] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col relative">
      <Navbar />

      {/* Floating Left Button: How It Works */}
      <button 
        onClick={() => setShowHowItWorks(true)}
        className="absolute top-20 left-4 sm:left-8 z-10 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
      >
        <Info className="h-4 w-4" /> How It Works
      </button>

      {/* Floating Right Button: Register Business */}
      <button 
        onClick={() => setShowRegisterBusiness(true)}
        className="absolute top-20 right-4 sm:right-8 z-10 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-sm hover:bg-primary/20 transition-colors"
      >
        <PlusCircle className="h-4 w-4" /> Register Business
      </button>

      <div className="flex-1 relative flex flex-col items-center justify-center overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 text-center z-0 flex flex-col items-center justify-center my-auto min-h-full py-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <UtensilsCrossed className="h-4 w-4" /> Centralized Canteen Platform
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            One Platform to Manage{" "}
            <span className="text-primary">All Your Canteens</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            CanteenHub helps organizations manage canteens and enables users to order food easily.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
              Login
            </Link>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 text-sm font-bold text-foreground shadow-sm hover:bg-muted transition-colors">
              Register <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Built for Every Organization (Small Strip) */}
          <div className="mt-16 border-t border-border/50 pt-8 w-full max-w-3xl">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">Built for Every Organization</p>
            <div className="flex flex-wrap justify-center gap-8 sm:gap-12 opacity-60">
              {[
                { icon: <GraduationCap className="h-6 w-6" />, label: "Colleges" },
                { icon: <Briefcase className="h-6 w-6" />, label: "Companies" },
                { icon: <Hospital className="h-6 w-6" />, label: "Hospitals" },
                { icon: <Hotel className="h-6 w-6" />, label: "Hostels" },
                { icon: <Landmark className="h-6 w-6" />, label: "Tech Parks" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className="text-foreground">{item.icon}</div>
                  <span className="text-[10px] font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-border bg-card py-4 z-10 relative shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex justify-center items-center gap-4">
          <div className="inline-flex items-center gap-2 font-heading text-sm font-bold text-primary">
            <UtensilsCrossed className="h-4 w-4" /> CanteenHub
          </div>
          <span className="text-muted-foreground text-xs">|</span>
          <p className="text-xs text-muted-foreground">© 2026 CanteenHub. All rights reserved.</p>
        </div>
      </footer>

      {/* MODAL: How It Works */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-3xl rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-2xl">
            <button onClick={() => setShowHowItWorks(false)} className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-bold text-foreground">How It Works</h2>
              <p className="text-muted-foreground text-sm mt-1">Get started in three simple steps</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { step: "1", icon: <Building2 className="h-6 w-6" />, title: "Select Organization", desc: "Choose your college, company, or hospital canteen from the list." },
                { step: "2", icon: <ShoppingCart className="h-6 w-6" />, title: "Browse & Order", desc: "Explore menus, add items to your cart, and place your order." },
                { step: "3", icon: <CheckCircle2 className="h-6 w-6" />, title: "Enjoy Your Meal", desc: "Track your order, pick it up, and enjoy freshly prepared food." },
              ].map((item) => (
                <div key={item.step} className="relative rounded-2xl border border-border bg-background p-6 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">{item.icon}</div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground uppercase tracking-wider">Step {item.step}</div>
                  <h3 className="mt-2 text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Register Business */}
      {showRegisterBusiness && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-2xl">
            <button onClick={() => setShowRegisterBusiness(false)} className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl font-bold text-foreground">Register Your Business</h2>
              <p className="text-muted-foreground text-sm mt-1">Are you an organization or canteen owner? Get started here.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm hover:shadow-lg transition-all flex flex-col">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 transition-colors">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Register Your Organization</h3>
                <p className="text-xs text-muted-foreground mb-6 flex-1">
                  Colleges, companies, hospitals, hostels and more. Set up your organization and manage all your canteens from one dashboard.
                </p>
                <Link to="/register-organization" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Building2 className="h-4 w-4" /> Register Organization <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm hover:shadow-lg transition-all flex flex-col">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 transition-colors">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Register Your Canteen</h3>
                <p className="text-xs text-muted-foreground mb-6 flex-1">
                  Are you a canteen owner? Join CanteenHub, manage your menu, receive digital orders, and track your earnings effortlessly.
                </p>
                <Link to="/register-canteen" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  🍽️ Register Canteen <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
