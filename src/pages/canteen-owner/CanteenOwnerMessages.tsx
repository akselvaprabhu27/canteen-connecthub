import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { 
  Send, 
  Building, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    role: string;
  };
  title: string;
  message: string;
  priority?: string;
  isRead: boolean;
  createdAt: string;
}

const CanteenOwnerMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = user?._id || user?.id;

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages/canteen/inbox", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
      
      // Mark all as read for this canteen
      // In a real app we might want a more specific canteenId if one owner has many, 
      // but usually it's 1-1. Let's get the canteenId from first message or profile.
      if (data.length > 0) {
        const canteenId = data[0].canteenId;
        await fetch(`/api/messages/read/${canteenId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad) {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        setIsInitialLoad(false);
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, loading]);

  const handleReply = async () => {
    if (!replyText.trim()) return;

    setSending(true);
    try {
      // For reply, we need the canteenId and organizationId from the existing context
      const lastMsg = messages[0]; // Messages are sorted by createdAt: -1 in inbox, but we want a valid context
      if (!lastMsg) {
        toast.error("No context to reply to");
        return;
      }

      const res = await fetch("/api/messages/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          canteenId: lastMsg.canteenId,
          organizationId: lastMsg.organizationId,
          title: "Chat Message",
          message: replyText,
          receiverId: lastMsg.senderId._id === currentUserId ? lastMsg.receiverId : lastMsg.senderId._id
        })
      });

      if (res.ok) {
        const newMessage = await res.json();
        // Since it's a list, we might want to re-fetch or push to local state
        setMessages(prev => [...prev, { ...newMessage, senderId: { _id: currentUserId, name: user.name, role: user.role } }]);
        setReplyText("");
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Sort messages for display (inbox comes descending, but chat view needs ascending)
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] bg-card rounded-2xl sm:rounded-3xl border border-border overflow-hidden shadow-sm animate-fade-in">
      {/* Header */}
      <div className="p-3.5 sm:p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Building className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-xs sm:text-base text-foreground truncate">Organization Communication</h3>
            <p className="text-[9px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5 truncate">Official Thread</p>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <ScrollArea className="flex-1 p-3.5 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {loading ? (
            <div className="py-20 text-center animate-pulse text-xs font-bold text-muted-foreground">Loading messages...</div>
          ) : sortedMessages.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/20 mb-3" />
              <p className="text-base sm:text-lg font-bold text-foreground">No messages from organization yet</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Official updates and notices will appear here.</p>
            </div>
          ) : (
            sortedMessages.map((m) => {
              const isMe = m.senderId._id === currentUserId;
              const isSystem = m.title.includes("💰") || m.title.includes("✅") || m.title.includes("❌");

              return (
                <div key={m._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[90%] sm:max-w-[80%] space-y-1`}>
                    <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                      <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {isMe ? "You" : "Organization Admin"}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/50">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={`rounded-2xl p-3 sm:p-4 shadow-md relative ${
                      isMe 
                      ? "bg-emerald-600 text-white rounded-tr-none" 
                      : isSystem 
                        ? "bg-amber-100 border border-amber-300 text-amber-950 rounded-tl-none"
                        : "bg-[#2d2d2d] text-white rounded-tl-none border border-white/10"
                    }`}>
                      {(!isMe || isSystem) && m.title !== "Chat Message" && !m.title.startsWith("Re: ") && m.title !== "Reply from Canteen" && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-black text-xs uppercase tracking-tight ${isMe ? "text-white" : isSystem ? "text-amber-950" : "text-primary-foreground/90"}`}>{m.title}</span>
                        </div>
                      )}
                      <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isMe ? "text-white/90" : isSystem ? "text-amber-950/90" : "text-white/80"}`}>{m.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 sm:p-6 bg-muted/30 border-t border-border/50">
        <div className="flex gap-2 sm:gap-3 bg-background rounded-2xl p-1.5 sm:p-2 border border-border shadow-inner">
          <Input 
            placeholder="Write a message to organization admin..." 
            className="flex-1 border-none focus-visible:ring-0 text-xs sm:text-sm font-medium h-9 sm:h-10 px-3 sm:px-4 text-foreground placeholder:text-muted-foreground/50"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
          />
          <Button 
            onClick={handleReply} 
            disabled={sending || !replyText.trim() || messages.length === 0}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground h-9 sm:h-10 px-3.5 sm:px-6 text-xs font-black shadow-lg shadow-primary/20 shrink-0"
          >
            {sending ? "..." : <><Send className="h-3.5 w-3.5 sm:mr-2" /><span className="hidden sm:inline">Send</span></>}
          </Button>
        </div>
        {messages.length === 0 && (
          <p className="text-[9px] sm:text-[10px] text-center mt-2 font-bold text-muted-foreground uppercase tracking-wider">
            You can reply once the organization sends the first message.
          </p>
        )}
      </div>
    </div>
  );
};

export default CanteenOwnerMessages;
