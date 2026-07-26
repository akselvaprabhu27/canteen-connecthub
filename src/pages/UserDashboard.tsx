import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, ShoppingCart, Bell, LogOut, Search, Star, Plus, Minus, ChevronRight, Clock, Package, Wallet, X, Building2, UtensilsCrossed as Fork, Sparkles, Trash2, Heart, Edit, Trophy } from "lucide-react";
import { toast } from "sonner";
import { ItemRatingModal } from "@/components/ItemRatingModal";

interface Org { _id: string; name: string; type?: string; }
interface Canteen { _id: string; canteenName: string; category: string; rating?: number; timing?: string; }
interface MenuItem { _id: string; itemName: string; price: number; category: string; desc?: string; quantity?: string; }
interface Order { _id: string; orderId: string; items: any[]; totalAmount: number; status: string; createdAt: string; canteenId?: any; }

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgSearch, setOrgSearch] = useState("");
  const [showOrgDrop, setShowOrgDrop] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuSearch, setMenuSearch] = useState("");
  // Multi-canteen cart: Record<canteenId, { items: Record<itemId, number>, name: string, orgId: string }>
  const [carts, setCarts] = useState<Record<string, any>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingCanteens, setLoadingCanteens] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const orgRef = useRef<HTMLDivElement>(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quoteFade, setQuoteFade] = useState(true);
  const [favoriteCarts, setFavoriteCarts] = useState<any[]>([]);
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");
  const [itemRatingStats, setItemRatingStats] = useState<Record<string, { averageRating: number; totalRatings: number }>>({});
  const [selectedItemForRating, setSelectedItemForRating] = useState<MenuItem | null>(null);

  const foodQuotes = [
    "Good food is waiting for you 🍔",
    "Your next bite is just one click away 😋",
    "Don't keep deliciousness waiting 🍕",
    "Hunger called… we answered 🍟",
    "Life is uncertain. Order dessert first 🍰",
    "Food tastes better when shared ❤️",
    "Cravings don't wait… neither should you 🌮",
    "Your stomach has entered the chat 🍜",
    "Every meal is a memory in the making 🍛",
    "Fresh food, faster smiles 😊",
    "Eat now, regret never 😎",
    "Biryani is always a good idea 🍗",
    "Love at first bite 🍕",
    "Feed your mood 🍩",
    "Don't wait… the food is hot 🔥",
    "Tap. Order. Eat. Repeat. 🔄",
    "Hungry? Your meal is waving 👋",
    "Canteen magic starts here ✨",
    "Serving happiness on a plate 🍽",
    "Today's special: happiness with extra cheese 🧀",
    "Fuel your hustle with a tasty bite 💪",
    "Because you deserve a food break 🎉",
    "One does not simply skip lunch 🧐",
    "Warning: browsing may cause instant hunger 😂",
    "Treat yourself — you've earned it 🏆",
    "Flavors that make you smile 😄",
    "Hot meals, cool vibes ❄️🔥",
  ];

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role === "super_admin") { navigate("/admin"); return; }
    if (u.role === "org_admin") { navigate("/org-admin"); return; }
    if (u.role === "canteen_owner") { navigate("/canteen-owner"); return; }
    setUser(u);
    const token = u.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Fetch Carts from DB
    fetch("/api/carts", { headers: authHeaders })
      .then(r => r.json())
      .then(d => { if (typeof d === "object") setCarts(d); })
      .catch(() => {});

    // Fetch Favorites from DB
    fetch("/api/favorites", { headers: authHeaders })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setFavoriteCarts(d); })
      .catch(() => {});
    fetch("/api/organizations").then(r => r.json()).then(d => setOrgs(Array.isArray(d) ? d : [])).catch(() => {});
    if (u._id || u.id) {
      const uid = u._id || u.id;
      fetch(`/api/orders/user/${uid}`, { headers: { Authorization: `Bearer ${u.token}` } })
        .then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => {});
      
      fetch(`/api/wallet/details`, { headers: { Authorization: `Bearer ${u.token}` } })
        .then(r => r.json()).then(d => {
          if (d.walletBalance !== undefined) setWalletBalance(d.walletBalance);
        }).catch(() => {});

      // Fetch latest User data (including session fields)
      fetch("/api/auth/me", { headers: authHeaders })
        .then(r => r.json())
        .then(updatedUser => {
          if (updatedUser._id) {
            setUser({ ...u, ...updatedUser });
          }
        }).catch(() => {});

      // Handled above in unified fetch
    }
  }, [navigate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (orgRef.current && !orgRef.current.contains(e.target as Node)) setShowOrgDrop(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Food quote rotation with fade animation
  useEffect(() => {
    setQuoteIdx(Math.floor(Math.random() * foodQuotes.length));
    const interval = setInterval(() => {
      setQuoteFade(false);
      setTimeout(() => {
        setQuoteIdx(prev => (prev + 1) % foodQuotes.length);
        setQuoteFade(true);
      }, 400);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const selectOrg = (org: Org) => {
    setSelectedOrg(org); setOrgSearch(org.name); setShowOrgDrop(false);
    setSelectedCanteen(null); setMenu([]); setLoadingCanteens(true);
    fetch(`/api/canteens/${org._id}`, {
      headers: { Authorization: `Bearer ${user?.token || localStorage.getItem("token")}` }
    }).then(r => r.json()).then(d => setCanteens(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingCanteens(false));
  };

  const selectCanteen = async (c: Canteen) => {
    setSelectedCanteen(c); setLoadingMenu(true); setItemRatingStats({});
    try {
      const [menuRes, ratingRes] = await Promise.all([
        fetch(`/api/menu/${c._id}`),
        fetch(`/api/item-reviews/canteen/${c._id}`)
      ]);
      const menuData = await menuRes.json();
      setMenu(Array.isArray(menuData) ? menuData : []);
      if (ratingRes.ok) {
        const ratingData = await ratingRes.json();
        const map: Record<string, { averageRating: number; totalRatings: number }> = {};
        ratingData.forEach((s: any) => { map[s._id] = s; });
        setItemRatingStats(map);
      }
    } catch { /* silent */ } finally { setLoadingMenu(false); }
  };

  const refreshItemRatings = async () => {
    if (!selectedCanteen) return;
    try {
      const res = await fetch(`/api/item-reviews/canteen/${selectedCanteen._id}`);
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, { averageRating: number; totalRatings: number }> = {};
        data.forEach((s: any) => { map[s._id] = s; });
        setItemRatingStats(map);
      }
    } catch { /* silent */ }
  };

  const updateCart = (id: string, delta: number) => {
    if (!selectedCanteen) return;
    const cid = selectedCanteen._id;
    
    setCarts(prev => {
      const currentCanteenCart = prev[cid] || { items: {}, name: selectedCanteen.canteenName, orgId: selectedOrg?._id || "" };
      const nextQty = Math.max(0, (currentCanteenCart.items[id] || 0) + delta);
      
      const updatedItems = { ...currentCanteenCart.items };
      if (nextQty === 0) {
        delete updatedItems[id];
      } else {
        updatedItems[id] = nextQty;
      }
      
      let nextCarts = { ...prev };
      if (Object.keys(updatedItems).length === 0) {
        delete nextCarts[cid];
      } else {
        nextCarts[cid] = { ...currentCanteenCart, items: updatedItems };
      }
      
      const uid = user?._id || user?.id;
      // Sync with Backend
      fetch("/api/carts/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({
          canteenId: cid,
          orgId: currentCanteenCart.orgId,
          name: currentCanteenCart.name,
          items: updatedItems
        })
      });
      return nextCarts;
    });
  };

  const activeCartCount = Object.keys(carts).length;
  const totalItemCount = Object.values(carts).reduce((total, c) => total + Object.values(c.items as Record<string, number>).reduce((a, b) => a + b, 0), 0);
  
  const currentCartItems = selectedCanteen && carts[selectedCanteen._id] 
    ? menu.filter(m => carts[selectedCanteen._id].items[m._id] > 0).map(m => ({ ...m, qty: carts[selectedCanteen._id].items[m._id] }))
    : [];
    
  const currentCartTotal = currentCartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const filteredOrgs = orgs.filter(o => o.name?.toLowerCase().includes(orgSearch.toLowerCase()));
  const filteredMenuItems = menu.filter(m => 
    m.itemName?.toLowerCase().includes(menuSearch.toLowerCase()) ||
    (m.desc && m.desc.toLowerCase().includes(menuSearch.toLowerCase())) ||
    (m.category && m.category.toLowerCase().includes(menuSearch.toLowerCase()))
  );
  const userName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = userName.charAt(0).toUpperCase();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/"); };

  const statusColor = (s: string) => s === "delivered" ? "text-green-500 bg-green-500/10" : s === "preparing" ? "text-amber-500 bg-amber-500/10" : s === "cancelled" ? "text-red-500 bg-red-500/10" : "text-blue-500 bg-blue-500/10";

  const goToCart = (cid?: string, oid?: string) => {
    const targetCanteenId = cid || selectedCanteen?._id;
    const targetOrgId = oid || selectedOrg?._id;
    
    if (!targetCanteenId) { toast.error("Please select a canteen first"); return; }
    
    const uid = user?._id || user?.id;
    // Set localStorage for CartPage
    localStorage.setItem(`selectedCanteenId_${uid}`, targetCanteenId);
    localStorage.setItem(`selectedOrgId_${uid}`, targetOrgId || "");

    // Sync Session with DB
    fetch("/api/auth/sync-session", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ lastSelectedCanteenId: targetCanteenId, lastSelectedOrgId: targetOrgId || "" })
    }).finally(() => {
      navigate("/cart");
    });
  };

  const startRename = (idx: number) => {
    setRenamingIdx(idx);
    setTempName(favoriteCarts[idx].canteenName);
  };

  const saveRename = (idx: number) => {
    if (tempName.trim()) {
      const updated = [...favoriteCarts];
      const favId = updated[idx]._id;
      updated[idx].canteenName = tempName.trim();
      setFavoriteCarts(updated);
      
      // Sync with Backend
      fetch(`/api/favorites/rename/${favId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({ canteenName: tempName.trim() })
      });
      toast.success("Cart renamed");
    }
    setRenamingIdx(null);
  };

  const removeCart = (cid: string) => {
    setCarts(prev => {
      const next = { ...prev };
      delete next[cid];
      // Sync with Backend
      fetch(`/api/carts/${cid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` }
      });
      return next;
    });
  };

  const deleteFavorite = (idx: number) => {
    const favId = favoriteCarts[idx]._id;
    const updated = favoriteCarts.filter((_, i) => i !== idx);
    setFavoriteCarts(updated);
    
    // Sync with Backend
    fetch(`/api/favorites/${favId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user.token}` }
    });
    toast.success("Favorite removed");
  };

  const addFavoriteToCart = (fav: any) => {
    setCarts(prev => {
      const next = { ...prev };
      next[fav.canteenId] = {
        items: fav.items,
        name: fav.canteenName,
        orgId: fav.orgId
      };
      
      // Sync with Backend
      fetch("/api/carts/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${user.token}` 
        },
        body: JSON.stringify({
          canteenId: fav.canteenId,
          orgId: fav.orgId,
          name: fav.canteenName,
          items: fav.items
        })
      });
      return next;
    });
    goToCart(fav.canteenId, fav.orgId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-heading text-xl font-bold text-primary">
            <UtensilsCrossed className="h-6 w-6" /> CanteenHub
          </div>
          <div className="flex items-center gap-3">
            <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:scale-105 transition-transform shadow-md shadow-primary/20" title="View Profile">
              {initials}
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        {/* Welcome + Org Search */}
        <div className="relative mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#00A8E8] via-[#007EA7] to-[#003459] p-5 sm:p-8 text-primary-foreground shadow-2xl shadow-primary/30 z-30">
          {/* Decorative background elements */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          </div>

          <div className="relative z-40 flex flex-col gap-6 sm:gap-10">
            {/* Top Row: Welcome & Quote */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
              <div className="animate-in fade-in slide-in-from-left duration-700 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-1 w-6 sm:w-8 rounded-full bg-white/30" />
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">User Dashboard</p>
                </div>
                <p className="text-white/70 text-xs sm:text-sm font-medium">Welcome back,</p>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black mt-0.5 sm:mt-1 tracking-tight text-white drop-shadow-sm leading-tight break-words">
                  {userName}<span className="text-white/40">!</span>
                </h1>
              </div>

              {/* Quote Box - Responsive, wrapped, no overflow */}
              <div className="animate-in fade-in zoom-in duration-1000 delay-300 w-full md:w-auto md:ml-auto">
                <div 
                  className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl transition-all hover:bg-white/15"
                  style={{ 
                    opacity: quoteFade ? 1 : 0,
                    transform: `translateX(${quoteFade ? '0' : '10px'})`,
                  }}
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white/50 animate-pulse shrink-0" />
                  <p className="text-xs sm:text-base md:text-xl font-bold italic text-white tracking-tight drop-shadow-md leading-snug">
                    "{foodQuotes[quoteIdx]}"
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Row: Search Bar */}
            <div ref={orgRef} className="relative animate-in fade-in slide-in-from-bottom duration-700 delay-200 z-50">
              <div className="group flex items-center gap-2.5 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-xl border border-white/25 px-4 py-3 sm:px-5 sm:py-4 shadow-xl transition-all focus-within:bg-white/25 focus-within:ring-2 focus-within:ring-white/30 w-full md:max-w-md">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white/70 shrink-0 group-focus-within:text-white transition-colors" />
                <input
                  className="flex-1 min-w-0 bg-transparent text-white placeholder:text-white/60 text-xs sm:text-sm font-semibold outline-none"
                  placeholder="Search your organization..."
                  value={orgSearch}
                  onChange={e => { setOrgSearch(e.target.value); setShowOrgDrop(true); }}
                  onFocus={() => setShowOrgDrop(true)}
                />
                {orgSearch && (
                  <button onClick={() => { setOrgSearch(""); setSelectedOrg(null); setCanteens([]); setSelectedCanteen(null); setMenu([]); setMenuSearch(""); }} className="text-white/60 hover:text-white bg-white/10 rounded-full p-1 sm:p-1.5 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              
              {showOrgDrop && filteredOrgs.length > 0 && (
                <div className="absolute top-full left-0 mt-2 sm:mt-3 w-full md:max-w-md z-[100] rounded-xl sm:rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 border-white/20">
                  {filteredOrgs.map(org => (
                    <button key={org._id} onClick={() => selectOrg(org)} className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3 sm:px-5 sm:py-4 text-left hover:bg-primary/5 transition-colors border-b border-border/50 last:border-0 group">
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm shrink-0"><Building2 className="h-4 w-4 sm:h-5 sm:w-5" /></div>
                      <div className="min-w-0 flex-1"><p className="text-xs sm:text-sm font-bold text-foreground truncate">{org.name}</p><p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">{org.type || "Organization"}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row - Compact 3 column grid on mobile */}
        <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: "My Wallet", value: `₹${walletBalance}`, icon: <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, color: "text-emerald-500 bg-emerald-500/10", link: "/my-wallet" },
            { 
              label: "My Carts", 
              value: activeCartCount, 
              icon: <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, 
              color: "text-primary bg-primary/10",
              onClick: () => setShowCart(true)
            },
            { 
              label: "My Favorites", 
              value: favoriteCarts.length, 
              icon: <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />, 
              color: "text-pink-500 bg-pink-500/10",
              onClick: () => {
                const favEl = document.getElementById('favorites-section');
                if (favEl) favEl.scrollIntoView({ behavior: 'smooth' });
              }
            },
          ].map(s => (
            s.link ? (
              <Link key={s.label} to={s.link} className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between">
                <div className={`mb-2 sm:mb-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-sm sm:text-xl font-bold text-foreground truncate">{s.value}</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{s.label}</p>
                </div>
              </Link>
            ) : (
              <button key={s.label} onClick={s.onClick} className="text-left rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-5 shadow-sm hover:shadow-md transition-all group hover:-translate-y-0.5 flex flex-col justify-between">
                <div className={`mb-2 sm:mb-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl ${s.color} group-hover:scale-110 transition-transform`}>{s.icon}</div>
                <div>
                  <p className="text-sm sm:text-xl font-bold text-foreground truncate">{s.value}</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{s.label}</p>
                </div>
              </button>
            )
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Canteens */}
            {selectedOrg && !selectedCanteen && (
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                  <Fork className="h-5 w-5 text-primary" />
                  <div><h2 className="font-semibold text-foreground">Canteens at {selectedOrg.name}</h2><p className="text-xs text-muted-foreground">{canteens.length} canteen(s) available</p></div>
                </div>
                <div className="p-4">
                  {loadingCanteens ? (
                    <div className="grid gap-3 sm:grid-cols-2">{[1,2].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
                  ) : canteens.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground"><Fork className="mx-auto h-10 w-10 opacity-30 mb-2" /><p>No canteens found for this organization.</p></div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {canteens.map(c => (
                        <button key={c._id} onClick={() => selectCanteen(c)} className="group text-left rounded-xl border border-border bg-background p-4 hover:border-primary/50 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><UtensilsCrossed className="h-5 w-5" /></div>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.category === "Veg" ? "bg-green-500/10 text-green-500" : c.category === "Non-Veg" ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"}`}>{c.category || "General"}</span>
                          </div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{c.canteenName}</h3>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              <span className="font-bold text-foreground">{(c as any).avgRating && (c as any).avgRating > 0 ? (c as any).avgRating : "N/A"}</span>
                              <span className="text-[10px] opacity-70">({(c as any).totalReviews || 0})</span>
                            </span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{(c as any).timing || "8AM-8PM"}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                  )}
                </div>
              </div>
            )}

            {/* Menu */}
            {selectedCanteen && (
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <button onClick={() => { setSelectedCanteen(null); setMenu([]); setMenuSearch(""); }} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground shrink-0"><ChevronRight className="h-4 w-4 rotate-180" /></button>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-foreground truncate">{selectedCanteen.canteenName}</h2>
                      <p className="text-xs text-muted-foreground">
                        {menuSearch ? `${filteredMenuItems.length} of ${menu.length} items` : `${menu.length} items`}
                      </p>
                    </div>
                  </div>
                  {totalItemCount > 0 && (
                    <button onClick={() => goToCart()} className="flex items-center gap-2 rounded-xl bg-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
                      <ShoppingCart className="h-4 w-4" /> Cart ({totalItemCount}) · ₹{currentCartTotal}
                    </button>
                  )}
                </div>
                <div className="p-4">
                  {/* Live Item Search Input Bar */}
                  {menu.length > 0 && (
                    <div className="relative mb-4">
                      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input
                          type="text"
                          placeholder={`Search items in ${selectedCanteen.canteenName}...`}
                          value={menuSearch}
                          onChange={(e) => setMenuSearch(e.target.value)}
                          className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none"
                        />
                        {menuSearch && (
                          <button onClick={() => setMenuSearch("")} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {loadingMenu ? (
                    <div className="grid gap-3 sm:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}</div>
                  ) : menu.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground"><UtensilsCrossed className="mx-auto h-10 w-10 opacity-30 mb-2" /><p>No menu items available.</p></div>
                  ) : filteredMenuItems.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">
                      <Search className="mx-auto h-10 w-10 opacity-30 mb-2" />
                      <p className="text-sm font-bold text-foreground">No items matching "{menuSearch}"</p>
                      <p className="text-xs text-muted-foreground mt-1">Try searching for a different dish name or category</p>
                      <button onClick={() => setMenuSearch("")} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                        Clear Search
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredMenuItems.map(item => {
                        const iStats = itemRatingStats[item._id];
                        const avg = iStats?.averageRating || 0;
                        const cnt = iStats?.totalRatings || 0;
                        const isTopRated = avg >= 4.5 && cnt >= 5;
                        return (
                          <div key={item._id} className="relative rounded-xl border border-border bg-background p-4 hover:shadow-sm transition-shadow">
                            {/* Top Rated Badge */}
                            {isTopRated && (
                              <div className="absolute -top-2 left-3 flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow">
                                <Trophy size={8} className="fill-white" /> Top Rated
                              </div>
                            )}

                            {/* Item Name + Veg dot */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`shrink-0 inline-block h-3 w-3 rounded-sm border-2 ${item.category === "Non-Veg" ? "border-red-500 bg-red-500" : "border-green-500 bg-green-500"}`} />
                              <h3 className="text-sm font-semibold text-foreground truncate">{item.itemName}</h3>
                            </div>
                            {item.desc && <p className="text-xs text-muted-foreground truncate">{item.desc}</p>}
                            {item.quantity && <p className="text-xs text-primary/90 font-bold italic truncate mt-0.5">{item.quantity}</p>}

                            {/* CENTER SPACE: Average Rating + Rate button */}
                            <div className="flex items-center justify-between mt-2 mb-2">
                              {/* Average stars (always visible; shows N/A if no ratings yet) */}
                              <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={11} className={avg >= s ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted-foreground/30"} />
                                ))}
                                <span className="ml-1 text-[10px] font-bold text-foreground">
                                  {avg > 0 ? avg.toFixed(1) : "N/A"}
                                </span>
                                {cnt > 0 && <span className="text-[10px] text-muted-foreground">({cnt})</span>}
                              </div>
                              {/* Rate button — separate from canteen review */}
                              <button
                                onClick={() => setSelectedItemForRating(item)}
                                className="flex items-center gap-1 rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-bold text-yellow-600 hover:bg-yellow-400/20 transition-colors active:scale-95"
                              >
                                <Star size={10} className="fill-yellow-500 text-yellow-500" /> Rate
                              </button>
                            </div>

                            {/* BOTTOM: Price + Add/quantity control */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                              <span className="text-base font-bold text-foreground">₹{item.price}</span>
                              {selectedCanteen && carts[selectedCanteen._id]?.items[item._id] ? (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => updateCart(item._id, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"><Minus className="h-3 w-3" /></button>
                                  <span className="w-5 text-center text-sm font-bold text-foreground">{carts[selectedCanteen._id].items[item._id]}</span>
                                  <button onClick={() => updateCart(item._id, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"><Plus className="h-3 w-3" /></button>
                                </div>
                              ) : (
                                <button onClick={() => updateCart(item._id, 1)} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"><Plus className="h-3 w-3" /> Add</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No org selected state */}
            {!selectedOrg && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-bounce"><Building2 className="h-8 w-8" /></div>
                <h3 className="text-xl font-bold text-foreground mb-2">Ready to order?</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">Select your organization from the search bar above to browse available canteens.</p>
              </div>
            )}

            {/* Favorites Section Swapped to be above Profile */}
            <div id="favorites-section" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pink-500" />
                  My Favorite Carts
                </h2>
              </div>
              {favoriteCarts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/50">
                  <Heart className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Save your favorite meals to see them here!</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {favoriteCarts.map((fav, i) => (
                    <div key={i} className="group relative rounded-2xl border border-border bg-card p-5 hover:shadow-lg transition-all hover:border-pink-500/30">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          {renamingIdx === i ? (
                            <div className="flex items-center gap-2 pr-4">
                              <input 
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="w-full bg-muted border border-primary/20 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:border-primary transition-all"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveRename(i);
                                  if (e.key === 'Escape') setRenamingIdx(null);
                                }}
                              />
                            </div>
                          ) : (
                            <>
                              <h3 className="font-bold text-foreground truncate pr-6">{fav.canteenName}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {Object.values(fav.items).reduce((a, b) => (a as number) + (b as number), 0)} item(s) · ₹{fav.total}
                              </p>
                            </>
                          )}
                        </div>
                        <button onClick={() => deleteFavorite(i)} className="text-muted-foreground hover:text-destructive p-1 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="flex items-center gap-2">
                        {renamingIdx === i ? (
                          <>
                            <button 
                              onClick={() => saveRename(i)}
                              className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                            >
                              Save Name
                            </button>
                            <button 
                              onClick={() => setRenamingIdx(null)}
                              className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-all"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => addFavoriteToCart(fav)}
                              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                            >
                              Reorder
                            </button>
                            <button 
                              onClick={() => startRename(i)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                              title="Rename Cart"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Active Orders */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">Active Orders</h2>
              </div>
              <div className="divide-y divide-border">
                {todayOrders.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Package className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-[10px] text-muted-foreground">No orders today. Hungry yet?</p>
                  </div>
                ) : (
                  todayOrders.slice(0, 4).map(o => (
                    <div key={o._id} className="px-5 py-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/order-details')}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-foreground">#{o.orderId || o._id?.slice(-6)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{o.items?.length || 0} items · ₹{o.totalAmount}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor(o.status)}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-semibold text-foreground">Quick Links</h2>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { label: "My Order History", to: "/order-details", icon: <Package className="h-4 w-4" /> },
                  { label: "My Wallet", to: "/my-wallet", icon: <Wallet className="h-4 w-4" /> },
                  { label: "My Reviews", to: "/my-reviews", icon: <Star className="h-4 w-4" /> },
                ].map(a => (
                  <Link key={a.label} to={a.to} className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-xs font-bold text-foreground hover:bg-muted transition-all active:scale-[0.98]">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {a.icon}
                      <span className="text-foreground">{a.label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Multi-Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex items-end justify-end sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-border bg-card shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Active Carts ({activeCartCount})</h2>
              </div>
              <button onClick={() => setShowCart(false)} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {activeCartCount === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ShoppingCart className="mx-auto h-12 w-12 opacity-20 mb-3" />
                  <p>No active carts found</p>
                  <button onClick={() => setShowCart(false)} className="mt-4 text-sm text-primary font-semibold">Start shopping</button>
                </div>
              ) : (
                Object.entries(carts).map(([cid, c]) => (
                  <div key={cid} className="rounded-2xl border border-border bg-background p-5 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Fork className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{c.name}</h3>
                          <p className="text-xs text-muted-foreground">{Object.values(c.items).reduce((a: any, b: any) => a + b, 0)} items in cart</p>
                        </div>
                      </div>
                      <button onClick={() => removeCart(cid)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setShowCart(false); goToCart(cid, c.orgId); }}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                      >
                        View & Checkout <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Food Item Rating Modal — completely separate from canteen review system */}
      {selectedItemForRating && (
        <ItemRatingModal
          isOpen={!!selectedItemForRating}
          onClose={() => setSelectedItemForRating(null)}
          foodItem={selectedItemForRating}
          onSuccess={() => { refreshItemRatings(); setSelectedItemForRating(null); }}
        />
      )}
    </div>
  );
};

export default UserDashboard;
