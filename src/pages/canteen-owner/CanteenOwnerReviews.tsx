import { Star, AlertTriangle, MessageCircle, Send, BarChart3, Edit2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RatingStars } from "@/components/RatingStars";

interface Review {
  _id: string;
  userId?: { name: string };
  rating: number;
  comment: string;
  canteenResponse?: string;
  complaintFlag?: boolean;
  createdAt: string;
}

interface CanteenStats {
  avgRating: number;
  totalReviews: number;
  breakdown: Record<number, number>;
}

const CanteenOwnerReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [stats, setStats] = useState<CanteenStats | null>(null);
  const [canteenId, setCanteenId] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    const loadReviews = async (cid: string) => {
      setCanteenId(cid);
      try {
        const [reviewRes, statsRes] = await Promise.all([
          fetch(`/api/reviews/${cid}`),
          fetch(`/api/reviews/stats/${cid}`)
        ]);
        if (reviewRes.ok) {
          const data = await reviewRes.json();
          setReviews(Array.isArray(data) ? data : []);
        }
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } catch {
        toast.error("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    const cachedId = localStorage.getItem("myCanteenId");
    if (cachedId) {
      loadReviews(cachedId);
    } else {
      fetch("/api/canteens/my", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(c => {
          if (c?._id) { localStorage.setItem("myCanteenId", c._id); loadReviews(c._id); }
          else setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, []);

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) { toast.error("Please write a response"); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/reviews/reply/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ canteenResponse: replyText })
      });
      if (res.ok) {
        const updatedReview = await res.json();
        setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, canteenResponse: updatedReview.canteenResponse } : r));
        setReplyingTo(null);
        setEditingReply(null);
        setReplyText("");
        toast.success("Response saved!");
      } else {
        const err = await res.json().catch(() => ({ message: "Failed" }));
        toast.error(err.message || "Failed to submit response");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const startEdit = (review: Review) => {
    setEditingReply(review._id);
    setReplyingTo(null);
    setReplyText(review.canteenResponse || "");
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  };

  const normalReviews = reviews.filter(r => !r.complaintFlag);
  const complaints = reviews.filter(r => r.complaintFlag);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">Reviews & Feedback</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{reviews.length} total review{reviews.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Rating Summary Card */}
      {stats && stats.totalReviews > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">Rating Overview</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 items-center">
            <div className="flex flex-col items-center text-center p-5 bg-muted/30 rounded-2xl border border-border/50">
              <div className="text-5xl font-black text-foreground mb-2">{stats.avgRating}</div>
              <RatingStars rating={stats.avgRating} size={22} className="mb-2" />
              <p className="text-xs font-medium text-muted-foreground">out of 5 · {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}</p>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = stats.breakdown[star] || 0;
                const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5 w-8 shrink-0">
                      <span className="text-xs font-bold text-foreground">{star}</span>
                      <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden border border-border/30">
                      <div className="h-full bg-yellow-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-[10px] font-medium text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Normal Reviews */}
      <div className="space-y-4">
        {normalReviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-foreground">No reviews yet</p>
            <p className="text-xs text-muted-foreground mt-1">Reviews from customers will appear here.</p>
          </div>
        ) : (
          normalReviews.map(r => (
            <div key={r._id} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-sm font-bold text-foreground">{r.userId?.name || "Anonymous"}</span>
                  <span className="ml-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{formatDate(r.createdAt)}</span>
                </div>
                <RatingStars rating={r.rating} size={14} />
              </div>
              {r.comment ? (
                <p className="text-sm text-muted-foreground italic">"{r.comment}"</p>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">No comment provided.</p>
              )}
              
              {/* Inlined Reply Logic to prevent focus loss */}
              {(() => {
                const isReplying = replyingTo === r._id || editingReply === r._id;
                
                if (r.canteenResponse && editingReply !== r._id) {
                  return (
                    <div className="mt-3 rounded-xl bg-primary/5 p-4 border border-primary/15">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-semibold text-foreground">Your Response</span>
                        </div>
                        <button
                          onClick={() => startEdit(r)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Edit2 className="h-3 w-3" /> Edit
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{r.canteenResponse}"</p>
                    </div>
                  );
                }

                if (isReplying) {
                  return (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Write a response to this review..."
                        rows={3}
                        autoFocus
                        className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReplySubmit(r._id)}
                          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {editingReply === r._id ? "Update Response" : "Send Response"}
                        </button>
                        <button
                          onClick={() => { setReplyingTo(null); setEditingReply(null); setReplyText(""); }}
                          className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    onClick={() => { setReplyingTo(r._id); setReplyText(""); }}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Reply to this review
                  </button>
                );
              })()}
            </div>
          ))
        )}
      </div>

      {/* Complaints */}
      {complaints.length > 0 && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-foreground">Complaints ({complaints.length})</h2>
          </div>
          {complaints.map(c => (
            <div key={c._id} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-bold text-foreground">{c.userId?.name || "Anonymous"}</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{formatDate(c.createdAt)}</span>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  {c.canteenResponse ? "Resolved" : "Open"}
                </span>
              </div>
              {c.comment && <p className="text-sm text-muted-foreground italic">"{c.comment}"</p>}
              
              {/* Inlined Reply Logic for Complaints */}
              {(() => {
                const isReplying = replyingTo === c._id || editingReply === c._id;
                
                if (c.canteenResponse && editingReply !== c._id) {
                  return (
                    <div className="mt-3 rounded-xl bg-primary/5 p-4 border border-primary/15">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-semibold text-foreground">Your Response</span>
                        </div>
                        <button
                          onClick={() => startEdit(c)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Edit2 className="h-3 w-3" /> Edit
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{c.canteenResponse}"</p>
                    </div>
                  );
                }

                if (isReplying) {
                  return (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Write a response to this complaint..."
                        rows={3}
                        autoFocus
                        className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReplySubmit(c._id)}
                          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {editingReply === c._id ? "Update Response" : "Send Response"}
                        </button>
                        <button
                          onClick={() => { setReplyingTo(null); setEditingReply(null); setReplyText(""); }}
                          className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    onClick={() => { setReplyingTo(c._id); setReplyText(""); }}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> {c.canteenResponse ? "Edit Response" : "Respond to complaint"}
                  </button>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CanteenOwnerReviews;
