import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquare, Trophy } from 'lucide-react';
import { RatingStars } from './RatingStars';

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodItem: {
    _id: string;
    itemName: string;
    price: number;
    category: string;
    desc?: string;
    avgRating?: number;
    totalRatings?: number;
  };
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ isOpen, onClose, foodItem }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && foodItem._id) {
      fetchReviews();
    }
  }, [isOpen, foodItem._id]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/item-reviews/item/${foodItem._id}`);
      const data = await response.json();
      setReviews(data.reviews);
      setBreakdown(data.breakdown);
    } catch (error) {
      console.error("Error fetching item reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalReviews = reviews.length;
  const isTopRated = foodItem.avgRating && foodItem.avgRating >= 4.5 && foodItem.totalRatings && foodItem.totalRatings >= 5;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-border max-h-[90vh] flex flex-col">
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-muted/20 relative">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{foodItem.itemName}</h2>
              {isTopRated && (
                <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-yellow-500/20">
                  <Trophy size={10} /> Top Rated
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{foodItem.category} • ₹{foodItem.price}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors absolute right-6 top-6">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Stats Section */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/30 rounded-3xl border border-border/50">
              <div className="text-6xl font-black text-foreground mb-2">{foodItem.avgRating?.toFixed(1) || "0.0"}</div>
              <RatingStars rating={foodItem.avgRating || 0} size={24} className="mb-4" />
              <div className="text-sm font-medium text-muted-foreground">Based on {foodItem.totalRatings || 0} reviews</div>
            </div>

            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-4 group">
                    <div className="flex items-center gap-1 w-8">
                      <span className="text-sm font-bold text-foreground">{star}</span>
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden border border-border/30">
                      <div 
                        className="h-full bg-yellow-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(250,204,21,0.4)]" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-8 text-right text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare size={20} className="text-primary" />
              Recent Reviews
            </h3>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border">
                <p className="text-muted-foreground italic">No reviews yet. Be the first to rate!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="p-5 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/30 transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-foreground">{review.userId?.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                          {new Date(review.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <RatingStars rating={review.rating} size={14} />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-card-foreground leading-relaxed italic opacity-90 group-hover:opacity-100 transition-opacity">
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
