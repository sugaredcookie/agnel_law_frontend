import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PanelDashboardLayout from "../PanelDashboardLayout";
import {
  getAllProfileRequestsAdmin,
  createProfileRequestAdmin,
  updateProfileRequestAdmin,
} from "../../../utils/Api";

// Common student profile fields that admin can request updates for
const FIELD_OPTIONS = [
  { path: "studentDetails.abcNumber", label: "ABC ID", type: "text" },
  { path: "studentDetails.prnNumber", label: "PRN Number", type: "text" },
  { path: "studentDetails.grNumber", label: "GR Number", type: "text" },
  { path: "studentDetails.capApplicationId", label: "CAP Application ID", type: "text" },
  { path: "studentDetails.aadharCardNumber", label: "Aadhar Number", type: "text" },
  { path: "studentDetails.studentMobileNumber", label: "Mobile Number", type: "text" },
  { path: "studentDetails.emailAddress", label: "Email Address", type: "text" },
  { path: "studentDetails.address", label: "Address", type: "text" },
  { path: "studentDetails.bloodGroup", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
  { path: "studentDetails.dateOfBirth", label: "Date of Birth", type: "date" },
  { path: "studentDetails.religion", label: "Religion", type: "text" },
  { path: "studentDetails.caste", label: "Caste", type: "text" },
  { path: "studentDetails.casteCategory", label: "Caste Category", type: "select", options: ["General", "OBC", "SC", "ST", "NT", "SBC", "VJ-A", "EWS"] },
  { path: "studentDetails.birthPlace", label: "Birth Place", type: "text" },
  { path: "studentDetails.motherTongue", label: "Mother Tongue", type: "text" },
];

const ProfileRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const res = await getAllProfileRequestsAdmin();
      setRequests(res.data.requests || []);
    } catch (err) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreated = () => {
    setShowCreate(false);
    fetchRequests();
  };

  const toggleActive = async (req) => {
    try {
      await updateProfileRequestAdmin(req._id, { isActive: !req.isActive });
      toast.success(req.isActive ? "Request deactivated" : "Request activated");
      fetchRequests();
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  return (
    <PanelDashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile Update Requests</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            + New Request
          </button>
        </div>

        {/* Create Form Modal */}
        {showCreate && (
          <CreateRequestForm
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
          />
        )}

        {/* Requests List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No profile update requests yet. Create one to ask students to update their information.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req._id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{req.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {req.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Field: <span className="font-medium">{req.fieldLabel}</span>
                      &nbsp;&middot;&nbsp;
                      Target: <span className="font-medium capitalize">{req.targetType}</span>
                      {req.targetBatches?.length > 0 && (
                        <> ({req.targetBatches.map((b) => b.batchName || b).join(", ")})</>
                      )}
                      {req.targetProgram && <> ({req.targetProgram})</>}
                    </p>
                    {req.deadline && (
                      <p className="text-xs text-gray-400 mt-1">
                        Deadline: {new Date(req.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(req)}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                        req.isActive
                          ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {req.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => navigate(`/panel-admin/profile-requests/${req._id}`)}
                      className="text-xs px-3 py-1.5 rounded-md font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {req.completedCount} / {req.totalTargeted} completed
                    </span>
                    <span className="text-gray-500 font-medium">
                      {req.totalTargeted > 0
                        ? Math.round((req.completedCount / req.totalTargeted) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${req.totalTargeted > 0 ? (req.completedCount / req.totalTargeted) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelDashboardLayout>
  );
};

// ─── Create Form ──────────────────────────────────────────────

const CreateRequestForm = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: "",
    selectedField: "",
    targetType: "all",
    targetBatches: [],
    targetProgram: "",
    placeholder: "",
    validationRegex: "",
    deadline: "",
  });
  const [batches, setBatches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch batches and programs for targeting
    const fetchMeta = async () => {
      try {
        const { getAllBatchesAPI, getAllProgramsViaAdmin } = await import("../../../utils/Api");
        const [batchRes, progRes] = await Promise.all([
          getAllBatchesAPI(),
          getAllProgramsViaAdmin(),
        ]);
        setBatches(batchRes.data.batches || batchRes.data || []);
        const progData = progRes.data?.programs || progRes.programs || progRes.data || progRes || [];
        setPrograms(Array.isArray(progData) ? progData : []);
      } catch {
        // Non-critical
      }
    };
    fetchMeta();
  }, []);

  const selectedFieldDef = FIELD_OPTIONS.find((f) => f.path === form.selectedField);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.selectedField) {
      toast.warning("Title and field are required");
      return;
    }
    if (form.targetType === "batch" && form.targetBatches.length === 0) {
      toast.warning("Select at least one batch");
      return;
    }
    if (form.targetType === "program" && !form.targetProgram) {
      toast.warning("Select a program");
      return;
    }

    setSaving(true);
    try {
      await createProfileRequestAdmin({
        title: form.title.trim(),
        fieldPath: selectedFieldDef.path,
        fieldLabel: selectedFieldDef.label,
        fieldType: selectedFieldDef.type,
        selectOptions: selectedFieldDef.options || [],
        placeholder: form.placeholder.trim(),
        validationRegex: form.validationRegex.trim(),
        targetType: form.targetType,
        targetBatches: form.targetType === "batch" ? form.targetBatches : [],
        targetProgram: form.targetType === "program" ? form.targetProgram : "",
        deadline: form.deadline || null,
      });
      toast.success("Request created!");
      onCreated();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const toggleBatch = (id) => {
    setForm((prev) => ({
      ...prev,
      targetBatches: prev.targetBatches.includes(id)
        ? prev.targetBatches.filter((b) => b !== id)
        : [...prev.targetBatches, id],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4">Create Profile Update Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Update your ABC ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field to Update</label>
              <select
                value={form.selectedField}
                onChange={(e) => setForm((p) => ({ ...p, selectedField: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Field --</option>
                {FIELD_OPTIONS.map((f) => (
                  <option key={f.path} value={f.path}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                value={form.targetType}
                onChange={(e) => setForm((p) => ({ ...p, targetType: e.target.value, targetBatches: [], targetProgram: "" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Students</option>
                <option value="batch">Specific Batches</option>
                <option value="program">Specific Program</option>
              </select>
            </div>

            {form.targetType === "batch" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Batches</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                  {batches.map((b) => (
                    <label key={b._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={form.targetBatches.includes(b._id)}
                        onChange={() => toggleBatch(b._id)}
                        className="rounded"
                      />
                      {b.batchName}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {form.targetType === "program" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Program</label>
                <select
                  value={form.targetProgram}
                  onChange={(e) => setForm((p) => ({ ...p, targetProgram: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select --</option>
                  {programs.map((p) => (
                    <option key={p._id} value={p.programName}>
                      {p.programName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder Text (optional)</label>
              <input
                type="text"
                value={form.placeholder}
                onChange={(e) => setForm((p) => ({ ...p, placeholder: e.target.value }))}
                placeholder="e.g. Enter your 12-digit ABC ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (optional)</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? "Creating..." : "Create Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileRequests;
