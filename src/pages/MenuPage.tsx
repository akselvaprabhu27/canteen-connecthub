import { Link, useSearchParams } from "react-router-dom";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RatingStars } from "@/components/RatingStars";
import { ItemRatingModal } from "@/components/ItemRatingModal";
import { ItemDetailsModal } from "@/components/ItemDetailsModal";
import { Star, Trophy } from "lucide-react";

interface MenuItem {
  _id: string;
  itemName: string;
  price: number;
  category: string;
  desc?: string;
  quantity?: string;
  avgRating?: number;
  totalRatings?: number;
}

interface CanteenRatingStat {
  _id: string;
  averageRating: number;
  totalRatings: number;
}

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const uid = user?._id || user?.id;
  const canteenId = searchParams.get("canteenId") || localStorage.getItem(`selectedCanteenId_${uid}`);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [canteenName, setCanteenName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [selectedItemForRating, setSelectedItemForRating] = useState<MenuItem | null>(null);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<MenuItem | null>(null);
  const [ratingStats, setRatingStats] = useState<Record<string, CanteenRatingStat>>({});

  useEffect(() => {
    if (!canteenId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const authHeaders = { Authorization: `Bearer ${token}` };

        // Fetch Carts from DB to get current quantities
        const cartRes = await fetch("/api/carts", { headers: authHeaders });
        const allCarts = await cartRes.json();
        
        if (canteenId && allCarts[canteenId]) {
          setQuantities(allCarts[canteenId].items || {});
          setCanteenName(allCarts[canteenId].name);
          setOrgId(allCarts[canteenId].orgId);
        }

        // Fetch Menu
        const response = await fetch(`/api/menu/${canteenId}`);
        const data = await response.json();
        if (response.ok) {
          // Fetch Canteen Item Ratings
          const ratingRes = await fetch(`/api/item-reviews/canteen/${canteenId}`);
          let statsMap: Record<string, CanteenRatingStat> = {};
          if (ratingRes.ok) {
            const ratingData = await ratingRes.json();
            ratingData.forEach((stat: CanteenRatingStat) => {
              statsMap[stat._id] = stat;
            });
            setRatingStats(statsMap);
          }

          // Sort by popularity: (avgRating * totalRatings)
          const sortedData = [...data].sort((a, b) => {
            const statA = statsMap[a._id];
            const statB = statsMap[b._id];
            const scoreA = (statA?.averageRating || 0) * (statA?.totalRatings || 0);
            const scoreB = (statB?.averageRating || 0) * (statB?.totalRatings || 0);
            return scoreB - scoreA;
          });

          setMenuItems(sortedData);
          // If we don't have canteen name yet, fetch it
          if (!canteenName) {
             const cRes = await fetch(`/api/canteens/details/${canteenId}`);
             const cData = await cRes.json();
             setCanteenName(cData.canteenName);
             setOrgId(cData.organizationId);
          }
        } else {
          toast.error("Failed to load menu");
        }

      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [canteenId]);

  const refreshRatings = async () => {
    try {
      const ratingRes = await fetch(`/api/item-reviews/canteen/${canteenId}`);
      if (ratingRes.ok) {
        const ratingData = await ratingRes.json();
        const statsMap: Record<string, CanteenRatingStat> = {};
        ratingData.forEach((stat: CanteenRatingStat) => {
          statsMap[stat._id] = stat;
        });
        setRatingStats(statsMap);
      }
    } catch (error) {
      console.error("Error refreshing ratings:", error);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => {
      const next = (prev[id] || 0) + delta;
      let newQuantities;
      if (next <= 0) {
        const { [id]: _, ...rest } = prev;
        newQuantities = rest;
      } else {
        newQuantities = { ...prev, [id]: next };
      }
      
      // Sync with DB
      if (canteenId) {
        fetch("/api/carts/update", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${localStorage.getItem("token")}` 
          },
          body: JSON.stringify({
            canteenId,
            orgId,
            name: canteenName,
            items: newQuantities
          })
        });
      }
      return newQuantities;
    });
  };

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Menu</h1>
            <p className="mt-1 text-sm text-muted-foreground">{menuItems.length} items available</p>
          </div>
          {totalItems > 0 && (
            <Link to="/cart" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
              <ShoppingCart className="h-4 w-4" /> Cart ({totalItems})
            </Link>
          )}
        </div>
        {loading ? (
          <div className="text-center py-10">Loading menu...</div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No menu items found.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => {
              const stats = ratingStats[item._id];
              const avg = stats?.averageRating || 0;
              const count = stats?.totalRatings || 0;
              const isTopRated = avg >= 4.5 && count >= 5;

              return (
                <div key={item._id} className="group relative flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-xl transition-all duration-300 animate-fade-in hover:-translate-y-1">
                  {isTopRated && (
                    <div className="absolute -top-3 left-6 z-10 flex items-center gap-1.5 rounded-full bg-yellow-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-yellow-500/20">
                      <Trophy size={10} className="fill-white" /> Top Rated
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 
                          className="cursor-pointer text-lg font-black text-card-foreground hover:text-primary transition-colors leading-tight"
                          onClick={() => setSelectedItemForDetails({ ...item, avgRating: avg, totalRatings: count })}
                        >
                          {item.itemName}
                        </h3>
                        <p className="mt-1.5 text-xs font-medium text-muted-foreground line-clamp-2 min-h-[2rem]">
                          {item.desc || "Delicious freshly prepared meal."}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest ${
                        item.category === "Veg" ? "bg-green-500/10 text-green-600 border border-green-500/20" : 
                        item.category === "Non-Veg" ? "bg-red-500/10 text-red-600 border border-red-500/20" : 
                        "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                      }`}>
                        {item.category}
                      </span>
                    </div>

                    <div 
                      className="mt-4 flex items-center gap-2 cursor-pointer group/rating bg-muted/30 w-fit px-3 py-1.5 rounded-xl border border-border/50 hover:bg-muted/50 transition-all"
                      onClick={() => setSelectedItemForDetails({ ...item, avgRating: avg, totalRatings: count })}
                    >
                      <RatingStars rating={avg} size={14} />
                      <span className="text-xs font-bold text-foreground">
                        {avg > 0 ? avg.toFixed(1) : "N/A"}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        ({count} ratings)
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Price</span>
                      <span className="text-2xl font-black text-foreground">₹{item.price}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedItemForRating(item)}
                        className="flex h-10 px-4 items-center justify-center rounded-xl border border-border bg-background text-[11px] font-bold uppercase tracking-wider text-foreground hover:bg-muted hover:border-primary/30 transition-all active:scale-95"
                      >
                        Rate
                      </button>

                      {quantities[item._id] ? (
                        <div className="flex items-center gap-2 bg-primary/5 p-1 rounded-xl border border-primary/20">
                          <button onClick={() => updateQty(item._id, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary shadow-sm hover:bg-muted transition-colors border border-primary/10">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-black text-primary">{quantities[item._id]}</span>
                          <button onClick={() => updateQty(item._id, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => updateQty(item._id, 1)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-6 text-xs font-black uppercase tracking-widest text-white hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-95">
                          <Plus className="h-4 w-4" /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedItemForRating && (
          <ItemRatingModal 
            isOpen={!!selectedItemForRating} 
            onClose={() => setSelectedItemForRating(null)} 
            foodItem={selectedItemForRating}
            onSuccess={refreshRatings}
          />
        )}

        {selectedItemForDetails && (
          <ItemDetailsModal 
            isOpen={!!selectedItemForDetails} 
            onClose={() => setSelectedItemForDetails(null)} 
            foodItem={selectedItemForDetails}
          />
        )}
      </div>
    </div>
  );
};

export default MenuPage;
