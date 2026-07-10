import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Org {
  _id: string;
  name: string;
  type: string;
  location: string;
  commissionPercentage: number;
  canteenCount?: number;
}

const AdminOrganizations = () => {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", type: "College", location: "", commissionPercentage: 10 });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const fetchOrgs = async () => {
    try {
      const res = await fetch("/api/organizations");
      const data = await res.json();
      // fetch canteen counts for each org
      const withCounts = await Promise.all(
        data.map(async (org: Org) => {
          const cr = await fetch(`/api/canteens/${org._id}`);
          const canteens = await cr.json();
          return { ...org, canteenCount: Array.isArray(canteens) ? canteens.length : 0 };
        })
      );
      setOrgs(withCounts);
    } catch {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/organizations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Organization '${data.name}' created!`);
        setShowModal(false);
        setForm({ name: "", type: "College", location: "", commissionPercentage: 10 });
        fetchOrgs();
      } else {
        toast.error(data.message || "Failed to create organization");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Organizations</h2>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Organization
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-card-foreground">Add New Organization</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
                <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. IIT Delhi" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">
                  <option>College</option><option>Company</option><option>Hospital</option><option>Hostel</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Location</label>
                <input required type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. New Delhi" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Commission (%)</label>
                <input type="number" min={0} max={50} value={form.commissionPercentage} onChange={e => setForm({ ...form, commissionPercentage: Number(e.target.value) })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button type="submit" disabled={saving} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? "Creating..." : "Create Organization"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Canteens</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Commission</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : orgs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No organizations yet. Click "Add Organization" to get started.</td></tr>
            ) : (
              orgs.map((org) => (
                <tr key={org._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{org.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{org.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{org.location}</td>
                  <td className="px-4 py-3 text-muted-foreground">{org.canteenCount ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{org.commissionPercentage}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrganizations;
