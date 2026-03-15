import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { categoryService } from "@/lib/categoryService";
import type { Category } from "@/lib/categoryService";

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  // Load categories from database
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const [cats, counts] = await Promise.all([
        categoryService.getCategories(),
        categoryService.getCategoryProductCounts()
      ]);
      setCategories(cats);
      setProductCounts(counts);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({ title: "Error loading categories", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditCat(null); setForm({ name: "", slug: "" }); setShowModal(true); };
  const openEdit = (c: Category) => { setEditCat(c); setForm({ name: c.name, slug: c.slug }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, '');
    
    try {
      if (editCat) {
        await categoryService.updateCategory(editCat.id, { name: form.name, slug });
        toast({ title: "Category updated!" });
      } else {
        await categoryService.createCategory({ name: form.name, slug, active: true, sort_order: categories.length });
        toast({ title: "Category added!" });
      }
      setShowModal(false);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({ title: "Error saving category", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      toast({ title: "Category deleted" });
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ title: "Error deleting category", variant: "destructive" });
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await categoryService.updateCategory(cat.id, { active: !cat.active });
      setCategories(categories.map(c => c.id === cat.id ? { ...c, active: !c.active } : c));
    } catch (error) {
      console.error('Error updating category:', error);
      toast({ title: "Error updating category", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Categories</h1>
          <p className="font-body text-sm text-muted-foreground">{categories.length} categories</p>
        </div>
        <Button className="font-body text-xs tracking-wider uppercase" onClick={openAdd}><Plus size={14} className="mr-1" /> Add Category</Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Slug</th>
              <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Products</th>
              <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Active</th>
              <th className="text-right px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center"><p className="font-body text-sm text-muted-foreground">Loading...</p></td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center"><p className="font-body text-sm text-muted-foreground">No categories found</p></td></tr>
            ) : (
              categories.map(c => (
                <tr key={c.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Tag size={14} className="text-primary" /></div>
                      <span className="font-body text-sm font-medium text-foreground">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-muted-foreground hidden sm:table-cell">/{c.slug}</td>
                  <td className="px-4 py-3 font-body text-sm text-foreground">{productCounts[c.name] || 0}</td>
                  <td className="px-4 py-3"><Switch checked={c.active} onCheckedChange={() => handleToggleActive(c)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-50 bg-background border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-xl font-semibold text-foreground">{editCat ? "Edit" : "New"} Category</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-body text-xs uppercase text-muted-foreground">Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} className="h-10 bg-card border-border font-body" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-body text-xs uppercase text-muted-foreground">Slug</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="h-10 bg-card border-border font-body" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1 font-body text-xs tracking-wider uppercase" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 font-body text-xs tracking-wider uppercase" onClick={handleSave}>Save</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
