/**
 * Result Config Management page for examiners.
 * CRUD for exam result configurations, Excel upload, template download,
 * and roll number comparison between semester configs.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUpload,
  FiDownload,
  FiGitMerge,
  FiX,
  // [LEGACY EXCEL] FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiFile,
  FiEye,
  FiRefreshCw,
} from "react-icons/fi";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import SearchableDropdown from "../../components/SearchableDropdown";
import {
  getResultConfigsAPI,
  createResultConfigAPI,
  updateResultConfigAPI,
  archiveResultConfigAPI,
  uploadResultConfigExcelAPI,
  deleteResultConfigExcelDataAPI,
  compareResultConfigRollsAPI,
  getAllProgramsViaExaminer,
  syncResultConfigFromSessionAPI,
  getExamSessionsForMarksAPI,
  getSessionSubjectsAPI,
  getSessionFiltersAPI,
} from "../../utils/Api";

// ─── Constants ──────────────────────────────────────────────

const EXAM_TYPES = [
  { value: "regular", label: "Regular" },
  { value: "atkt", label: "ATKT" },
  { value: "reval", label: "Revaluation" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const EMPTY_FORM = {
  slug: "",
  label: "",
  programme: "",
  programId: "",
  semester: "",
  semesterNumber: "",
  totalSemesters: "",
  examType: "regular",
  year: "",
  examMonth: "",
  resultDeclaredOn: "",
  resultAmendedOn: "",
  place: "",
  dataSource: "excel",
  examSessionId: "",
  examSessionType: "",
  practicalSubjectId: "",
  practicalType: "single",
  syncBatch: "",
  status: "draft",
};

// ─── Utility ────────────────────────────────────────────────

const statusBadge = (status) => {
  switch (status) {
    case "active": return "bg-green-100 text-green-800";
    case "draft": return "bg-yellow-100 text-yellow-800";
    case "archived": return "bg-gray-200 text-gray-600";
    default: return "bg-gray-100 text-gray-800";
  }
};

const examTypeBadge = (type) => {
  switch (type) {
    case "regular": return "bg-blue-100 text-blue-800";
    case "atkt": return "bg-orange-100 text-orange-800";
    case "reval": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const examTypeOrder = { regular: 0, atkt: 1, reval: 2 };

/**
 * Build hierarchy: programName -> year -> semesterNumber -> configs[]
 * All keys derived from actual data, nothing hardcoded.
 */
const buildHierarchy = (configs, programMap) => {
  const tree = {};

  configs.forEach((c) => {
    const progName = programMap[c.programId] || "Unknown Program";
    const year = c.year || "No Year";
    const semKey = c.semesterNumber;

    if (!tree[progName]) tree[progName] = {};
    if (!tree[progName][year]) tree[progName][year] = {};
    if (!tree[progName][year][semKey]) tree[progName][year][semKey] = [];
    tree[progName][year][semKey].push(c);
  });

  // Sort configs within each semester by exam type
  Object.values(tree).forEach((years) =>
    Object.values(years).forEach((sems) =>
      Object.values(sems).forEach((arr) =>
        arr.sort((a, b) => (examTypeOrder[a.examType] ?? 9) - (examTypeOrder[b.examType] ?? 9))
      )
    )
  );

  return tree;
};

// ─── Component ──────────────────────────────────────────────

