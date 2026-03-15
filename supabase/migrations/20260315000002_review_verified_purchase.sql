-- Function to check if user has delivered order for a product
CREATE OR REPLACE FUNCTION has_delivered_order_for_product(
    p_customer_id UUID,
    p_product_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    has_order BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = p_customer_id
        AND oi.product_id = p_product_id
        AND o.status = 'delivered'
    ) INTO has_order;
    
    RETURN has_order;
END;
$$ LANGUAGE plpgsql;

-- Function to get order details for review verification
CREATE OR REPLACE FUNCTION get_delivered_order_for_product(
    p_customer_id UUID,
    p_product_id UUID
)
RETURNS TABLE (
    order_id UUID,
    order_date TIMESTAMP WITH TIME ZONE,
    quantity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as order_id,
        o.created_at as order_date,
        oi.quantity::INTEGER
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.customer_id = p_customer_id
    AND oi.product_id = p_product_id
    AND o.status = 'delivered'
    ORDER BY o.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Update reviews table to track verified purchase
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Create index for verified purchases
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON public.reviews(verified_purchase) WHERE verified_purchase = true;
