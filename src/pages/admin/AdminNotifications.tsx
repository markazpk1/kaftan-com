import { useState, useEffect, useMemo } from "react";
import {
  Bell, Search, Filter, ShoppingCart, Users, Package, AlertTriangle,
  Trash2, Check, CheckCheck, ChevronDown, X, BellOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { playNotificationSound } from "@/lib/notificationSound";
import { useToast } from "@/hooks/use-toast";
import { notificationService, type Notification } from "@/lib/notificationService";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type NotificationType = "order" | "customer" | "inventory" | "alert";
type NotificationStatus = "all" | "unread" | "read";

const typeConfig: Record<NotificationType, { icon: typeof Bell; label: string; color: string; badgeColor: string }> = {
  order: { icon: ShoppingCart, label: "Orders", color: "text-primary bg-primary/10", badgeColor: "bg-primary/10 text-primary border-primary/20" },
  customer: { icon: Users, label: "Customers", color: "text-emerald-600 bg-emerald-500/10", badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  inventory: { icon: Package, label: "Inventory", color: "text-amber-600 bg-amber-500/10", badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  alert: { icon: AlertTriangle, label: "Alerts", color: "text-destructive bg-destructive/10", badgeColor: "bg-destructive/10 text-destructive border-destructive/20" },
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<Notification["type"] | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAdminAuth();

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchNotifications();
      subscribeToNotifications();
    } else if (!authLoading && !isAdmin) {
      setLoading(false);
    }
  }, [authLoading, isAdmin]);

  // Filtered notifications
  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (statusFilter === "unread" && n.read) return false;
      if (statusFilter === "read" && !n.read) return false;
      if (search) {
        const q = search.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      }
      return true;
    });
  }, [notifications, typeFilter, statusFilter, search]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const allSelected = filtered.length > 0 && filtered.every((n) => selectedIds.has(n.id));

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    filtered.forEach((n) => {
      const label = formatDate(n.created_at);
      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    });
    return groups;
  }, [filtered]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const subscription = notificationService.subscribeToNotifications((payload) => {
      if (payload.eventType === 'INSERT') {
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        // Play sound for new notifications
        playNotificationSound(newNotification.type === 'alert' ? 'critical' : 'info');
      } else if (payload.eventType === 'UPDATE') {
        const updatedNotification = payload.new as Notification;
        setNotifications(prev => 
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        );
      } else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id;
        setNotifications(prev => prev.filter(n => n.id !== deletedId));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell size={24} />
            Notifications
          </h1>
          <p className="text-sm font-body text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell size={24} />
            Notifications
          </h1>
          <p className="text-sm font-body text-muted-foreground mt-1">Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((n) => n.id)));
    }
  };

  const markSelectedRead = async () => {
    try {
      await notificationService.markMultipleAsRead(Array.from(selectedIds));
      setNotifications((prev) =>
        prev.map((n) => (selectedIds.has(n.id) ? { ...n, read: true } : n))
      );
      toast({ title: `${selectedIds.size} notification(s) marked as read` });
      setSelectedIds(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive"
      });
    }
  };

  const markSelectedUnread = async () => {
    try {
      for (const id of selectedIds) {
        await notificationService.toggleReadStatus(id, false);
      }
      setNotifications((prev) =>
        prev.map((n) => (selectedIds.has(n.id) ? { ...n, read: false } : n))
      );
      toast({ title: `${selectedIds.size} notification(s) marked as unread` });
      setSelectedIds(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notifications as unread",
        variant: "destructive"
      });
    }
  };

  const deleteSelected = async () => {
    try {
      await notificationService.deleteMultipleNotifications(Array.from(selectedIds));
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      toast({ title: `${selectedIds.size} notification(s) deleted` });
      setSelectedIds(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive"
      });
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast({ title: "All notifications marked as read" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
    }
  };

  const clearAll = async () => {
    try {
      await notificationService.deleteAllNotifications();
      setNotifications([]);
      setSelectedIds(new Set());
      toast({ title: "All notifications cleared" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive"
      });
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  };

  const removeNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell size={24} />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary font-body">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-sm font-body text-muted-foreground mt-1">
            Manage and review all system notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="font-body"
          >
            <CheckCheck size={14} className="mr-1.5" />
            Mark all read
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={notifications.length === 0}
                className="font-body text-destructive hover:text-destructive"
              >
                <Trash2 size={14} className="mr-1.5" />
                Clear all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading">Clear all notifications?</AlertDialogTitle>
                <AlertDialogDescription className="font-body">
                  This will permanently remove all {notifications.length} notifications. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearAll} className="font-body bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Clear all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(typeConfig) as [NotificationType, typeof typeConfig[NotificationType]][]).map(([type, config]) => {
          const count = notifications.filter((n) => n.type === type).length;
          const unread = notifications.filter((n) => n.type === type && !n.read).length;
          const Icon = config.icon;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
              className={cn(
                "p-4 rounded-xl border transition-all text-left",
                typeFilter === type
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:bg-secondary/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.color)}>
                  <Icon size={16} />
                </div>
                {unread > 0 && (
                  <Badge variant="outline" className={cn("text-[10px] font-body", config.badgeColor)}>
                    {unread} new
                  </Badge>
                )}
              </div>
              <p className="text-sm font-body font-medium text-foreground">{config.label}</p>
              <p className="text-xs font-body text-muted-foreground">{count} total</p>
            </button>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-body bg-secondary/50 border-0"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as NotificationType | "all")}>
          <SelectTrigger className="w-full sm:w-40 font-body bg-secondary/50 border-0">
            <Filter size={14} className="mr-2 text-muted-foreground" />
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-body">All types</SelectItem>
            <SelectItem value="order" className="font-body">Orders</SelectItem>
            <SelectItem value="customer" className="font-body">Customers</SelectItem>
            <SelectItem value="inventory" className="font-body">Inventory</SelectItem>
            <SelectItem value="alert" className="font-body">Alerts</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as NotificationStatus)}>
          <SelectTrigger className="w-full sm:w-40 font-body bg-secondary/50 border-0">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-body">All status</SelectItem>
            <SelectItem value="unread" className="font-body">Unread</SelectItem>
            <SelectItem value="read" className="font-body">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm font-body text-foreground font-medium">
            {selectedIds.size} selected
          </span>
          <Separator orientation="vertical" className="h-5" />
          <Button variant="ghost" size="sm" onClick={markSelectedRead} className="font-body text-xs">
            <Check size={12} className="mr-1" /> Mark read
          </Button>
          <Button variant="ghost" size="sm" onClick={markSelectedUnread} className="font-body text-xs">
            <BellOff size={12} className="mr-1" /> Mark unread
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="font-body text-xs text-destructive hover:text-destructive">
                <Trash2 size={12} className="mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading">Delete selected notifications?</AlertDialogTitle>
                <AlertDialogDescription className="font-body">
                  This will permanently remove {selectedIds.size} notification(s).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteSelected} className="font-body bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Notification List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Select all header */}
        {filtered.length > 0 && (
          <>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-secondary/30 border-b border-border">
              <button
                onClick={toggleSelectAll}
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  allSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30 hover:border-primary"
                )}
              >
                {allSelected && <Check size={10} />}
              </button>
              <span className="text-xs font-body text-muted-foreground">
                {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
                {search && ` matching "${search}"`}
              </span>
            </div>
          </>
        )}

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={40} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="font-heading text-lg text-muted-foreground mb-1">No notifications found</p>
            <p className="text-sm font-body text-muted-foreground/70">
              {search || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "You're all caught up!"}
            </p>
            {(search || typeFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 font-body"
                onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="px-4 py-2 bg-secondary/20 border-b border-border">
                <span className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wider">
                  {date}
                </span>
              </div>
              {items.map((notification) => {
                const config = typeConfig[notification.type];
                const Icon = config.icon;
                const isSelected = selectedIds.has(notification.id);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3.5 border-b border-border last:border-0 transition-colors group",
                      !notification.read && "bg-primary/[0.02]",
                      isSelected && "bg-primary/[0.06]"
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(notification.id)}
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-colors mt-1 flex-shrink-0",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30 hover:border-primary"
                      )}
                    >
                      {isSelected && <Check size={10} />}
                    </button>

                    {/* Icon */}
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", config.color)}>
                      <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={cn(
                          "text-sm font-body",
                          !notification.read ? "font-semibold text-foreground" : "text-foreground"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                        <Badge variant="outline" className={cn("text-[10px] font-body ml-auto hidden sm:inline-flex", config.badgeColor)}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-body text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-xs font-body text-muted-foreground/60 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1.5 rounded-md hover:bg-destructive/10 flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
