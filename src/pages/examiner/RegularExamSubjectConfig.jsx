import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getRegularExamSessionsAPI,
  getRegularExamSubjectConfigsAPI,
  createRegularExamSubjectConfigAPI,
  updateRegularExamSubjectConfigAPI,
  deleteRegularExamSubjectConfigAPI,
  getAvailableBatchesAPI,
  getSubjectsForLinkingAPI,
} from "../../utils/Api";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import SearchableDropdown from "../../components/SearchableDropdown";

const RegularExamSubjectConfig = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    course: "",
    batch: "",
    batchLabel: "",
    pattern: "",
    subjects: [],
  });
  const [subjectInput, setSubjectInput] = useState({
    label: "",
    examDate: "",
    examTime: "10:30 AM to 01:00 PM",
    examType: "Semester End Examination",
  });
  const [availableBatchesFromDB, setAvailableBatchesFromDB] = useState([]);
  const [selectedActualBatches, setSelectedActualBatches] = useState([]);
  const [adminSubjects, setAdminSubjects] = useState([]);
  const [subjectInputMode, setSubjectInputMode] = useState("database"); // "database" or "manual"
  const [selectedDbSubject, setSelectedDbSubject] = useState("");
  const [editingSubjectIndex, setEditingSubjectIndex] = useState(null);

  const simplifiedBatches = {
    "BA LLB": ["FYBA-LLB", "SYBA-LLB", "TYBA-LLB", "IVBA-LLB", "VBA-LLB"],
    LLB: ["FYLLB", "SYLLB", "TYLLB"],
    LLM: ["FYLLM", "SYLLM"],
  };

  useEffect(() => {
    fetchSessionAndConfigs();
    fetchAdminSubjects();
  }, [sessionId]);

  const fetchAdminSubjects = async () => {
    try {
      const subjects = await getSubjectsForLinkingAPI();
      setAdminSubjects(subjects || []);
    } catch (error) {
      console.error("Failed to fetch admin subjects:", error);
    }
  };

  const fetchSessionAndConfigs = async () => {
    try {
      setLoading(true);
      const [sessionsResponse, configsResponse] = await Promise.all([
        getRegularExamSessionsAPI(),
        getRegularExamSubjectConfigsAPI(sessionId),
      ]);

      const currentSession = sessionsResponse.sessions.find(
        (s) => s._id === sessionId,
      );
      setSession(currentSession);
      setConfigs(configsResponse.configs || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load session and configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (config = null) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        course: config.course,
        batch: config.batch,
        batchLabel: config.batchLabel,
        pattern: config.pattern,
        subjects: config.subjects || [],
      });
      setSelectedActualBatches(config.actualBatches || []);
    } else {
      setEditingConfig(null);
      setFormData({
        course: "",
        batch: "",
        batchLabel: "",
        pattern: "",
        subjects: [],
      });
      setSelectedActualBatches([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConfig(null);
    setFormData({
      course: "",
      batch: "",
      batchLabel: "",
      pattern: "",
      subjects: [],
    });
    setSubjectInput({
      label: "",
      examDate: "",
      examTime: "10:30 AM to 01:00 PM",
      examType: "Semester End Examination",
    });
    setSelectedDbSubject("");
    setEditingSubjectIndex(null);
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;

    if (name === "course") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        batch: "",
        batchLabel: "",
      }));
      setSelectedActualBatches([]);
      
      // Fetch available batches from database
      try {
        console.log("Fetching batches for course:", value);
        const response = await getAvailableBatchesAPI({ course: value });
        console.log("Available batches from API:", response.batches);
        setAvailableBatchesFromDB(response.batches || []);
      } catch (error) {
        console.error("Failed to fetch batches:", error);
        toast.error("Failed to load available batches");
      }
    } else if (name === "batch") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        batchLabel: value,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubjectInputChange = (e) => {
    const { name, value } = e.target;
    setSubjectInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubject = () => {
    let subjectLabel = "";
    let subjectId = null;

    if (subjectInputMode === "database") {
      if (!selectedDbSubject) {
        toast.error("Please select a subject from the database");
        return;
      }
      const dbSubject = adminSubjects.find((s) => s._id === selectedDbSubject);
      if (!dbSubject) {
        toast.error("Selected subject not found");
        return;
      }
      subjectLabel = dbSubject.subjectName;
      subjectId = dbSubject._id;
    } else {
      if (!subjectInput.label.trim()) {
        toast.error("Subject name is required");
        return;
      }
      subjectLabel = subjectInput.label;
    }

    if (editingSubjectIndex !== null) {
      // Update existing subject in-place; preserve original id
      setFormData((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s, i) =>
          i === editingSubjectIndex
            ? {
                ...s,
                label: subjectLabel,
                type: s.type || "subject",
                examDate: subjectInput.examDate,
                examTime: subjectInput.examTime,
                examType: subjectInput.examType,
                subjectId: subjectId,
              }
            : s,
        ),
      }));
      toast.success("Subject updated. Don't forget to Save the configuration.");
    } else {
      const newSubject = {
        id: `${formData.batch.toLowerCase().replace(/\s+/g, "-")}-${formData.pattern.replace(":", "-")}-${subjectLabel.toLowerCase().replace(/\s+/g, "-")}`,
        label: subjectLabel,
        type: "subject",
        examDate: subjectInput.examDate,
        examTime: subjectInput.examTime,
        examType: subjectInput.examType,
        subjectId: subjectId,
      };

      setFormData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, newSubject],
      }));
    }

    setSubjectInput({
      label: "",
      examDate: "",
      examTime: "10:30 AM to 01:00 PM",
      examType: "Semester End Examination",
    });
    setSelectedDbSubject("");
    setEditingSubjectIndex(null);
  };

  const handleEditSubject = (index) => {
    const s = formData.subjects[index];
    if (!s || s.type === "section") return;
    if (s.subjectId) {
      setSubjectInputMode("database");
      setSelectedDbSubject(s.subjectId);
    } else {
      setSubjectInputMode("manual");
      setSelectedDbSubject("");
    }
    setSubjectInput({
      label: s.label || "",
      examDate: s.examDate ? String(s.examDate).slice(0, 10) : "",
      examTime: s.examTime || "10:30 AM to 01:00 PM",
      examType: s.examType || "Semester End Examination",
    });
    setEditingSubjectIndex(index);
  };

  const handleCancelEditSubject = () => {
    setEditingSubjectIndex(null);
    setSubjectInput({
      label: "",
      examDate: "",
      examTime: "10:30 AM to 01:00 PM",
      examType: "Semester End Examination",
    });
    setSelectedDbSubject("");
  };

  const handleRemoveSubject = (index) => {
    if (editingSubjectIndex === index) {
      handleCancelEditSubject();
    }
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.subjects.length === 0) {
      toast.error("Please add at least one subject");
      return;
    }

    try {
      const payload = {
        ...formData,
        examSessionId: sessionId,
        actualBatches: selectedActualBatches,
      };

      if (editingConfig) {
        await updateRegularExamSubjectConfigAPI(editingConfig._id, payload);
        toast.success("Configuration updated successfully");
      } else {
        await createRegularExamSubjectConfigAPI(payload);
        toast.success("Configuration created successfully");
      }
      handleCloseModal();
      fetchSessionAndConfigs();
    } catch (error) {
      console.error("Failed to save configuration:", error);
      toast.error(
        error?.response?.data?.message || "Failed to save configuration",
      );
    }
  };

  const handleDelete = async (configId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this configuration? This action cannot be undone.",
      )
    ) {
      try {
        await deleteRegularExamSubjectConfigAPI(configId);
        toast.success("Configuration deleted successfully");
        fetchSessionAndConfigs();
      } catch (error) {
        console.error("Failed to delete configuration:", error);
        toast.error(
          error?.response?.data?.message || "Failed to delete configuration",
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <ExaminerNavbar />
        <ExaminerTopHeader />
        <div className="lg:ml-64 pt-20 flex items-center justify-center">
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100">
        <ExaminerNavbar />
        <ExaminerTopHeader />
        <div className="lg:ml-64 pt-20 flex items-center justify-center">
          <div className="text-center py-8">Session not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen text-black">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 max-w-7xl mx-auto mt-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <button
                  onClick={() => navigate("/examiner/regular-exam-sessions")}
                  className="text-blue-600 hover:underline mb-2"
                >
                  ← Back to Sessions
                </button>
                <h1 className="text-3xl font-bold">{session.title}</h1>
                <p className="text-gray-600 mt-1">
                  Configure subjects and exam schedule for each batch
                </p>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                disabled={session.status === "closed"}
              >
                + Add Configuration
              </button>
            </div>

            {configs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">
                  No subject configurations found. Add your first configuration
                  to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {configs.map((config) => (
                  <div
                    key={config._id}
                    className="border border-gray-300 rounded-lg p-4 bg-white"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {config.course} - {config.batchLabel} ({config.pattern})
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {config.subjects.length} subject(s) configured
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {session.status !== "closed" && (
                          <>
                            <button
                              onClick={() => handleOpenModal(config)}
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(config._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <h4 className="font-medium mb-2">Subjects:</h4>
                      <div className="space-y-2">
                        {config.subjects.map((subject, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-sm bg-white p-2 rounded"
                          >
                            <span className="font-medium">{subject.label}</span>
                            <div className="text-gray-600">
                              {subject.examDate && (
                                <>
                                  {new Date(subject.examDate).toLocaleDateString()}{" "}
                                  • {subject.examTime}
                                </>
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                {editingConfig
                  ? "Edit Subject Configuration"
                  : "Add Subject Configuration"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-800">
                      Course *
                    </label>
                    <select
                      name="course"
                      value={formData.course}
                      onChange={handleInputChange}
                      className="w-full p-2 border-2 border-blue-500 rounded-md bg-white text-black"
                      required
                      disabled={editingConfig}
                    >
                      <option value="">Select Course</option>
                      <option value="BA LLB">BA LLB</option>
                      <option value="LLB">LLB</option>
                      <option value="LLM">LLM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-800">
                      Batch Group *
                    </label>
                    <select
                      name="batch"
                      value={formData.batch}
                      onChange={handleInputChange}
                      className="w-full p-2 border-2 border-blue-500 rounded-md bg-white text-black"
                      required
                      disabled={!formData.course || editingConfig}
                    >
                      <option value="">Select Batch Group</option>
                      {formData.course &&
                        simplifiedBatches[formData.course]?.map((batch) => (
                          <option key={batch} value={batch}>
                            {batch}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-800">
                      Pattern *
                    </label>
                    <select
                      name="pattern"
                      value={formData.pattern}
                      onChange={handleInputChange}
                      className="w-full p-2 border-2 border-blue-500 rounded-md bg-white text-black"
                      required
                      disabled={editingConfig}
                    >
                      <option value="">Select Pattern</option>
                      <option value="75:25">75:25</option>
                      <option value="60:40">60:40</option>
                    </select>
                  </div>
                </div>

                {formData.batch && availableBatchesFromDB.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                    <h3 className="text-md font-semibold mb-2 text-gray-800">
                      Group Actual Batches under "{formData.batch}"
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Select which specific batches from the database should be included in this configuration:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {availableBatchesFromDB
                        .filter(dbBatch => dbBatch.startsWith(formData.batch.split('-')[0]))
                        .map((dbBatch) => (
                          <label key={dbBatch} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedActualBatches.includes(dbBatch)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedActualBatches([...selectedActualBatches, dbBatch]);
                                } else {
                                  setSelectedActualBatches(selectedActualBatches.filter(b => b !== dbBatch));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-gray-700">{dbBatch}</span>
                          </label>
                        ))}
                    </div>
                    {selectedActualBatches.length > 0 && (
                      <p className="text-sm text-green-700 mt-2 font-medium">
                        ✓ {selectedActualBatches.length} batch(es) selected
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Subjects
                      {formData.subjects.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({formData.subjects.length})
                        </span>
                      )}
                    </h3>
                  </div>

                  {formData.subjects.length > 0 && (
                    <div className="mb-4 space-y-2 max-h-72 overflow-y-auto border border-gray-200 rounded-md p-3 bg-white">
                      {formData.subjects.map((subject, idx) => {
                        const isEditing = editingSubjectIndex === idx;
                        return (
                          <div
                            key={idx}
                            className={`flex justify-between items-start p-3 rounded border ${
                              isEditing
                                ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900 truncate">
                                  {subject.label}
                                </span>
                                {subject.subjectId ? (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                    Linked
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                    Manual
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                {subject.examDate && (
                                  <span>
                                    <i className="mdi mdi-calendar mr-1"></i>
                                    {new Date(subject.examDate).toLocaleDateString()}
                                  </span>
                                )}
                                {subject.examTime && (
                                  <span>
                                    <i className="mdi mdi-clock-outline mr-1"></i>
                                    {subject.examTime}
                                  </span>
                                )}
                                {subject.examType && (
                                  <span className="text-blue-600">
                                    <i className="mdi mdi-tag-outline mr-1"></i>
                                    {subject.examType}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-3 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditSubject(idx)}
                                className={`px-2.5 py-1 rounded text-xs font-medium text-white ${
                                  isEditing
                                    ? "bg-blue-700"
                                    : "bg-blue-500 hover:bg-blue-600"
                                }`}
                                title="Edit subject"
                              >
                                <i className="mdi mdi-pencil mr-1"></i>
                                {isEditing ? "Editing" : "Edit"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSubject(idx)}
                                className="px-2.5 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600"
                                title="Remove subject"
                              >
                                <i className="mdi mdi-delete mr-1"></i>
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div
                    className={`rounded-md border p-4 ${
                      editingSubjectIndex !== null
                        ? "bg-blue-50 border-blue-300"
                        : "bg-blue-50/40 border-blue-200"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                      <h5 className="font-semibold text-gray-900 flex items-center">
                        <i
                          className={`mdi ${
                            editingSubjectIndex !== null
                              ? "mdi-pencil text-blue-600"
                              : "mdi-plus-circle text-green-600"
                          } mr-2 text-lg`}
                        ></i>
                        {editingSubjectIndex !== null
                          ? `Edit Subject (#${editingSubjectIndex + 1})`
                          : "Add Subject"}
                      </h5>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Input Mode:</span>
                        <button
                          type="button"
                          onClick={() => setSubjectInputMode("database")}
                          className={`px-3 py-1 text-xs rounded ${
                            subjectInputMode === "database"
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          From Database
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubjectInputMode("manual")}
                          className={`px-3 py-1 text-xs rounded ${
                            subjectInputMode === "manual"
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          Manual Entry
                        </button>
                      </div>
                    </div>

                    {subjectInputMode === "manual" && (
                      <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        <i className="mdi mdi-alert-outline mr-1"></i>
                        Manual subjects need to be linked later via Subject Linking menu for faculty marks integration.
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-800">
                          Subject {subjectInputMode === "database" ? "(Select)" : "(Name)"} *
                        </label>
                        {subjectInputMode === "database" ? (
                          <SearchableDropdown
                            options={adminSubjects.map((s) => ({
                              value: s._id,
                              label: `${s.subjectName}${s.subjectCode ? ` (${s.subjectCode})` : ""}`,
                            }))}
                            value={selectedDbSubject}
                            onChange={(value) => setSelectedDbSubject(value)}
                            placeholder="Search subjects..."
                          />
                        ) : (
                          <input
                            type="text"
                            name="label"
                            value={subjectInput.label}
                            onChange={handleSubjectInputChange}
                            className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                            placeholder="e.g., Constitutional Law I"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-800">
                            Exam Date
                          </label>
                          <input
                            type="date"
                            name="examDate"
                            value={subjectInput.examDate}
                            onChange={handleSubjectInputChange}
                            className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-800">
                            Exam Time
                          </label>
                          <input
                            type="text"
                            name="examTime"
                            value={subjectInput.examTime}
                            onChange={handleSubjectInputChange}
                            className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                            placeholder="10:30 AM to 01:00 PM"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-800">
                            Exam Type
                          </label>
                          <input
                            type="text"
                            name="examType"
                            value={subjectInput.examType}
                            onChange={handleSubjectInputChange}
                            className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                            placeholder="Semester End Examination"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleAddSubject}
                          className={`flex-1 px-4 py-2 text-white rounded font-medium ${
                            editingSubjectIndex !== null
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          <i
                            className={`mdi ${
                              editingSubjectIndex !== null
                                ? "mdi-content-save"
                                : "mdi-plus"
                            } mr-1`}
                          ></i>
                          {editingSubjectIndex !== null
                            ? "Update Subject"
                            : "Add Subject to List"}
                        </button>
                        {editingSubjectIndex !== null && (
                          <button
                            type="button"
                            onClick={handleCancelEditSubject}
                            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={formData.subjects.length === 0}
                  >
                    {editingConfig ? "Update Configuration" : "Create Configuration"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegularExamSubjectConfig;
