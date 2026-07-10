import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: number;
  className?: string;
  onRate?: (rating: number) => void;
  hoverRating?: number;
  setHoverRating?: (rating: number) => void;
}

export const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  max = 5, 
  size = 16, 
  className = "", 
  onRate,
  hoverRating = 0,
  setHoverRating
}) => {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= (hoverRating || rating);
        
        return (
          <Star
            key={i}
            size={size}
            className={`transition-all duration-200 ${
              isActive 
                ? "fill-yellow-400 text-yellow-400 scale-110" 
                : "text-muted border-muted fill-transparent"
            } ${onRate ? "cursor-pointer hover:scale-125" : ""}`}
            onClick={() => onRate && onRate(starValue)}
            onMouseEnter={() => setHoverRating && setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating && setHoverRating(0)}
          />
        );
      })}
    </div>
  );
};
