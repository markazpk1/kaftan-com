-- Add payment_method column to orders table
ALTER TABLE orders ADD COLUMN payment_method text DEFAULT 'card';

-- Update existing orders to have a default payment method
UPDATE orders SET payment_method = 'card' WHERE payment_method IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
