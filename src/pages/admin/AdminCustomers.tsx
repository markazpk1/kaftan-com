import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Eye, X, Users, Mail, Phone, MapPin, ShoppingCart, Star, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  orders: number;
  spent: number;
  joined: string;
  status: "Active" | "Inactive";
}


const AdminCustomers = () => {
  const { isAdmin } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [filter, setFilter] = useState("All");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

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
      setSelectedRows(new Set(filtered.map(c => c.id)));
    }
  };

  // Fetch customers from database
  const fetchCustomers = async () => {
    // Only check if current user is admin, not if customers are admin
    console.log('🔐 fetchCustomers: isAdmin =', isAdmin, 'hasFetched =', hasFetched.current);
    
    if (!isAdmin || hasFetched.current) return;
      
    try {
      setLoading(true);
      
      // Fetch all customers (regardless of their roles)
      console.log('📊 Fetching customers from database...');
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📋 Raw customers data:', customersData);
      console.log('❌ Error:', error);

      if (error) throw error;

      // Fetch orders for each customer to calculate orders count and total spent
      const customersWithStats = await Promise.all(
        (customersData || []).map(async (customer: any) => {
          console.log('👤 Processing customer:', customer.full_name, 'user_id:', customer.user_id);
          
          const { data: ordersData } = await supabase
            .from('orders')
            .select('total')
            .eq('user_id', customer.user_id);

          const ordersCount = ordersData?.length || 0;
          const totalSpent = ordersData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

          // Customer status should be based on orders, not admin role
          const customerStatus = ordersCount > 0 ? "Active" as const : "Inactive" as const;

          console.log('📦 Customer stats:', { 
            name: customer.full_name, 
            ordersCount, 
            totalSpent, 
            status: customerStatus 
          });

          return {
            id: customer.id,
            user_id: customer.user_id,
            name: customer.full_name,
            email: customer.email,
            phone: customer.phone,
            city: customer.city,
            orders: ordersCount,
            spent: totalSpent,
            joined: new Date(customer.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }),
            status: customerStatus
          };
        })
      );

      // Filter out admin users from the final list
      const { data: adminUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      const adminUserIds = new Set((adminUsers || []).map(au => au.user_id));
      const nonAdminCustomers = customersWithStats.filter(customer => !adminUserIds.has(customer.user_id));

      console.log('🚫 Filtering out admin users:', adminUserIds);
      console.log('✅ Final non-admin customers:', nonAdminCustomers);

      setCustomers(nonAdminCustomers);
      hasFetched.current = true;
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({ 
        title: "Failed to load customers", 
        description: "Please try again later",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [isAdmin]);

  const exportCSV = (rows: Customer[]) => {
    const headers = ["ID", "Name", "Email", "Phone", "City", "Orders", "Total Spent", "Joined", "Status"];
    const csv = [
      headers.join(","),
      ...rows.map(c => [c.id, c.name, c.email, `"${c.phone}"`, c.city, c.orders, c.spent, c.joined, c.status].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${rows.length} customers exported to CSV` });
  };

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || c.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-foreground">Customers</h1>
            <p className="font-body text-sm text-muted-foreground">Loading customers...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 text-center animate-pulse">
              <div className="w-4 h-4 bg-muted rounded mx-auto mb-2"></div>
              <div className="w-16 h-6 bg-muted rounded mx-auto mb-1"></div>
              <div className="w-20 h-3 bg-muted rounded mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="font-body text-muted-foreground">Loading customer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Customers</h1>
          <p className="font-body text-sm text-muted-foreground">{customers.length} registered customers</p>
        </div>
        <div className="flex gap-2">
          {selectedRows.size > 0 && (
            <Button variant="outline" className="font-body text-xs tracking-wider uppercase" onClick={() => exportCSV(filtered.filter(c => selectedRows.has(c.id)))}>
              <Download size={14} className="mr-1" /> Export Selected ({selectedRows.size})
            </Button>
          )}
          <Button variant="outline" className="font-body text-xs tracking-wider uppercase" onClick={() => exportCSV(filtered)}>
            <Download size={14} className="mr-1" /> Export All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Customers", value: customers.length, icon: Users },
          { label: "Active", value: customers.filter(c => c.status === "Active").length, icon: Star },
          { label: "Total Orders", value: customers.reduce((s, c) => s + c.orders, 0), icon: ShoppingCart },
          { label: "Total Revenue", value: `AUD ${(customers.reduce((s, c) => s + c.spent, 0) / 1000).toFixed(0)}K`, icon: Star },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
            <s.icon size={18} className="mx-auto text-primary mb-2" />
            <p className="font-heading text-xl font-semibold text-foreground">{s.value}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-card border-border font-body" />
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Inactive"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg font-body text-xs transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="font-body text-lg font-medium text-foreground mb-2">No customers found</p>
            <p className="font-body text-sm text-muted-foreground">
              {customers.length === 0 
                ? "No customers have registered yet." 
                : "No customers match your search criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground w-10">
                  <input type="checkbox" checked={selectedRows.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-border accent-primary" />
                </th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">City</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Orders</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Spent</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">View</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading text-sm font-semibold flex-shrink-0">
                        {c.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">{c.name}</p>
                        <p className="font-body text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-muted-foreground hidden md:table-cell">{c.city}</td>
                  <td className="px-4 py-3 font-body text-sm text-foreground">{c.orders}</td>
                  <td className="px-4 py-3 font-body text-sm font-medium text-foreground hidden sm:table-cell">AUD {c.spent.toLocaleString()}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-body font-medium ${c.status === "Active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selectedRows.has(c.id)} onChange={() => toggleRow(c.id)} className="rounded border-border accent-primary" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => setSelected(c)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Eye size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSelected(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-50 bg-background border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-semibold text-foreground">Customer Details</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary font-heading text-2xl font-semibold">
                {selected.name.split(" ").map(n => n[0]).join("")}
              </div>
              <h4 className="font-heading text-lg font-semibold text-foreground mt-2">{selected.name}</h4>
              <p className="font-body text-sm text-muted-foreground">{selected.status}</p>
            </div>
            <div className="space-y-3">
              {[
                { icon: Mail, label: selected.email },
                { icon: Phone, label: selected.phone },
                { icon: MapPin, label: selected.city },
              ].map(i => (
                <div key={i.label} className="flex items-center gap-3">
                  <i.icon size={14} className="text-muted-foreground" />
                  <span className="font-body text-sm text-foreground">{i.label}</span>
                </div>
              ))}
              <Separator />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="font-heading text-lg font-semibold text-foreground">{selected.orders}</p>
                  <p className="font-body text-[10px] text-muted-foreground uppercase">Orders</p>
                </div>
                <div>
                  <p className="font-heading text-lg font-semibold text-foreground">AUD {(selected.spent / 1000).toFixed(1)}K</p>
                  <p className="font-body text-[10px] text-muted-foreground uppercase">Spent</p>
                </div>
                <div>
                  <p className="font-heading text-lg font-semibold text-foreground">{selected.joined}</p>
                  <p className="font-body text-[10px] text-muted-foreground uppercase">Joined</p>
                </div>
              </div>
            </div>
            <Button className="w-full mt-5 font-body text-xs tracking-wider uppercase" onClick={() => setSelected(null)}>Close</Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
