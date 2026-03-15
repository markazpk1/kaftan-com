import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search, Filter, Eye, X, Package, Truck, Clock, CheckCircle,
  XCircle, ChevronDown, Download, MoreVertical, Trash2, Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  items: number;
  total: number;
  status: string;
  payment?: string;
  date: string;
  shipping_address: string;
  shipping_city?: string;
  shipping_country?: string;
}

const statuses = ["All", "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Refunded"];

const statusColor: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Processing: "bg-amber-100 text-amber-700",
  Shipped: "bg-blue-100 text-blue-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Refunded: "bg-purple-100 text-purple-700",
};

const statusIcon: Record<string, React.ElementType> = {
  Pending: Clock,
  Confirmed: CheckCircle,
  Processing: Clock,
  Shipped: Truck,
  Delivered: CheckCircle,
  Cancelled: XCircle,
  Refunded: XCircle,
};

const AdminOrders = () => {
  const { user, isAdmin } = useAdminAuth();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Fetch orders from database
  const fetchOrders = async () => {
    if (!isAdmin || hasFetched.current) return;
      
    try {
      setLoading(true);
        
      // Fetch orders with order items count
      const { data: ordersData, error } = await supabase
        .from('orders')
          .select(`
            *,
            order_items (
              id
            )
          `)
          .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match expected format
      const transformedOrders: Order[] = (ordersData || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        items: order.order_items?.length || 0,
        total: Number(order.total) || 0,
        status: order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'pending',
        payment: 'COD', // Default payment method since it's not in the schema
        date: new Date(order.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        shipping_address: order.shipping_address,
        shipping_city: order.shipping_city,
        shipping_country: order.shipping_country
      }));

      // Remove duplicates based on order ID
      const uniqueOrders = transformedOrders.filter((order, index, self) => 
        index === self.findIndex((o) => o.id === order.id)
        );

      setOrders(uniqueOrders);
      hasFetched.current = true;
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ 
        title: "Failed to load orders", 
        description: "Please try again later",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
      }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAdmin]);

  const filtered = orders.filter(o => {
    const matchSearch = 
      o.order_number.toLowerCase().includes(search.toLowerCase()) || 
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === filtered.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filtered.map(o => o.id)));
    }
  };

  const exportCSV = (rows: Order[]) => {
    const headers = ["Order ID", "Order Number", "Customer", "Email", "Items", "Total", "Status", "Payment", "Date", "Address"];
    const csv = [
      headers.join(","),
      ...rows.map(o => [o.id, o.order_number, o.customer_name, o.customer_email, o.items, o.total, o.status, o.payment || 'COD', o.date, `"${o.shipping_address}"`].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${rows.length} orders exported to CSV` });
  };

  const updateStatus = async (id: string, newStatus: string) => {
    console.log('🔄 Updating order status:', { id, newStatus });
    
    try {
      // Check if user is admin first
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.email, 'Role:', user?.user_metadata?.role);
      
      // Map frontend status to database enum values
      const statusMapping: Record<string, 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'> = {
        "Pending": "pending",
        "Confirmed": "confirmed", 
        "Processing": "processing",
        "Shipped": "shipped",
        "Delivered": "delivered",
        "Cancelled": "cancelled",
        "Refunded": "refunded"
      };

      const dbStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' = 
        statusMapping[newStatus] || 
        (newStatus.toLowerCase() as any);
      
      console.log('📤 Mapped status:', newStatus, '→', dbStatus);
      
      const { error, data } = await supabase
        .from('orders')
        .update({ status: dbStatus })
        .eq('id', id)
        .select(); // Add .select() to see what was updated
      
      if (error) {
        console.error('❌ Database update error:', error);
        throw error;
      }
      
      console.log('✅ Database update successful, updated data:', data);
      
      // Update local state with the new status (keep frontend format)
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      toast({ title: `Order ${id} marked as ${newStatus}` });
      
    } catch (error) {
      console.error('💥 Catch block error:', error);
      toast({ 
        title: "Failed to update status", 
        description: error.message || "Please try again later",
        variant: "destructive" 
      });
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setOrders(orders.filter(o => o.id !== id));
      toast({ title: "Order deleted successfully" });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({ 
        title: "Failed to delete order", 
        description: "Please try again later",
        variant: "destructive" 
      });
    }
  };

  const editOrder = (id: string) => {
    toast({ title: "Edit order feature coming soon!" });
  };

  const bulkUpdateStatus = (newStatus: string) => {
    setBulkConfirm(newStatus);
  };

  const confirmBulkUpdate = async () => {
    if (!bulkConfirm) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: bulkConfirm.toLowerCase() as any })
        .in('id', Array.from(selectedRows));
      
      if (error) throw error;
      
      setOrders(orders.map(o => selectedRows.has(o.id) ? { ...o, status: bulkConfirm } : o));
      toast({ title: `${selectedRows.size} orders marked as ${bulkConfirm}` });
      setSelectedRows(new Set());
      setBulkConfirm(null);
    } catch (error) {
      console.error('Error bulk updating order status:', error);
      toast({ 
        title: "Failed to update orders", 
        description: "Please try again later",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-heading text-xl text-muted-foreground">Loading orders...</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Please wait while we fetch orders</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="font-heading text-3xl font-semibold text-foreground">Orders</h1>
              <p className="font-body text-sm text-muted-foreground">{orders.length} total orders</p>
            </div>
        <div className="flex gap-2">
          {selectedRows.size > 0 && (
            <>
              <Button variant="outline" className="font-body text-xs tracking-wider uppercase" onClick={() => exportCSV(filtered.filter(o => selectedRows.has(o.id)))}>
                <Download size={14} className="mr-1" /> Export ({selectedRows.size})
              </Button>
              <select
                onChange={e => { if (e.target.value) { bulkUpdateStatus(e.target.value); e.target.value = ""; } }}
                defaultValue=""
                className="h-9 px-3 rounded-md border border-border bg-card font-body text-xs tracking-wider uppercase text-foreground cursor-pointer"
              >
                <option value="" disabled>Bulk Status...</option>
                {["Processing", "Shipped", "Delivered", "Cancelled", "Refunded"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </>
          )}
          <Button variant="outline" className="font-body text-xs tracking-wider uppercase" onClick={() => exportCSV(filtered)}>
            <Download size={14} className="mr-1" /> Export All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statuses.filter(s => s !== "All").concat(["Refunded"]).filter((v, i, a) => a.indexOf(v) === i).map(s => {
          const count = orders.filter(o => o.status === s).length;
          const Icon = statusIcon[s] || Package;
          return (
            <div key={s} className="bg-card border border-border rounded-lg p-3 text-center cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setStatusFilter(s)}>
              <Icon size={18} className="mx-auto text-muted-foreground mb-1" />
              <p className="font-heading text-xl font-semibold text-foreground">{count}</p>
              <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{s}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by order ID or customer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-card border-border font-body" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg font-body text-xs whitespace-nowrap transition-all ${
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground w-10">
                  <input type="checkbox" checked={selectedRows.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-border accent-primary" />
                </th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Order</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Customer</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Payment</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selectedRows.has(o.id)} onChange={() => toggleRow(o.id)} className="rounded border-border accent-primary" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-body text-sm font-medium text-foreground">{o.order_number}</p>
                    <p className="font-body text-xs text-muted-foreground sm:hidden">{o.customer_name}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="font-body text-sm text-foreground">{o.customer_name}</p>
                    <p className="font-body text-xs text-muted-foreground">{o.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-muted-foreground hidden md:table-cell">{o.date}</td>
                  <td className="px-4 py-3">
                    <p className="font-body text-sm font-medium text-foreground">${o.total.toLocaleString()}</p>
                    <p className="font-body text-xs text-muted-foreground">{o.items} items</p>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-muted-foreground hidden md:table-cell">{o.payment}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-body font-medium border-0 cursor-pointer ${statusColor[o.status]}`}
                    >
                      {statuses.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelectedOrder(o)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this order?')) {
                            deleteOrder(o.id);
                            if (selectedRows.has(o.id)) {
                              setSelectedRows(prev => {
                                const next = new Set(prev);
                                next.delete(o.id);
                                return next;
                              });
                            }
                          }
                        }} 
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSelectedOrder(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-50 bg-background border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-semibold text-foreground">Order {selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {[
                ["Customer", selectedOrder.customer_name],
                ["Email", selectedOrder.customer_email],
                ["Phone", selectedOrder.customer_phone || 'N/A'],
                ["Date", selectedOrder.date],
                ["Items", `${selectedOrder.items} items`],
                ["Total", `₨ ${selectedOrder.total.toLocaleString()}`],
                ["Payment", selectedOrder.payment || 'COD'],
                ["Address", selectedOrder.shipping_address],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="font-body text-sm text-muted-foreground">{label}</span>
                  <span className="font-body text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-muted-foreground">Status</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-body font-medium ${statusColor[selectedOrder.status]}`}>{selectedOrder.status}</span>
              </div>
            </div>
            <Button className="w-full mt-5 font-body text-xs tracking-wider uppercase" onClick={() => setSelectedOrder(null)}>Close</Button>
          </motion.div>
        </div>
      )}

      <AlertDialog open={!!bulkConfirm} onOpenChange={() => setBulkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Confirm Bulk Status Update</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Are you sure you want to mark <span className="font-semibold text-foreground">{selectedRows.size} orders</span> as <span className="font-semibold text-foreground">{bulkConfirm}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body text-xs tracking-wider uppercase">Cancel</AlertDialogCancel>
            <AlertDialogAction className="font-body text-xs tracking-wider uppercase" onClick={confirmBulkUpdate}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </>
      )}
    {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSelectedOrder(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-50 bg-background border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-semibold text-foreground">Order {selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {[
                ["Customer", selectedOrder.customer_name],
                ["Email", selectedOrder.customer_email],
                ["Phone", selectedOrder.customer_phone],
                ["Date", selectedOrder.date],
                ["Items", `${selectedOrder.items} items`],
                ["Total", `₨ ${selectedOrder.total.toLocaleString()}`],
                ["Payment", selectedOrder.payment],
                ["Address", selectedOrder.shipping_address],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="font-body text-sm text-muted-foreground">{label}</span>
                  <span className="font-body text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-muted-foreground">Status</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-body font-medium ${statusColor[selectedOrder.status]}`}>{selectedOrder.status}</span>
              </div>
            </div>
            <Button className="w-full mt-5 font-body text-xs tracking-wider uppercase" onClick={() => setSelectedOrder(null)}>Close</Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
