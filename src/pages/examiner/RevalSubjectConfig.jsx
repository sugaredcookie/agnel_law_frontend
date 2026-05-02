import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getRevalSubjectConfigsAPI,
  createRevalSubjectConfigAPI,
  updateRevalSubjectConfigAPI,
  deleteRevalSubjectConfigAPI,
  getRevalSessionsAPI,
  getRevalBatchGroupsAPI,
} from "../../utils/Api";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";

const availableCourses = ["BA LLB", "LLB"];

const RevalSubjectConfig = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);

  const [batchGroups, setBatchGroups] = useState([]);
  const [selectedBatchGroup, setSelectedBatchGroup] = useState(null);

  const [formData, setFormData] = useState({
    course: "",
    batch: "",
    batchLabel: "",
    subjects: [],
  });

  // Set of subjectId strings for checkbox state — always mirrors formData.subjects
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(new Set());
  const [subjectSearch, setSubjectSearch] = useState("");

  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualSubjectName, setManualSubjectName] = useState("");

  useEffect(() => {
    fetchData();
  }, [sessionId]); // eslint-disable-line

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configRes, sessionRes, batchGroupRes] = await Promise.all([
        getRevalSubjectConfigsAPI(sessionId),
        getRevalSessionsAPI(),
        getRevalBatchGroupsAPI().catch(() => ({ batchGroups: [] })),
      ]);
      setConfigs(configRes.configs || []);
      const found = (sessionRes.sessions || []).find((s) => s._id === sessionId);
      setSession(found || null);
      setBatchGroups(batchGroupRes.batchGroups || []);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (config = null) => {
    if (config) {
      setEditingConfig(config);
      const subjects = config.subjects || [];
      setFormData({
        course: config.course,
        batch: config.batch,
        batchLabel: config.batchLabel,
        subjects,
      });
      setSelectedSubjectIds(
        new Set(subjects.filter((s) => s.subjectId).map((s) => String(s.subjectId))),
      );
      setSelectedBatchGroup(null);
    } else {
      setEditingConfig(null);
      setFormData({ course: "", batch: "", batchLabel: "", subjects: [] });
      setSelectedSubjectIds(new Set());
      setSelectedBatchGroup(null);
    }
    setManualSubjectName("");
    setSubjectSearch("");
    setShowManualAdd(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConfig(null);
    setSelectedBatchGroup(null);
    setSelectedSubjectIds(new Set());
    setManualSubjectName("");
    setSubjectSearch("");
    setShowManualAdd(false);
  };

  const handleBatchGroupSelect = (groupId) => {
    if (!groupId) {
      setSelectedBatchGroup(null);
      setSubjectSearch("");
      return;
    }
    const group = batchGroups.find((g) => g._id === groupId);
    if (!group) return;

    setSelectedBatchGroup(group);
    setSubjectSearch("");

    if (!editingConfig) {
      // Create mode: set batch/label and auto-select all subjects from the group
      const allIds = new Set(group.subjects.map((s) => String(s._id)));
      setSelectedSubjectIds(allIds);
      setFormData((prev) => ({
        ...prev,
        batch: group.groupName,
        batchLabel: group.groupName,
        subjects: group.subjects.map((s) => ({
          id: String(s._id),
          label: s.subjectName + (s.subjectCode ? ` (${s.subjectCode})` : ""),
          subjectId: s._id,
        })),
      }));
    }
    // Edit mode: just switch the browsing pool — don't touch existing subjects
  };

  // Toggle a single subject from the current batch group
  const handleSubjectToggle = (subject) => {
    const sid = String(subject._id);
    const newIds = new Set(selectedSubjectIds);

    if (newIds.has(sid)) {
      // Remove
      newIds.delete(sid);
      setSelectedSubjectIds(newIds);
      setFormData((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => String(s.subjectId) !== sid),
      }));
    } else {
      // Add
      newIds.add(sid);
      setSelectedSubjectIds(newIds);
      setFormData((prev) => ({
        ...prev,
        subjects: [
          ...prev.subjects,
          {
            id: String(subject._id),
            label: subject.subjectName + (subject.subjectCode ? ` (${subject.subjectCode})` : ""),
            subjectId: subject._id,
          },
        ],
      }));
    }
  };

  // Add all subjects from current batch group (merge — keep existing subjects)
  const handleSelectAll = () => {
    if (!selectedBatchGroup) return;
    const newIds = new Set(selectedSubjectIds);
    const newSubjects = [...formData.subjects];
    for (const s of selectedBatchGroup.subjects) {
      const sid = String(s._id);
      if (!newIds.has(sid)) {
        newIds.add(sid);
        newSubjects.push({
          id: sid,
          label: s.subjectName + (s.subjectCode ? ` (${s.subjectCode})` : ""),
          subjectId: s._id,
        });
      }
    }
    setSelectedSubjectIds(newIds);
    setFormData((prev) => ({ ...prev, subjects: newSubjects }));
  };

  // Remove only the subjects belonging to the current batch group
  const handleDeselectAll = () => {
    if (!selectedBatchGroup) return;
    const groupIds = new Set(selectedBatchGroup.subjects.map((s) => String(s._id)));
    const newIds = new Set(selectedSubjectIds);
    for (const id of groupIds) newIds.delete(id);
    setSelectedSubjectIds(newIds);
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => !s.subjectId || !groupIds.has(String(s.subjectId))),
    }));
  };

  const handleAddManualSubject = () => {
    if (!manualSubjectName.trim()) return toast.error("Enter a subject name");
    const id =
      "manual-" +
      manualSubjectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Date.now();

    setFormData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { id, label: manualSubjectName.trim(), subjectId: null }],
    }));
    setManualSubjectName("");
  };

  const handleRemoveSubject = (index) => {
    const removed = formData.subjects[index];
    if (removed?.subjectId) {
      const newIds = new Set(selectedSubjectIds);
      newIds.delete(String(removed.subjectId));
      setSelectedSubjectIds(newIds);
    }
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subjects.length) return toast.error("Add at least one subject");

    try {
      if (editingConfig) {
        await updateRevalSubjectConfigAPI(editingConfig._id, formData);
        toast.success("Configuration updated");
      } else {
        await createRevalSubjectConfigAPI(sessionId, formData);
        toast.success("Configuration created");
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save config");
    }
  };

  const handleDelete = async (configId) => {
    if (window.confirm("Delete this subject configuration?")) {
      try {
        await deleteRevalSubjectConfigAPI(configId);
        toast.success("Configuration deleted");
        fetchData();
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to delete");
      }
    }
  };

  const handleToggleActive = async (config) => {
    try {
      await updateRevalSubjectConfigAPI(config._id, { isActive: !config.isActive });
      toast.success(`Configuration ${!config.isActive ? "activated" : "deactivated"}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update configuration");
    }
  };

  const filteredBatchGroupSubjects = useMemo(() => {
    if (!selectedBatchGroup?.subjects) return [];
    if (!subjectSearch.trim()) return selectedBatchGroup.subjects;
    const q = subjectSearch.toLowerCase();
    return selectedBatchGroup.subjects.filter(
      (s) =>
        s.subjectName.toLowerCase().includes(q) ||
        (s.subjectCode && s.subjectCode.toLowerCase().includes(q)),
    );
  }, [selectedBatchGroup, subjectSearch]);

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate("/examiner/reval-sessions")}
                className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2"
              >
                <i className="mdi mdi-arrow-left"></i>
                Back to Sessions
              </button>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {session?.title || "Loading..."}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Configure subjects for batches
                  </p>
                </div>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                  disabled={!session || session.status === "closed"}
                >
                  <i className="mdi mdi-plus"></i>
                  Add Configuration
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : configs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <i className="mdi mdi-book-open-variant text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-600 text-lg">
                  No subject configurations found
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Add configurations for different batches
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {configs.map((config) => (
                  <div
                    key={config._id}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {config.batchLabel}
                          </h3>
                          {config.isActive ? (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">
                              Active
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-400 text-white">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">
                          <strong>Course:</strong> {config.course} |{" "}
                          <strong>Batch:</strong> {config.batch}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(config)}
                          className={`px-3 py-1.5 rounded text-sm ${
                            config.isActive
                              ? "bg-orange-600 hover:bg-orange-700"
                              : "bg-green-600 hover:bg-green-700"
                          } text-white`}
                          disabled={session?.status === "closed"}
                        >
                          {config.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleOpenModal(config)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          disabled={session?.status === "closed"}
                        >
                          <i className="mdi mdi-pencil mr-1"></i>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(config._id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          disabled={session?.status === "closed"}
                        >
                          <i className="mdi mdi-delete mr-1"></i>
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Subjects list */}
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-3">
                        Subjects ({config.subjects.length})
                      </h4>
                      <div className="space-y-2">
                        {config.subjects.map((subject, idx) => (
                          <div key={idx} className="p-3 rounded bg-gray-50">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {subject.label}
                              </p>
                              {subject.subjectId ? (
                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                  Linked
                                </span>
                              ) : (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                  Manual
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingConfig ? "Edit Configuration" : "New Configuration"}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <i className="mdi mdi-close text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* Course + Display Label */}
              {(selectedBatchGroup || editingConfig) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Course
                    </label>
                    <select
                      value={formData.course}
                      onChange={(e) => setFormData((prev) => ({ ...prev, course: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                      required
                      style={{ color: "#111827" }}
                    >
                      <option value="">Select Course</option>
                      {availableCourses.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Display Label
                    </label>
                    <input
                      type="text"
                      value={formData.batchLabel}
                      onChange={(e) => setFormData((prev) => ({ ...prev, batchLabel: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                      required
                      placeholder="e.g., FY BA LLB (Sem 1)"
                    />
                  </div>
                </div>
              )}

              {/* Batch Group selector — in create mode required; in edit mode optional for browsing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {editingConfig ? "Browse subjects from batch group" : "Select Batch Group"}
                </label>
                {batchGroups.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No batch groups found.</p>
                ) : (
                  <select
                    value={selectedBatchGroup?._id || ""}
                    onChange={(e) => handleBatchGroupSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                    required={!editingConfig}
                    style={{ color: "#111827" }}
                  >
                    <option value="">
                      {editingConfig ? "Select group to add/remove subjects" : "Select Batch Group"}
                    </option>
                    {batchGroups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.groupName} ({group.subjects.length} subjects)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Subject management — shown when a batch group is selected or editing */}
              {(selectedBatchGroup || editingConfig) && (
                <div className="space-y-3">
                  {/* Batch group subject checkboxes */}
                  {selectedBatchGroup && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {selectedBatchGroup.groupName}
                          <span className="ml-2 text-xs font-normal text-gray-400">
                            — check to add, uncheck to remove
                          </span>
                        </span>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Add all
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={handleDeselectAll}
                            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                          >
                            Remove all
                          </button>
                        </div>
                      </div>

                      {selectedBatchGroup.subjects.length > 4 && (
                        <div className="relative mb-2">
                          <i className="mdi mdi-magnify absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                          <input
                            type="text"
                            value={subjectSearch}
                            onChange={(e) => setSubjectSearch(e.target.value)}
                            placeholder="Search subjects..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 text-sm"
                          />
                        </div>
                      )}

                      <div className="border border-gray-200 rounded-md max-h-56 overflow-y-auto">
                        {filteredBatchGroupSubjects.length === 0 ? (
                          <p className="p-4 text-sm text-gray-400 text-center">
                            No subjects match "{subjectSearch}"
                          </p>
                        ) : (
                          filteredBatchGroupSubjects.map((subject) => (
                            <label
                              key={subject._id}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <input
                                type="checkbox"
                                checked={selectedSubjectIds.has(String(subject._id))}
                                onChange={() => handleSubjectToggle(subject)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-gray-900">{subject.subjectName}</span>
                                {subject.subjectCode && (
                                  <span className="text-xs text-gray-400 ml-2">{subject.subjectCode}</span>
                                )}
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Current subjects list — always visible in edit mode, visible after group selection in create */}
                  {formData.subjects.length > 0 && (
                    <div className="border border-gray-200 rounded-md">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">
                          Selected subjects ({formData.subjects.length})
                        </span>
                      </div>
                      {formData.subjects.map((subject, idx) => (
                        <div
                          key={subject.id || idx}
                          className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm text-gray-900 truncate">{subject.label}</span>
                            {subject.subjectId ? (
                              <span className="shrink-0 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                Linked
                              </span>
                            ) : (
                              <span className="shrink-0 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                Manual
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(idx)}
                            className="ml-3 shrink-0 text-red-400 hover:text-red-600"
                            title="Remove"
                          >
                            <i className="mdi mdi-close text-lg"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Manual add */}
                  <div>
                    {!showManualAdd ? (
                      <button
                        type="button"
                        onClick={() => setShowManualAdd(true)}
                        className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                      >
                        <i className="mdi mdi-plus-circle-outline"></i>
                        Add subject manually
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={manualSubjectName}
                          onChange={(e) => setManualSubjectName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 text-sm"
                          placeholder="Subject name"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); handleAddManualSubject(); }
                            if (e.key === "Escape") { setShowManualAdd(false); setManualSubjectName(""); }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddManualSubject}
                          className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowManualAdd(false); setManualSubjectName(""); }}
                          className="px-3 py-2 border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 text-sm"
                        >
                          <i className="mdi mdi-close"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  disabled={formData.subjects.length === 0}
                >
                  {editingConfig ? "Update Configuration" : "Create Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevalSubjectConfig;
