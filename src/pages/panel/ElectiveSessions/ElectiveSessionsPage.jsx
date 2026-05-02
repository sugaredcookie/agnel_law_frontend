import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import PanelDashboardLayout from "../PanelDashboardLayout";
import {
  getElectiveSessionsAPI,
  createElectiveSessionAPI,
  deleteElectiveSessionAPI,
  getAllBatchGroupsViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-700",
  open: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-700",
  locked: "bg-yellow-100 text-yellow-800",
};

const ElectiveSessionsPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [batchGroups, setBatchGroups] = useState([]);
  const [form, setForm] = useState({
    name: "",
    batchGroup: "",
    openAt: "",
    closeAt: "",
    maxSelectionsPerStudent: "",
    allowReselection: true,
    capacityPerSubject: "",
    notifyOnOpen: false,
    notifyBeforeDeadline: false,
  });
  const [creating, setCreating] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getElectiveSessionsAPI();
      setSessions(res.sessions || []);
    } catch (err) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    loadBatchGroups();
  }, [fetchSessions]);

  const loadBatchGroups = async () => {
    try {
      const res = await getAllBatchGroupsViaAdmin();
      setBatchGroups(res.batchGroups || res.data || []);
    } catch {}
  };

  const handleCreate = async () => {
    if (!form.name || !form.batchGroup) {
      toast.error("Name and batch group are required");
      return;
    }
    setCreating(true);
    try {
      await createElectiveSessionAPI({
        ...form,
        maxSelectionsPerStudent: form.maxSelectionsPerStudent ? Number(form.maxSelectionsPerStudent) : undefined,
        capacityPerSubject: form.capacityPerSubject ? Number(form.capacityPerSubject) : 0,
      });
      toast.success("Session created");
      setShowCreate(false);
      setForm({ name: "", batchGroup: "", openAt: "", closeAt: "", maxSelectionsPerStudent: "", allowReselection: true, capacityPerSubject: "", notifyOnOpen: false, notifyBeforeDeadline: false });
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create session");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this draft session?")) return;
    try {
      await deleteElectiveSessionAPI(id);
      toast.success("Session deleted");
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cannot delete non-draft session");
    }
  };

  return (
    <PanelDashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Elective Sessions</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          {showCreate ? "Cancel" : "New Session"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-3">Create Elective Session</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g., SY BA LLB Elective Selection 2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Group *</label>
              <select
                value={form.batchGroup}
                onChange={(e) => setForm((f) => ({ ...f, batchGroup: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select batch group</option>
                {batchGroups.map((g) => (
                  <option key={g._id} value={g._id}>{g.groupName} ({g.program?.name || ""})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Open At</label>
              <input
                type="datetime-local"
                value={form.openAt}
                onChange={(e) => setForm((f) => ({ ...f, openAt: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Close At (Deadline)</label>
              <input
                type="datetime-local"
                value={form.closeAt}
                onChange={(e) => setForm((f) => ({ ...f, closeAt: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Selections Per Student</label>
              <input
                type="number"
                value={form.maxSelectionsPerStudent}
                onChange={(e) => setForm((f) => ({ ...f, maxSelectionsPerStudent: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Leave empty to use batch default"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity Per Elective (0 = unlimited)</label>
              <input
                type="number"
                value={form.capacityPerSubject}
                onChange={(e) => setForm((f) => ({ ...f, capacityPerSubject: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowReselection}
                onChange={() => setForm((f) => ({ ...f, allowReselection: !f.allowReselection }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Allow Reselection</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.notifyOnOpen}
                onChange={() => setForm((f) => ({ ...f, notifyOnOpen: !f.notifyOnOpen }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Email Students on Open</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.notifyBeforeDeadline}
                onChange={() => setForm((f) => ({ ...f, notifyBeforeDeadline: !f.notifyBeforeDeadline }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Reminder Before Deadline</span>
            </label>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
          >
            {creating ? "Creating..." : "Create Session"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <i className="mdi mdi-book-open-variant text-5xl text-gray-300 block mb-4"></i>
          <p>No elective sessions found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((s) => (
            <div key={s._id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{s.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                  {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">
                Group: {s.batchGroup?.groupName || "Unknown"} | Program: {s.batchGroup?.program?.name || ""}
                {s.batchGroup?.batches?.length > 0 && (
                  <span> | Batches: {s.batchGroup.batches.map((b) => b.batchName).join(", ")}</span>
                )}
              </p>
              {s.closeAt && (
                <p className="text-sm text-gray-500 mb-1">
                  Deadline: {new Date(s.closeAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
              <p className="text-sm text-gray-500 mb-3">
                {s.electiveSubjects?.length || 0} subjects | Max: {s.maxSelectionsPerStudent || "batch default"}
                {s.capacityPerSubject > 0 ? ` | Cap: ${s.capacityPerSubject}` : ""}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/panel-admin/elective-sessions/${s._id}`)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  View Details
                </button>
                {s.status === "draft" && (
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelDashboardLayout>
  );
};

export default ElectiveSessionsPage;
