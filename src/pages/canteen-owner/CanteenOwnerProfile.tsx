import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CanteenData {
  _id: string;
  canteenName: string;
  category: string;
  ownerName: string;
  ownerPhone: string;
  openingTime: string;
  closingTime: string;
}

const CanteenOwnerProfile = () => {
  const [canteen, setCanteen] = useState<CanteenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const res = await fetch("/api/canteens/my", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCanteen({
          _id: data._id,
          canteenName: data.canteenName || "",
          category: data.category || "General",
          ownerName: data.ownerName || "",
          ownerPhone: data.ownerPhone || "",
          openingTime: data.openingTime || "",
          closingTime: data.closingTime || "",
        });
      } else {
        toast.error("Failed to load profile details");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canteen) return;
    setSaving(true);
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const res = await fetch(`/api/canteens/${canteen._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(canteen),
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canteen) {
    return <div className="text-muted-foreground">Failed to load canteen details.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground">Profile Settings</h2>
      <div className="max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Canteen Name</label>
            <input
              type="text"
              value={canteen.canteenName}
              onChange={(e) => setCanteen({ ...canteen, canteenName: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
            <select
              value={canteen.category}
              onChange={(e) => setCanteen({ ...canteen, category: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="General">General</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Owner Name</label>
            <input
              type="text"
              value={canteen.ownerName}
              onChange={(e) => setCanteen({ ...canteen, ownerName: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Contact Number</label>
            <input
              type="tel"
              value={canteen.ownerPhone}
              onChange={(e) => setCanteen({ ...canteen, ownerPhone: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Opening Time</label>
              <input
                type="time"
                value={canteen.openingTime}
                onChange={(e) => setCanteen({ ...canteen, openingTime: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Closing Time</label>
              <input
                type="time"
                value={canteen.closingTime}
                onChange={(e) => setCanteen({ ...canteen, closingTime: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanteenOwnerProfile;
