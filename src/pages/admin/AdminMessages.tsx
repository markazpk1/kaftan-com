import { useState, useEffect } from "react";
import { Search, Mail, MailOpen, Trash2, Clock, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { messageService, Message } from "@/lib/messageService";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAdminAuth();

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchMessages();
    } else if (!authLoading && !isAdmin) {
      setLoading(false);
      toast({
        title: "Access Denied",
        description: "You need to be logged in as an admin to view messages",
        variant: "destructive"
      });
    }
  }, [authLoading, isAdmin]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getMessages();
      setMessages(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await messageService.markAsRead(messageId);
      setMessages(messages.map(m => m.id === messageId ? { ...m, read: true } : m));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark message as read",
        variant: "destructive"
      });
    }
  };

  const handleToggleStarred = async (messageId: string, starred: boolean) => {
    try {
      await messageService.toggleStarred(messageId, starred);
      setMessages(messages.map(m => m.id === messageId ? { ...m, starred } : m));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update starred status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages(messages.filter(m => m.id !== messageId));
      setSelected(null);
      toast({
        title: "Success",
        description: "Message deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
  };

  const filtered = messages.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const unread = messages.filter(m => !m.read).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Messages</h1>
          <p className="font-body text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Messages</h1>
          <p className="font-body text-sm text-muted-foreground">Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-foreground">Messages</h1>
        <p className="font-body text-sm text-muted-foreground">{unread} unread messages</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search messages..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 bg-card border-border font-body" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message List */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelected(m); handleMarkAsRead(m.id); }}
                className={`w-full text-left p-4 hover:bg-secondary/30 transition-colors ${selected?.id === m.id ? "bg-secondary/50" : ""} ${!m.read ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {!m.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                    <span className={`font-body text-sm ${!m.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>{m.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {m.starred && <Star size={12} className="text-accent fill-accent" />}
                    <span className="font-body text-[10px] text-muted-foreground">{formatDate(m.created_at)}</span>
                  </div>
                </div>
                <p className="font-body text-xs font-medium text-foreground truncate">{m.subject}</p>
                <p className="font-body text-xs text-muted-foreground truncate mt-0.5">{m.message.substring(0, 100)}...</p>
              </button>
            ))}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          {selected ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading text-xl font-semibold text-foreground">{selected.subject}</h3>
                  <p className="font-body text-sm text-muted-foreground">{selected.name} · {selected.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleStarred(selected.id, !selected.starred)}>
                    <Star size={16} className={selected.starred ? "text-accent fill-accent" : "text-muted-foreground"} />
                  </button>
                  <button onClick={() => handleDeleteMessage(selected.id)}>
                    <Trash2 size={16} className="text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
              <Separator className="mb-4" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-body mb-4">
                <Clock size={12} /> {formatDate(selected.created_at)}
              </div>
              <div className="font-body text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selected.message}</div>
              <Separator className="my-4" />
              <div className="flex gap-2">
                <Button className="font-body text-xs tracking-wider uppercase" onClick={() => window.location.href = `mailto:${selected.email}?subject=Re: ${selected.subject}`}>Reply</Button>
                <Button variant="outline" className="font-body text-xs tracking-wider uppercase" onClick={() => window.location.href = `mailto:?subject=Fwd: ${selected.subject}&body=${encodeURIComponent(selected.message)}`}>Forward</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <Mail size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="font-body text-sm text-muted-foreground">Select a message to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
