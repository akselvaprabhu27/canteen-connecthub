import { Link, useSearchParams } from "react-router-dom";
import { UtensilsCrossed, Star, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Canteen {
  _id: string;
  canteenName: string;
  category: string;
  avgRating?: number;
  totalReviews?: number;
  timing?: string;
  itemCount?: number;
}

const categoryColors: Record<string, string> = {
  Veg: "bg-success/10 text-success",
  "Non-Veg": "bg-destructive/10 text-destructive",
  General: "bg-accent/20 text-accent-foreground",
};

const CanteensPage = () => {
  const [params] = useSearchParams();
  const orgId = params.get("orgId") || localStorage.getItem("selectedOrgId");
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const fetchCanteens = async () => {
      try {
        const response = await fetch(`/api/canteens/${orgId}`);
        const data = await response.json();
        if (response.ok) {
          setCanteens(data);
        } else {
          toast.error("Failed to load canteens");
        }
      } catch (error) {
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchCanteens();
  }, [orgId]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Canteens</h1>
          <p className="mt-1 text-sm text-muted-foreground">{canteens.length} canteen(s) available</p>
        </div>
        {loading ? (
          <div className="text-center py-10">Loading canteens...</div>
        ) : canteens.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No canteens found for this organization.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {canteens.map((c) => (
              <Link 
                key={c._id} 
                to={`/menu?canteenId=${c._id}`} 
                onClick={() => localStorage.setItem("selectedCanteenId", c._id)}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UtensilsCrossed className="h-6 w-6" />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[c.category] || "bg-secondary text-secondary-foreground"}`}>{c.category || 'General'}</span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-card-foreground group-hover:text-primary transition-colors tracking-tight">{c.canteenName}</h3>
                <div className="mt-3 flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-foreground">{c.avgRating && c.avgRating > 0 ? c.avgRating : "N/A"}</span>
                    <span className="text-[10px] opacity-70">({c.totalReviews || 0})</span>
                  </div>
                  <span className="flex items-center gap-1.5 font-medium"><Clock className="h-4 w-4" /> {c.timing || "8 AM - 8 PM"}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CanteensPage;
