import { Link, useNavigate, useLocation } from "react-router-dom";
import { Star, Send, MessageSquare, UtensilsCrossed } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RatingStars } from "@/components/RatingStars";

interface CanteenStats {
  avgRating: number;
  totalReviews: number;
  breakdown: Record<number, number>;
}

interface RecentReview {
  _id: string;
  userId?: { name: string };
  rating: number;
  comment?: string;
  createdAt: string;
}

const ReviewPage = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [canteenName, setCanteenName] = useState("Canteen");
  const [canteenId, setCanteenId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(true);

  const ratingLabels: Record<number, string> = {
    1: "Terrible 😞",
    2: "Bad 😕",
    3: "Average 😐",
    4: "Good 😊",
    5: "Amazing! 🤩"
  };

  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const init = async () => {
      try {
        // If we have state from OrderDetailsPage, use it directly
        if (location.state?.canteenId) {
          setCanteenId(location.state.canteenId);
          setCanteenName(location.state.canteenName || "Canteen");
          setOrderId(location.state.orderId || "");
          setLoading(false);
          return;
        }

        // Fallback: Get current user session
        const meRes = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = await meRes.json();

        const cid = user.lastSelectedCanteenId;
        const oid = user.lastOrderId;

        if (!cid) {
          toast.error("No canteen selected. Please order first.");
          navigate("/dashboard");
          return;
        }

        setCanteenId(cid);
        setOrderId(oid || "");

        // Fetch canteen name
        const canteenRes = await fetch(`/api/canteens/details/${cid}`);
        if (canteenRes.ok) {
          const cData = await canteenRes.json();
          setCanteenName(cData.canteenName || "Canteen");
        }
      } catch (err) {
        console.error("ReviewPage init error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a star rating"); return; }

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) { toast.error("Please log in"); navigate("/login"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id || user.id,
          canteenId,
          orderId: orderId || undefined,
          rating,
          comment,
          complaintFlag: false
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Review submitted! Thank you for your feedback. 🎉");
        navigate("/order-details");
      } else {
        console.error("Submission failed:", data);
        toast.error(data.message || "Failed to submit review");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1 w-8 rounded-full bg-primary" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Canteen Review</p>
            </div>
            <h1 className="font-heading text-3xl font-black text-foreground">Rate Your Experience</h1>
            <div className="mt-1 flex items-center gap-2 text-muted-foreground">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">{canteenName}</p>
            </div>
          </div>
          <Link
            to="/order-details"
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors text-center"
          >
            ← Back to Orders
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Review Form */}
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            {/* Star Rating */}
            <div className="flex flex-col items-center space-y-3 mb-8">
              <p className="text-sm font-semibold text-muted-foreground">How was your experience?</p>
              <div className="flex gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`h-10 w-10 transition-all duration-150 ${
                        activeRating >= star
                          ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className={`text-base font-bold min-h-[1.5rem] transition-all ${activeRating > 0 ? "text-yellow-500" : "text-transparent"}`}>
                {activeRating > 0 ? ratingLabels[activeRating] : "—"}
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-2 mb-6">
              <label className="block text-sm font-semibold text-foreground">
                Your Review <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                rows={5}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Tell others about the food quality, service, cleanliness..."
                className="w-full rounded-2xl border border-border bg-muted/30 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
              ) : (
                <><Send size={16} /> Submit Review</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
