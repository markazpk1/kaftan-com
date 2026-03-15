import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Star,
  Settings, BarChart3, ChevronLeft, ChevronRight, LogOut, Bell,
  Search, Menu, X, FileText, Truck, MessageSquare, Image, Percent,
  Server, Mail, Megaphone
} from "lucide-react";
import NotificationDropdown from "@/components/admin/NotificationDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Products", icon: Package, path: "/admin/products" },
  { label: "Orders", icon: ShoppingCart, path: "/admin/orders" },
  { label: "Customers", icon: Users, path: "/admin/customers" },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { label: "Coupons", icon: Percent, path: "/admin/coupons" },
  { label: "Reviews", icon: Star, path: "/admin/reviews" },
  { label: "Categories", icon: Tag, path: "/admin/categories" },
  { label: "Collections", icon: FileText, path: "/admin/collections" },
  { label: "Inventory", icon: Truck, path: "/admin/inventory" },
  { label: "Pages", icon: FileText, path: "/admin/pages" },
  { label: "Media", icon: Image, path: "/admin/media" },
  { label: "Messages", icon: MessageSquare, path: "/admin/messages" },
  { label: "Notifications", icon: Bell, path: "/admin/notifications" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-heading font-bold text-lg flex-shrink-0">
          FS
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-heading text-lg font-semibold text-foreground leading-none">Fashion Spectrum</h1>
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-widest">Admin Panel</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto min-h-0" data-lenis-prevent>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm transition-all",
              isActive(item.path)
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-3 space-y-1">
        <button
          onClick={() => { navigate("/"); }}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all w-full"
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Back to Store</span>}
        </button>
        <button
          onClick={async () => {
            const { supabase } = await import("@/integrations/supabase/client");
            await supabase.auth.signOut();
            navigate("/admin/login");
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm text-destructive hover:bg-destructive/10 transition-all w-full"
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300 sticky top-0 h-screen",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-6 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground">
                <Menu size={20} />
              </button>
              <div className="relative hidden sm:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search anything..."
                  className="pl-9 h-9 w-64 bg-secondary/50 border-0 font-body text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading text-sm font-semibold">
                  A
                </div>
                <span className="font-body text-sm text-foreground hidden sm:inline">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
