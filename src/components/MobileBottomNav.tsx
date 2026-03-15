import { Home, Search, ShoppingBag, Heart, Grid3X3 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Home", to: "/" },
  { icon: Grid3X3, label: "Shop", to: "/shop" },
  { icon: Search, label: "Search", to: "search" },
  { icon: Heart, label: "Wishlist", to: "/wishlist" },
  { icon: ShoppingBag, label: "Cart", to: "cart" },
];

interface MobileBottomNavProps {
  onSearchOpen: () => void;
}

const MobileBottomNav = ({ onSearchOpen }: MobileBottomNavProps) => {
  const location = useLocation();
  const { openCart, totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border lg:hidden safe-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ icon: Icon, label, to }) => {
          const isActive =
            to === "/" ? location.pathname === "/" : location.pathname.startsWith(to) && to !== "search" && to !== "cart";
          const isSearch = to === "search";
          const isCart = to === "cart";

          if (isSearch) {
            return (
              <button
                key={label}
                onClick={onSearchOpen}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground active:text-primary transition-colors"
              >
                <Icon size={20} strokeWidth={1.5} />
                <span className="font-body text-[9px] tracking-wider">{label}</span>
              </button>
            );
          }

          if (isCart) {
            return (
              <button
                key={label}
                onClick={openCart}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground active:text-primary transition-colors"
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={1.5} />
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-body"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </div>
                <span className="font-body text-[9px] tracking-wider">{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={label}
              to={to}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground active:text-primary"
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                {label === "Wishlist" && wishlistCount > 0 && (
                  <motion.span
                    key={wishlistCount}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 bg-sale text-primary-foreground text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-body"
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </div>
              <span className="font-body text-[9px] tracking-wider">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-5 h-0.5 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
