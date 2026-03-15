import { Heart, Plus, Trash2, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWishlist } from "@/contexts/WishlistContext";
import type { Product } from "@/lib/products";

const WishlistTab = () => {
  const { items, removeItem, totalItems } = useWishlist();

  const removeFromWishlist = (productId: string) => {
    removeItem(productId);
    toast.success("Item removed from wishlist");
  };

  const addToCart = (item: Product) => {
    toast.success(`${item.name} has been added to your cart`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-foreground">My Wishlist</h2>
        <p className="text-sm text-muted-foreground font-body">{totalItems} items</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-heading text-xl text-muted-foreground">Your wishlist is empty</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Save items you love for later</p>
          <Button className="mt-4">
            <ShoppingBag size={14} className="mr-2" />
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-lg p-4">
              <div className="relative">
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
                <img
                  src={item.image || '/placeholder.svg'}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-md"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="mt-3">
                <h3 className="font-body text-sm font-medium text-foreground truncate">{item.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {item.color && (
                    <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                      {item.color}
                    </span>
                  )}
                  {item.category && (
                    <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                      {item.category}
                    </span>
                  )}
                </div>
                <p className="font-heading text-lg font-semibold text-foreground mt-2">
                  ${item.price.toLocaleString()}
                </p>
                <Button 
                  className="w-full mt-3"
                  onClick={() => addToCart(item)}
                >
                  <ShoppingBag size={14} className="mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistTab;
