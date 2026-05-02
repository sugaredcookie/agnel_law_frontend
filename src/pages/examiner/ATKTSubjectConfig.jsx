import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getAtktSessionsAPI,
  getSubjectConfigsAPI,
  createSubjectConfigAPI,
  updateSubjectConfigAPI,
  deleteSubjectConfigAPI,
  getAllProgramsViaAdmin,
  getAllBatchesAPI,
  getAvailableBatchesAPI,
  getSubjectsForLinkingAPI,
} from "../../utils/Api";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import SearchableDropdown from "../../components/SearchableDropdown";

const ATKTSubjectConfig = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [availableBatchesFromDB, setAvailableBatchesFromDB] = useState([]);
  const [selectedActualBatches, setSelectedActualBatches] = useState([]);
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
  const [adminSubjects, setAdminSubjects] = useState([]);
  const [subjectInputMode, setSubjectInputMode] = useState("database");
  const [selectedDbSubject, setSelectedDbSubject] = useState("");
  const [editingSubjectIndex, setEditingSubjectIndex] = useState(null);

  const availableBatches = {
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
        getAtktSessionsAPI(),
        getSubjectConfigsAPI(sessionId),
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
      
      // Fetch available batches from database for editing
      try {
        const response = await getAvailableBatchesAPI({ course: config.course });
        setAvailableBatchesFromDB(response.batches || []);
      } catch (error) {
        console.error("Failed to fetch batches:", error);
      }
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
      setAvailableBatchesFromDB([]);
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
    setSelectedActualBatches([]);
    setAvailableBatchesFromDB([]);
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
      if (value) {
        try {
          const response = await getAvailableBatchesAPI({ course: value });
          setAvailableBatchesFromDB(response.batches || []);
        } catch (error) {
          console.error("Failed to fetch batches:", error);
          toast.error("Failed to load available batches");
        }
      } else {
        setAvailableBatchesFromDB([]);
      }
    } else if (name === "batch") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        batchLabel: value,
      }));
      setSelectedActualBatches([]);
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
        toast.error("Invalid subject selection");
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
      // Update existing subject in-place; preserve original id and type
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

  const handleAddSection = () => {
    const sectionName = prompt(
      "Enter section name (e.g., 'Optional Subjects'):",
    );
    if (!sectionName) return;

    const newSection = {
      id: `${formData.batch.toLowerCase().replace(/\s+/g, "-")}-${formData.pattern.replace(":", "-")}-${sectionName.toLowerCase().replace(/\s+/g, "-")}`,
      label: sectionName,
      type: "section",
    };

    setFormData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, newSection],
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
        actualBatches: selectedActualBatches,
      };

      if (editingConfig) {
        await updateSubjectConfigAPI(editingConfig._id, payload);
        toast.success("Configuration updated successfully");
      } else {
        await createSubjectConfigAPI(sessionId, payload);
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
    if (window.confirm("Are you sure you want to delete this configuration?")) {
      try {
        await deleteSubjectConfigAPI(configId);
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

  const handleToggleActive = async (config) => {
    try {
      await updateSubjectConfigAPI(config._id, { isActive: !config.isActive });
      toast.success(
        `Configuration ${!config.isActive ? "activated" : "deactivated"}`,
      );
      fetchSessionAndConfigs();
    } catch (error) {
      console.error("Failed to update configuration:", error);
      toast.error("Failed to update configuration");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen">
          <div className="p-6">
            <div className="mb-6">
              <button
                onClick={() => navigate("/examiner/atkt-sessions")}
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
                    Configure subjects for batches and patterns
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
                  Add configurations for different batches and patterns
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
                            {config.batchLabel} - {config.pattern}
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

                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-3">
                        Subjects ({config.subjects.length})
                      </h4>
                      <div className="space-y-2">
                        {config.subjects.map((subject, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded ${
                              subject.type === "section"
                                ? "bg-purple-50 border-l-4 border-purple-600"
                                : "bg-gray-50"
                            }`}
                          >
                            {subject.type === "section" ? (
                              <p className="font-semibold text-purple-700">
                                {subject.label}
                              </p>
                            ) : (
                              <div className="flex justify-between items-start">
                                <div>
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
                                  <p className="text-sm text-gray-600">
                                    <span className="mr-4">
                                      <i className="mdi mdi-calendar mr-1"></i>
                                      {subject.examDate || "Date not set"}
                                    </span>
                                    <span>
                                      <i className="mdi mdi-clock mr-1"></i>
                                      {subject.examTime}
                                    </span>
                                  </p>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {subject.examType}
                                </span>
                              </div>
                            )}
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingConfig ? "Edit Configuration" : "New Configuration"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="mdi mdi-close text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course *
                  </label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pattern *
                  </label>
                  <select
                    name="pattern"
                    value={formData.pattern}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                    required
                    disabled={editingConfig}
                  >
                    <option value="">Select Pattern</option>
                    <option value="75:25">75:25</option>
                    <option value="60:40">60:40</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch *
                </label>
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                  required
                  disabled={editingConfig || !formData.course}
                >
                  <option value="">Select Batch</option>
                  {formData.course &&
                    availableBatches[formData.course]?.map((batch) => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                </select>
                {!formData.course && (
                  <p className="text-xs text-amber-600 mt-1">
                    Please select a course first
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Course, Pattern, and Batch combination must be unique
                </p>
              </div>

              {formData.batch && availableBatchesFromDB.length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                  <h4 className="text-md font-semibold mb-2 text-gray-800">
                    Select Actual Batches for "{formData.batch}"
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Choose which specific batches from the database should be included in this configuration:
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
                      {selectedActualBatches.length} batch(es) selected
                    </p>
                  )}
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Subjects
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 text-sm"
                    >
                      <i className="mdi mdi-plus mr-1"></i>
                      Add Section
                    </button>
                  </div>
                </div>

                {formData.subjects.length > 0 && (
                  <div className="mb-4 space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {formData.subjects.map((subject, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between items-start p-3 rounded ${
                          subject.type === "section"
                            ? "bg-purple-50 border-l-4 border-purple-600"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex-1">
                          {subject.type === "section" ? (
                            <p className="font-semibold text-purple-700">
                              <i className="mdi mdi-folder-outline mr-1"></i>
                              {subject.label}
                            </p>
                          ) : (
                            <div>
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
                              <p className="text-xs text-gray-600 mt-1">
                                {subject.examDate && (
                                  <span className="mr-3">
                                    <i className="mdi mdi-calendar mr-1"></i>
                                    {subject.examDate}
                                  </span>
                                )}
                                <span className="mr-3">
                                  <i className="mdi mdi-clock mr-1"></i>
                                  {subject.examTime}
                                </span>
                                <span className="text-blue-600">
                                  {subject.examType}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="ml-2 flex gap-2">
                          {subject.type !== "section" && (
                            <button
                              type="button"
                              onClick={() => handleEditSubject(idx)}
                              className={`text-sm px-2 py-1 rounded text-white ${
                                editingSubjectIndex === idx
                                  ? "bg-blue-700"
                                  : "bg-blue-500 hover:bg-blue-600"
                              }`}
                              title="Edit subject"
                            >
                              <i className="mdi mdi-pencil"></i>
                              {editingSubjectIndex === idx ? " Editing..." : " Edit"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(idx)}
                            className="text-red-600 hover:text-red-800"
                            title="Remove"
                          >
                            <i className="mdi mdi-delete text-lg"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-gray-900">
                      {editingSubjectIndex !== null ? "Edit Subject" : "Add Subject"}
                    </h5>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Input Mode:</span>
                      <button
                        type="button"
                        onClick={() => setSubjectInputMode("database")}
                        className={`px-3 py-1 text-xs rounded ${
                          subjectInputMode === "database"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        From Database
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubjectInputMode("manual")}
                        className={`px-3 py-1 text-xs rounded ${
                          subjectInputMode === "manual"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        Manual Entry
                      </button>
                    </div>
                  </div>

                  {subjectInputMode === "manual" && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      <i className="mdi mdi-alert mr-1"></i>
                      Manual subjects need to be linked later via Subject Linking for marks integration.
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          placeholder="Search and select subject..."
                        />
                      ) : (
                        <input
                          type="text"
                          name="label"
                          value={subjectInput.label}
                          onChange={handleSubjectInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          placeholder="e.g., Constitutional Law - I"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Exam Date
                        </label>
                        <input
                          type="date"
                          name="examDate"
                          value={subjectInput.examDate}
                          onChange={handleSubjectInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Exam Time
                        </label>
                        <input
                          type="text"
                          name="examTime"
                          value={subjectInput.examTime}
                          onChange={handleSubjectInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          placeholder="10:30 AM to 01:00 PM"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Exam Type
                        </label>
                        <input
                          type="text"
                          name="examType"
                          value={subjectInput.examType}
                          onChange={handleSubjectInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          placeholder="Semester End Examination"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddSubject}
                        className={`flex-1 px-4 py-2 text-white rounded-md ${
                          editingSubjectIndex !== null
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-blue-600 hover:bg-blue-700"
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
                          className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  disabled={formData.subjects.length === 0}
                >
                  {editingConfig
                    ? "Update Configuration"
                    : "Create Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATKTSubjectConfig;
