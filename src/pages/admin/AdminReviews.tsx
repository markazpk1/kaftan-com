import { useState, useEffect } from "react";
import { Star, Check, Trash2, Eye, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  helpful_count: number;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    avgRating: 0
  });

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await (supabase as any)
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Get unique product IDs
      const productIds = [...new Set((reviewsData || []).map((r: any) => r.product_id))];

      // Fetch product data only
      const { data: productsData } = await (supabase as any)
        .from('products')
        .select('id, name')
        .in('id', productIds);

      // Create product lookup map
      const productMap = (productsData || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});

      // Format reviews without customer data (we don't have access to users table)
      const formattedReviews = (reviewsData || []).map((r: any) => {
        const product = productMap[r.product_id];
        
        return {
          id: r.id,
          customer_name: 'Customer', // We can't access user data due to RLS
          customer_email: '',
          product_name: product?.name || 'Unknown Product',
          product_id: r.product_id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          status: r.status,
          helpful_count: r.helpful_count || 0
        };
      });

      setReviews(formattedReviews);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast({ title: "Error fetching reviews", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats locally instead of using RPC
      const { data: reviewsData, error } = await (supabase as any)
        .from('reviews')
        .select('status, rating');

      if (error) throw error;

      const total = reviewsData?.length || 0;
      const pending = reviewsData?.filter((r: any) => r.status === 'pending').length || 0;
      const approved = reviewsData?.filter((r: any) => r.status === 'approved').length || 0;
      const rejected = reviewsData?.filter((r: any) => r.status === 'rejected').length || 0;
      const avgRating = approved > 0 
        ? (reviewsData?.filter((r: any) => r.status === 'approved').reduce((sum: number, r: any) => sum + r.rating, 0) / approved)
        : 0;

      setStats({
        total,
        pending,
        approved,
        rejected,
        avgRating
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateStatus = async (id: string, status: Review["status"]) => {
    try {
      const { error } = await (supabase as any)
        .from('reviews')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setReviews(reviews.map(r => r.id === id ? { ...r, status } : r));
      fetchStats();
      toast({ title: `Review ${status} successfully` });
    } catch (error: any) {
      console.error('Error updating review:', error);
      toast({ title: "Error updating review", description: error.message, variant: "destructive" });
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReviews(reviews.filter(r => r.id !== id));
      fetchStats();
      toast({ title: "Review deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast({ title: "Error deleting review", description: error.message, variant: "destructive" });
    }
  };

  const filtered = filter === "all" ? reviews : reviews.filter(r => r.status === filter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-foreground">Reviews</h1>
        <p className="font-body text-sm text-muted-foreground">
          {stats.total} reviews · Avg {stats.avgRating.toFixed(1)} ★
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: MessageSquare },
          { label: "Pending", value: stats.pending, icon: Eye },
          { label: "Approved", value: stats.approved, icon: Check },
          { label: "Avg Rating", value: stats.avgRating.toFixed(1), icon: Star },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
            <s.icon size={18} className="mx-auto text-primary mb-2" />
            <p className="font-heading text-xl font-semibold text-foreground">{s.value}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg font-body text-xs transition-all capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="font-body text-muted-foreground">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading text-xs font-semibold">
                      {r.customer_name.split(" ").map(n => n[0]).join("") || "?"}
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">{r.customer_name || "Anonymous"}</p>
                      <p className="font-body text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <p className="font-body text-xs text-primary font-medium mt-2">{r.product_name}</p>
                  <div className="flex items-center gap-0.5 my-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} className={i < r.rating ? "text-accent fill-accent" : "text-muted-foreground/30"} />
                    ))}
                  </div>
                  <p className="font-body text-sm text-foreground">{r.comment}</p>
                  {r.helpful_count > 0 && (
                    <p className="font-body text-xs text-muted-foreground mt-2">
                      {r.helpful_count} people found this helpful
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-body font-medium flex-shrink-0 ${statusColor[r.status]}`}>
                    {r.status}
                  </span>
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    title="Delete review"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <Button size="sm" className="font-body text-xs" onClick={() => updateStatus(r.id, "approved")}>
                    <Check size={12} className="mr-1" /> Approve
                  </Button>
                  <Button variant="outline" size="sm" className="font-body text-xs text-destructive" onClick={() => updateStatus(r.id, "rejected")}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
