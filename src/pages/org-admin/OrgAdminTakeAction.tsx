import React, { useState, useEffect } from "react";
import { ShieldAlert, Store, ShieldCheck, XCircle, AlertOctagon, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Canteen {
  _id: string;
  canteenName: string;
  category?: string;
  address?: string;
  isBlocked: boolean;
  blockReason?: string;
  blockedBy?: string;
  ownerId?: { name: string; email: string };
  orgWarningsCount?: number;
  adminWarningsCount?: number;
}

const OrgAdminTakeAction = () => {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Suspension Modal states
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen | null>(null);
  const [reason, setReason] = useState("");
  const [blocking, setBlocking] = useState(false);

  // Warning Modal states
  const [selectedCanteenForWarn, setSelectedCanteenForWarn] = useState<Canteen | null>(null);
  const [warnReason, setWarnReason] = useState("");
  const [warningInProgress, setWarningInProgress] = useState(false);

  useEffect(() => {
    fetchCanteens();
  }, []);

  const fetchCanteens = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/canteens/org-canteens", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCanteens(Array.isArray(data) ? data : []);
      } else {
        toast.error(data.message || "Failed to load canteens");
      }
    } catch (err) {
      toast.error("An error occurred while fetching canteens");
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!selectedCanteen) return;
    if (!reason.trim()) {
      toast.error("Please enter a reason for suspension");
      return;
    }

    setBlocking(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/canteens/block/${selectedCanteen._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${selectedCanteen.canteenName} has been suspended.`);
        setCanteens(prev => prev.map(c => c._id === selectedCanteen._id ? { ...c, isBlocked: true, blockReason: reason, blockedBy: 'org_admin' } : c));
        setSelectedCanteen(null);
        setReason("");
      } else {
        toast.error(data.message || "Failed to suspend canteen");
      }
    } catch (err) {
      toast.error("An error occurred during suspension");
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async (canteen: Canteen) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/canteens/unblock/${canteen._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${canteen.canteenName} has been reinstated.`);
        setCanteens(prev => prev.map(c => c._id === canteen._id ? { ...c, isBlocked: false, blockReason: "", blockedBy: undefined } : c));
      } else {
        toast.error(data.message || "Failed to reinstate canteen");
      }
    } catch (err) {
      toast.error("An error occurred during reinstatement");
    }
  };

  const handleWarn = async () => {
    if (!selectedCanteenForWarn) return;
    if (!warnReason.trim()) {
      toast.error("Please enter a description for the infraction");
      return;
    }

    setWarningInProgress(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/canteens/warn/${selectedCanteenForWarn._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: warnReason })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Warning issued to ${selectedCanteenForWarn.canteenName}.`);
        setCanteens(prev => prev.map(c => c._id === selectedCanteenForWarn._id ? { ...c, orgWarningsCount: (c.orgWarningsCount || 0) + 1 } : c));
        setSelectedCanteenForWarn(null);
        setWarnReason("");
      } else {
        toast.error(data.message || "Failed to issue warning");
      }
    } catch (err) {
      toast.error("An error occurred while issuing warning");
    } finally {
      setWarningInProgress(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Disciplinary Action Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage canteen suspensions, review warnings, and override dashboard access.
        </p>
      </div>

      {/* Warning Notice Box */}
      <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-4 flex gap-3 text-red-500 max-w-4xl">
        <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold">Warning: Account Suspension Protocol</p>
          <p className="leading-relaxed opacity-90">
            Blocking a canteen blocks the owner's dashboard instantly. They will be locked out and can only see the suspension reason provided by you. Reinstatement is immediate upon clicking "Unblock".
          </p>
        </div>
      </div>

      {/* Canteens List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Retrieving organization canteens...</p>
        </div>
      ) : canteens.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-3xl bg-card/20">
          <Store className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-bold text-muted-foreground">No Canteens Registered</p>
          <p className="text-xs text-muted-foreground mt-1">There are no approved canteens under this organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canteens.map(canteen => (
            <div 
              key={canteen._id}
              className={`rounded-2xl border bg-card p-6 shadow-sm transition-all flex flex-col justify-between ${
                canteen.isBlocked 
                  ? 'border-red-500/30 shadow-red-500/5' 
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      canteen.isBlocked ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-primary/10 border-primary/20 text-primary'
                    }`}>
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-foreground">{canteen.canteenName}</h3>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{canteen.category || "General"}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                    canteen.isBlocked ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                  }`}>
                    {canteen.isBlocked ? "Suspended" : "Active"}
                  </span>
                </div>

                <div className="rounded-xl bg-muted/40 p-4 space-y-3 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Canteen Owner</span>
                    <p className="font-bold text-foreground mt-0.5">{canteen.ownerId?.name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Owner Contact Email</span>
                    <p className="font-bold text-foreground mt-0.5">{canteen.ownerId?.email || "N/A"}</p>
                  </div>
                  <div className="pt-2.5 border-t border-border/40 flex justify-between text-[10px] font-bold">
                    <span className="text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Org Warns: {canteen.orgWarningsCount || 0}
                    </span>
                    <span className="text-red-600 bg-red-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> Admin Warns: {canteen.adminWarningsCount || 0}
                    </span>
                  </div>
                </div>

                {canteen.isBlocked && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs">
                    <span className="text-[9px] font-black uppercase text-red-500">Suspension Reason</span>
                    <p className="text-red-400 mt-1 italic leading-relaxed">
                      "{canteen.blockReason || "Suspended by admin."}"
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border/50">
                {canteen.isBlocked ? (
                  <button
                    onClick={() => handleUnblock(canteen)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white px-4 py-2.5 text-xs font-black transition duration-150 cursor-pointer shadow-sm"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Reinstate Dashboard
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedCanteenForWarn(canteen);
                        setWarnReason("");
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white px-4 py-2.5 text-xs font-black transition duration-150 cursor-pointer shadow-sm"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Warn
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCanteen(canteen);
                        setReason("");
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2.5 text-xs font-black transition duration-150 cursor-pointer shadow-sm"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Suspend
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suspension Modal */}
      {selectedCanteen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-2.5 text-red-500">
                <AlertOctagon className="h-5 w-5" />
                <h3 className="text-lg font-black text-foreground">Suspend Account</h3>
              </div>
              <button 
                onClick={() => setSelectedCanteen(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                You are suspending <span className="font-extrabold text-foreground">{selectedCanteen.canteenName}</span>. Please supply a clear reason. The canteen owner will be locked out and will view this message upon login.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Reason for Suspension</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="E.g., Failed multiple hygiene checks / overdue on critical food safety report responses..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:ring-2 focus:ring-red-500/20 outline-none resize-none transition-all shadow-inner text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedCanteen(null)}
                className="flex-1 rounded-xl border border-border bg-background hover:bg-muted py-2.5 text-xs font-black text-foreground transition duration-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={blocking || !reason.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-2.5 text-xs font-black transition duration-150 disabled:opacity-50 cursor-pointer shadow-lg shadow-red-600/20"
              >
                {blocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                Confirm Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {selectedCanteenForWarn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-2.5 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-lg font-black text-foreground">Issue Official Warning</h3>
              </div>
              <button 
                onClick={() => setSelectedCanteenForWarn(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                You are issuing an official warning advisory to <span className="font-extrabold text-foreground">{selectedCanteenForWarn.canteenName}</span>. Please describe the policy infraction clearly.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Infraction Description</label>
                <textarea
                  value={warnReason}
                  onChange={e => setWarnReason(e.target.value)}
                  placeholder="E.g., Minor delays in food report responses / slight hygiene warnings..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:ring-2 focus:ring-amber-500/20 outline-none resize-none transition-all shadow-inner text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedCanteenForWarn(null)}
                className="flex-1 rounded-xl border border-border bg-background hover:bg-muted py-2.5 text-xs font-black text-foreground transition duration-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleWarn}
                disabled={warningInProgress || !warnReason.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white py-2.5 text-xs font-black transition duration-150 disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {warningInProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Confirm Warning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgAdminTakeAction;
