import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, Building2, ChevronRight, ChevronLeft, CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";

const ORG_TYPES = ["College", "Company", "Hospital", "Hostel", "Tech Park", "Factory", "Other"];

const STEPS = ["Organization Info", "Contact Details", "Admin Details", "Business Info", "Account Setup"];

const defaultForm = {
  name: "", type: "College", address: "", city: "", state: "", pincode: "",
  officialEmail: "", phone: "", alternatePhone: "", websiteUrl: "",
  adminFullName: "", adminEmail: "", adminPhone: "",
  expectedUsers: "", expectedCanteens: "", businessDescription: "", gstNumber: "",
  password: "", confirmPassword: "", terms: false, logoUrl: "",
};

const inputCls = "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all";
const labelCls = "mb-1.5 block text-sm font-medium text-foreground";

const OrgRegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      const res = await fetch("/api/organizations/register", {
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
            Your request has been sent to Super Admin for approval. You will be notified once reviewed.
          </p>
          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <p className="text-sm text-muted-foreground">
              You can check your approval status by logging in at any time.
            </p>
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
            <Building2 className="h-6 w-6 text-primary" /> Organization Registration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Register your organization to get started with CanteenHub</p>
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
            
            {/* Step 0: Organization Info */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground mb-4">Organization Information</h2>
                <div>
                  <label className={labelCls}>Organization Name *</label>
                  <input required type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. IIT Delhi" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Organization Type *</label>
                  <select required value={form.type} onChange={e => set("type", e.target.value)} className={inputCls}>
                    {ORG_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Organization Address *</label>
                  <textarea required value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full address" rows={2} className={inputCls + " resize-none"} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>City *</label>
                    <input required type="text" value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>State *</label>
                    <input required type="text" value={form.state} onChange={e => set("state", e.target.value)} placeholder="State" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Pincode *</label>
                    <input required type="text" value={form.pincode} onChange={e => set("pincode", e.target.value)} placeholder="000000" className={inputCls} maxLength={6} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Organization Logo URL</label>
                  <input type="url" value={form.logoUrl} onChange={e => set("logoUrl", e.target.value)} placeholder="https://..." className={inputCls} />
                  <p className="mt-1 text-xs text-muted-foreground">Paste a direct link to your organization logo</p>
                </div>
              </div>
            )}

            {/* Step 1: Contact Details */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground mb-4">Contact Details</h2>
                <div>
                  <label className={labelCls}>Official Email *</label>
                  <input required type="email" value={form.officialEmail} onChange={e => set("officialEmail", e.target.value)} placeholder="org@example.com" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Phone Number *</label>
                    <input required type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Alternate Phone</label>
                    <input type="tel" value={form.alternatePhone} onChange={e => set("alternatePhone", e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Website URL</label>
                  <input type="url" value={form.websiteUrl} onChange={e => set("websiteUrl", e.target.value)} placeholder="https://yourorg.com" className={inputCls} />
                </div>
              </div>
            )}

            {/* Step 2: Admin Details */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground mb-4">Admin Details</h2>
                <div>
                  <label className={labelCls}>Admin Full Name *</label>
                  <input required type="text" value={form.adminFullName} onChange={e => set("adminFullName", e.target.value)} placeholder="Full name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Admin Email *</label>
                  <input required type="email" value={form.adminEmail} onChange={e => set("adminEmail", e.target.value)} placeholder="admin@example.com" className={inputCls} />
                  <p className="mt-1 text-xs text-muted-foreground">This will be used for login</p>
                </div>
                <div>
                  <label className={labelCls}>Admin Phone *</label>
                  <input required type="tel" value={form.adminPhone} onChange={e => set("adminPhone", e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputCls} />
                </div>
              </div>
            )}

            {/* Step 3: Business Info */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground mb-4">Business Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Expected Number of Users *</label>
                    <input required type="number" min={1} value={form.expectedUsers} onChange={e => set("expectedUsers", e.target.value)} placeholder="e.g. 500" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Expected Number of Canteens *</label>
                    <input required type="number" min={1} value={form.expectedCanteens} onChange={e => set("expectedCanteens", e.target.value)} placeholder="e.g. 5" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Business Description *</label>
                  <textarea required value={form.businessDescription} onChange={e => set("businessDescription", e.target.value)} placeholder="Tell us about your organization and why you want to use CanteenHub..." rows={4} className={inputCls + " resize-none"} />
                </div>
                <div>
                  <label className={labelCls}>GST / Registration Number</label>
                  <input type="text" value={form.gstNumber} onChange={e => set("gstNumber", e.target.value)} placeholder="GST or business registration number" className={inputCls} />
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

            {/* Navigation Buttons */}
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

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Are you a canteen owner?{" "}
          <Link to="/register-canteen" className="text-primary hover:underline font-medium">Register your canteen here</Link>
        </p>
      </div>
    </div>
  );
};

export default OrgRegisterPage;
