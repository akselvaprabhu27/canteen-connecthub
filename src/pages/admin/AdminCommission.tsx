import { useEffect, useState } from "react";
import { toast } from "sonner";

const AdminCommission = () => {
  const [commission, setCommission] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/analytics/super-admin", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setCommission(String(data.platformCommission ?? 0));
        setLoading(false);
      })
      .catch(() => {
        setCommission("0");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const numValue = parseFloat(commission);
    if (commission.trim() === "" || isNaN(numValue) || numValue < 0 || numValue > 100) {
      toast.error("Please enter a valid commission between 0 and 100.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/analytics/commission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ commission: numValue }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Commission set to ${numValue}%. New orders will deduct this rate automatically.`
        );
      } else {
        toast.error(data.message || "Failed to save");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const numVal = parseFloat(commission);
  const previewValid = commission.trim() !== "" && !isNaN(numVal) && numVal >= 0 && numVal <= 100;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Commission Settings</h2>
      <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading current commission...</p>
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Platform Commission (%)
              </label>
              <input
                type="number"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                min={0}
                max={100}
                step={0.1}
                placeholder="Enter % e.g. 10"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                This percentage is deducted from every order placed on the platform.
              </p>
            </div>

            {previewValid && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs space-y-1">
                <p className="font-semibold text-primary">Live Preview (per ₹100 order)</p>
                <p className="text-muted-foreground">
                  Commission deducted:{" "}
                  <span className="text-foreground font-medium">
                    ₹{numVal.toFixed(2)}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Canteen receives:{" "}
                  <span className="text-foreground font-medium">
                    ₹{(100 - numVal).toFixed(2)}
                  </span>
                </p>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCommission;
