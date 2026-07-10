import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, ChefHat, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const FOOD_TYPES = ["Veg", "Non-Veg", "General"];
const CATEGORIES = ["Fast Food", "South Indian", "North Indian", "Chinese", "Continental", "Snacks & Beverages", "Bakery", "Multi-Cuisine", "Other"];
const STEPS = ["Canteen Info", "Owner Details", "Operations", "Banking Info", "Account Setup"];

const defaultForm = {
  canteenName: "", ownerName: "", ownerEmail: "", ownerPhone: "", alternatePhone: "",
  organizationName: "", category: "Fast Food", foodType: "General", logoUrl: "",
  address: "", floorBlock: "", seatingCapacity: "", kitchenCapacity: "", numberOfStaff: "",
  openingTime: "08:00", closingTime: "21:00", fssaiLicense: "", businessDescription: "",
  bankAccountName: "", bankAccountNumber: "", ifscCode: "", upiId: "",
  password: "", confirmPassword: "", terms: false,
};

const inputCls = "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all";
const labelCls = "mb-1.5 block text-sm font-medium text-foreground";

const CanteenRegisterPage = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  useEffect(() => {
    fetch("/api/organizations")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setOrgs(data);
      })
      .catch(() => {});
  }, []);

  const filteredOrgs = orgs.filter(o => o.name.toLowerCase().includes(form.organizationName.toLowerCase()));

  const set = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!form.terms) {
      toast.error("Please accept the Terms and Conditions");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/canteens/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Request Submitted!</h1>
          <p className="text-muted-foreground text-base mb-6">
            Your canteen registration has been sent for approval. Both your organization and Super Admin will review your request.
          </p>
          <div className="rounded-2xl border border-border bg-card p-6 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-sm text-foreground">Organization Approval: <span className="font-medium text-amber-500">Pending</span></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-sm text-foreground">Super Admin Approval: <span className="font-medium text-amber-500">Pending</span></span>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-heading text-2xl font-bold text-primary">
            <UtensilsCrossed className="h-7 w-7" /> CanteenHub
          </div>
          <h1 className="mt-3 text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" /> Canteen Registration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Register your canteen to join CanteenHub</p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border z-0" />
            {STEPS.map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-1.5">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i < step ? "bg-primary border-primary text-primary-foreground" :
                  i === step ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30" :
                  "bg-background border-border text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm animate-fade-in">
          <form onSubmit={step === STEPS.length - 1 ? handleSubmit : (e) => { e.preventDefault(); next(); }}>

            {/* Step 0: Canteen Info */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground mb-4">Canteen Information</h2>
                <div>
                  <label className={labelCls}>Canteen Name *</label>
                  <input required type="text" value={form.canteenName} onChange={e => set("canteenName", e.target.value)} placeholder="e.g. Taste Kitchen" className={inputCls} />
                </div>
                <div className="relative">
                  <label className={labelCls}>Organization Name *</label>
                  <input
                    required
                    type="text"
                    value={form.organizationName}
                    onChange={e => {
                      set("organizationName", e.target.value);
                      setShowOrgDropdown(true);
                    }}
                    onFocus={() => setShowOrgDropdown(true)}
                    onBlur={() => setTimeout(() => setShowOrgDropdown(false), 200)}
                    placeholder="Search or type organization name"
                    className={inputCls}
                    autoComplete="off"
                  />
                  {showOrgDropdown && form.organizationName && (
                    <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card shadow-xl p-1.5 animate-fade-in">
                      {filteredOrgs.length > 0 ? (
                        filteredOrgs.map(org => (
                          <div
                            key={org._id}
                            className="relative flex cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2.5 text-sm outline-none hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => {
                              set("organizationName", org.name);
                              setShowOrgDropdown(false);
                            }}
                          >
                            <span className="font-medium">{org.name}</span>
                            {org.type && (
                              <span className="text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {org.type}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center flex flex-col items-center gap-1">
                          <span className="font-medium text-foreground/70">No approved organizations found</span>
                          <span className="text-xs">Try a different search term</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Category *</label>
                    <select required value={form.category} onChange={e => set("category", e.target.value)} className={inputCls}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Food Type *</label>
                    <select required value={form.foodType} onChange={e => set("foodType", e.target.value)} className={inputCls}>
                      {FOOD_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Canteen Logo URL</label>
                  <input type="url" value={form.logoUrl} onChange={e => set("logoUrl", e.target.value)} placeholder="https://..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Address / Location *</label>
                  <textarea required value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full address within the organization" rows={2} className={inputCls + " resize-none"} />
                </div>
                <div>
                  <label className={labelCls}>Floor / Block</label>
                  <input type="text" value={form.floorBlock} onChange={e => set("floorBlock", e.target.value)} placeholder="e.g. Ground Floor, Block A" className={inputCls} />
                </div>
              </div>
            )}

            {/* Step 1: Owner Details */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground mb-4">Owner Details</h2>
                <div>
                  <label className={labelCls}>Owner Full Name *</label>
                  <input required type="text" value={form.ownerName} onChange={e => set("ownerName", e.target.value)} placeholder="Full name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Owner Email *</label>
                  <input required type="email" value={form.ownerEmail} onChange={e => set("ownerEmail", e.target.value)} placeholder="owner@example.com" className={inputCls} />
                  <p className="mt-1 text-xs text-muted-foreground">This will be used for login</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Owner Phone *</label>
                    <input required type="tel" value={form.ownerPhone} onChange={e => set("ownerPhone", e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Alternate Phone</label>
                    <input type="tel" value={form.alternatePhone} onChange={e => set("alternatePhone", e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Operations */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground mb-4">Operations</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Seating Capacity</label>
                    <input type="number" min={0} value={form.seatingCapacity} onChange={e => set("seatingCapacity", e.target.value)} placeholder="50" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Kitchen Capacity</label>
                    <input type="number" min={0} value={form.kitchenCapacity} onChange={e => set("kitchenCapacity", e.target.value)} placeholder="20" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>No. of Staff</label>
                    <input type="number" min={0} value={form.numberOfStaff} onChange={e => set("numberOfStaff", e.target.value)} placeholder="5" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Opening Time *</label>
                    <input required type="time" value={form.openingTime} onChange={e => set("openingTime", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Closing Time *</label>
                    <input required type="time" value={form.closingTime} onChange={e => set("closingTime", e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>FSSAI License Number</label>
                  <input type="text" value={form.fssaiLicense} onChange={e => set("fssaiLicense", e.target.value)} placeholder="Food Safety License number" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Business Description *</label>
                  <textarea required value={form.businessDescription} onChange={e => set("businessDescription", e.target.value)} placeholder="Tell us about your canteen, specialties..." rows={3} className={inputCls + " resize-none"} />
                </div>
              </div>
            )}

            {/* Step 3: Banking Info */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground mb-4">Banking Information</h2>
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-3">This information will be used for payments and settlements.</p>
                <div>
                  <label className={labelCls}>Bank Account Name</label>
                  <input type="text" value={form.bankAccountName} onChange={e => set("bankAccountName", e.target.value)} placeholder="Account holder name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Bank Account Number</label>
                  <input type="text" value={form.bankAccountNumber} onChange={e => set("bankAccountNumber", e.target.value)} placeholder="Account number" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>IFSC Code</label>
                  <input type="text" value={form.ifscCode} onChange={e => set("ifscCode", e.target.value)} placeholder="e.g. SBIN0001234" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>UPI ID</label>
                  <input type="text" value={form.upiId} onChange={e => set("upiId", e.target.value)} placeholder="e.g. owner@upi" className={inputCls} />
                </div>
              </div>
            )}

            {/* Step 4: Account Setup */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground mb-4">Account Setup</h2>
                <div>
                  <label className={labelCls}>Password *</label>
                  <input required type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Minimum 8 characters" className={inputCls} minLength={8} />
                </div>
                <div>
                  <label className={labelCls}>Confirm Password *</label>
                  <input required type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="Re-enter your password" className={inputCls} />
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.terms}
                      onChange={e => set("terms", e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                      required
                    />
                    <span className="text-sm text-muted-foreground">
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline font-medium">Terms and Conditions</a>{" "}
                      and{" "}
                      <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>{" "}
                      of CanteenHub.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              {step > 0 ? (
                <button type="button" onClick={prev} className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Already registered? Login
                </Link>
              )}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {step === STEPS.length - 1
                  ? (loading ? "Submitting..." : "Submit Registration")
                  : (<>Next <ChevronRight className="h-4 w-4" /></>)
                }
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Registering an organization?{" "}
          <Link to="/register-organization" className="text-primary hover:underline font-medium">Register your organization here</Link>
        </p>
      </div>
    </div>
  );
};

export default CanteenRegisterPage;
