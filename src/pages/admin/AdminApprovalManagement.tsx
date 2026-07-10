import { useEffect, useState } from "react";
import {
  Building2, ChefHat, Clock, CheckCircle2, XCircle,
  Search, Eye, X, ChevronDown
} from "lucide-react";
import { toast } from "sonner";

type OrgRequest = {
  _id: string; name: string; type: string; adminFullName: string;
  adminEmail: string; adminPhone: string; city: string; state: string;
  officialEmail: string; phone: string; expectedUsers: number;
  expectedCanteens: number; businessDescription: string; gstNumber: string;
  websiteUrl: string; address: string; approvalStatus: string;
  rejectionReason: string; createdAt: string;
};

type CanteenRequest = {
  _id: string; canteenName: string; organizationName: string; category: string;
  foodType: string; ownerName: string; ownerEmail: string; ownerPhone: string;
  address: string; fssaiLicense: string; businessDescription: string;
  organizationApprovalStatus: string; superAdminApprovalStatus: string;
  orgRejectionReason: string; adminRejectionReason: string; createdAt: string;
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
          placeholder="Enter reason for rejection (optional)..."
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

const AdminApprovalManagement = () => {
  const [tab, setTab] = useState<"orgs" | "canteens">("orgs");
  const [orgRequests, setOrgRequests] = useState<OrgRequest[]>([]);
  const [canteenRequests, setCanteenRequests] = useState<CanteenRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewOrg, setViewOrg] = useState<OrgRequest | null>(null);
  const [viewCanteen, setViewCanteen] = useState<CanteenRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; type: "org" | "canteen" } | null>(null);

  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (search) params.append("search", search);
      const [orgRes, canRes] = await Promise.all([
        fetch(`/api/organizations/requests?${params}`, { headers }),
        fetch(`/api/canteens/requests/all?${params}`, { headers }),
      ]);
      setOrgRequests(await orgRes.json());
      setCanteenRequests(await canRes.json());
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter, search]);

  const approveOrg = async (id: string) => {
    const res = await fetch(`/api/organizations/approve/${id}`, { method: "PUT", headers });
    if (res.ok) { toast.success("Organization approved!"); fetchData(); }
    else toast.error("Failed to approve");
  };

  const rejectOrg = async (id: string, reason: string) => {
    const res = await fetch(`/api/organizations/reject/${id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ reason }),
    });
    if (res.ok) { toast.success("Organization rejected"); fetchData(); }
    else toast.error("Failed to reject");
    setRejectTarget(null);
  };

  const approveCanteen = async (id: string) => {
    const res = await fetch(`/api/canteens/approve/admin/${id}`, { method: "PUT", headers });
    if (res.ok) { toast.success("Canteen approved!"); fetchData(); }
    else toast.error("Failed to approve");
  };

  const rejectCanteen = async (id: string, reason: string) => {
    const res = await fetch(`/api/canteens/reject/admin/${id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ reason }),
    });
    if (res.ok) { toast.success("Canteen rejected"); fetchData(); }
    else toast.error("Failed to reject");
    setRejectTarget(null);
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Approval Management</h2>
        <p className="text-sm text-muted-foreground">Review and manage organization and canteen registration requests</p>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 rounded-xl bg-muted p-1 w-fit">
        <button
          onClick={() => setTab("orgs")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === "orgs" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Building2 className="h-4 w-4" />
          Organization Requests
          {orgRequests.filter(o => o.approvalStatus === "pending").length > 0 && (
            <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white font-bold">
              {orgRequests.filter(o => o.approvalStatus === "pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("canteens")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === "canteens" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ChefHat className="h-4 w-4" />
          Canteen Requests
          {canteenRequests.filter(c => c.superAdminApprovalStatus === "pending").length > 0 && (
            <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white font-bold">
              {canteenRequests.filter(c => c.superAdminApprovalStatus === "pending").length}
            </span>
          )}
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === "orgs" ? "Search organizations..." : "Search canteens..."}
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

      {/* Organization Requests Table */}
      {tab === "orgs" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admin</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expected</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : orgRequests.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No organization requests found.</td></tr>
              ) : orgRequests.map((org) => (
                <tr key={org._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{org.name}</div>
                    <div className="text-xs text-muted-foreground">{org.city}, {org.state}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{org.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-foreground">{org.adminFullName}</div>
                    <div className="text-xs text-muted-foreground">{org.adminEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{org.phone}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{org.expectedUsers} users</div>
                    <div>{org.expectedCanteens} canteens</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(org.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={org.approvalStatus} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setViewOrg(org)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="View Details">
                        <Eye className="h-4 w-4" />
                      </button>
                      {org.approvalStatus === "pending" && (
                        <>
                          <button onClick={() => approveOrg(org._id)} className="rounded-lg px-2.5 py-1 bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors">Approve</button>
                          <button onClick={() => setRejectTarget({ id: org._id, type: "org" })} className="rounded-lg px-2.5 py-1 bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors">Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Canteen Requests Table */}
      {tab === "canteens" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Canteen</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Org Approval</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admin Approval</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : canteenRequests.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No canteen requests found.</td></tr>
              ) : canteenRequests.map((c) => (
                <tr key={c._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{c.canteenName}</div>
                    <div className="text-xs text-muted-foreground">{c.foodType}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.organizationName}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-foreground">{c.ownerName}</div>
                    <div className="text-xs text-muted-foreground">{c.ownerEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{c.category}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(c.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.organizationApprovalStatus} /></td>
                  <td className="px-4 py-3"><StatusBadge status={c.superAdminApprovalStatus} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setViewCanteen(c)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="View Details">
                        <Eye className="h-4 w-4" />
                      </button>
                      {c.superAdminApprovalStatus === "pending" && (
                        <>
                          <button onClick={() => approveCanteen(c._id)} className="rounded-lg px-2.5 py-1 bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors">Approve</button>
                          <button onClick={() => setRejectTarget({ id: c._id, type: "canteen" })} className="rounded-lg px-2.5 py-1 bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors">Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Org Detail Modal */}
      {viewOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-card-foreground">{viewOrg.name}</h3>
                <p className="text-xs text-muted-foreground">{viewOrg.type} · {viewOrg.city}, {viewOrg.state}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={viewOrg.approvalStatus} />
                <button onClick={() => setViewOrg(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                ["Admin Name", viewOrg.adminFullName], ["Admin Email", viewOrg.adminEmail],
                ["Admin Phone", viewOrg.adminPhone], ["Official Email", viewOrg.officialEmail],
                ["Phone", viewOrg.phone], ["Website", viewOrg.websiteUrl],
                ["Address", viewOrg.address], ["GST Number", viewOrg.gstNumber],
                ["Expected Users", String(viewOrg.expectedUsers)], ["Expected Canteens", String(viewOrg.expectedCanteens)],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">{k}</p>
                  <p className="text-foreground">{v || "—"}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Business Description</p>
                <p className="text-foreground">{viewOrg.businessDescription || "—"}</p>
              </div>
              {viewOrg.rejectionReason && (
                <div className="col-span-2 rounded-xl bg-red-50 dark:bg-red-950/30 p-3">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">Rejection Reason: {viewOrg.rejectionReason}</p>
                </div>
              )}
            </div>
            {viewOrg.approvalStatus === "pending" && (
              <div className="flex gap-3 border-t border-border px-6 py-4">
                <button onClick={() => { approveOrg(viewOrg._id); setViewOrg(null); }} className="flex-1 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors">Approve</button>
                <button onClick={() => { setRejectTarget({ id: viewOrg._id, type: "org" }); setViewOrg(null); }} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Canteen Detail Modal */}
      {viewCanteen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl animate-fade-in">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-card-foreground">{viewCanteen.canteenName}</h3>
                <p className="text-xs text-muted-foreground">{viewCanteen.category} · {viewCanteen.foodType} · {viewCanteen.organizationName}</p>
              </div>
              <button onClick={() => setViewCanteen(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                ["Owner Name", viewCanteen.ownerName], ["Owner Email", viewCanteen.ownerEmail],
                ["Owner Phone", viewCanteen.ownerPhone], ["Address", viewCanteen.address],
                ["FSSAI License", viewCanteen.fssaiLicense], ["Organization", viewCanteen.organizationName],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">{k}</p>
                  <p className="text-foreground">{v || "—"}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Business Description</p>
                <p className="text-foreground">{viewCanteen.businessDescription || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Org Approval</p>
                <StatusBadge status={viewCanteen.organizationApprovalStatus} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Admin Approval</p>
                <StatusBadge status={viewCanteen.superAdminApprovalStatus} />
              </div>
            </div>
            {viewCanteen.superAdminApprovalStatus === "pending" && (
              <div className="flex gap-3 border-t border-border px-6 py-4">
                <button onClick={() => { approveCanteen(viewCanteen._id); setViewCanteen(null); }} className="flex-1 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors">Approve</button>
                <button onClick={() => { setRejectTarget({ id: viewCanteen._id, type: "canteen" }); setViewCanteen(null); }} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          onConfirm={(reason) => {
            if (rejectTarget.type === "org") rejectOrg(rejectTarget.id, reason);
            else rejectCanteen(rejectTarget.id, reason);
          }}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
};

export default AdminApprovalManagement;
