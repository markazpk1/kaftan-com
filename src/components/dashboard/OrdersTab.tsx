import React, { useState, useEffect } from "react";
import { Package, Search, Filter, Calendar, ChevronDown, Eye, Truck, CheckCircle, XCircle, X } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  items: {
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    size?: string;
    color?: string;
    image?: string;
  }[];
}

const OrdersTab = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders function
  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch orders with order items and product_id
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            size,
            color,
            unit_price,
            total_price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched orders data:', orders);

      // Transform the data and fetch product images for each order
      const transformedOrders: Order[] = await Promise.all(
        (orders || []).map(async (order) => {
          // Fetch product images for each unique product in this order
          const productIds = [...new Set(order.order_items?.map(item => item.product_id).filter(Boolean))];
          const productImages: Record<string, string> = {};
          
          if (productIds.length > 0) {
            const { data: products } = await supabase
              .from('products')
              .select('id, images')
              .in('id', productIds);
            
            products?.forEach(product => {
              if (product.images) {
                // Handle both JSON arrays and single URLs
                if (Array.isArray(product.images) && product.images.length > 0) {
                  // JSON array case - take first image
                  productImages[product.id] = product.images[0];
                } else if (typeof product.images === 'string' && (product.images as string).startsWith('http')) {
                  // Single URL case - use as is
                  productImages[product.id] = product.images;
                } else {
                  // Fallback for any other format
                  productImages[product.id] = undefined;
                }
              }
            });
          }

          return {
            id: order.id,
            order_number: order.order_number,
            created_at: order.created_at,
            total: order.total,
            status: order.status,
            items: (order.order_items || []).map(item => ({
              id: item.id,
              name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              size: item.size,
              color: item.color,
              image: productImages[item.product_id] || undefined,
            })),
          };
        })
      );

      console.log('Transformed orders with images:', transformedOrders);
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Refetch orders when window gets focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchOrders();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "confirmed":
        return "bg-indigo-100 text-indigo-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Calendar size={16} />;
      case "processing":
        return <Package size={16} />;
      case "shipped":
        return <Truck size={16} />;
      case "confirmed":
        return <Package size={16} />;
      case "refunded":
        return <XCircle size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
            My Orders
          </h2>
          <p className="font-body text-muted-foreground">
            Track and manage your orders
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-10 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                No orders found
              </h3>
              <p className="font-body text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "You haven't placed any orders yet"}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h3 className="font-heading text-lg font-medium text-foreground">
                      {order.order_number}
                    </h3>
                    <p className="font-body text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={24} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-body font-medium text-foreground">
                          {item.name}
                        </h4>
                        <p className="font-body text-sm text-muted-foreground">
                          Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-semibold text-foreground">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-body text-muted-foreground">Total</span>
                    <span className="font-heading text-lg font-semibold text-foreground">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSelectedOrder(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-50 bg-background border border-border rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-heading text-xl font-semibold text-foreground">
                  Order {selectedOrder.order_number}
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  {new Date(selectedOrder.created_at).toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Status */}
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-muted-foreground">Status</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </span>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <h4 className="font-heading text-lg font-semibold text-foreground mb-4">Order Items</h4>
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={32} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-body font-medium text-foreground text-lg">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="font-body text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </span>
                          <span className="font-body text-sm text-muted-foreground">
                            ${item.unit_price.toFixed(2)} each
                          </span>
                          {item.size && (
                            <span className="font-body text-sm text-muted-foreground">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="font-body text-sm text-muted-foreground">
                              Color: {item.color}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-heading text-lg font-semibold text-foreground">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Order Total */}
              <div className="flex justify-between items-center">
                <span className="font-heading text-lg font-semibold text-foreground">Total</span>
                <span className="font-heading text-xl font-bold text-foreground">
                  ${selectedOrder.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <Button 
                onClick={() => setSelectedOrder(null)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default OrdersTab;
