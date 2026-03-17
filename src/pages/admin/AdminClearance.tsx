import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Filter, Edit2, Trash2, Eye, MoreVertical,
  X, Upload, Package, ChevronDown, Tag, Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/productUtils";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ClearanceProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image: string;
  category: string;
  color?: string;
  status: "Active" | "Draft" | "Archived";
  discount_percentage?: number;
  sku: string;
  stock: number;
}

const AdminClearance = () => {
  const [products, setProducts] = useState<ClearanceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<ClearanceProduct | null>(null);
  const [form, setForm] = useState<{ 
    name: string; 
    price: string; 
    original_price: string; 
    category: string; 
    stock: string; 
    sku: string; 
    status: "Active" | "Draft" | "Archived";
  }>({ 
    name: "", 
    price: "", 
    original_price: "", 
    category: "", 
    stock: "", 
    sku: "",
    status: "Active"
  });

  useEffect(() => {
    fetchClearanceProducts();
  }, []);

  const fetchClearanceProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or('discount_percentage.gt.0,status.eq.Archived')
        .order('created_at.desc');

      if (error) {
        console.error('Error fetching clearance products:', error);
        toast({
          title: "Error",
          description: "Failed to load clearance products",
          variant: "destructive"
        });
      } else {
        const clearanceProducts = data?.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          original_price: product.original_price,
          image: product.images?.[0] || '',
          category: product.category,
          color: product.colors?.[0] || '',
          status: (product.in_stock ? "Active" : "Archived") as "Active" | "Draft" | "Archived",
          discount_percentage: product.original_price && product.price > 0 
            ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
            : 0,
          sku: product.sku || '',
          stock: product.stock || 0
        })) || [];
        setProducts(clearanceProducts);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load clearance products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        name: form.name,
        price: parseFloat(form.price) || 0,
        original_price: parseFloat(form.original_price) || null,
        category: form.category,
        stock: parseInt(form.stock) || 0,
        sku: form.sku,
        status: form.status,
        discount_percentage: form.original_price && parseFloat(form.price) > 0
          ? Math.round(((parseFloat(form.original_price) - parseFloat(form.price)) / parseFloat(form.original_price)) * 100)
          : 0,
        slug: slugify(form.name)
      };

      if (editProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editProduct.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Clearance product updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Clearance product added successfully",
        });
      }

      resetForm();
      fetchClearanceProducts();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to save clearance product",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this clearance product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Clearance product deleted successfully",
      });
      
      fetchClearanceProducts();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to delete clearance product",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setForm({
      name: "", 
      price: "", 
      original_price: "", 
      category: "", 
      stock: "", 
      sku: "",
      status: "Active"
    });
    setEditProduct(null);
    setShowModal(false);
  };

  const openEditModal = (product: ClearanceProduct) => {
    setForm({
      name: product.name,
      price: product.price.toString(),
      original_price: product.original_price?.toString() || "",
      category: product.category,
      stock: product.stock.toString(),
      sku: product.sku,
      status: product.status
    });
    setEditProduct(product);
    setShowModal(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || product.status === status;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-mobile-nav">
        <AnnouncementBar />
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="font-body text-sm text-muted-foreground tracking-widest uppercase animate-pulse">Loading clearance products...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-background pb-mobile-nav">
      <AnnouncementBar />
      <Navbar />

      {/* Header */}
      <div className="py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl text-foreground">
                Clearance Products
              </h1>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Manage products with discounts for clearance sale
              </p>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="gap-2"
            >
              <Plus size={16} />
              Add Clearance Product
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 sm:px-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search clearance products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={status} onValueChange={(value: string) => setStatus(value as "Active" | "Draft" | "Archived")}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Table */}
      <div className="container mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-card rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-body text-xs tracking-[0.1em] uppercase text-muted-foreground">Product</th>
                  <th className="text-left p-4 font-body text-xs tracking-[0.1em] uppercase text-muted-foreground">SKU</th>
                  <th className="text-left p-4 font-body text-xs tracking-[0.1em] uppercase text-muted-foreground">Category</th>
                  <th className="text-left p-4 font-body text-xs tracking-[0.1em] uppercase text-muted-foreground">Price</th>
                  <th className="text-left p-4 font-body text-xs tracking-[0.1em] uppercase text-muted-foreground">Original Price</th>
                  <th className="text-left p-4 font-body text-xs tracking-[0.1em] uppercase text-muted-foreground">Discount</th>
                  <th className="text-left p-4 font-body text-xs tracking-[0.1em] uppercase text-muted-foreground">Stock</th>
                  <th className="text-left p-4 font-body text-xs tracking-[0.1em] uppercase text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-body text-xs tracking-[0.1em] uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-background rounded overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-body text-sm font-medium text-foreground">{product.name}</p>
                          {product.discount_percentage && product.discount_percentage > 0 && (
                            <Badge className="bg-red-100 text-red-800 text-xs mt-1">
                              -{product.discount_percentage}% OFF
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-body text-sm text-muted-foreground">{product.sku}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    </td>
                    <td className="p-4 font-body text-sm font-medium text-foreground">${product.price.toFixed(2)}</td>
                    <td className="p-4 font-body text-sm text-muted-foreground">
                      {product.original_price ? `$${product.original_price.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4">
                      {product.discount_percentage && product.discount_percentage > 0 ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {product.discount_percentage}%
                        </Badge>
                      ) : (
                        <span className="font-body text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-body text-sm">
                        {product.stock > 10 ? 'text-green-600' : 
                        product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}
                      </span>
                      {product.stock} units
                    </td>
                    <td className="p-4">
                      <Badge className={
                        product.status === 'Active' ? 'bg-green-100 text-green-800' :
                        product.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {product.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(product)}
                          className="gap-1"
                        >
                          <Edit2 size={14} />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(product.id)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Tag className="mx-auto text-muted-foreground mb-4 h-12 w-12" />
            <p className="font-body text-muted-foreground">
              {search || status !== "All" 
                ? "No clearance products found matching your filters."
                : "No clearance products available."}
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>

    {/* Add/Edit Modal */}
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => resetForm()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl text-foreground">
                {editProduct ? 'Edit Clearance Product' : 'Add Clearance Product'}
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={resetForm}
              >
                <X size={18} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Sale Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                    placeholder="Leave empty if no original price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={form.status} onValueChange={(value: string) => setForm({ ...form, status: value as "Active" | "Draft" | "Archived" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default AdminClearance;
