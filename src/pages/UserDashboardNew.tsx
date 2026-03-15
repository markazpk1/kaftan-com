import React, { useState } from "react";
import { User, Package, MapPin, Heart, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ProfileTab from "@/components/dashboard/ProfileTab";
import OrdersTab from "@/components/dashboard/OrdersTab";
import AddressesTab from "@/components/dashboard/AddressesTab";
import WishlistTab from "@/components/dashboard/WishlistTab";
import PaymentsTab from "@/components/dashboard/PaymentsTab";

type TabKey = "profile" | "orders" | "addresses" | "wishlist" | "payments";

const sidebarItems: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "My Profile", icon: User },
  { key: "orders", label: "My Orders", icon: Package },
  { key: "addresses", label: "Address Book", icon: MapPin },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "payments", label: "Payment Methods", icon: CreditCard },
];

const tabComponents: Record<TabKey, React.FC> = {
  profile: ProfileTab,
  orders: OrdersTab,
  addresses: AddressesTab,
  wishlist: WishlistTab,
  payments: PaymentsTab,
};

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
            Please log in to access your dashboard
          </h1>
          <p className="font-body text-muted-foreground">
            You need to be logged in to view your profile and orders
          </p>
        </div>
      </div>
    );
  }

  const currentTabComponent = tabComponents[activeTab];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-card border border-border rounded-xl p-6">
              <h1 className="font-heading text-xl font-semibold text-foreground mb-6">
                My Account
              </h1>
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-body text-sm transition-colors ${
                      activeTab === item.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentTabComponent ? React.createElement(currentTabComponent) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;
