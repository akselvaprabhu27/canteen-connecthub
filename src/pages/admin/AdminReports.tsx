import React, { useState, useEffect } from "react";
import { AlertTriangle, Clock, Building2, UtensilsCrossed, MessageSquare, Loader2, CheckCircle, XCircle, Search, Filter, Camera, ShieldAlert, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Report {
  _id: string;
  reportId: string;
  userId: { name: string; email: string; phone?: string };
  canteenId: { canteenName: string };
  organizationId: { name: string };
  issueType: string;
  severity: string;
  status: string;
  deadline: string;
  description: string;
  photos: string[];
  createdAt: string;
}

interface Response {
  _id: string;
  senderRole: string;
  message: string;
  attachments: string[];
  createdAt: string;
}

const AdminReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [stats, setStats] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [newResponse, setNewResponse] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);
  const [highReportedCanteens, setHighReportedCanteens] = useState<any[]>([]);
  const [showHighReportedModal, setShowHighReportedModal] = useState(false);
  const [filterCanteenId, setFilterCanteenId] = useState<string | null>(null);
  const [filterCanteenName, setFilterCanteenName] = useState<string>("");

  useEffect(() => {
    fetchReports();
    fetchAnalytics();
    fetchHighReported();
  }, []);

  const fetchHighReported = async () => {
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch("/api/reports/high-reported", {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setHighReportedCanteens(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load high reported canteens:", err);
    }
  };

  const fetchReports = async () => {
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch("/api/reports/admin-reports", {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReports(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch("/api/reports/analytics", {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReportDetails = async (report: Report) => {
    setSelectedReport(report);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch(`/api/reports/${report._id}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setResponses(data.responses);
        // Update the report in the list if details fetched more info
        if (data.report) {
          setSelectedReport(data.report);
        }
      }
    } catch (err) {
      toast.error("Failed to load details");
    }
  };

  const handleAddResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResponse.trim() || !selectedReport) return;

    setSendingResponse(true);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch(`/api/reports/${selectedReport._id}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ message: newResponse })
      });
      const data = await res.json();
      if (res.ok) {
        setResponses(prev => [...prev, data]);
        setNewResponse("");
        toast.success("Response sent");
        if (selectedReport.status === "Pending") {
          setReports(prev => prev.map(r => r._id === selectedReport._id ? { ...r, status: "Under Investigation" } : r));
          setSelectedReport(prev => prev ? { ...prev, status: "Under Investigation" } : null);
        }
      } else {
        toast.error("Failed to send response");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setSendingResponse(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedReport) return;
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch(`/api/reports/${selectedReport._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setReports(prev => prev.map(r => r._id === selectedReport._id ? { ...r, status } : r));
        setSelectedReport(prev => prev ? { ...prev, status } : null);
        toast.success(`Report marked as ${status}`);
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const calculateDeadline = (deadline: string, status: string) => {
    if (status === "Resolved" || status === "Rejected") return "Completed";
    
    const now = new Date().getTime();
    const target = new Date(deadline).getTime();
    const diff = target - now;
    
    if (diff < 0) return "Overdue";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    if (minutes > 0) return `${minutes}m ${seconds}s left`;
    return `${seconds}s left`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-500 text-white shadow-red-500/20";
      case "High": return "bg-orange-500 text-white shadow-orange-500/20";
      case "Medium": return "bg-yellow-500 text-black shadow-yellow-500/20";
      case "Low": return "bg-blue-500 text-white shadow-blue-500/20";
      case "Normal": return "bg-blue-500 text-white shadow-blue-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved": return "bg-green-500/10 text-green-500";
      case "Rejected": return "bg-red-500/10 text-red-500";
      case "Under Investigation": return "bg-blue-500/10 text-blue-500";
      default: return "bg-amber-500/10 text-amber-500";
    }
  };

  const filteredReports = reports.filter(r => {
    if (filterCanteenId) {
      const isSameCanteen = r.canteenId?._id === filterCanteenId || (typeof r.canteenId === 'object' && r.canteenId !== null && (r.canteenId as any)._id === filterCanteenId);
      if (!isSameCanteen) return false;
      
      const reportDate = new Date(r.createdAt).getTime();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (reportDate < sevenDaysAgo.getTime()) return false;
      
      return true;
    }

    return r.reportId.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (r.canteenId?.canteenName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
           (r.organizationId?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
           r.issueType.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* List/Table Panel */}
      <div className={`flex flex-col transition-all duration-500 ease-in-out ${selectedReport ? 'w-1/3 border-r border-border' : 'w-full'}`}>
        <div className="p-8 space-y-8 overflow-y-auto">
          {/* Analytics Summary - Only show when no report selected or in full view */}
          {!selectedReport && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-primary to-orange-600 text-white shadow-xl shadow-primary/20">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Reports</span>
                </div>
                <p className="text-4xl font-black">{reports.length}</p>
                <p className="text-xs font-bold mt-2 opacity-70 flex items-center gap-1">
                  Active System Submissions
                </p>
              </div>
              
              <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Action</span>
                </div>
                <p className="text-4xl font-black text-foreground">{reports.filter(r => r.status === 'Pending').length}</p>
                <p className="text-xs font-bold mt-2 text-muted-foreground">Awaiting Org Response</p>
              </div>

              <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resolution Rate</span>
                </div>
                <p className="text-4xl font-black text-foreground">
                  {reports.length > 0 ? Math.round((reports.filter(r => r.status === 'Resolved').length / reports.length) * 100) : 0}%
                </p>
                <p className="text-xs font-bold mt-2 text-muted-foreground">Successfully Resolved</p>
              </div>

              <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Overdue Reports</span>
                </div>
                <p className="text-4xl font-black text-foreground">{reports.filter(r => calculateDeadline(r.deadline, r.status) === 'Overdue').length}</p>
                <p className="text-xs font-bold mt-2 text-red-500 uppercase tracking-tighter">Immediate Attention</p>
              </div>
            </div>
          )}

          {/* Main Table Content */}
          <div className={`rounded-3xl border border-border bg-card overflow-hidden shadow-sm transition-all ${selectedReport ? 'border-none shadow-none bg-transparent' : ''}`}>
            <div className={`p-6 border-b border-border bg-card/50 flex flex-col md:flex-row md:items-center justify-between gap-4 ${selectedReport ? 'px-0' : ''}`}>
              <div>
                <h2 className="text-xl font-black tracking-tight text-foreground">Global Escalation Center</h2>
                <p className="text-xs text-muted-foreground mt-1">Monitoring {reports.length} food safety reports</p>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setShowHighReportedModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 text-sm font-extrabold hover:bg-red-500 hover:text-white transition duration-150 relative cursor-pointer"
                >
                  <ShieldAlert className="h-4 w-4" />
                  High Reported
                  {highReportedCanteens.length > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg animate-bounce">
                      {highReportedCanteens.length}
                    </span>
                  )}
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none w-full md:w-64"
                  />
                </div>
              </div>
            </div>

            {filterCanteenId && (
              <div className="mx-6 mt-4 p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <ShieldAlert className="h-4 w-4 animate-pulse" />
                  <span>Showing only the last 7 days reports for <strong className="text-foreground">{filterCanteenName}</strong></span>
                </div>
                <button
                  onClick={() => {
                    setFilterCanteenId(null);
                    setFilterCanteenName("");
                  }}
                  className="text-[10px] font-black uppercase bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {selectedReport ? (
              <div className="space-y-3 mt-4">
                {filteredReports.map(report => (
                  <button
                    key={report._id}
                    onClick={() => fetchReportDetails(report)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      selectedReport?._id === report._id 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{report.reportId}</span>
                    </div>
                    <h3 className="font-bold text-foreground truncate">{report.canteenId?.canteenName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{report.issueType}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Report ID</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Org / Canteen</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Issue Type</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Due Date</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground font-bold">Gathering reports...</p>
                        </td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <CheckCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground font-bold">System clean. No reports found.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map(report => (
                        <tr key={report._id} className={`group transition-colors hover:bg-muted/20 ${calculateDeadline(report.deadline, report.status) === 'Overdue' ? 'bg-red-500/5' : ''}`}>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{report.reportId}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                <Building2 className="h-3 w-3 text-muted-foreground" /> {report.organizationId?.name}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <UtensilsCrossed className="h-3 w-3" /> {report.canteenId?.canteenName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-foreground">
                            {report.issueType}
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1.5 text-xs font-black ${calculateDeadline(report.deadline, report.status) === 'Overdue' ? 'text-red-500' : (calculateDeadline(report.deadline, report.status) === 'Completed' ? 'text-green-500' : 'text-amber-500')}`}>
                              <Clock className="h-3.5 w-3.5" /> {calculateDeadline(report.deadline, report.status)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <button 
                              onClick={() => {
                                toast.warning(`Strike issued to ${report.canteenId?.canteenName}. Flagged for review.`);
                              }}
                              className="p-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-600 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              title="Issue Strike"
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => fetchReportDetails(report)}
                              className="p-2 rounded-xl border border-border bg-background text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group-hover:shadow-lg"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Panel - Shared Layout with Org Admin */}
      {selectedReport ? (
        <div className="flex-1 flex flex-col bg-card/30 animate-in slide-in-from-right-full duration-500">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <button 
                    onClick={() => setSelectedReport(null)}
                    className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground mb-4 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" /> Back to Dashboard
                  </button>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{selectedReport.reportId}</span>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${getStatusColor(selectedReport.status)}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-foreground">{selectedReport.issueType}</h2>
                  <p className="text-muted-foreground mt-1">Canteen: <span className="font-bold text-foreground">{selectedReport.canteenId?.canteenName}</span></p>
                  <p className="text-xs text-muted-foreground">Organization: <span className="font-bold">{selectedReport.organizationId?.name}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Response Deadline</p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-bold ${calculateDeadline(selectedReport.deadline, selectedReport.status) === 'Overdue' ? 'border-red-500 text-red-500 bg-red-500/5' : (calculateDeadline(selectedReport.deadline, selectedReport.status) === 'Completed' ? 'border-green-500 text-green-500 bg-green-500/5' : 'border-amber-500 text-amber-500 bg-amber-500/5')}`}>
                    <Clock className="h-4 w-4" /> {calculateDeadline(selectedReport.deadline, selectedReport.status)}
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex gap-2">
                {selectedReport.status !== 'Under Investigation' && selectedReport.status !== 'Resolved' && selectedReport.status !== 'Rejected' && (
                  <button onClick={() => updateStatus('Under Investigation')} className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
                    <ShieldAlert className="h-4 w-4" /> Investigate
                  </button>
                )}
                {selectedReport.status !== 'Resolved' && (
                  <button onClick={() => updateStatus('Resolved')} className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-green-600 transition-all shadow-lg shadow-green-500/20">
                    <CheckCircle className="h-4 w-4" /> Mark as Resolved
                  </button>
                )}
                {selectedReport.status !== 'Rejected' && (
                  <button onClick={() => updateStatus('Rejected')} className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
                    <XCircle className="h-4 w-4" /> Reject Report
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User & Order Info */}
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl border border-border bg-background shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">User Details</h4>
                    <p className="text-sm font-bold text-foreground">{selectedReport.userId.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedReport.userId.email}</p>
                    {selectedReport.userId.phone && <p className="text-xs text-muted-foreground mt-0.5">{selectedReport.userId.phone}</p>}
                  </div>
                  <div className="p-6 rounded-3xl border border-border bg-background shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Description</h4>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
                  </div>
                </div>

                {/* Photos */}
                <div className="p-6 rounded-3xl border border-border bg-background shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Evidence Photos</h4>
                  {selectedReport.photos && selectedReport.photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedReport.photos.map((photo, i) => (
                        <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-border bg-muted">
                          <img src={photo} alt="Evidence" className="h-full w-full object-cover hover:scale-110 transition-transform cursor-pointer" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
                      <Camera className="h-8 w-8 opacity-20 mb-2" />
                      <p className="text-[10px] font-bold uppercase">No photos uploaded</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Response Timeline */}
              <div className="space-y-6 pb-20">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Communication Timeline
                </h4>
                <div className="space-y-4">
                  {responses.map((resp, i) => (
                    <div key={i} className={`flex ${resp.senderRole === 'super_admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm text-white ${
                        resp.senderRole === 'super_admin'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : resp.senderRole === 'org_admin'
                            ? 'bg-primary/20 border border-primary/20 rounded-bl-none'
                            : resp.senderRole === 'user'
                              ? 'bg-muted border border-border rounded-bl-none'
                              : 'bg-purple-950/40 border border-purple-500/20 rounded-bl-none'
                      }`}>
                        <div className="flex justify-between items-center gap-8 mb-1">
                          <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">
                            {resp.senderRole.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] opacity-70">{new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{resp.message}</p>
                      </div>
                    </div>
                  ))}
                  {responses.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto opacity-20 mb-2" />
                      <p className="text-xs font-bold uppercase">No conversation history yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Response Input */}
          <div className="p-6 border-t border-border bg-card/90 backdrop-blur-md">
            <form onSubmit={handleAddResponse} className="max-w-3xl mx-auto flex gap-3">
              <input
                type="text"
                value={newResponse}
                onChange={e => setNewResponse(e.target.value)}
                placeholder="Participate in conversation..."
                className="flex-1 rounded-2xl border border-border bg-background px-6 py-4 text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={sendingResponse || !newResponse.trim()}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {sendingResponse ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden"></div>
      )}

      {showHighReportedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500 animate-pulse">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Escalated Warning Center</h3>
                  <p className="text-xs text-muted-foreground">Canteens with 5+ safety reports in the last 7 days</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHighReportedModal(false)}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {highReportedCanteens.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-10 w-10 text-green-500/30 mx-auto mb-3" />
                <p className="text-sm font-bold">No High-Reported Canteens</p>
                <p className="text-xs text-muted-foreground mt-1">All canteens are operating under normal reporting levels.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {highReportedCanteens.map((canteen) => (
                  <div key={canteen.canteenId} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-border bg-muted/30 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${canteen.isBlocked ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                        <h4 className="font-extrabold text-foreground">{canteen.canteenName}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                        <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-md">
                          {canteen.totalReports} Reports (Weekly)
                        </span>
                        <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md">
                          {canteen.pendingCount} Pending
                        </span>
                        <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-md">
                          {canteen.investigatingCount} Investigating
                        </span>
                        <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded-md">
                          {canteen.resolvedCount} Resolved
                        </span>
                        <span className="bg-red-500/5 text-red-400 px-2 py-0.5 rounded-md">
                          {canteen.rejectedCount} Rejected
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setFilterCanteenId(canteen.canteenId);
                          setFilterCanteenName(canteen.canteenName);
                          setShowHighReportedModal(false);
                          setSelectedReport(null);
                        }}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black bg-slate-800 border border-slate-700 hover:bg-slate-700 active:bg-slate-800 text-slate-200 rounded-xl transition duration-150 cursor-pointer shadow-md"
                      >
                        <Clock className="h-4 w-4 text-primary" />
                        Weekly Reports
                      </button>
                      <button
                        onClick={() => {
                          setShowHighReportedModal(false);
                          navigate("/admin/take-action");
                        }}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl transition duration-150 cursor-pointer shadow-md shadow-red-500/20"
                      >
                        Take Action <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
