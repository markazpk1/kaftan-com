import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Package, ShoppingCart, Users, AlertTriangle, Trash2, Volume2, VolumeX, BellRing } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  playNotificationSound,
  requestNotificationPermission,
  showBrowserNotification,
} from "@/lib/notificationSound";
import { useToast } from "@/hooks/use-toast";
import { notificationService, type Notification } from "@/lib/notificationService";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const typeIcons = {
  order: ShoppingCart,
  customer: Users,
  inventory: Package,
  alert: AlertTriangle,
};

const typeColors = {
  order: "text-primary bg-primary/10",
  customer: "text-emerald-600 bg-emerald-500/10",
  inventory: "text-amber-600 bg-amber-500/10",
  alert: "text-destructive bg-destructive/10",
};

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("admin_notification_sound");
    return saved !== "false";
  });
  const [pushEnabled, setPushEnabled] = useState(false);
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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data.slice(0, 10)); // Show only latest 10 in dropdown
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const subscription = notificationService.subscribeToNotifications((payload) => {
      if (payload.eventType === 'INSERT') {
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only latest 10
        // Play sound for new notifications
        if (soundEnabled) {
          playNotificationSound(newNotification.type === 'alert' ? 'critical' : 'info');
        }
        // Show browser notification
        if (pushEnabled) {
          showBrowserNotification(
            `⚠️ ${newNotification.title}`,
            newNotification.message
          );
        }
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
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Check browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setPushEnabled(true);
    }
  }, []);

  // Persist sound preference
  useEffect(() => {
    localStorage.setItem("admin_notification_sound", String(soundEnabled));
  }, [soundEnabled]);

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const toggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      playNotificationSound("info");
      toast({ title: "Notification sounds enabled" });
    } else {
      toast({ title: "Notification sounds muted" });
    }
  }, [soundEnabled, toast]);

  const togglePush = useCallback(async () => {
    if (pushEnabled) {
      setPushEnabled(false);
      toast({ title: "Browser notifications disabled" });
      return;
    }
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      setPushEnabled(true);
      toast({ title: "Browser notifications enabled" });
      showBrowserNotification("Notifications Active", "You'll receive alerts for critical events.");
    } else {
      toast({
        title: "Permission denied",
        description: "Please allow notifications in your browser settings.",
        variant: "destructive",
      });
    }
  }, [pushEnabled, toast]);

  const testCriticalAlert = useCallback(async () => {
    try {
      const testNotif = await notificationService.createNotification({
        title: "Payment Failed",
        message: "Test alert — Order #9999 payment was declined",
        type: "alert"
      });
      // The real-time subscription will handle adding it to the list
      if (soundEnabled) {
        playNotificationSound("critical");
      }
      if (pushEnabled) {
        showBrowserNotification("⚠️ Payment Failed", testNotif.message);
      }
    } catch (error) {
      console.error('Failed to create test notification:', error);
    }
  }, [soundEnabled, pushEnabled]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={18} className={cn(unreadCount > 0 && "animate-pulse")} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-body">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Notifications
          </h3>
          <div className="flex items-center gap-1">
            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                soundEnabled
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground hover:bg-secondary"
              )}
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            {/* Push toggle */}
            <button
              onClick={togglePush}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                pushEnabled
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground hover:bg-secondary"
              )}
              title={pushEnabled ? "Disable browser notifications" : "Enable browser notifications"}
            >
              <BellRing size={14} />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-between px-4 pb-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-body text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={testCriticalAlert}
            className="text-xs font-body text-muted-foreground hover:text-foreground ml-auto"
          >
            Test alert
          </button>
        </div>

        <DropdownMenuSeparator className="m-0" />

        {/* Notification list */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell size={24} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-body text-muted-foreground">
                No notifications
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = typeIcons[notification.type];
              return (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-secondary/50 group",
                    !notification.read && "bg-primary/[0.03]"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                      typeColors[notification.type]
                    )}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-body truncate",
                          !notification.read
                            ? "font-semibold text-foreground"
                            : "text-foreground"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs font-body text-muted-foreground truncate mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-[10px] font-body text-muted-foreground/70 mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full font-body text-xs text-muted-foreground" onClick={() => navigate("/admin/notifications")}>
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
