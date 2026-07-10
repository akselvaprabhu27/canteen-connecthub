import React, { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, Building2, Calendar, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Warning {
  _id: string;
  warnedBy: "org_admin" | "super_admin";
  reason: string;
  createdAt: string;
}

const CanteenOwnerWarnings = () => {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarnings();
  }, []);

  const fetchWarnings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/canteens/my-warnings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWarnings(Array.isArray(data) ? data : []);
      } else {
        toast.error("Failed to load warnings history");
      }
    } catch (err) {
      toast.error("An error occurred while fetching warnings");
    } finally {
      setLoading(false);
    }
  };

  const orgCount = warnings.filter(w => w.warnedBy === "org_admin").length;
  const adminCount = warnings.filter(w => w.warnedBy === "super_admin").length;

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Official Advisory & Warnings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review administrative warnings and policy advisories issued to your canteen.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-amber-500/10 bg-amber-500/5 shadow-sm flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-500">Organization Advisories</h3>
            <p className="text-3xl font-black text-foreground mt-2">{orgCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Issued by your university/organization administration</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-red-500/10 bg-red-500/5 shadow-sm flex items-start gap-4">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500 shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-red-500">System Warning Flags</h3>
            <p className="text-3xl font-black text-foreground mt-2">{adminCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Issued globally by system superadministrators</p>
          </div>
        </div>
      </div>

      {/* Warning Logs List */}
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
        <h2 className="text-base font-black text-foreground mb-6 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" /> Historical Warning Directory
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gathering warning advisories...</p>
          </div>
        ) : warnings.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">No Warnings Active</p>
            <p className="text-xs text-muted-foreground mt-1">Your canteen dashboard is operating in good standing with no infractions reported.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {warnings.map((warning) => (
              <div 
                key={warning._id} 
                className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors ${
                  warning.warnedBy === "super_admin" 
                    ? "border-red-500/20 bg-red-500/5" 
                    : "border-amber-500/20 bg-amber-500/5"
                }`}
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    {warning.warnedBy === "super_admin" ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 font-extrabold text-[10px] uppercase">
                        <ShieldAlert className="h-3.5 w-3.5" /> Superadmin Warning
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 font-extrabold text-[10px] uppercase">
                        <Building2 className="h-3.5 w-3.5" /> Organization Warning
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(warning.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-relaxed italic">
                    "{warning.reason}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CanteenOwnerWarnings;
