-- Delete all demo products added by inventory setup
DELETE FROM products
WHERE slug IN (
    'classic-white-shirt',
    'slim-fit-jeans',
    'leather-handbag',
    'silk-evening-dress',
    'cotton-tshirt-pack',
    'wool-blazer',
    'sports-shoes',
    'denim-jacket',
    'summer-dress',
    'business-suit'
);

-- This will remove the 10 demo products while keeping your existing products intact
