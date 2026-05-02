import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PanelDashboardLayout from "../PanelDashboardLayout";
import {
  getElectiveSessionAPI,
  updateElectiveSessionAPI,
  getElectiveSessionSelectionsAPI,
  lockElectiveSessionAPI,
  lockElectiveStudentAPI,
  unlockElectiveStudentAPI,
  exportElectiveSessionSelectionsAPI,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const STATUS_META = {
  draft: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", label: "Draft" },
  open: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Open" },
  closed: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", label: "Closed" },
  locked: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Locked" },
};

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "--";

const Pill = ({ children, className }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${className}`}>
    {children}
  </span>
);

const ElectiveSessionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(false);
  const [tab, setTab] = useState("overview");

  const fetchSession = useCallback(async () => {
    try {
      const res = await getElectiveSessionAPI(id);
      setSession(res.session);
      setStats(res.stats);
    } catch {
      toast.error("Failed to load session");
      navigate("/panel-admin/elective-sessions");
    }
  }, [id, navigate]);

  const fetchSelections = useCallback(async () => {
    try {
      const res = await getElectiveSessionSelectionsAPI(id);
      setStudents(res.students || []);
    } catch {}
  }, [id]);

  useEffect(() => {
    Promise.all([fetchSession(), fetchSelections()]).finally(() => setLoading(false));
  }, [fetchSession, fetchSelections]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      if (newStatus === "locked") await lockElectiveSessionAPI(id);
      else await updateElectiveSessionAPI(id, { status: newStatus });
      toast.success(`Session ${newStatus}`);
      fetchSession();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleLockStudent = async (studentId) => {
    try {
      await lockElectiveStudentAPI(id, studentId);
      toast.success("Student locked");
      fetchSession();
      fetchSelections();
    } catch {
      toast.error("Failed to lock student");
    }
  };

  const handleUnlockStudent = async (studentId) => {
    try {
      await unlockElectiveStudentAPI(id, studentId);
      toast.success("Student unlocked");
      fetchSession();
      fetchSelections();
    } catch {
      toast.error("Failed to unlock student");
    }
  };

  const handleExport = async () => {
    try {
      const res = await exportElectiveSessionSelectionsAPI(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", `elective-selections.xlsx`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export");
    }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.rollNumber?.toLowerCase().includes(q);
    const hasSel = s.selectedElectives?.length > 0;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "submitted" && hasSel) ||
      (statusFilter === "pending" && !hasSel) ||
      (statusFilter === "locked" && s.isLocked);
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <PanelDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      </PanelDashboardLayout>
    );
  }

  if (!session) return null;

  const sm = STATUS_META[session.status] || STATUS_META.draft;
  const total = stats?.totalStudents || 0;
  const submitted = stats?.submittedCount || 0;
  const pending = stats?.pendingCount || 0;
  const pctDone = total > 0 ? Math.round((submitted / total) * 100) : 0;

  const statusActions = {
    draft: [{ label: "Open Selection", status: "open", icon: "mdi-play-circle-outline", cls: "bg-emerald-600 hover:bg-emerald-700" }],
    open: [
      { label: "Close", status: "closed", icon: "mdi-close-circle-outline", cls: "bg-rose-600 hover:bg-rose-700" },
      { label: "Lock", status: "locked", icon: "mdi-lock-outline", cls: "bg-amber-600 hover:bg-amber-700" },
    ],
    closed: [
      { label: "Reopen", status: "open", icon: "mdi-restart", cls: "bg-emerald-600 hover:bg-emerald-700" },
      { label: "Lock", status: "locked", icon: "mdi-lock-outline", cls: "bg-amber-600 hover:bg-amber-700" },
    ],
    locked: [],
  };

  return (
    <PanelDashboardLayout>
      <div className="space-y-6">
        {/* Back link */}
        <button
          onClick={() => navigate("/panel-admin/elective-sessions")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <i className="mdi mdi-arrow-left text-base" /> Sessions
        </button>

        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900">{session.name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${sm.bg} ${sm.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                  {sm.label}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {session.batchGroup?.groupName}
                {session.batchGroup?.batches?.length > 0 && (
                  <span className="mx-1.5 text-gray-300">|</span>
                )}
                {session.batchGroup?.batches?.length > 0 && (
                  <>Batches: {session.batchGroup.batches.map((b) => b.batchName).join(", ")}</>
                )}
                {session.openAt && <span className="mx-1.5 text-gray-300">|</span>}
                {session.openAt && <>Opens {fmt(session.openAt)}</>}
                {session.closeAt && <span className="mx-1.5 text-gray-300">|</span>}
                {session.closeAt && <>Deadline {fmt(session.closeAt)}</>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(statusActions[session.status] || []).map((a) => (
                <button
                  key={a.status}
                  onClick={() => handleStatusChange(a.status)}
                  disabled={updating}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${a.cls}`}
                >
                  <i className={`mdi ${a.icon} text-base`} />
                  {a.label}
                </button>
              ))}
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <i className="mdi mdi-download text-base" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Stats row -- equal-height cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-blue-200">Completion</p>
              <span className="text-3xl font-bold leading-none">{pctDone}%</span>
            </div>
            <div className="mt-4">
              <div className="bg-white/20 rounded-full h-1.5">
                <div className="bg-white rounded-full h-1.5 transition-all duration-500" style={{ width: `${pctDone}%` }} />
              </div>
              <p className="text-xs text-blue-200 mt-2">{submitted} of {total} students</p>
            </div>
          </div>
          {[
            { label: "Total", value: total, icon: "mdi-account-group", iconBg: "bg-gray-100", iconColor: "text-gray-600", valueCls: "text-gray-900" },
            { label: "Submitted", value: submitted, icon: "mdi-check-circle", iconBg: "bg-emerald-50", iconColor: "text-emerald-600", valueCls: "text-emerald-700" },
            { label: "Pending", value: pending, icon: "mdi-clock-outline", iconBg: "bg-amber-50", iconColor: "text-amber-600", valueCls: "text-amber-700" },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                  <i className={`mdi ${c.icon} ${c.iconColor}`} />
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{c.label}</span>
              </div>
              <p className={`text-3xl font-bold mt-3 ${c.valueCls}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            {[
              { key: "overview", label: "Overview", icon: "mdi-chart-bar" },
              { key: "students", label: `Students (${total})`, icon: "mdi-account-multiple" },
              { key: "settings", label: "Settings", icon: "mdi-cog-outline" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <i className={`mdi ${t.icon} text-base`} />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab: Overview */}
        {tab === "overview" && (
          <div className="space-y-5">
            {session.electiveSubjects?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  Selection Distribution
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {session.electiveSubjects.map((sub) => {
                    const count = stats?.selectionStats?.[sub._id] || 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    const cap = session.capacityPerSubject || 0;
                    const capPct = cap > 0 ? Math.min(100, Math.round((count / cap) * 100)) : 0;
                    const isNearFull = cap > 0 && capPct >= 90;
                    return (
                      <div
                        key={sub._id}
                        className={`bg-white rounded-xl border p-4 transition-shadow hover:shadow-sm ${
                          isNearFull ? "border-rose-200" : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{sub.subjectName}</p>
                            <p className="text-xs text-gray-400 font-mono">{sub.subjectCode}</p>
                          </div>
                          <span className="text-lg font-bold text-gray-800 flex-shrink-0">{count}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                isNearFull ? "bg-rose-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${cap > 0 ? capPct : pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">
                            {pct}%{cap > 0 && <> &middot; {count}/{cap}</>}
                          </span>
                        </div>
                        {isNearFull && (
                          <p className="text-[11px] text-rose-500 font-medium mt-1.5">
                            <i className="mdi mdi-alert-circle-outline mr-0.5" />
                            Near full capacity
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Students */}
        {tab === "students" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <i className="mdi mdi-magnify absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or roll..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                {["all", "submitted", "pending", "locked"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      statusFilter === f
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500 sm:ml-auto whitespace-nowrap">{filtered.length} of {students.length}</span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-12">#</th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Selected Electives</th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-32">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-24 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((s, i) => {
                      const hasSel = s.selectedElectives?.length > 0;
                      return (
                        <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 leading-tight">{s.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{s.rollNumber}</p>
                          </td>
                          <td className="px-4 py-3">
                            {hasSel ? (
                              <div className="flex flex-wrap gap-1">
                                {s.selectedElectives.map((e, idx) => (
                                  <Pill key={idx} className="bg-blue-50 text-blue-700">
                                    {e.subject?.subjectName || "Unknown"}
                                  </Pill>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-300">&mdash;</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {hasSel ? (
                                <Pill className="bg-emerald-50 text-emerald-700">
                                  <i className="mdi mdi-check-circle text-xs" /> Submitted
                                </Pill>
                              ) : (
                                <Pill className="bg-amber-50 text-amber-700">
                                  <i className="mdi mdi-clock-outline text-xs" /> Pending
                                </Pill>
                              )}
                              {s.isLocked && (
                                <Pill className="bg-yellow-50 text-yellow-700">
                                  <i className="mdi mdi-lock text-xs" /> Locked
                                </Pill>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {s.isLocked ? (
                              <button
                                onClick={() => handleUnlockStudent(s._id)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <i className="mdi mdi-lock-open-variant-outline" /> Unlock
                              </button>
                            ) : (
                              <button
                                onClick={() => handleLockStudent(s._id)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-rose-600 transition-colors"
                              >
                                <i className="mdi mdi-lock-outline" /> Lock
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center">
                          <i className="mdi mdi-account-search text-4xl text-gray-200 block mb-2" />
                          <p className="text-sm text-gray-400">No students match your filters</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Settings */}
        {tab === "settings" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {[
              { label: "Batch Group", value: session.batchGroup?.groupName, icon: "mdi-school" },
              { label: "Batches", value: session.batchGroup?.batches?.map((b) => b.batchName).join(", ") || "--", icon: "mdi-format-list-bulleted" },
              { label: "Max Selections", value: session.maxSelectionsPerStudent || "Batch default", icon: "mdi-numeric" },
              { label: "Reselection", value: session.allowReselection ? "Allowed" : "Not allowed", icon: "mdi-refresh" },
              { label: "Capacity / Subject", value: session.capacityPerSubject > 0 ? session.capacityPerSubject : "Unlimited", icon: "mdi-account-multiple-check" },
              { label: "Opens", value: fmt(session.openAt), icon: "mdi-calendar-start" },
              { label: "Deadline", value: fmt(session.closeAt), icon: "mdi-calendar-end" },
              { label: "Notify on Open", value: session.notifyOnOpen ? "Yes" : "No", icon: "mdi-bell-ring-outline" },
              { label: "Deadline Reminder", value: session.notifyBeforeDeadline ? "Yes" : "No", icon: "mdi-bell-alert-outline" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4">
                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <i className={`mdi ${item.icon} text-gray-500`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelDashboardLayout>
  );
};

export default ElectiveSessionDetailPage;
