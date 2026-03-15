import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const CartDrawer = () => {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-charcoal/50 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-md bg-background shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="font-heading text-2xl text-foreground">
                Your Cart ({totalItems})
              </h2>
              <button
                onClick={closeCart}
                className="text-foreground hover:text-primary transition-colors"
                aria-label="Close cart"
              >
                <X size={24} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag size={48} className="text-muted-foreground/30 mb-4" />
                  <p className="font-heading text-xl text-foreground mb-2">Your cart is empty</p>
                  <p className="font-body text-xs text-muted-foreground tracking-wide">
                    Add some beautiful pieces to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <motion.div
                      key={`${item.product.id}-${item.size}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="flex gap-4"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-28 object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-body text-xs tracking-[0.1em] uppercase text-foreground truncate">
                          {item.product.name}
                        </h3>
                        <p className="font-body text-[10px] text-muted-foreground mt-1">
                          Size: {item.size}
                        </p>
                        <p className="font-body text-sm font-medium text-foreground mt-1">
                          ${item.product.price.toFixed(2)}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-border">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                              className="p-1.5 hover:bg-secondary transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="px-3 font-body text-xs">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                              className="p-1.5 hover:bg-secondary transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id, item.size)}
                            className="font-body text-[10px] tracking-wider uppercase text-muted-foreground hover:text-sale transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border px-6 py-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground">Subtotal</span>
                  <span className="font-heading text-xl text-foreground">${totalPrice.toFixed(2)}</span>
                </div>
                <p className="font-body text-[10px] text-muted-foreground text-center">
                  Shipping & taxes calculated at checkout
                </p>
                <button
                  onClick={() => { closeCart(); navigate("/checkout"); }}
                  className="w-full bg-primary text-primary-foreground font-body text-xs tracking-[0.2em] uppercase py-4 hover:bg-charcoal transition-colors duration-300"
                >
                  Checkout
                </button>
                <button
                  onClick={closeCart}
                  className="w-full text-center font-body text-xs tracking-[0.15em] uppercase text-foreground hover:text-primary transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
