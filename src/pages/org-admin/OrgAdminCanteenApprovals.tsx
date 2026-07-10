import { useEffect, useState } from "react";
import { ChefHat, Clock, CheckCircle2, XCircle, Eye, X, Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type CanteenRequest = {
  _id: string; canteenName: string; organizationName: string; category: string;
  foodType: string; ownerName: string; ownerEmail: string; ownerPhone: string;
  address: string; floorBlock: string; seatingCapacity: number; numberOfStaff: number;
  openingTime: string; closingTime: string; fssaiLicense: string; businessDescription: string;
  organizationApprovalStatus: string; superAdminApprovalStatus: string;
  orgRejectionReason: string; createdAt: string;
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const icons: Record<string, JSX.Element> = {
    pending: <Clock className="h-3 w-3" />,
    approved: <CheckCircle2 className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status] || styles.pending}`}>
      {icons[status]} {status}
    </span>
  );
};

const RejectModal = ({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-card-foreground">Reason for Rejection</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Enter reason (optional)..."
          rows={4}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={() => onConfirm(reason)} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">Reject</button>
        </div>
      </div>
    </div>
  );
};

const OrgAdminCanteenApprovals = () => {
  const [requests, setRequests] = useState<CanteenRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewItem, setViewItem] = useState<CanteenRequest | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/canteens/requests/org", { headers });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load canteen requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/canteens/approve/org/${id}`, { method: "PUT", headers });
    if (res.ok) { toast.success("Canteen approved by organization!"); fetchRequests(); }
    else toast.error("Failed to approve");
  };

  const handleReject = async (id: string, reason: string) => {
    const res = await fetch(`/api/canteens/reject/org/${id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ reason }),
    });
    if (res.ok) { toast.success("Canteen rejected"); fetchRequests(); }
    else toast.error("Failed to reject");
    setRejectId(null);
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const filtered = requests.filter(r => {
    const matchSearch = r.canteenName.toLowerCase().includes(search.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.organizationApprovalStatus === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Canteen Approval Requests</h2>
        <p className="text-sm text-muted-foreground">Review and approve canteen registrations for your organization</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", count: requests.filter(r => r.organizationApprovalStatus === "pending").length, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Approved", count: requests.filter(r => r.organizationApprovalStatus === "approved").length, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Rejected", count: requests.filter(r => r.organizationApprovalStatus === "rejected").length, color: "text-red-500", bg: "bg-red-500/10" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg} mb-2`}>
              <ChefHat className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search canteens..."
            className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="relative">
          <select
            value={filter} onChange={e => setFilter(e.target.value)}
            className="appearance-none rounded-xl border border-input bg-background px-4 py-2.5 pr-8 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Canteen</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timings</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Org Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admin Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No canteen requests found.</td></tr>
            ) : filtered.map((r) => (
              <tr key={r._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{r.canteenName}</div>
                  <div className="text-xs text-muted-foreground">{r.foodType} · {r.address?.substring(0, 30)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-foreground">{r.ownerName}</div>
                  <div className="text-xs text-muted-foreground">{r.ownerEmail}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{r.category}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {r.openingTime} – {r.closingTime}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(r.createdAt)}</td>
                <td className="px-4 py-3"><StatusBadge status={r.organizationApprovalStatus} /></td>
                <td className="px-4 py-3"><StatusBadge status={r.superAdminApprovalStatus} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setViewItem(r)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="View">
                      <Eye className="h-4 w-4" />
                    </button>
                    {r.organizationApprovalStatus === "pending" && (
                      <>
                        <button onClick={() => handleApprove(r._id)} className="rounded-lg px-2.5 py-1 bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors">Approve</button>
                        <button onClick={() => setRejectId(r._id)} className="rounded-lg px-2.5 py-1 bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors">Reject</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-card-foreground">{viewItem.canteenName}</h3>
                <p className="text-xs text-muted-foreground">{viewItem.category} · {viewItem.foodType}</p>
              </div>
              <button onClick={() => setViewItem(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                ["Owner Name", viewItem.ownerName], ["Owner Email", viewItem.ownerEmail],
                ["Owner Phone", viewItem.ownerPhone], ["Floor / Block", viewItem.floorBlock],
                ["Seating Capacity", String(viewItem.seatingCapacity)], ["Staff Count", String(viewItem.numberOfStaff)],
                ["Opening Time", viewItem.openingTime], ["Closing Time", viewItem.closingTime],
                ["FSSAI License", viewItem.fssaiLicense], ["Address", viewItem.address],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">{k}</p>
                  <p className="text-foreground">{v || "—"}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Business Description</p>
                <p className="text-foreground">{viewItem.businessDescription || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Org Approval</p>
                <StatusBadge status={viewItem.organizationApprovalStatus} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Admin Approval</p>
                <StatusBadge status={viewItem.superAdminApprovalStatus} />
              </div>
            </div>
            {viewItem.organizationApprovalStatus === "pending" && (
              <div className="flex gap-3 border-t border-border px-6 py-4">
                <button onClick={() => { handleApprove(viewItem._id); setViewItem(null); }} className="flex-1 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors">Approve</button>
                <button onClick={() => { setRejectId(viewItem._id); setViewItem(null); }} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      {rejectId && (
        <RejectModal
          onConfirm={(reason) => handleReject(rejectId, reason)}
          onClose={() => setRejectId(null)}
        />
      )}
    </div>
  );
};

export default OrgAdminCanteenApprovals;
