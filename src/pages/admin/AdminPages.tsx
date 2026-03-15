import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Edit2, Eye, Plus, Trash2, Globe, GlobeLock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { pagesService, type PageListItem } from "@/lib/pagesService";

interface PageItem {
  id: number;
  name: string;
  path: string;
  status: "Published" | "Draft";
  updated: string;
}

const initialPages: PageItem[] = [
  { id: 1, name: "Home", path: "/", status: "Published", updated: "Feb 27, 2025" },
  { id: 2, name: "Shop", path: "/shop", status: "Published", updated: "Feb 25, 2025" },
  { id: 3, name: "Collections", path: "/collections", status: "Published", updated: "Feb 20, 2025" },
  { id: 4, name: "New Arrivals", path: "/new-arrivals", status: "Published", updated: "Feb 22, 2025" },
  { id: 5, name: "Sale", path: "/sale", status: "Published", updated: "Feb 18, 2025" },
  { id: 6, name: "Best Sellers", path: "/best-sellers", status: "Published", updated: "Feb 15, 2025" },
  { id: 7, name: "About", path: "/about", status: "Draft", updated: "Feb 10, 2025" },
  { id: 8, name: "Contact", path: "/contact", status: "Draft", updated: "Feb 8, 2025" },
];

const today = () => {
  const d = new Date();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const AdminPages = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<PageListItem[]>([]);
  const [editPage, setEditPage] = useState<PageListItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newPage, setNewPage] = useState({ name: "", path: "", status: "draft" as 'draft' | 'published' });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch pages from service
  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const pagesData = await pagesService.getAllPages();
        setPages(pagesData);
      } catch (error) {
        console.error('Error fetching pages:', error);
        toast({
          title: "Error",
          description: "Failed to load pages",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [toast]);

  const handleAdd = async () => {
    if (!newPage.name.trim() || !newPage.path.trim()) {
      toast({ title: "Name and path are required", variant: "destructive" });
      return;
    }

    try {
      const slug = pagesService.generateSlug(newPage.name);
      const createdPage = await pagesService.createPage({
        name: newPage.name,
        slug,
        path: newPage.path,
        content: '<h1>' + newPage.name + '</h1><p>Add your content here.</p>',
        meta_title: newPage.name + ' - Fashion Spectrum Luxe',
        meta_description: 'Description for ' + newPage.name,
        status: newPage.status,
        is_system: false,
      });

      if (createdPage) {
        const updatedPages = await pagesService.getAllPages();
        setPages(updatedPages);
        setNewPage({ name: "", path: "", status: "draft" });
        setIsAddOpen(false);
        toast({ title: `"${newPage.name}" page created` });
      }
    } catch (error) {
      console.error('Error creating page:', error);
      toast({
        title: "Error",
        description: "Failed to create page",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!editPage) return;

    try {
      const updatedPage = await pagesService.updatePage(editPage.id, {
        name: editPage.name,
        path: editPage.path,
        status: editPage.status,
      });

      if (updatedPage) {
        const updatedPages = await pagesService.getAllPages();
        setPages(updatedPages);
        toast({ title: `"${editPage.name}" updated` });
        setEditPage(null);
      }
    } catch (error) {
      console.error('Error updating page:', error);
      toast({
        title: "Error",
        description: "Failed to update page",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;

    try {
      const success = await pagesService.deletePage(deleteId);
      if (success) {
        const updatedPages = await pagesService.getAllPages();
        setPages(updatedPages);
        setDeleteId(null);
        toast({ title: `"${pages.find(p => p.id === deleteId)?.name}" deleted` });
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete page",
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const updatedPage = await pagesService.togglePageStatus(id);
      if (updatedPage) {
        const updatedPages = await pagesService.getAllPages();
        setPages(updatedPages);
      }
    } catch (error) {
      console.error('Error toggling page status:', error);
      toast({
        title: "Error",
        description: "Failed to update page status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Pages</h1>
          <p className="font-body text-sm text-muted-foreground">Manage storefront pages</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus size={16} /> Add Page
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Page</th>
              <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Path</th>
              <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Updated</th>
              <th className="text-right px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading pages...
                </td>
              </tr>
            ) : pages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No pages yet
                </td>
              </tr>
            ) : (
              pages.map(p => (
                <tr key={p.id} className="border-b border-border hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText size={14} className="text-primary" />
                      </div>
                      <span className="font-body text-sm font-medium text-foreground">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-muted-foreground hidden sm:table-cell">{p.path}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(p.id)}
                      className={`text-xs px-2.5 py-1 rounded-full font-body font-medium cursor-pointer transition-colors ${
                        p.status === "published" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      }`}
                    >
                      {p.status === "published" ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-muted-foreground hidden md:table-cell">{p.updated_at}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a href={p.path} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <Eye size={14} />
                      </a>
                      <button onClick={() => navigate(`/admin/pages/edit/${p.path === "/" ? "home" : p.path.replace(/^\//, "")}`)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Page Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Page</DialogTitle>
            <DialogDescription>Create a new storefront page</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Page Name</Label>
              <Input value={newPage.name} onChange={e => setNewPage({ ...newPage, name: e.target.value })} placeholder="e.g. FAQ" />
            </div>
            <div className="space-y-2">
              <Label>Path</Label>
              <Input value={newPage.path} onChange={e => setNewPage({ ...newPage, path: e.target.value })} placeholder="e.g. /faq" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newPage.status} onValueChange={v => setNewPage({ ...newPage, status: v as 'draft' | 'published' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Create Page</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Page Dialog */}
      <Dialog open={!!editPage} onOpenChange={o => !o && setEditPage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>Update page details</DialogDescription>
          </DialogHeader>
          {editPage && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Page Name</Label>
                <Input value={editPage.name} onChange={e => setEditPage({ ...editPage, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Path</Label>
                <Input value={editPage.path} onChange={e => setEditPage({ ...editPage, path: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editPage.status} onValueChange={v => setEditPage({ ...editPage, status: v as 'draft' | 'published' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPage(null)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{pages.find(p => p.id === deleteId)?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPages;
