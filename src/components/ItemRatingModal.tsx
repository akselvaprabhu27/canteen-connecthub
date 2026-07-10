import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { RatingStars } from './RatingStars';
import { toast } from 'sonner';

interface ItemRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: {
    _id: string;
    itemName: string;
  };
  onSuccess: () => void;
}

export const ItemRatingModal: React.FC<ItemRatingModalProps> = ({ isOpen, onClose, foodItem, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState<{ canReview: boolean; orderId?: string; isUpdate?: boolean; existingReview?: any } | null>(null);
  const [checking, setChecking] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?._id || user?.id;

  useEffect(() => {
    if (isOpen && foodItem._id && userId) {
      checkEligibility();
    }
  }, [isOpen, foodItem._id, userId]);

  const checkEligibility = async () => {
    setChecking(true);
    try {
      const response = await fetch(`/api/item-reviews/eligibility/${userId}/${foodItem._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      setEligibility(data);
      if (data.existingReview) {
        setRating(data.existingReview.rating);
        setComment(data.existingReview.comment || "");
      }
    } catch (error) {
      console.error("Error checking eligibility:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!eligibility?.canReview) {
      toast.error(eligibility?.message || "You are not eligible to review this item.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/item-reviews/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          userId,
          foodItemId: foodItem._id,
          rating,
          comment,
          orderId: eligibility.orderId
        })
      });

      if (response.ok) {
        toast.success(eligibility.isUpdate ? "Review updated!" : "Review submitted!");
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to submit review");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="text-xl font-bold text-foreground">Rate {foodItem.itemName}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {checking ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">Checking eligibility...</p>
            </div>
          ) : !eligibility?.canReview ? (
            <div className="flex flex-col items-center text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                <AlertCircle size={32} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Not Eligible</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {eligibility?.message || "You can only review items you have previously ordered and completed."}
                </p>
              </div>
              <button onClick={onClose} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-semibold">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground">How would you rate this item?</p>
                <div className="py-2">
                  <RatingStars 
                    rating={rating} 
                    onRate={setRating} 
                    size={40} 
                    hoverRating={hoverRating}
                    setHoverRating={setHoverRating}
                  />
                </div>
                <p className="text-sm font-bold text-yellow-500 min-h-[1.25rem]">
                  {hoverRating === 1 || (hoverRating === 0 && rating === 1) ? "Terrible" :
                   hoverRating === 2 || (hoverRating === 0 && rating === 2) ? "Bad" :
                   hoverRating === 3 || (hoverRating === 0 && rating === 3) ? "Average" :
                   hoverRating === 4 || (hoverRating === 0 && rating === 4) ? "Good" :
                   hoverRating === 5 || (hoverRating === 0 && rating === 5) ? "Amazing!" : ""}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Review (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this food..."
                  className="w-full min-h-[120px] p-4 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || rating === 0}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                {loading ? "Submitting..." : (
                  <>
                    <Send size={18} />
                    {eligibility.isUpdate ? "Update Review" : "Submit Review"}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
