import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, User, Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const inputCls =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all";
const labelCls = "mb-1.5 block text-sm font-medium text-foreground";

const RegisterPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "",
    dateOfBirth: "",
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Day, Month, Year select options for DOB (highly responsive & intuitive)
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

  const handleDobChange = (field: "day" | "month" | "year", value: string) => {
    let newDay = dobDay;
    let newMonth = dobMonth;
    let newYear = dobYear;

    if (field === "day") {
      newDay = value;
      setDobDay(value);
    } else if (field === "month") {
      newMonth = value;
      setDobMonth(value);
    } else if (field === "year") {
      newYear = value;
      setDobYear(value);
    }

    if (newDay && newMonth && newYear) {
      setFormData((f) => ({ ...f, dateOfBirth: `${newYear}-${newMonth}-${newDay}` }));
    } else {
      setFormData((f) => ({ ...f, dateOfBirth: "" }));
    }
  };

  const set = (field: string, value: string) =>
    setFormData((f) => ({ ...f, [field]: value }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }
    setProfilePhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // Build payload — role is ALWAYS forced to "user" here
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        gender: formData.gender || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        role: "user", // Hardcoded — backend will also enforce this
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created successfully! Welcome to CanteenHub 🎉");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-heading text-2xl font-bold text-primary">
            <UtensilsCrossed className="h-7 w-7" /> CanteenHub
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your personal account to get started.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-20 w-20 cursor-pointer rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden hover:border-primary transition-colors"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <Upload className="h-5 w-5 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Profile photo{" "}
                <span className="text-muted-foreground/60">(optional)</span>
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className={labelCls}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="John Doe"
                className={inputCls}
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelCls}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className={labelCls}>
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className={inputCls}
              />
            </div>

            {/* Password */}
            <div>
              <label className={labelCls}>
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Minimum 8 characters"
                  className={inputCls + " pr-11"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={labelCls}>
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="Re-enter your password"
                  className={inputCls + " pr-11"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className={labelCls}>
                Gender{" "}
                <span className="text-muted-foreground/60 text-xs">(optional)</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => set("gender", e.target.value)}
                className={inputCls}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className={labelCls}>
                Date of Birth{" "}
                <span className="text-muted-foreground/60 text-xs">(optional)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={dobDay}
                  onChange={(e) => handleDobChange("day", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Day</option>
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {parseInt(d)}
                    </option>
                  ))}
                </select>
                <select
                  value={dobMonth}
                  onChange={(e) => handleDobChange("month", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={dobYear}
                  onChange={(e) => handleDobChange("year", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">or register as</span>
              <div className="flex-1 border-t border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/register-organization"
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                🏢 Organization
              </Link>
              <Link
                to="/register-canteen"
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                🍽️ Canteen Owner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
