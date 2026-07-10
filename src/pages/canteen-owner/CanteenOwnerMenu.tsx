import { Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

interface MenuItem {
  _id: string;
  itemName: string;
  price: number;
  category: string;
  quantity?: string;
}

const CanteenOwnerMenu = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [canteenId, setCanteenId] = useState<string>("");
  const [form, setForm] = useState({ itemName: "", price: "", category: "Veg", quantity: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");

  const fetchMenu = async (cid: string) => {
    const res = await fetch(`/api/menu/${cid}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uid = user?._id || user?.id;
    const cachedId = localStorage.getItem(`myCanteenId_${uid}`);
    if (cachedId) {
      setCanteenId(cachedId);
      fetchMenu(cachedId);
    } else {
      fetch("/api/canteens/my", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(c => {
          if (c?._id) {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const uid = user?._id || user?.id;
            setCanteenId(c._id);
            localStorage.setItem(`myCanteenId_${uid}`, c._id);
            fetchMenu(c._id);
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canteenId) { toast.error("Canteen not found"); return; }
    setSaving(true);
    try {
      const url = editingId ? `/api/menu/update/${editingId}` : "/api/menu/add";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ canteenId, ...form, price: Number(form.price) })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingId ? "Item updated!" : "Item added to menu!");
        setForm({ itemName: "", price: "", category: "Veg", quantity: "" });
        setEditingId(null);
        fetchMenu(canteenId);
      } else {
        toast.error(data.message || "Failed to save item");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item._id);
    setForm({
      itemName: item.itemName,
      price: item.price.toString(),
      category: item.category,
      quantity: item.quantity || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ itemName: "", price: "", category: "Veg", quantity: "" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await fetch(`/api/menu/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Item removed");
      setItems(prev => prev.filter(i => i._id !== id));
    } catch {
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Menu Management</h2>
      </div>

      <div className={`rounded-xl border border-border bg-card p-6 shadow-sm transition-all ${editingId ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-card-foreground">{editingId ? "Edit Item" : "Add New Item"}</h3>
          {editingId && (
            <button onClick={cancelEdit} className="text-xs font-medium text-muted-foreground hover:text-foreground">Cancel Edit</button>
          )}
        </div>
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Item Name</label>
            <input required type="text" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} placeholder="e.g. Veg Biryani" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Quantity</label>
            <input type="text" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 1 Plate, 250ml" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Price (₹)</label>
            <input required type="number" min="1" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="100" className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">
              <option>Veg</option><option>Non-Veg</option><option>Beverage</option>
            </select>
          </div>
          <div className="sm:col-span-4">
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update Item" : "Save Item"}
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Item</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Quantity</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Price</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading menu...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No items yet. Add your first menu item above.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{item.itemName}</td>
                  <td className="px-4 py-3 text-muted-foreground italic">{item.quantity || "-"}</td>
                  <td className="px-4 py-3 text-foreground font-bold">₹{item.price}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.category === "Veg" ? "bg-success/10 text-success" : item.category === "Non-Veg" ? "bg-destructive/10 text-destructive" : "bg-accent/20 text-accent-foreground"}`}>{item.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(item)} className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground hover:text-primary transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CanteenOwnerMenu;
