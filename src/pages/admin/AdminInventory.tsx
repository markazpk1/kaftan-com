import { useState, useEffect } from "react";
import { Search, AlertTriangle, Package, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { inventoryService, type InventoryItem, type InventoryStats } from "@/lib/inventoryService";

const AdminInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total_skus: 0,
    low_stock: 0,
    out_of_stock: 0,
    critical_stock: 0,
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Fetch inventory data
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const [inventoryData, statsData] = await Promise.all([
          inventoryService.getInventoryItems(),
          inventoryService.getInventoryStats(),
        ]);
        setItems(inventoryData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        toast({
          title: "Error",
          description: "Failed to load inventory data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Handle search and filter
  const getFilteredItems = async () => {
    try {
      let filteredItems: InventoryItem[];
      
      if (search.trim()) {
        filteredItems = await inventoryService.searchInventoryItems(search);
      } else if (filter !== "All") {
        filteredItems = await inventoryService.getFilteredInventoryItems(filter as 'Low Stock' | 'Out of Stock' | 'Critical');
      } else {
        filteredItems = await inventoryService.getInventoryItems();
      }
      
      setItems(filteredItems);
    } catch (error) {
      console.error('Error filtering items:', error);
    }
  };

  // Update filtered items when search or filter changes
  useEffect(() => {
    if (!loading) {
      getFilteredItems();
    }
  }, [search, filter, loading]);

  const restockItem = async (id: string) => {
    try {
      const success = await inventoryService.restockItem(id);
      if (success) {
        toast({ title: "Stock updated +50 units" });
        // Refresh data
        const [inventoryData, statsData] = await Promise.all([
          inventoryService.getInventoryItems(),
          inventoryService.getInventoryStats(),
        ]);
        setItems(inventoryData);
        setStats(statsData);
      } else {
        toast({
          title: "Error",
          description: "Failed to update stock",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error restocking item:', error);
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-foreground">Inventory</h1>
        <p className="font-body text-sm text-muted-foreground">Stock management</p>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <Package size={18} className="mx-auto text-primary mb-2" />
          <p className="font-heading text-xl font-semibold text-foreground">{stats.total_skus}</p>
          <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Total SKUs</p>
        </div>
        <div className="bg-card border border-amber-200 rounded-lg p-4 text-center">
          <AlertTriangle size={18} className="mx-auto text-amber-500 mb-2" />
          <p className="font-heading text-xl font-semibold text-amber-600">{stats.low_stock}</p>
          <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Low Stock</p>
        </div>
        <div className="bg-card border border-red-200 rounded-lg p-4 text-center">
          <TrendingDown size={18} className="mx-auto text-red-500 mb-2" />
          <p className="font-heading text-xl font-semibold text-red-600">{stats.out_of_stock}</p>
          <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Out of Stock</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-card border-border font-body" />
        </div>
        <div className="flex gap-2">
          {["All", "Low Stock", "Out of Stock"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg font-body text-xs whitespace-nowrap transition-all ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">SKU</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Stock</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading inventory data...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                items.map(i => (
                  <tr key={i.id} className="border-b border-border hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={i.image} alt={i.name} className="w-9 h-9 rounded-lg object-cover bg-secondary" />
                        <p className="font-body text-sm font-medium text-foreground truncate max-w-[180px]">{i.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-muted-foreground hidden sm:table-cell">{i.sku}</td>
                    <td className="px-4 py-3">
                      <span className={`font-body text-sm font-medium ${i.stock === 0 ? "text-red-500" : i.stock <= i.min_stock_level ? "text-amber-600" : "text-foreground"}`}>
                        {i.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full font-body font-medium ${
                        i.stock === 0 ? "bg-red-100 text-red-700" : i.stock <= i.min_stock_level ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                      }`}>
                        {i.stock_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" className="font-body text-xs" onClick={() => restockItem(i.id)}>Restock</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;
