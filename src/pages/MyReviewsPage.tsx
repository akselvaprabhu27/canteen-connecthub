import { Link, useNavigate } from "react-router-dom";
import { Star, MessageSquare, UtensilsCrossed, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RatingStars } from "@/components/RatingStars";

interface Organization { name: string; }
interface Canteen { canteenName: string; organizationId: Organization | null; }

interface CanteenReview {
  _id: string;
  canteenId: Canteen | null;
  rating: number;
  comment: string;
  canteenResponse?: string;
  createdAt: string;
}

interface ItemReview {
  _id: string;
  foodItemId?: { itemName: string; price: number };
  canteenId?: { canteenName: string };
  rating: number;
  comment?: string;
  createdAt: string;
}

const getSentiment = (rating: number) => {
  if (rating >= 4) return { text: "Positive", color: "bg-green-500/10 text-green-600 border border-green-500/20" };
  if (rating === 3) return { text: "Neutral", color: "bg-amber-500/10 text-amber-600 border border-amber-500/20" };
  return { text: "Negative", color: "bg-red-500/10 text-red-600 border border-red-500/20" };
};

type Tab = "canteen" | "item";

const MyReviewsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("canteen");
  const [canteenReviews, setCanteenReviews] = useState<CanteenReview[]>([]);
  const [itemReviews, setItemReviews] = useState<ItemReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/login"); return; }
    const user = JSON.parse(stored);
    const userId = user._id || user.id;
    if (!userId) { setLoading(false); return; }

    const fetchAll = async () => {
      try {
        const token = user.token;
        const headers = { Authorization: `Bearer ${token}` };

        const [cRes, iRes] = await Promise.all([
          fetch(`/api/reviews/user/${userId}`, { headers }),
          fetch(`/api/item-reviews/user/${userId}`, { headers })
        ]);

        if (cRes.ok) setCanteenReviews(await cRes.json());
        if (iRes.ok) setItemReviews(await iRes.json());
      } catch {
        toast.error("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [navigate]);

  const tabs: { id: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: "canteen", label: "Canteen Reviews", count: canteenReviews.length, icon: <UtensilsCrossed className="h-4 w-4" /> },
    { id: "item", label: "Item Reviews", count: itemReviews.length, icon: <Package className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1 w-8 rounded-full bg-primary" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">My Account</p>
            </div>
            <h1 className="font-heading text-3xl font-black text-foreground">My Reviews</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {canteenReviews.length + itemReviews.length} total review{canteenReviews.length + itemReviews.length !== 1 ? "s" : ""} submitted
            </p>
          </div>
          <Link
            to="/dashboard"
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors text-center"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl bg-muted/50 border border-border p-1 mb-8 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : activeTab === "canteen" ? (
          canteenReviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">No canteen reviews yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Order food and share your experience with the canteen.</p>
              <Link to="/dashboard" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Browse Canteens
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {canteenReviews.map(review => {
                const sentiment = getSentiment(review.rating);
                return (
                  <div key={review._id} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-foreground">{review.canteenId?.canteenName || "Unknown Canteen"}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{review.canteenId?.organizationId?.name || "Organization"}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${sentiment.color}`}>
                        {sentiment.text}
                      </span>
                    </div>

                    <RatingStars rating={review.rating} size={16} className="mb-3" />

                    {review.comment ? (
                      <p className="text-sm text-foreground italic">"{review.comment}"</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No comment provided.</p>
                    )}

                    {review.canteenResponse && (
                      <div className="mt-4 rounded-xl bg-primary/5 p-4 border border-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold text-foreground">
                            Response from {review.canteenId?.canteenName || "Canteen"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground italic">"{review.canteenResponse}"</p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-border text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {new Date(review.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          itemReviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <Star className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">No item reviews yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Click "Rate" on any food item after completing your order.</p>
              <Link to="/dashboard" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Browse Menu
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {itemReviews.map(review => {
                const sentiment = getSentiment(review.rating);
                return (
                  <div key={review._id} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-foreground">{review.foodItemId?.itemName || "Unknown Item"}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {review.canteenId?.canteenName || "Canteen"}
                          {review.foodItemId?.price ? ` · ₹${review.foodItemId.price}` : ""}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${sentiment.color}`}>
                        {sentiment.text}
                      </span>
                    </div>

                    <RatingStars rating={review.rating} size={16} className="mb-3" />

                    {review.comment ? (
                      <p className="text-sm text-foreground italic">"{review.comment}"</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No comment provided.</p>
                    )}

                    <div className="mt-4 pt-4 border-t border-border text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {new Date(review.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MyReviewsPage;
