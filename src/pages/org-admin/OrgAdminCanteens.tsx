import { UtensilsCrossed, Bell, MessageSquare, Search, Send, User, CheckCircle2, AlertCircle, X, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Canteen {
  _id: string;
  canteenName: string;
  category: string;
  itemCount: number;
  unreadMessagesCount?: number;
  hasPendingPaymentRequest?: boolean;
  pendingPaymentAmount?: number;
}

const OrgAdminCanteens = () => {
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyType, setNotifyType] = useState<"all" | "selected">("all");
  const [selectedCanteenIds, setSelectedCanteenIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageForm, setMessageForm] = useState({
    title: "",
    message: ""
  });
  const [sending, setSending] = useState(false);

  const fetchCanteens = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uid = user?._id || user?.id;
    const token = localStorage.getItem("token");
    
    // Prioritize organizationId from user object, then fallback to localStorage
    let orgId = user.organizationId || localStorage.getItem(`myOrgId_${uid}`);

    try {
      if (!orgId) {
        const orgRes = await fetch("/api/organizations/my", { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        const data = await orgRes.json();
        // The API might return a single object or an array
        if (Array.isArray(data) && data.length > 0) {
          orgId = data[0]._id;
        } else if (data && data._id) {
          orgId = data._id;
        }
        
        if (orgId) {
          localStorage.setItem(`myOrgId_${uid}`, orgId);
        }
      }

      if (!orgId) { 
        console.warn("No Organization ID found for user");
        setLoading(false); 
        return; 
      }

      const res = await fetch(`/api/canteens/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCanteens(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching canteens:", error);
      toast.error("Failed to load canteens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCanteens(); }, []);

  const handleNotifySubmit = async () => {
    if (!messageForm.title || !messageForm.message) {
      toast.error("Please fill in all fields");
      return;
    }

    const idsToSend = notifyType === "all" 
      ? canteens.map(c => c._id) 
      : selectedCanteenIds;

    if (idsToSend.length === 0) {
      toast.error("No canteens selected");
      return;
    }

    setSending(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          canteenIds: idsToSend,
          organizationId: user.organizationId || localStorage.getItem(`myOrgId_${user._id || user.id}`),
          ...messageForm
        })
      });

      if (res.ok) {
        toast.success("Notifications sent successfully");
        setShowNotifyModal(false);
        setMessageForm({ title: "", message: "" });
        setSelectedCanteenIds([]);
      } else {
        toast.error("Failed to send notifications");
      }
    } catch {
      toast.error("Error sending notifications");
    } finally {
      setSending(false);
    }
  };

  const filteredCanteens = canteens.filter(c => 
    c.canteenName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCanteenSelection = (id: string) => {
    setSelectedCanteenIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground">Canteen Management</h2>
          <p className="text-sm text-muted-foreground">Manage and communicate with your canteens</p>
        </div>
        <Button 
          onClick={() => setShowNotifyModal(true)}
          className="bg-[#6B8E23] text-white hover:bg-[#556B2F] font-bold rounded-xl shadow-lg shadow-olive-600/20 transition-all active:scale-95 border-none"
        >
          <Bell className="mr-2 h-4 w-4" /> Notify Canteens
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground col-span-full py-20 text-center animate-pulse font-medium">Loading canteens...</p>
        ) : canteens.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-card rounded-3xl border-2 border-dashed border-border/50">
            <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-bold text-foreground">No canteens yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">Canteens will appear once canteen owners register under your organization.</p>
          </div>
        ) : (
          canteens.map((c) => (
            <div 
              key={c._id} 
              onClick={() => navigate(`/org-admin/messages?canteenId=${c._id}`)}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-xl hover:border-[#6B8E23]/50 transition-all cursor-pointer animate-fade-in"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6B8E23]/10 text-[#6B8E23] transition-transform group-hover:scale-110 group-hover:rotate-3">
                  <UtensilsCrossed className="h-7 w-7" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className="bg-[#6B8E23]/10 text-[#6B8E23] border-[#6B8E23]/20 font-bold">Active</Badge>
                  {c.unreadMessagesCount && c.unreadMessagesCount > 0 ? (
                    <Badge className="bg-[#6B8E23] text-white font-black shadow-lg shadow-olive-600/30 border-none ring-2 ring-white/10">
                      🔔 {c.unreadMessagesCount} New Repl{c.unreadMessagesCount === 1 ? 'y' : 'ies'}
                    </Badge>
                  ) : null}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-xl font-black text-foreground group-hover:text-[#6B8E23] transition-colors">{c.canteenName}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-muted-foreground px-2 py-1 bg-muted rounded-lg">{c.category}</span>
                  <span className="text-xs font-bold text-muted-foreground px-2 py-1 bg-muted rounded-lg">{c.itemCount ?? 0} items</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-xs font-black text-[#6B8E23] flex items-center opacity-80 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                  Open Chat <MessageSquare className="ml-1.5 h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notify Modal */}
      <Dialog open={showNotifyModal} onOpenChange={setShowNotifyModal}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl p-0 overflow-hidden border border-border/50 shadow-2xl bg-card">
          <DialogHeader className="bg-[#1a1a1a] p-8 text-white border-b border-white/5">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <Bell className="h-6 w-6 text-[#6B8E23]" /> Notify Canteens
              </DialogTitle>
              <button onClick={() => setShowNotifyModal(false)} className="rounded-full p-2 hover:bg-white/10 transition-colors text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="flex p-1 bg-muted/50 rounded-2xl gap-1">
              <button 
                onClick={() => setNotifyType("all")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all ${notifyType === "all" ? "bg-[#1a1a1a] shadow-lg text-[#6B8E23]" : "text-muted-foreground hover:text-foreground"}`}
              >
                All Canteens ({canteens.length})
              </button>
              <button 
                onClick={() => setNotifyType("selected")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all ${notifyType === "selected" ? "bg-[#1a1a1a] shadow-lg text-[#6B8E23]" : "text-muted-foreground hover:text-foreground"}`}
              >
                Selected Canteens ({selectedCanteenIds.length})
              </button>
            </div>

            {notifyType === "selected" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search canteens..." 
                    className="pl-10 rounded-xl bg-muted/30 border-none h-12 text-sm font-medium focus-visible:ring-[#6B8E23]/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {filteredCanteens.map(c => (
                    <button
                      key={c._id}
                      onClick={() => toggleCanteenSelection(c._id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedCanteenIds.includes(c._id) ? "border-[#6B8E23] bg-[#6B8E23]/5 shadow-sm" : "border-border hover:border-[#6B8E23]/30"}`}
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedCanteenIds.includes(c._id) ? "bg-[#6B8E23] border-[#6B8E23]" : "border-muted-foreground"}`}>
                        {selectedCanteenIds.includes(c._id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-xs font-bold truncate">{c.canteenName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Title</label>
                <Input 
                  placeholder="Notification Title (e.g. Tomorrow Maintenance)" 
                  className="rounded-xl bg-muted/30 border-none h-12 text-sm font-bold focus-visible:ring-[#6B8E23]/20 text-[#1a1a1a] placeholder:text-muted-foreground/60"
                  value={messageForm.title}
                  onChange={(e) => setMessageForm({...messageForm, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Message</label>
                <Textarea 
                  placeholder="Write your message here..." 
                  className="rounded-2xl bg-muted/30 border-none min-h-[120px] p-4 text-sm font-medium focus-visible:ring-[#6B8E23]/20 resize-none text-[#1a1a1a] placeholder:text-muted-foreground/60"
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                />
              </div>

            </div>
          </div>

          <DialogFooter className="p-8 bg-[#1a1a1a] border-t border-white/5">
            <Button 
              variant="ghost" 
              onClick={() => setShowNotifyModal(false)}
              className="rounded-xl font-bold px-6 text-white/50 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleNotifySubmit}
              disabled={sending}
              className="bg-[#6B8E23] text-white hover:bg-[#556B2F] font-black rounded-xl px-8 shadow-xl shadow-[#6B8E23]/20 h-12"
            >
              {sending ? "Sending..." : "Send Notifications"} <Send className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgAdminCanteens;
