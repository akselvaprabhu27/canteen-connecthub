import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, Save, ArrowLeft, Camera, LogOut } from "lucide-react";
import { toast } from "sonner";

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(true);

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

  // Sync dropdowns with loaded profile date of birth
  useEffect(() => {
    if (formData.dateOfBirth) {
      const [year, month, day] = formData.dateOfBirth.split("-");
      setDobDay(day || "");
      setDobMonth(month || "");
      setDobYear(year || "");
    } else {
      setDobDay("");
      setDobMonth("");
      setDobYear("");
    }
  }, [formData.dateOfBirth]);

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
          const u = await response.json();
          if (u.role === "super_admin") {
            navigate("/admin");
            return;
          }
          setUser(u);
          setFormData({
            name: u.name || "",
            email: u.email || "",
            phone: u.phone || "",
            dateOfBirth: u.dateOfBirth ? u.dateOfBirth.split("T")[0] : ""
          });
        } else {
          // Fallback to local storage if API fails
          const stored = localStorage.getItem("user");
          if (stored) {
            const u = JSON.parse(stored);
            if (u.role === "super_admin") {
              navigate("/admin");
              return;
            }
            setUser(u);
            setFormData({
              name: u.name || "",
              email: u.email || "",
              phone: u.phone || "",
              dateOfBirth: u.dateOfBirth ? u.dateOfBirth.split("T")[0] : ""
            });
          } else {
            navigate("/login");
          }
        }
      } catch (error) {
        toast.error("Failed to fetch profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        // Ensure we merge with existing token and role
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event("storage"));
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting to change password...");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log("Fetch URL: /api/auth/change-password");
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });
      
      console.log("Response status:", response.status);
      const data = await response.json();
      if (response.ok) {
        toast.success("Password changed successfully!");
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        console.error("Password change error:", data);
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("An error occurred while changing password");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-heading">Loading...</div>;

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto max-w-4xl px-3 py-6 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/20 transition-all shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Profile Section */}
          <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-2xl shadow-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-28 sm:h-32 bg-gradient-to-r from-primary/80 to-primary" />
            
            <div className="relative px-4 pb-6 sm:px-8 sm:pb-8">
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0">
                <div className="relative">
                  <div className="flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-3xl border-4 border-card bg-primary text-3xl sm:text-4xl font-bold text-primary-foreground shadow-xl">
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute -bottom-2 -right-2 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-card border border-border text-foreground shadow-lg hover:bg-muted transition-colors">
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>

              <div className="pt-16 sm:pt-4 sm:ml-40 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{formData.name}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{formData.email}</p>
                </div>
                <button 
                  onClick={handleSave}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
                >
                  <Save className="h-4 w-4" /> Save Changes
                </button>
              </div>

              <div className="mt-12 grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <User className="h-3.5 w-3.5" /> Full Name
                    </label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" /> Email Address
                    </label>
                    <input 
                      type="email" 
                      value={formData.email}
                      disabled
                      className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> Phone Number
                    </label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" /> Date of Birth
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={dobDay}
                        onChange={(e) => handleDobChange("day", e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
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
                        className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
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
                        className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
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
                </div>
              </div>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="rounded-3xl border border-border bg-card p-8 shadow-2xl shadow-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <Save className="h-4 w-4" />
              </span>
              Change Password
            </h2>
            
            <form onSubmit={handleChangePassword} className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Old Password</label>
                <input 
                  type="password"
                  required
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
                <input 
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm New Password</label>
                <input 
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="md:col-span-3">
                <button 
                  type="submit"
                  className="rounded-xl bg-foreground px-6 py-3 text-sm font-bold text-background hover:bg-foreground/90 transition-all active:scale-[0.98]"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
