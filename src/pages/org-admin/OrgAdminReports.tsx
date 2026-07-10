import React, { useState, useEffect } from "react";
import { AlertTriangle, Clock, ChevronRight, MessageSquare, Loader2, CheckCircle, XCircle, Search, Filter, Camera, Send, ShieldAlert, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Report {
  _id: string;
  reportId: string;
  userId: { name: string; email: string };
  canteenId: { canteenName: string };
  issueType: string;
  severity: string;
  status: string;
  deadline: string;
  description: string;
  photos: string[];
  createdAt: string;
}

interface Fine {
  _id: string;
  fineId: string;
  amount: number;
  reason: string;
  status: string;
}

interface Response {
  _id: string;
  senderRole: string;
  message: string;
  attachments: string[];
  createdAt: string;
}

const OrgAdminReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [newResponse, setNewResponse] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [fines, setFines] = useState<Fine[]>([]);
  const [processingFine, setProcessingFine] = useState<string | null>(null);
  const [highReportedCanteens, setHighReportedCanteens] = useState<any[]>([]);
  const [showHighReportedModal, setShowHighReportedModal] = useState(false);
  const [filterCanteenId, setFilterCanteenId] = useState<string | null>(null);
  const [filterCanteenName, setFilterCanteenName] = useState<string>("");

  useEffect(() => {
    fetchReports();
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
      const res = await fetch("/api/reports/org-reports", {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReports(Array.isArray(data) ? data : []);
      } else {
        toast.error("Failed to load reports");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
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
        setFines(data.fines || []);
        if (data.report) setSelectedReport(data.report);
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
        // Refresh status if it was pending
        if (selectedReport.status === "Pending") {
          setReports(prev => prev.map(r => r._id === selectedReport._id ? { ...r, status: "Under Investigation" } : r));
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

  const handlePayFine = async (fineId: string) => {
    setProcessingFine(fineId);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      const res = await fetch(`/api/fines/pay/${fineId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ transactionId: "TEST_PAY_" + Date.now() })
      });
      if (res.ok) {
        setFines(prev => prev.map(f => f._id === fineId ? { ...f, status: "Paid" } : f));
        toast.success("Fine paid successfully");
        // Also add a local response to show PAID
        const paidFine = fines.find(f => f._id === fineId);
        if (paidFine) {
          setResponses(prev => [...prev, {
            _id: Math.random().toString(),
            senderRole: "system",
            message: `PAID: Fine of ${paidFine.amount} has been paid.`,
            attachments: [],
            createdAt: new Date().toISOString()
          }]);
        }
      }
    } catch (err) {
      toast.error("Payment failed");
    } finally {
      setProcessingFine(null);
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
      case "Critical": return "bg-red-500 text-white";
      case "High": return "bg-orange-500 text-white";
      case "Medium": return "bg-yellow-500 text-black";
      case "Low": return "bg-blue-500 text-white";
      case "Normal": return "bg-blue-500 text-white";
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
           r.issueType.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* List Panel */}
      <div className={`flex flex-col border-r border-border transition-all duration-300 ${selectedReport ? 'w-1/3' : 'w-full'}`}>
        <div className="p-6 border-b border-border bg-card/50">
          <h1 className="text-2xl font-bold text-foreground mb-4">Food Safety Reports</h1>
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary/20 outline-none"
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

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <CheckCircle className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No reports found.</p>
            </div>
          ) : (
            filteredReports.map(report => (
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
                <h3 className="font-bold text-foreground truncate">{report.canteenId.canteenName}</h3>
                <p className="text-xs text-muted-foreground mt-1">{report.issueType}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${calculateDeadline(report.deadline, report.status) === 'Overdue' ? 'text-red-500' : (calculateDeadline(report.deadline, report.status) === 'Completed' ? 'text-green-500' : 'text-amber-500')}`}>
                    <Clock className="h-3 w-3" /> {calculateDeadline(report.deadline, report.status)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Details Panel */}
      {selectedReport ? (
        <div className="flex-1 flex flex-col bg-card/30">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{selectedReport.reportId}</span>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${getStatusColor(selectedReport.status)}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-foreground">{selectedReport.issueType}</h2>
                  <p className="text-muted-foreground mt-1">Canteen: <span className="font-bold text-foreground">{selectedReport.canteenId.canteenName}</span></p>
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
                            : 'bg-muted border border-border rounded-bl-none'
                      }`}>
                        <div className="flex justify-between items-center gap-8 mb-1">
                          <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">
                            {resp.senderRole.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] opacity-70">{new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{resp.message}</p>
                        
                        {/* If system message contains fine instruction and fine is pending, show pay button */}
                        {resp.senderRole === 'system' && resp.message.includes('Fine issued') && (
                          <div className="mt-3 pt-3 border-t border-border/20">
                            {fines.some(f => f.status === 'Pending') ? (
                              <button 
                                onClick={() => {
                                  const pendingFine = fines.find(f => f.status === 'Pending');
                                  if (pendingFine) handlePayFine(pendingFine._id);
                                }}
                                disabled={!!processingFine}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-black hover:opacity-90 transition-all shadow-lg"
                              >
                                {processingFine ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
                                PAY FINE NOW
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle className="h-4 w-4" /> Fine Paid
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                placeholder="Type your official response..."
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
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card/20 text-center">
          <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-6">
            <AlertTriangle className="h-12 w-12 text-primary/20" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground/40">Select a report to view details</h2>
          <p className="text-sm text-muted-foreground mt-2">Investigate food safety concerns and respond within the deadline.</p>
        </div>
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
                          navigate("/org-admin/take-action");
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

export default OrgAdminReports;
