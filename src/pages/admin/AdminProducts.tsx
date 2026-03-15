import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Filter, Edit2, Trash2, Eye, MoreVertical,
  X, Upload, Package, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { productService } from "@/lib/productService";
import { uploadService } from "@/lib/uploadService";
import { categoryService } from "@/lib/categoryService";
import { useCollections } from "@/hooks/useCollections";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/productService";

interface AdminProduct extends Product {
  stock: number;
  status: "Active" | "Draft" | "Archived";
  sku: string;
}

const initialProducts: AdminProduct[] = [];

const AdminProducts = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { collections, loading: collectionsLoading } = useCollections();
  const [form, setForm] = useState<{ 
    name: string; 
    price: string; 
    original_price: string; 
    category: string; 
    stock: string; 
    sku: string; 
    status: "Active" | "Draft" | "Archived";
    selectedCollections: string[];
  }>({ 
    name: "", 
    price: "", 
    original_price: "", 
    category: "", 
    stock: "", 
    sku: "", 
    status: "Active",
    selectedCollections: []
  });

  // Load products and categories from database
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await categoryService.getCategories();
      const catNames = cats.filter(c => c.active).map(c => c.name);
      setCategories(["All", ...catNames]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      // Convert to AdminProduct format
      const adminProducts: AdminProduct[] = data.map(p => ({
        ...p,
        stock: p.stock ?? (p.in_stock ? 100 : 0),
        status: "Active" as const,
        sku: p.sku || `FS-${p.id.slice(-4).toUpperCase()}`,
        original_price: p.original_price
      }));
      setProducts(adminProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({ title: "Error loading products", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditProduct(null);
    setForm({ 
      name: "", 
      price: "", 
      original_price: "", 
      category: "", 
      stock: "", 
      sku: "", 
      status: "Active",
      selectedCollections: []
    });
    setUploadedImages([]);
    setShowModal(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditProduct(p);
    // Fetch product collections
    fetchProductCollections(p.id).then(productCollections => {
      setForm({
        name: p.name,
        price: String(p.price),
        original_price: p.original_price ? String(p.original_price) : "",
        category: p.category,
        stock: String(p.stock),
        sku: p.sku,
        status: p.status,
        selectedCollections: productCollections
      });
    });
    setUploadedImages(p.images || []);
    setShowModal(true);
  };

  // Fetch collections for a specific product
  const fetchProductCollections = async (productId: string): Promise<string[]> => {
    try {
      const { data, error } = await (supabase as any)
        .from('collection_products')
        .select('collection_id')
        .eq('product_id', productId);
      
      if (error) throw error;
      return data?.map((item: any) => item.collection_id) || [];
    } catch (error) {
      console.error('Error fetching product collections:', error);
      return [];
    }
  };

  const handleSave = async () => {
    console.log('🔘 handleSave called');
    console.log('Form data:', form);
    console.log('Uploaded images:', uploadedImages);
    
    if (!form.name || !form.price || !form.stock) {
      console.log('❌ Validation failed - missing required fields');
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    
    let productId: string;
    
    if (editProduct) {
      console.log('📝 Updating existing product:', editProduct.id);
      // Update existing product
      try {
        const updateData = {
          name: form.name,
          price: Number(form.price),
          original_price: form.original_price ? Number(form.original_price) : null,
          category: form.category,
          images: uploadedImages.length > 0 ? uploadedImages : ["/placeholder.svg"],
          featured: false,
          in_stock: Number(form.stock) > 0,
          stock: Number(form.stock),
          sku: form.sku || `FS-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        };
        console.log('Update data:', updateData);
        
        await productService.updateProduct(editProduct.id, updateData);
        productId = editProduct.id;
        toast({ title: "Product updated!" });
        loadProducts(); // Reload products
      } catch (error) {
        console.error('❌ Error updating product:', error);
        toast({ title: "Error updating product", variant: "destructive" });
        return;
      }
    } else {
      console.log('➕ Creating new product');
      // Create new product
      try {
        const createData = {
          name: form.name,
          price: Number(form.price),
          original_price: form.original_price ? Number(form.original_price) : null,
          category: form.category,
          images: uploadedImages.length > 0 ? uploadedImages : ["/placeholder.svg"],
          featured: false,
          in_stock: Number(form.stock) > 0,
          stock: Number(form.stock),
          sku: form.sku || `FS-${Date.now().toString(36).toUpperCase().slice(-6)}`,
          colors: [],
          sizes: [],
          description: "",
          collection: null,
          slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        };
        console.log('Create data:', createData);
        
        const newProduct = await productService.createProduct(createData);
        productId = newProduct.id;
        toast({ title: "Product added!" });
        loadProducts(); // Reload products
      } catch (error) {
        console.error('❌ Error creating product:', error);
        toast({ title: "Error adding product", variant: "destructive" });
        return;
      }
    }
    
    // Save collections for the product
    if (productId && form.selectedCollections.length > 0) {
      try {
        // First, remove existing collections for this product
        await (supabase as any)
          .from('collection_products')
          .delete()
          .eq('product_id', productId);
        
        // Then add new collections
        const collectionProducts = form.selectedCollections.map(collectionId => ({
          collection_id: collectionId,
          product_id: productId
        }));
        
        const { error } = await (supabase as any)
          .from('collection_products')
          .insert(collectionProducts);
        
        if (error) throw error;
        
        console.log('✅ Collections saved successfully');
      } catch (error) {
        console.error('❌ Error saving collections:', error);
        toast({ 
          title: "Product saved but collections failed", 
          description: "Please try updating collections separately",
          variant: "destructive" 
        });
      }
    }
    
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      toast({ title: "Product deleted" });
      loadProducts(); // Reload products
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: "Error deleting product", variant: "destructive" });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    console.log('Files selected:', files.map(f => f.name));
    console.log('File details:', files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    })));

    setUploading(true);
    try {
      const uploadedFiles = await uploadService.uploadMultipleImages(files);
      console.log('Upload successful:', uploadedFiles);
      setUploadedImages([...uploadedImages, ...uploadedFiles.map(f => f.url)]);
      toast({ title: `${files.length} image(s) uploaded successfully!` });
    } catch (error) {
      console.error('❌ Upload failed:', error);
      console.error('Full error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      
      toast({ 
        title: "Upload failed", 
        description: error instanceof Error ? error.message : "Please check console for details",
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      Active: "bg-green-100 text-green-700",
      Draft: "bg-amber-100 text-amber-700",
      Archived: "bg-muted text-muted-foreground",
    };
    return colors[s] || "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Products</h1>
          <p className="font-body text-sm text-muted-foreground">{products.length} products in catalog</p>
        </div>
        <Button className="font-body text-xs tracking-wider uppercase" onClick={openAdd}>
          <Plus size={14} className="mr-1" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-card border-border font-body" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-2 rounded-lg font-body text-xs whitespace-nowrap transition-all ${
                category === c ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">SKU</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Stock</th>
                <th className="text-right px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0] || "/placeholder.svg"} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-secondary" />
                      <div>
                        <p className="font-body text-sm font-medium text-foreground truncate max-w-[200px]">{p.name}</p>
                        <p className="font-body text-xs text-muted-foreground">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-muted-foreground hidden sm:table-cell">{p.sku}</td>
                  <td className="px-4 py-3">
                    <p className="font-body text-sm font-medium text-foreground">$ {p.price}</p>
                    {p.original_price && <p className="font-body text-xs text-muted-foreground line-through">$ {p.original_price}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`font-body text-sm ${Number(p.stock || 0) < 10 ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                      {String(p.stock || 0).replace(/[^\d]/g, '') || '0'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a href={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground" title="View Product">
                        <Eye size={14} />
                      </a>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      {loading ? (
        <div className="text-center py-12">
          <Package size={40} className="mx-auto text-muted-foreground/30 mb-3 animate-pulse" />
          <p className="font-body text-sm text-muted-foreground">Loading products...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-body text-sm text-muted-foreground">No products found</p>
        </div>
      ) : null}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-50 bg-background border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-xl font-semibold text-foreground">{editProduct ? "Edit Product" : "Add Product"}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-body text-xs uppercase text-muted-foreground">Product Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-10 bg-card border-border font-body" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Price ($)</Label>
                  <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="h-10 bg-card border-border font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Compare Price</Label>
                  <Input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} className="h-10 bg-card border-border font-body" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Category</Label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full h-10 rounded-md border border-border bg-card px-3 font-body text-sm text-foreground">
                    <option value="">Select Category</option>
                    {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Stock *</Label>
                  <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="h-10 bg-card border-border font-body" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">SKU</Label>
                  <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="h-10 bg-card border-border font-body" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Status</Label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as "Active" | "Draft" | "Archived" }))} className="w-full h-10 rounded-md border border-border bg-card px-3 font-body text-sm text-foreground">
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              
              {/* Collections Selection */}
              <div className="space-y-1.5">
                <Label className="font-body text-xs uppercase text-muted-foreground">Collections</Label>
                {collectionsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading collections...</div>
                ) : collections.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No collections available</div>
                ) : (
                  <Select
                    value={form.selectedCollections.length > 0 ? form.selectedCollections[0] : ""}
                    onValueChange={(value) => {
                      setForm(f => ({ ...f, selectedCollections: value ? [value] : [] }));
                    }}
                  >
                    <SelectTrigger className="h-10 bg-card border-border font-body">
                      <SelectValue placeholder="Select a collection (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          <div className="flex items-center gap-2">
                            {collection.name}
                            {collection.featured && (
                              <span className="w-2 h-2 bg-primary rounded-full"></span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {form.selectedCollections.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Selected: {collections.find(c => c.id === form.selectedCollections[0])?.name || 'Collection'}
                  </div>
                )}
              </div>
              
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="font-body text-sm text-muted-foreground">Drag & drop images or click to upload</p>
                  <p className="font-body text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  {uploading && <p className="font-body text-xs text-primary mt-2">Uploading...</p>}
                </label>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-body text-xs uppercase text-muted-foreground">Uploaded Images</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={img} alt={`Upload ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1 font-body text-xs tracking-wider uppercase" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 font-body text-xs tracking-wider uppercase" onClick={handleSave}>{editProduct ? "Update" : "Add"} Product</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
