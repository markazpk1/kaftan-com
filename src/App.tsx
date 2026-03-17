import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import CartDrawer from "@/components/CartDrawer";
import MobileBottomNav from "@/components/MobileBottomNav";
import SearchOverlay from "@/components/SearchOverlay";
import PageTransition from "@/components/PageTransition";
import { useState } from "react";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Collections from "./pages/Collections";
import CollectionsPage from "./pages/CollectionsPage";
import CollectionDetail from "./pages/CollectionDetail";
import NewArrivals from "./pages/NewArrivals";
import Sale from "./pages/Sale";
// Admin collections management
import AdminCollections from "./pages/admin/AdminCollections";
import SafariCollection from "./pages/SafariCollection";
import ParadiseCollection from "./pages/ParadiseCollection";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import OurStory from "./pages/OurStory";
import ContactUs from "./pages/ContactUs";
import NotFound from "./pages/NotFound";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminPages from "./pages/admin/AdminPages";
import AdminPageEditor from "./pages/admin/AdminPageEditor";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminSettings from "./pages/admin/AdminSettings";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSetup from "./pages/admin/AdminSetup";
import RemovePrices from "./pages/admin/RemovePrices";
import BuyClearance from "./pages/BuyClearance";

const queryClient = new QueryClient();

const AdminProtected = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAdminAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-body text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">Access Denied</h1>
            <p className="font-body text-muted-foreground mb-6">
              You don't have permission to access the admin panel. Please contact your administrator if you need access.
            </p>
            <div className="space-y-3">
              <a
                href="/admin/login"
                className="block w-full bg-primary text-primary-foreground font-body text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-center"
              >
                Admin Login
              </a>
              <a
                href="/"
                className="block w-full border border-border font-body text-sm px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-center"
              >
                Back to Store
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { isAdmin, loading } = useAdminAuth();

  // Check if current route is admin route
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // Redirect non-admin users trying to access admin routes
  useEffect(() => {
    if (!loading && isAdminRoute && !isAdmin) {
      // User is trying to access admin route but is not admin
      window.location.href = '/admin/login';
    }
  }, [loading, isAdminRoute, isAdmin, location.pathname]);

  // Don't show store chrome on admin routes
  const isAdminPath = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminPath && (
        <>
          <CartDrawer />
          <MobileBottomNav onSearchOpen={() => setSearchOpen(true)} />
          <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
      )}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Store Routes */}
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
          <Route path="/collections" element={<PageTransition><CollectionsPage /></PageTransition>} />
          <Route path="/collection/:slug" element={<PageTransition><CollectionDetail /></PageTransition>} />
          <Route path="/safari-collection" element={<PageTransition><SafariCollection /></PageTransition>} />
          <Route path="/paradise-collection" element={<PageTransition><ParadiseCollection /></PageTransition>} />
          <Route path="/new-arrivals" element={<PageTransition><NewArrivals /></PageTransition>} />
          <Route path="/sale" element={<PageTransition><Sale /></PageTransition>} />
          <Route path="/clearance" element={<PageTransition><BuyClearance /></PageTransition>} />
          
          <Route path="/product/:slug" element={<PageTransition><ProductDetail /></PageTransition>} />
          <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
          <Route path="/wishlist" element={<PageTransition><Wishlist /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/account" element={<PageTransition><UserDashboard /></PageTransition>} />
          <Route path="/our-story" element={<PageTransition><OurStory /></PageTransition>} />
          <Route path="/contact-us" element={<PageTransition><ContactUs /></PageTransition>} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/setup" element={<AdminSetup />} />
          <Route path="/admin" element={<AdminProtected><AdminLayout /></AdminProtected>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="collections" element={<AdminCollections />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="pages" element={<AdminPages />} />
            <Route path="pages/edit/:pageId" element={<AdminPageEditor />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="remove-prices" element={<RemovePrices />} />
          </Route>

          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <AnimatedRoutes />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
