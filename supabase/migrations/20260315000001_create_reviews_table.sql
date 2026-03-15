-- Reviews table for product reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- RLS Policies
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view approved reviews
CREATE POLICY "Allow public to view approved reviews" ON public.reviews
    FOR SELECT USING (status = 'approved');

-- Allow customers to view their own reviews
CREATE POLICY "Allow customers to view their own reviews" ON public.reviews
    FOR SELECT USING (customer_id = auth.uid());

-- Allow customers to create reviews
CREATE POLICY "Allow customers to create reviews" ON public.reviews
    FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Allow customers to update their own pending reviews
CREATE POLICY "Allow customers to update their own reviews" ON public.reviews
    FOR UPDATE USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

-- Allow customers to delete their own reviews
CREATE POLICY "Allow customers to delete their own reviews" ON public.reviews
    FOR DELETE USING (customer_id = auth.uid());

-- Allow admin to manage all reviews using JWT claim
CREATE POLICY "Allow admin full access" ON public.reviews
    FOR ALL USING (
        (auth.jwt() ->> 'email') = 'tcv00898@gmail.com'
    );

-- Function to update product rating when review is approved
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status != 'approved' OR OLD IS NULL) THEN
        UPDATE products
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0)
                FROM reviews 
                WHERE product_id = NEW.product_id AND status = 'approved'
            ),
            review_count = (
                SELECT COUNT(*) 
                FROM reviews 
                WHERE product_id = NEW.product_id AND status = 'approved'
            )
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update product rating
DROP TRIGGER IF EXISTS update_product_rating_trigger ON reviews;
CREATE TRIGGER update_product_rating_trigger
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- Function to get review statistics
CREATE OR REPLACE FUNCTION get_review_stats()
RETURNS TABLE (
    total_reviews BIGINT,
    pending_reviews BIGINT,
    approved_reviews BIGINT,
    rejected_reviews BIGINT,
    avg_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_reviews,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_reviews,
        COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved_reviews,
        COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected_reviews,
        COALESCE(AVG(rating) FILTER (WHERE status = 'approved'), 0)::NUMERIC(3,1) as avg_rating
    FROM reviews;
END;
$$ LANGUAGE plpgsql;
