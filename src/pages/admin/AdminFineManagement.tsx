import React, { useState, useEffect } from "react";
import { DollarSign, Building2, FileText, AlertTriangle, CheckCircle, XCircle, Search, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Fine {
  _id: string;
  fineId: string;
  reportId: {
    _id: string;
    reportId: string;
    userId: { name: string; email: string };
    issueType: string;
  };
  organizationId: { _id: string; name: string };
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

const AdminFineManagement = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [fineAmount, setFineAmount] = useState<number>(100);
  const [savingSettings, setSavingSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFines();
    fetchSettings();
  }, []);

  const fetchFines = async () => {
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch("/api/fines/all", {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFines(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      toast.error("Failed to load fines");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch("/api/fines/settings", {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFineAmount(data.value);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateSettings = async () => {
    setSavingSettings(true);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch("/api/fines/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ amount: fineAmount })
      });
      if (res.ok) {
        toast.success("Fine settings updated");
      }
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const cancelFine = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this fine?")) return;
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch(`/api/fines/cancel/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.ok) {
        setFines(prev => prev.map(f => f._id === id ? { ...f, status: "Cancelled" } : f));
        toast.success("Fine cancelled");
      }
    } catch (err) {
      toast.error("Failed to cancel fine");
    }
  };

  const filteredFines = fines.filter(f => 
    f.fineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.organizationId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.reportId?.reportId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Cancelled": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <DollarSign className="h-10 w-10 text-primary" /> Fine Management
          </h1>
          <p className="text-muted-foreground mt-2">Manage organization penalties and fine settings</p>
        </div>

        <div className="flex items-center gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Default Fine Amount</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-foreground">₹</span>
              <input 
                type="number"
                value={fineAmount}
                onChange={(e) => setFineAmount(Number(e.target.value))}
                className="w-24 bg-transparent text-lg font-black border-none focus:ring-0 outline-none p-0 text-white"
              />
            </div>
          </div>
          <button 
            onClick={updateSettings}
            disabled={savingSettings}
            className="p-3 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
          >
            {savingSettings ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Fines</span>
          </div>
          <p className="text-4xl font-black text-foreground">{fines.length}</p>
        </div>
        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending</span>
          </div>
          <p className="text-4xl font-black text-foreground">{fines.filter(f => f.status === 'Pending').length}</p>
        </div>
        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-green-500/10 text-green-500">
              <CheckCircle className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Collected</span>
          </div>
          <p className="text-4xl font-black text-foreground">₹{fines.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0)}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-card/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-black tracking-tight text-foreground">Active Penalties</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by ID or Organization..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none w-full md:w-80"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fine ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Organization</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Related Report</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-bold">Loading fines...</p>
                  </td>
                </tr>
              ) : filteredFines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <p className="text-sm font-bold uppercase tracking-widest opacity-50">No fines issued yet</p>
                  </td>
                </tr>
              ) : (
                filteredFines.map(fine => (
                  <tr key={fine._id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{fine.fineId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold">{fine.organizationId?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <FileText className="h-3 w-3" /> {fine.reportId?.reportId}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{fine.reason}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-foreground">₹{fine.amount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(fine.status)}`}>
                        {fine.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {fine.status === 'Pending' && (
                        <button 
                          onClick={() => cancelFine(fine._id)}
                          className="p-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-600 hover:bg-red-500 hover:text-white transition-all"
                          title="Cancel Fine"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminFineManagement;