const ResultConfigManagement = () => {
  const navigate = useNavigate();
  // Data
  const [configs, setConfigs] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterProgram, setFilterProgram] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  const [uploadingId, setUploadingId] = useState(null);
  const [deletingExcel, setDeletingExcel] = useState(false);

  // Session state (for DB source)
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sessionSubjects, setSessionSubjects] = useState([]);
  const [sessionBatches, setSessionBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);



  // Compare state
  const [showCompare, setShowCompare] = useState(false);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [compareResult, setCompareResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  // Accordion groups -- only one open per level; all start collapsed
  const [openGroup, setOpenGroup] = useState({});
  const [showArchived, setShowArchived] = useState(false);

  // ─── Fetch ──────────────────────────────────────────────

  const fetchConfigs = useCallback(async () => {
    try {
      const data = await getResultConfigsAPI();
      setConfigs(Array.isArray(data) ? data : data.configs || []);
    } catch (err) {
      console.error("Failed to load configs:", err);
      toast.error("Failed to load configurations.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrograms = useCallback(async () => {
    try {
      const res = await getAllProgramsViaExaminer();
      const list = res.programs || res.data || res || [];
      setPrograms(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load programs:", err);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
    fetchPrograms();
  }, [fetchConfigs, fetchPrograms]);

  // Fetch sessions when modal opens with "exam-session" data source
  useEffect(() => {
    if (showModal && form.dataSource === "exam-session" && sessions.length === 0) {
      setSessionsLoading(true);
      getExamSessionsForMarksAPI()
        .then((res) => setSessions(res.sessions || []))
        .catch(() => toast.error("Failed to load exam sessions."))
        .finally(() => setSessionsLoading(false));
    }
  }, [showModal, form.dataSource]);

  // Fetch batches when a session is selected
  useEffect(() => {
    if (form.examSessionId && form.examSessionType) {
      const sessionType = form.examSessionType === "RegularExamSession" ? "regular" : "atkt";
      setBatchesLoading(true);
      getSessionFiltersAPI(form.examSessionId, sessionType)
        .then((res) => setSessionBatches(res.filters?.batches || []))
        .catch(() => {
          setSessionBatches([]);
          toast.error("Failed to load batches.");
        })
        .finally(() => setBatchesLoading(false));
    } else {
      setSessionBatches([]);
    }
    setSessionSubjects([]);
  }, [form.examSessionId, form.examSessionType]);

  // Fetch subjects filtered by selected batch
  useEffect(() => {
    if (form.examSessionId && form.examSessionType && form.syncBatch) {
      const sessionType = form.examSessionType === "RegularExamSession" ? "regular" : "atkt";
      setSubjectsLoading(true);
      getSessionSubjectsAPI(form.examSessionId, sessionType, { batch: form.syncBatch })
        .then((res) => setSessionSubjects(res.subjects || []))
        .catch(() => {
          setSessionSubjects([]);
          toast.error("Failed to load subjects.");
        })
        .finally(() => setSubjectsLoading(false));
    } else {
      setSessionSubjects([]);
    }
  }, [form.examSessionId, form.examSessionType, form.syncBatch]);

  // ─── Grouping & filtering ──────────────────────────────

  const filteredConfigs = configs.filter((c) => {
    if (!showArchived && c.status === "archived") return false;
    if (filterProgram && c.programId !== filterProgram) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        c.label?.toLowerCase().includes(term) ||
        c.slug?.toLowerCase().includes(term) ||
        c.programme?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Build program ID -> name lookup
  const programMap = programs.reduce((acc, p) => {
    acc[p._id] = p.programName;
    return acc;
  }, {});

  const hierarchy = buildHierarchy(filteredConfigs, programMap);

  // Accordion: opening one group closes siblings at the same level
  const toggleGroup = (key) =>
    setOpenGroup((prev) => {
      if (prev[key]) return { ...prev, [key]: false };
      // Close all keys at the same prefix level, then open the target
      const prefix = key.includes("-") ? key.substring(0, key.lastIndexOf("-")) : "";
      const next = {};
      for (const k of Object.keys(prev)) {
        const kPrefix = k.includes("-") ? k.substring(0, k.lastIndexOf("-")) : "";
        next[k] = kPrefix === prefix ? false : prev[k];
      }
      next[key] = true;
      return next;
    });

  // ─── Modal handlers ────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  // Subjects from config (edit mode only)
  const [editSubjects, setEditSubjects] = useState([]);
  const [editPractical, setEditPractical] = useState(null);

  const openEdit = (cfg) => {
    setEditingId(cfg._id);
    setForm({
      slug: cfg.slug || "",
      label: cfg.label || "",
      programme: cfg.programme || "",
      programId: cfg.programId || "",
      semester: cfg.semester || "",
      semesterNumber: cfg.semesterNumber ?? "",
      totalSemesters: cfg.totalSemesters ?? "",
      examType: cfg.examType || "regular",
      year: cfg.year || "",
      examMonth: cfg.examMonth || "",
      resultDeclaredOn: cfg.resultDeclaredOn || "",
      resultAmendedOn: cfg.resultAmendedOn || "",
      place: cfg.place || "",
      dataSource: cfg.dataSource === "db"
        ? (cfg.examSessionId ? "exam-session" : "manual")
        : (cfg.dataSource || "excel"),
      examSessionId: cfg.examSessionId || "",
      examSessionType: cfg.examSessionType || "",
      practicalSubjectId: cfg.practicalSubjectId || "",
      practicalType: cfg.practicalType || cfg.practical?.type || "single",
      syncBatch: cfg.syncBatch || "",
      status: cfg.status || "draft",
    });
    setEditSubjects(cfg.subjects?.length ? cfg.subjects.map((s) => ({ ...s })) : []);
    setEditPractical(cfg.practical ? { ...cfg.practical } : null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setEditSubjects([]);
    setEditPractical(null);
    setSessionSubjects([]);
    setSessionBatches([]);
    setBatchesLoading(false);
    setSubjectsLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.slug || !form.label || !form.programme || !form.programId || !form.examType) {
      return toast.warn("Please fill all required fields.");
    }
    if (!form.semesterNumber || form.semesterNumber < 1) {
      return toast.warn("Semester number must be at least 1.");
    }
    if (!form.totalSemesters || form.totalSemesters < 1) {
      return toast.warn("Total semesters must be at least 1.");
    }
    if (form.dataSource === "exam-session" && !form.examSessionId) {
      return toast.warn("Please select an exam session.");
    }
    if (form.dataSource === "exam-session" && !form.syncBatch && editingId) {
      return toast.warn("Please select a batch.");
    }

    setSaving(true);
    try {
      const semNum = Number(form.semesterNumber);
      const payload = {
        ...form,
        semesterNumber: semNum,
        totalSemesters: Number(form.totalSemesters),
      };
      // Auto-fill semester display if not set (create mode hides this field)
      if (!payload.semester) {
        const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
        payload.semester = `SEMESTER ${roman[semNum] || semNum}${payload.year ? ` (${payload.year})` : ""}`;
      }

      if (editingId) {
        if (editSubjects.length > 0) {
          payload.subjects = editSubjects;
        }
        if (editPractical) {
          payload.practical = editPractical;
        }
        await updateResultConfigAPI(editingId, payload);
        toast.success("Configuration updated.");
      } else {
        await createResultConfigAPI(payload);
        toast.success("Configuration created.");
      }

      closeModal();
      fetchConfigs();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save configuration.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Archive ────────────────────────────────────────────

  const handleArchive = async (cfg) => {
    if (!window.confirm(`Archive "${cfg.label}"? This will hide it from result card generation.`)) return;
    try {
      await archiveResultConfigAPI(cfg._id);
      toast.success("Configuration archived.");
      fetchConfigs();
    } catch (err) {
      toast.error("Failed to archive configuration.");
    }
  };

  // ─── Excel upload ──────────────────────────────────────

  // ─── Sync from session ─────────────────────────────────

  const handleSyncFromSession = async (configId) => {
    setSyncing(true);
    try {
      const body = {};
      if (form.practicalSubjectId) {
        body.practicalSubjectId = form.practicalSubjectId;
        body.practicalType = form.practicalType || "single";
      }
      if (form.syncBatch) {
        body.batch = form.syncBatch;
      }
      const result = await syncResultConfigFromSessionAPI(configId, body);
      toast.success(
        result.message || `Synced ${result.studentCount} students from session.`
      );
      // Refresh configs and update modal subjects
      const data = await getResultConfigsAPI();
      const list = Array.isArray(data) ? data : data.configs || [];
      setConfigs(list);
      const fresh = list.find((c) => c._id === configId);
      if (fresh) {
        setEditSubjects(fresh.subjects?.length ? fresh.subjects.map((s) => ({ ...s })) : []);
        setEditPractical(fresh.practical ? { ...fresh.practical } : null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to sync from session.";
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  // ─── Excel handlers ───────────────────────────────────

  const handleDeleteExcelData = async () => {
    if (!editingId) return;
    if (!window.confirm("Delete all Excel data for this config? This will remove all parsed student records, the uploaded file, and detected subjects. This cannot be undone.")) return;
    setDeletingExcel(true);
    try {
      const result = await deleteResultConfigExcelDataAPI(editingId);
      toast.success(result.message || "Excel data deleted.");
      // Refresh config list and reset edit subjects
      const data = await getResultConfigsAPI();
      const list = Array.isArray(data) ? data : data.configs || [];
      setConfigs(list);
      setEditSubjects([]);
      setEditPractical(null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete Excel data.";
      toast.error(msg);
    } finally {
      setDeletingExcel(false);
    }
  };

  const handleExcelUpload = async (configId, file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      return toast.error("Only .xlsx or .xls files are accepted.");
    }
    setUploadingId(configId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadResultConfigExcelAPI(configId, formData);
      if (result.parseWarning) {
        toast.warn(`Excel uploaded but parsing failed: ${result.parseWarning}`);
      } else {
        const msg = result.studentCount != null
          ? `Excel uploaded. ${result.studentCount} students parsed.`
          : "Excel file uploaded.";
        toast.success(msg);
      }
      // Refresh config list and update the modal with fresh data
      const data = await getResultConfigsAPI();
      const list = Array.isArray(data) ? data : data.configs || [];
      setConfigs(list);
      const fresh = list.find((c) => c._id === configId);
      if (fresh) {
        setEditSubjects(fresh.subjects?.length ? fresh.subjects.map((s) => ({ ...s })) : []);
        setEditPractical(fresh.practical ? { ...fresh.practical } : null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to upload Excel.";
      toast.error(msg);
    } finally {
      setUploadingId(null);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ─── Roll comparison ───────────────────────────────────

  const handleCompare = async () => {
    if (!compareA || !compareB) return toast.warn("Select both configs to compare.");
    if (compareA === compareB) return toast.warn("Select two different configs.");
    setComparing(true);
    setCompareResult(null);
    try {
      const res = await compareResultConfigRollsAPI(compareA, compareB);
      setCompareResult(res);
    } catch (err) {
      toast.error("Failed to compare roll numbers.");
    } finally {
      setComparing(false);
    }
  };

  // ─── Program options for dropdowns ─────────────────────

  const programOptions = programs.map((p) => ({
    value: p._id,
    label: p.programName,
  }));

  const configOptions = configs
    .filter((c) => c.status !== "archived")
    .map((c) => ({ value: c._id, label: c.label }));

  // ─── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <ExaminerNavbar />
        <ExaminerTopHeader />
        <div className="lg:ml-64 pt-20 flex items-center justify-center">
          <div className="text-center py-8">Loading configurations...</div>
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
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 max-w-7xl mx-auto mt-4">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold">Result Cards</h1>
                <p className="text-gray-600 mt-1">
                  Manage exam result configs, upload Excel data, and view result cards.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  <FiPlus /> New Config
                </button>
                <button
                  onClick={() => setShowCompare(!showCompare)}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
                    showCompare
                      ? "bg-indigo-700 text-white"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  <FiGitMerge /> Compare Rolls
                </button>
                <button
                  onClick={() => navigate("/examiner/export-template")}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                >
                  <FiDownload /> Export Template
                </button>
              </div>
            </div>

            {/* Roll Number Comparison Panel */}
            {showCompare && (
              <div className="bg-indigo-50 rounded-lg p-4 mb-6 border border-indigo-200">
                <h3 className="text-sm font-semibold mb-3 text-indigo-800">
                  Roll Number Cross-Validation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Config A (e.g. SEM I)
                    </label>
                    <SearchableDropdown
                      options={configOptions}
                      value={compareA}
                      onChange={setCompareA}
                      placeholder="Select first config..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Config B (e.g. SEM II)
                    </label>
                    <SearchableDropdown
                      options={configOptions}
                      value={compareB}
                      onChange={setCompareB}
                      placeholder="Select second config..."
                    />
                  </div>
                </div>
                <button
                  onClick={handleCompare}
                  disabled={comparing}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
                >
                  <FiGitMerge /> {comparing ? "Comparing..." : "Compare Roll Numbers"}
                </button>

                {compareResult && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded p-3 border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {compareResult.inBoth}
                      </div>
                      <div className="text-xs text-green-600">
                        In Both ({compareResult.configA?.label} & {compareResult.configB?.label})
                      </div>
                    </div>
                    <div className="bg-red-50 rounded p-3 border border-red-200">
                      <div className="text-2xl font-bold text-red-700">
                        {compareResult.onlyInA?.count || 0}
                      </div>
                      <div className="text-xs text-red-600">
                        Only in {compareResult.configA?.label}
                      </div>
                      {compareResult.onlyInA?.count > 0 && (
                        <div className="mt-2 text-xs text-red-700 max-h-32 overflow-y-auto font-mono">
                          {compareResult.onlyInA.rolls.join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="bg-orange-50 rounded p-3 border border-orange-200">
                      <div className="text-2xl font-bold text-orange-700">
                        {compareResult.onlyInB?.count || 0}
                      </div>
                      <div className="text-xs text-orange-600">
                        Only in {compareResult.configB?.label}
                      </div>
                      {compareResult.onlyInB?.count > 0 && (
                        <div className="mt-2 text-xs text-orange-700 max-h-32 overflow-y-auto font-mono">
                          {compareResult.onlyInB.rolls.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Program
                </label>
                <select
                  value={filterProgram}
                  onChange={(e) => setFilterProgram(e.target.value)}
                  className="w-full p-2 border-2 border-blue-500 rounded-md bg-white"
                >
                  <option value="">All Programs</option>
                  {programs.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.programName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border-2 border-blue-500 rounded-md bg-white"
                >
                  <option value="">All Statuses</option>
                  {[...new Set(configs.map((c) => c.status).filter(Boolean))]
                    .sort()
                    .map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Label, slug, or programme..."
                  className="w-full p-2 border-2 border-blue-500 rounded-md bg-white"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-sm text-gray-600">Show archived</span>
                  <button
                    type="button"
                    onClick={() => setShowArchived((v) => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                      showArchived ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
                      style={{ transform: showArchived ? "translateX(18px)" : "translateX(3px)" }}
                    />
                  </button>
                </label>
              </div>
            </div>

            {/* Config View: Program -> Year -> Semesters */}
            {Object.keys(hierarchy).length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <i className="mdi mdi-cog-outline text-6xl mb-4 block"></i>
                <p className="text-lg font-medium">No configurations found</p>
                <p className="text-sm mt-1">Create a new config or adjust your filters.</p>
              </div>
            ) : (
              Object.entries(hierarchy).map(([progName, years]) => {
                const progKey = `prog-${progName}`;
                const progOpen = openGroup[progKey];
                const progConfigCount = Object.values(years).reduce(
                  (sum, sems) => sum + Object.values(sems).reduce(
                    (s2, arr) => s2 + (Array.isArray(arr) ? arr.length : Object.values(arr).reduce((s3, a) => s3 + a.length, 0)), 0
                  ), 0
                );

                return (
                  <div key={progName} className="mb-5">
                    {/* Program Header */}
                    <button
                      onClick={() => toggleGroup(progKey)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <i className="mdi mdi-school text-xl"></i>
                        <span className="font-bold text-base">{progName}</span>
                        <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          {progConfigCount}
                        </span>
                      </div>
                      {progOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                    </button>

                    {progOpen && (
                      <div className="mt-3 space-y-4">
                        {Object.entries(years)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([year, semesters]) => {
                            const yearKey = `${progKey}-${year}`;
                            const yearOpen = openGroup[yearKey];

                            return (
                              <div key={yearKey} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Year Header */}
                                <button
                                  onClick={() => toggleGroup(yearKey)}
                                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <i className="mdi mdi-calendar-range text-gray-500"></i>
                                    <span className="font-semibold text-sm text-gray-800">{year}</span>
                                  </div>
                                  {yearOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                                </button>

                                {yearOpen && (
                                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {Object.entries(semesters)
                                      .sort(([a], [b]) => Number(a) - Number(b))
                                      .map(([semNum, allSemConfigs]) => {
                                        const semConfigs = showArchived
                                          ? allSemConfigs
                                          : allSemConfigs.filter((c) => c.status !== "archived");
                                        if (semConfigs.length === 0) return null;
                                        return (
                                        <div
                                          key={`${yearKey}-sem${semNum}`}
                                          className="border border-gray-200 rounded-lg bg-white"
                                        >
                                          {/* Semester card header */}
                                          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                                            <div className="font-semibold text-sm text-gray-700">
                                              Semester {semNum}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                              {semConfigs[0]?.programme}
                                            </div>
                                          </div>

                                          {/* Exam type rows */}
                                          <div className="divide-y divide-gray-100">
                                            {semConfigs.map((c) => (
                                              <div
                                                key={c._id}
                                                className="flex items-center justify-between px-3 py-2 hover:bg-blue-50/50 transition-colors group"
                                              >
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${examTypeBadge(c.examType)}`}>
                                                    {c.examType}
                                                  </span>
                                                  <span className={`px-1.5 py-0.5 rounded text-xs ${statusBadge(c.status)}`}>
                                                    {c.status}
                                                  </span>
                                                  {/* [LEGACY EXCEL] Excel attached indicator
                                                  {c.dataSource === "excel" && (
                                                    c.excelFile
                                                      ? <FiCheck className="text-green-500 shrink-0" size={12} title="Excel attached" />
                                                      : <FiX className="text-red-400 shrink-0" size={12} title="No Excel" />
                                                  )}
                                                  */}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                  {/* View result cards */}
                                                  {c.status === "active" ? (
                                                    <button
                                                      type="button"
                                                      onClick={() => navigate(`/examiner/result-cards/${c._id}`)}
                                                      className="flex items-center justify-center w-7 h-7 text-emerald-600 hover:bg-emerald-100 rounded"
                                                      title="View Result Cards"
                                                    >
                                                      <FiEye size={14} />
                                                    </button>
                                                  ) : null}
                                                  <button
                                                    type="button"
                                                    onClick={() => openEdit(c)}
                                                    className="flex items-center justify-center w-7 h-7 text-blue-600 hover:bg-blue-100 rounded"
                                                    title="Edit"
                                                  >
                                                    <FiEdit2 size={14} />
                                                  </button>
                                                  {c.status !== "archived" ? (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleArchive(c)}
                                                      className="flex items-center justify-center w-7 h-7 text-red-500 hover:bg-red-50 rounded"
                                                      title="Archive"
                                                    >
                                                      <FiTrash2 size={14} />
                                                    </button>
                                                  ) : <span className="w-7 h-7" />}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                      })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div className="mt-4 text-sm text-gray-500">
              Total: {filteredConfigs.length} configuration{filteredConfigs.length !== 1 ? "s" : ""}
              {(filterProgram || filterStatus || searchTerm) && (
                <button
                  onClick={() => { setFilterProgram(""); setFilterStatus(""); setSearchTerm(""); }}
                  className="ml-3 text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Sticky header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white rounded-t-xl border-b border-gray-200 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "Edit Configuration" : "New Configuration"}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <FiX size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* -- Section: Identity -- */}
              <fieldset className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Identity</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Label *</label>
                    <input
                      name="label"
                      value={form.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          label,
                          // Auto-generate slug from label: lowercase, trim, replace spaces/special chars with dashes
                          slug: label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                        }));
                      }}
                      placeholder="e.g. FY LL.B. 2024 SEM I"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Slug *</label>
                    <input
                      name="slug"
                      value={form.slug}
                      onChange={handleChange}
                      placeholder="e.g. fy-llb-2024-sem1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                </div>
              </fieldset>

              {/* -- Section: Program & Exam -- */}
              <fieldset className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Program & Exam</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Programme Display Name *</label>
                    <input
                      name="programme"
                      value={form.programme}
                      onChange={handleChange}
                      placeholder="e.g. FIRST YEAR LL.B."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Program (Degree) *</label>
                    <SearchableDropdown
                      options={programOptions}
                      value={form.programId}
                      onChange={(val) => setForm((prev) => ({ ...prev, programId: val }))}
                      placeholder="Select program..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Exam Type *</label>
                    <select
                      name="examType"
                      value={form.examType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    >
                      {EXAM_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Semester Number *</label>
                    <input
                      name="semesterNumber"
                      type="number"
                      min={1}
                      max={10}
                      value={form.semesterNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Semesters *</label>
                    <input
                      name="totalSemesters"
                      type="number"
                      min={1}
                      max={10}
                      value={form.totalSemesters}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                </div>
              </fieldset>

              {/* -- Section: Semester & Details (edit only) -- */}
              {editingId && (
              <fieldset className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Details</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Semester Display</label>
                    <input
                      name="semester"
                      value={form.semester}
                      onChange={handleChange}
                      placeholder="e.g. SEMESTER I (2024-2025)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                    <input
                      name="year"
                      value={form.year}
                      onChange={handleChange}
                      placeholder="2024-2025"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Exam Month</label>
                    <input
                      name="examMonth"
                      value={form.examMonth}
                      onChange={handleChange}
                      placeholder="NOVEMBER"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Result Declared On</label>
                    <input
                      name="resultDeclaredOn"
                      value={form.resultDeclaredOn}
                      onChange={handleChange}
                      placeholder="dd/mm/yyyy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Place</label>
                    <input
                      name="place"
                      value={form.place}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {form.examType === "reval" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Result Amended On</label>
                    <input
                      name="resultAmendedOn"
                      value={form.resultAmendedOn}
                      onChange={handleChange}
                      placeholder="dd/mm/yyyy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    />
                  </div>
                )}
              </fieldset>
              )}

              {/* [LEGACY EXCEL] Data Source dropdown + Excel settings -- all configs now use "db" */}

              {/* -- Section: Data Source -- */}
              <fieldset className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
                  Data Source
                </legend>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dataSource"
                      value="excel"
                      checked={form.dataSource === "excel"}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Excel Template</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dataSource"
                      value="exam-session"
                      checked={form.dataSource === "exam-session"}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">From Exam Session</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dataSource"
                      value="manual"
                      checked={form.dataSource === "manual"}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Manual Entry</span>
                  </label>
                </div>

                {form.dataSource === "exam-session" && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    {/* Step 1: Exam Session */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {editingId ? "1. " : ""}Exam Session *
                      </label>
                      {sessionsLoading ? (
                        <p className="text-xs text-gray-400">Loading sessions...</p>
                      ) : (
                        <select
                          name="examSessionId"
                          value={form.examSessionId}
                          onChange={(e) => {
                            const selectedSession = sessions.find(
                              (s) => s._id === e.target.value
                            );
                            setForm((prev) => ({
                              ...prev,
                              examSessionId: e.target.value,
                              examSessionType: selectedSession?.examSessionType || "",
                              year: selectedSession?.academicYear || prev.year,
                              examType: selectedSession?.sessionType === "atkt" ? "atkt" : prev.examType,
                              syncBatch: "",
                              practicalSubjectId: "",
                              practicalType: "single",
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                        >
                          <option value="">Select exam session...</option>
                          {sessions.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.title} ({s.academicYear} - {s.term})
                              {s.sessionType === "atkt" ? " [ATKT]" : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Step 2: Batch (edit mode only) */}
                    {form.examSessionId && editingId && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          2. Batch *
                        </label>
                        {batchesLoading ? (
                          <p className="text-xs text-gray-400">Loading batches...</p>
                        ) : sessionBatches.length === 0 ? (
                          <p className="text-xs text-red-500">No batches found for this session.</p>
                        ) : (
                          <select
                            name="syncBatch"
                            value={form.syncBatch}
                            onChange={(e) => {
                              setForm((prev) => ({
                                ...prev,
                                syncBatch: e.target.value,
                                practicalSubjectId: "",
                                practicalType: "single",
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                          >
                            <option value="">Select batch...</option>
                            {sessionBatches.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* Step 3: Practical (edit mode only) */}
                    {form.examSessionId && form.syncBatch && editingId && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            3. Practical Subject
                          </label>
                          {subjectsLoading ? (
                            <p className="text-xs text-gray-400">Loading subjects...</p>
                          ) : sessionSubjects.length === 0 ? (
                            <p className="text-xs text-gray-500">No subjects found for this batch.</p>
                          ) : (
                            <select
                              name="practicalSubjectId"
                              value={form.practicalSubjectId}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                            >
                              <option value="">None (no practical)</option>
                              {sessionSubjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.label} {s.subjectCode ? `(${s.subjectCode})` : ""}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        {form.practicalSubjectId && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Practical Type
                            </label>
                            <select
                              name="practicalType"
                              value={form.practicalType}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                            >
                              <option value="single">Single (one total mark)</option>
                              <option value="split">Split (Internal / External)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </fieldset>

              {/* -- Section: Excel Data (edit only, excel source) -- */}
              {editingId && form.dataSource === "excel" && (
                <fieldset className="bg-white rounded-lg border border-blue-200 p-4">
                  <legend className="text-xs font-semibold text-blue-600 uppercase tracking-wider px-1">Excel Data</legend>
                  {editSubjects.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Data already uploaded ({editSubjects.length} subjects).
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate(`/examiner/result-cards/${editingId}?view=table`)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                        >
                          Open Table View to edit
                        </button>
                      </div>
                      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={handleDeleteExcelData}
                          disabled={deletingExcel}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          <FiTrash2 size={14} />
                          {deletingExcel ? "Deleting..." : "Delete Excel Data"}
                        </button>
                        <span className="text-xs text-gray-400">Removes all parsed records and the uploaded file</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-3">
                        Upload a filled standard template (.xlsx). This will parse and save student records for this config.
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingId === editingId}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          <FiUpload size={14} />
                          {uploadingId === editingId ? "Uploading..." : "Choose File"}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          disabled={uploadingId === editingId}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && editingId) handleExcelUpload(editingId, file);
                          }}
                        />
                        <span className="text-xs text-gray-400">Only .xlsx or .xls</span>
                      </div>
                    </>
                  )}
                </fieldset>
              )}

              {/* -- Section: Session Data (edit only, exam-session source) -- */}
              {editingId && form.dataSource === "exam-session" && (
                <fieldset className="bg-white rounded-lg border border-green-200 p-4">
                  <legend className="text-xs font-semibold text-green-600 uppercase tracking-wider px-1">
                    Session Data
                  </legend>
                  {editSubjects.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">
                        {editSubjects.length} subjects synced from session.
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSyncFromSession(editingId)}
                          disabled={syncing || !form.syncBatch}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          <FiRefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                          {syncing ? "Syncing..." : "Re-sync from Session"}
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/examiner/result-cards/${editingId}?view=table`)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                        >
                          Open Table View to edit
                        </button>
                      </div>
                      {!form.syncBatch && (
                        <p className="text-xs text-orange-500">Select a batch above to sync.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">
                        No data synced yet. Select session and batch above, then click below to pull student results.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSyncFromSession(editingId)}
                        disabled={syncing || !form.examSessionId || !form.syncBatch}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        <FiRefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                        {syncing ? "Syncing..." : "Sync from Session"}
                      </button>
                      {(!form.examSessionId || !form.syncBatch) && (
                        <p className="text-xs text-orange-500">
                          {!form.examSessionId ? "Save the config with a linked session first." : "Select a batch above to sync."}
                        </p>
                      )}
                    </div>
                  )}
                </fieldset>
              )}

              {/* -- Section: Subjects (edit only, when subjects exist) -- */}
              {editingId && editSubjects.length > 0 && (
                <fieldset className="bg-white rounded-lg border border-gray-200 p-4">
                  <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
                    Subjects ({editSubjects.length})
                  </legend>
                  <p className="text-xs text-gray-500 mb-3">
                    Edit subject names, codes, credits, and mark elective subjects.
                  </p>
                  <div className="space-y-1.5">
                    {editSubjects.map((subj, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          subj.elective
                            ? "bg-amber-50 border-amber-200"
                            : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        <input
                          type="number"
                          value={subj.code}
                          onChange={(e) =>
                            setEditSubjects((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, code: Number(e.target.value) } : s
                              )
                            )
                          }
                          className="w-14 text-xs font-mono text-center border border-gray-300 rounded px-1 py-1"
                          title="Subject Code"
                        />
                        <input
                          type="text"
                          value={subj.name}
                          onChange={(e) =>
                            setEditSubjects((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, name: e.target.value } : s
                              )
                            )
                          }
                          className="text-sm flex-1 border border-gray-300 rounded px-2 py-1"
                          title="Subject Name"
                        />
                        <input
                          type="number"
                          value={subj.credit}
                          onChange={(e) =>
                            setEditSubjects((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, credit: Number(e.target.value) } : s
                              )
                            )
                          }
                          className="w-14 text-xs text-center border border-gray-300 rounded px-1 py-1"
                          title="Credit"
                          min={1}
                        />
                        <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                          <input
                            type="checkbox"
                            checked={!!subj.elective}
                            onChange={() =>
                              setEditSubjects((prev) =>
                                prev.map((s, i) =>
                                  i === idx ? { ...s, elective: !s.elective } : s
                                )
                              )
                            }
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Elective</span>
                        </label>
                      </div>
                    ))}
                  </div>

                  {editPractical && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Practical</p>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-purple-50 border-purple-200">
                        <input
                          type="number"
                          value={editPractical.code || ""}
                          onChange={(e) =>
                            setEditPractical((prev) => ({ ...prev, code: Number(e.target.value) }))
                          }
                          className="w-14 text-xs font-mono text-center border border-gray-300 rounded px-1 py-1"
                          title="Practical Code"
                        />
                        <input
                          type="text"
                          value={editPractical.name || ""}
                          onChange={(e) =>
                            setEditPractical((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className="text-sm flex-1 border border-gray-300 rounded px-2 py-1"
                          title="Practical Name"
                        />
                        <input
                          type="number"
                          value={editPractical.credit || 4}
                          onChange={(e) =>
                            setEditPractical((prev) => ({ ...prev, credit: Number(e.target.value) }))
                          }
                          className="w-14 text-xs text-center border border-gray-300 rounded px-1 py-1"
                          title="Credit"
                          min={1}
                        />
                        <span className="text-xs text-purple-600 shrink-0">{editPractical.type || "single"}</span>
                      </div>
                    </div>
                  )}
                </fieldset>
              )}
            </div>

            {/* Sticky footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-white rounded-b-xl border-t border-gray-200 shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultConfigManagement;
