import { useState, useEffect } from "react";
import { Star, ThumbsUp, User, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProductReviewsProps {
  productId: string;
  averageRating?: number;
  reviewCount?: number;
}

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  helpful_count: number;
}

const ProductReviews = ({ productId, averageRating, reviewCount }: ProductReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [hasDeliveredOrder, setHasDeliveredOrder] = useState(false);
  const [checkingOrder, setCheckingOrder] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkUserReview();
    checkDeliveredOrder();
  }, [productId, user]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('reviews_with_customers')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReviews = (data || []).map((r: any) => ({
        id: r.id,
        customer_name: r.customer_name || 'Anonymous Customer',
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        helpful_count: r.helpful_count || 0
      }));

      setReviews(formattedReviews);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserReview = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('customer_id', user.id)
        .single();

      if (data) setUserHasReviewed(true);
    } catch (error) {
      // No review found
    }
  };

  const checkDeliveredOrder = async () => {
    if (!user) return;
    
    try {
      setCheckingOrder(true);
      const { data, error } = await (supabase as any)
        .rpc('has_delivered_order_for_product', {
          p_customer_id: user.id,
          p_product_id: productId
        });

      if (error) throw error;
      setHasDeliveredOrder(data === true);
    } catch (error) {
      console.error('Error checking order:', error);
      setHasDeliveredOrder(false);
    } finally {
      setCheckingOrder(false);
    }
  };

  const submitReview = async () => {
    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please write a review");
      return;
    }

    try {
      setSubmitting(true);
      
      // Get the delivered order for this product
      const { data: orderData, error: orderError } = await (supabase as any)
        .rpc('get_delivered_order_for_product', {
          p_customer_id: user.id,
          p_product_id: productId
        });

      if (orderError) throw orderError;
      
      if (!orderData || orderData.length === 0) {
        toast.error("You can only review products from delivered orders");
        return;
      }

      const orderId = orderData[0].order_id;
      
      const { error } = await (supabase as any)
        .from('reviews')
        .insert({
          product_id: productId,
          customer_id: user.id,
          rating,
          comment: comment.trim(),
          status: 'pending',
          verified_purchase: true,
          order_id: orderId
        });

      if (error) throw error;

      toast.success("Review submitted! It will be visible after approval.");
      setRating(0);
      setComment("");
      setUserHasReviewed(true);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-2xl text-foreground mb-1">Customer Reviews</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < Math.round(averageRating || 0) ? "text-accent fill-accent" : "text-muted-foreground/30"}
                />
              ))}
            </div>
            <span className="font-body text-sm text-muted-foreground">
              {averageRating?.toFixed(1) || "0.0"} ({reviewCount || 0} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Write Review - Only for users with delivered orders */}
      {user && !userHasReviewed && checkingOrder && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="font-body text-sm text-muted-foreground">Checking purchase history...</span>
          </div>
        </div>
      )}

      {user && !userHasReviewed && !checkingOrder && hasDeliveredOrder && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-body text-sm text-green-600">Verified Purchase</span>
          </div>
          <h4 className="font-body text-sm font-medium text-foreground mb-4">Write a Review</h4>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-4">
            <span className="font-body text-sm text-muted-foreground mr-2">Rating:</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setRating(i + 1)}
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-colors"
              >
                <Star
                  size={24}
                  className={i < (hoverRating || rating) ? "text-accent fill-accent" : "text-muted-foreground/30"}
                />
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary resize-none"
            rows={4}
          />

          {/* Submit */}
          <Button
            onClick={submitReview}
            disabled={submitting}
            className="mt-4 font-body text-xs tracking-[0.15em] uppercase"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      )}

      {user && !userHasReviewed && !checkingOrder && !hasDeliveredOrder && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-body text-sm text-amber-800">
            You can only review products from delivered orders. 
            <a href="/account/orders" className="text-primary hover:underline ml-1">View your orders</a>
          </p>
        </div>
      )}

      {user && userHasReviewed && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
          <p className="font-body text-sm text-primary">
            Thank you! Your review has been submitted and is pending approval.
          </p>
        </div>
      )}

      {!user && (
        <div className="bg-muted border border-border rounded-xl p-4 text-center">
          <p className="font-body text-sm text-muted-foreground">
            Please <a href="/login" className="text-primary hover:underline">login</a> to write a review
          </p>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 bg-card border border-border rounded-xl">
          <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="font-body text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading text-sm font-semibold">
                    {review.customer_name.split(" ").map(n => n[0]).join("") || "?"}
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">
                      {review.customer_name || "Anonymous"}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < review.rating ? "text-accent fill-accent" : "text-muted-foreground/30"}
                    />
                  ))}
                </div>
              </div>
              <p className="font-body text-sm text-foreground leading-relaxed">
                {review.comment}
              </p>
              {review.helpful_count > 0 && (
                <div className="flex items-center gap-1 mt-3 text-muted-foreground">
                  <ThumbsUp size={14} />
                  <span className="font-body text-xs">
                    {review.helpful_count} people found this helpful
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
