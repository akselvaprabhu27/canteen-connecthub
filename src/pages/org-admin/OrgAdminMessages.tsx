import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Send, 
  User, 
  MessageSquare, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  DollarSign,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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

interface Thread {
  _id: string;
  canteen: {
    _id: string;
    canteenName: string;
  };
  latestMessage: Message;
  unreadCount: number;
}

const OrgAdminMessages = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCanteenId = searchParams.get("canteenId");

  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string | null>(initialCanteenId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = user?._id || user?.id;

  const fetchThreads = async () => {
    try {
      const res = await fetch("/api/messages/org/threads", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setThreads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching threads:", error);
    }
  };

  const fetchMessages = async (canteenId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/thread/${canteenId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
      
      // Mark as read
      await fetch(`/api/messages/read/${canteenId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchThreads(); // Refresh thread list to update unread counts
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCanteenId) {
      setIsInitialLoad(true);
      fetchMessages(selectedCanteenId);
    }
  }, [selectedCanteenId]);

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
    if (!replyText.trim() || !selectedCanteenId) return;

    setSending(true);
    try {
      const selectedThread = threads.find(t => t._id === selectedCanteenId);
      const receiverId = messages.find(m => m.senderId._id !== currentUserId)?.senderId._id 
                        || selectedThread?.latestMessage.senderId._id;

      const res = await fetch("/api/messages/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          canteenId: selectedCanteenId,
          organizationId: user.organizationId || localStorage.getItem(`myOrgId_${user._id || user.id}`),
          title: "Chat Message",
          message: replyText,
          receiverId
        })
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages(prev => [...prev, { ...newMessage, senderId: { _id: currentUserId, name: user.name, role: user.role } }]);
        setReplyText("");
        fetchThreads();
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredThreads = threads.filter(t => 
    t.canteen.canteenName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-fade-in">
      {/* Sidebar - Thread List */}
      <div className="w-80 flex flex-col bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border/50 bg-muted/30">
          <h2 className="text-xl font-black text-foreground mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-10 rounded-xl bg-background border-none h-11 text-sm font-medium focus-visible:ring-primary/20 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No conversations</p>
              </div>
            ) : (
              filteredThreads.map(t => (
                <button
                  key={t._id}
                  onClick={() => setSelectedCanteenId(t._id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all relative group ${
                    selectedCanteenId === t._id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-black text-sm truncate pr-4 ${selectedCanteenId === t._id ? "text-primary-foreground" : "text-foreground"}`}>{t.canteen.canteenName}</span>
                    <span className={`text-[10px] font-bold opacity-70 ${selectedCanteenId === t._id ? "text-primary-foreground" : "text-muted-foreground"}`}>
                      {new Date(t.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-xs truncate font-medium ${selectedCanteenId === t._id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {t.latestMessage.message}
                  </p>
                  {t.unreadCount > 0 && selectedCanteenId !== t._id && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground animate-pulse shadow-md">
                      {t.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-card rounded-3xl border border-border overflow-hidden shadow-sm relative">
        {selectedCanteenId ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-foreground">
                    {threads.find(t => t._id === selectedCanteenId)?.canteen.canteenName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message List */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {messages.map((m, idx) => {
                  const isMe = m.senderId._id === currentUserId;
                  const isSystem = m.title.includes("💰") || m.title.includes("✅") || m.title.includes("❌");
                  
                  return (
                    <div key={m._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {/* Date Separator if needed */}
                      
                      <div className={`max-w-[80%] space-y-1`}>
                        <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            {isMe ? "You" : "Canteen"}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground/50">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className={`rounded-2xl p-4 shadow-md relative ${
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
                          <p className={`text-sm font-medium leading-relaxed ${isMe ? "text-white/90" : isSystem ? "text-amber-950/90" : ""}`}>{m.message}</p>
                          
                          {/* Payment Action Buttons for Org Admin */}
                          {m.title.includes("💰") && !isMe && (
                            <div className="mt-4 flex gap-2 pt-3 border-t border-amber-200/50">
                              <Button 
                                size="sm" 
                                className="h-8 bg-green-600 hover:bg-green-700 text-white font-black text-[10px] rounded-lg"
                                onClick={() => handlePaymentAction(m, 'approved')}
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Approve Payout
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 border-red-200 text-red-600 hover:bg-red-50 font-black text-[10px] rounded-lg"
                                onClick={() => handlePaymentAction(m, 'rejected')}
                              >
                                <XCircle className="mr-1 h-3 w-3" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply Box */}
            <div className="p-6 bg-muted/30 border-t border-border/50">
              <div className="flex gap-3 bg-background rounded-2xl p-2 border border-border shadow-inner">
                <Input 
                  placeholder="Type your professional response..." 
                  className="flex-1 border-none focus-visible:ring-0 text-sm font-medium h-10 px-4 text-white placeholder:text-muted-foreground/50"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                />
                <Button 
                  onClick={handleReply} 
                  disabled={sending || !replyText.trim()}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 font-black shadow-lg shadow-primary/20"
                >
                  {sending ? "..." : <><Send className="h-4 w-4 mr-2" /> Send</>}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-6">
              <MessageSquare className="h-12 w-12 text-primary/30" />
            </div>
            <h3 className="text-2xl font-black text-foreground">Select a Conversation</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Choose a canteen from the left sidebar to start communicating or view their payment requests.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  async function handlePaymentAction(message: Message, status: 'approved' | 'rejected') {
    if (status === 'approved') {
      navigate(`/org-admin/canteen-finance/${selectedCanteenId}`);
      return;
    }

    if (status === 'rejected') {
      setSending(true);
      try {
        const selectedThread = threads.find(t => t._id === selectedCanteenId);
        const receiverId = messages.find(m => m.senderId._id !== currentUserId)?.senderId._id 
                          || selectedThread?.latestMessage.senderId._id;

        const res = await fetch("/api/messages/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            canteenId: selectedCanteenId,
            organizationId: user.organizationId || localStorage.getItem(`myOrgId_${user._id || user.id}`),
            title: "❌ PAYOUT REJECTED",
            message: "We rejected your payment request. Please check the details or contact the organization admin for further clarification.",
            receiverId
          })
        });

        if (res.ok) {
          const newMessage = await res.json();
          setMessages(prev => [...prev, { ...newMessage, senderId: { _id: currentUserId, name: user.name, role: user.role } }]);
          toast.error("Payout request rejected");
          fetchThreads();
        }
      } catch (error) {
        toast.error("Error processing rejection");
      } finally {
        setSending(false);
      }
    }
  }
};

export default OrgAdminMessages;
