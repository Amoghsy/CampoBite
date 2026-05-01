import { useState } from 'react';
import api from '@/api/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Utensils,
  Clock,
  Smile,
  Send,
  CheckCircle,
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;          // ✅ REQUIRED FOR BACKEND
  orderToken: string;
  orderItems: string[];
}

export function FeedbackModal({
  isOpen,
  onClose,
  orderId,
  orderToken,
  orderItems,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [foodQuality, setFoodQuality] =
    useState<'good' | 'average' | 'poor' | null>(null);
  const [deliverySpeed, setDeliverySpeed] =
    useState<'fast' | 'okay' | 'slow' | null>(null);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] =
    useState<boolean | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  /* ================= SUBMIT FEEDBACK ================= */

  const handleSubmit = async () => {
    try {
      await api.post(`/api/feedback/${orderId}`, {
        rating,
        foodQuality: foodQuality ? foodQuality.toUpperCase() : null,
        deliverySpeed: deliverySpeed ? deliverySpeed.toUpperCase() : null,
        comment,
        wouldRecommend,
      });

      setIsSubmitted(true);

      setTimeout(() => {
        onClose();
        // reset
        setRating(0);
        setFoodQuality(null);
        setDeliverySpeed(null);
        setComment('');
        setWouldRecommend(null);
        setIsSubmitted(false);
      }, 2000);
    } catch (err) {
      console.error('Feedback submit failed', err);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  /* ================= SUCCESS STATE ================= */

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center animate-bounce-in">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h3 className="text-xl font-semibold">Thank You!</h3>
            <p className="text-muted-foreground text-center">
              Your feedback helps us serve you better.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  /* ================= FORM ================= */

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="h-10 w-10 rounded-xl gradient-accent flex items-center justify-center">
              <Star className="h-5 w-5 text-accent-foreground" />
            </div>
            Rate Your Order
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 pt-2">
            <Badge variant="outline" className="token-badge-sm">
              #{orderToken}
            </Badge>
            <span className="text-muted-foreground">
              {orderItems.join(', ')}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 1. Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              How was your food?
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-all hover:scale-110 focus:outline-none"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30'
                      }`}
                  />
                </button>
              ))}
            </div>
            <span className="h-6 text-sm font-medium text-primary">
              {ratingLabels[hoveredRating || rating]}
            </span>
          </div>

          {/* 2. Food Quality & Speed Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                Food Quality
              </label>
              <div className="flex flex-col gap-2">
                {['good', 'average', 'poor'].map((q) => (
                  <div
                    key={q}
                    className={`
                      cursor-pointer rounded-lg border p-2 text-center text-sm transition-all
                      ${foodQuality === q
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:bg-muted'
                      }
                    `}
                    onClick={() => setFoodQuality(q as any)}
                  >
                    {q.charAt(0).toUpperCase() + q.slice(1)}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Delivery Speed
              </label>
              <div className="flex flex-col gap-2">
                {['fast', 'okay', 'slow'].map((s) => (
                  <div
                    key={s}
                    className={`
                      cursor-pointer rounded-lg border p-2 text-center text-sm transition-all
                      ${deliverySpeed === s
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:bg-muted'
                      }
                    `}
                    onClick={() => setDeliverySpeed(s as any)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Recommendation */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Smile className="h-4 w-4 text-muted-foreground" />
              Would you recommend us?
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${wouldRecommend === true
                  ? 'border-success bg-success/10 text-success font-medium ring-1 ring-success'
                  : 'border-border hover:bg-muted text-muted-foreground'
                  }`}
                onClick={() => setWouldRecommend(true)}
              >
                <ThumbsUp className="h-4 w-4" /> Yes
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${wouldRecommend === false
                  ? 'border-destructive bg-destructive/10 text-destructive font-medium ring-1 ring-destructive'
                  : 'border-border hover:bg-muted text-muted-foreground'
                  }`}
                onClick={() => setWouldRecommend(false)}
              >
                <ThumbsDown className="h-4 w-4" /> No
              </button>
            </div>
          </div>

          {/* 4. Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Comments</label>
            <Textarea
              placeholder="Tell us what you liked or how we can improve..."
              className="resize-none min-h-[80px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Skip
          </Button>
          <Button
            className="flex-1 gradient-primary"
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
