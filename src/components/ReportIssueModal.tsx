import React, { useState } from "react";
import { X, AlertTriangle, Upload, Loader2, Camera, Info } from "lucide-react";
import { toast } from "sonner";

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

const ISSUE_TYPES = [
  "Spoiled Food", "Bad Taste", "Food Poisoning Symptoms", 
  "Low Food Quality", "Hygiene Problem", "Wrong Item Delivered", 
  "Missing Items", "Late Preparation", "Unsafe Packaging", 
  "Staff Misbehavior", "Overpricing", "Other"
];

export const ReportIssueModal = ({ isOpen, onClose, order }: ReportIssueModalProps) => {
  const [showWarning, setShowWarning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    issueType: ISSUE_TYPES[0],
    severity: "Normal",
    description: "",
    contactPreference: "No Contact Needed",
    photos: [] as string[],
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) {
      toast.error("Please provide a description");
      return;
    }

    setLoading(true);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;

      const payload = {
        orderId: order._id,
        canteenId: order.canteenId?._id || order.canteenId, // Handle both object and string
        organizationId: order.organizationId || user?.organizationId,
        ...formData
      };

      console.log("Submitting Report with Payload:", payload);

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Report submitted successfully");
        onClose();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to submit report");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (showWarning) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Report Issue</h2>
            <p className="text-sm text-muted-foreground mb-6">
              ⚠ Please report only genuine issues. Misuse of the reporting system may lead to account restrictions.
            </p>
            <div className="flex w-full gap-3">
              <button 
                onClick={onClose}
                className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowWarning(false)}
                className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">File Formal Report</h2>
              <p className="text-xs text-muted-foreground">Order #{order.orderId || order._id.slice(-6)}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Issue Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Issue Type</label>
            <select 
              value={formData.issueType}
              onChange={e => setFormData(prev => ({ ...prev, issueType: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide detailed explanation of the issue..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Upload Photos (Optional)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {formData.photos.map((photo, idx) => (
                <div key={idx} className="group relative aspect-square rounded-2xl border border-border overflow-hidden bg-muted">
                  <img src={photo} alt="Upload preview" className="h-full w-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {formData.photos.length < 4 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/50 hover:bg-muted hover:border-primary/50 transition-all">
                  <Camera className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Add Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3 w-3" /> Max 4 photos. Food, packaging, or bill photos are recommended.
            </p>
          </div>

          {/* Contact Preference */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Preference</label>
            <div className="flex flex-wrap gap-3">
              {["Call Me", "Email Me", "No Contact Needed"].map(pref => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, contactPreference: pref }))}
                  className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                    formData.contactPreference === pref 
                      ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20' 
                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-border px-6 py-3.5 text-sm font-bold text-foreground hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
