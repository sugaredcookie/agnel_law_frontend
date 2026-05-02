import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import {
  getExamSessionsForMarksAPI,
  getSessionFiltersAPI,
  getSessionSubjectsAPI,
  getStudentsForSubjectMarksAPI,
  bulkSaveMarksAPI,
  downloadSubjectMarksTemplateAPI,
  parseUploadedMarksAPI,
  getPendingMarkChangeRequestsAPI,
  reviewMarkChangeRequestAPI,
} from "../../utils/Api";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const ExaminerMarkEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Session selection state
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionType, setSessionType] = useState("");

  // Filters state
  const [filters, setFilters] = useState({ batches: [], courses: [] });
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  // Subject selection
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Students and marks
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [originalMarksData, setOriginalMarksData] = useState({});
  const [expandedRows, setExpandedRows] = useState({});

  // ATKT patterns from API response
  const [atktPatterns, setAtktPatterns] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // Upload/Download state
  const [uploadPreview, setUploadPreview] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Unsaved changes modal
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const fileInputRef = useRef(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("marks"); // "marks" | "change-requests"
  const [changeRequests, setChangeRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [reviewingId, setReviewingId] = useState(null);
  const [rejectRemark, setRejectRemark] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(null);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    // If both are empty, no changes
    const marksKeys = Object.keys(marksData);
    const originalKeys = Object.keys(originalMarksData);
    
    if (marksKeys.length === 0 && originalKeys.length === 0) {
      return false;
    }
    
    // Different number of students => changes
    if (marksKeys.length !== originalKeys.length) {
      return true;
    }
    
    // Compare each student's marks
    for (const studentId of marksKeys) {
      const current = marksData[studentId] || {};
      const original = originalMarksData[studentId] || {};
      
      const currentFields = Object.keys(current);
      const originalFields = Object.keys(original);
      
      // Check if same fields exist
      if (currentFields.length !== originalFields.length) {
        return true;
      }
      
      // Compare values (convert to string for consistent comparison)
      for (const field of currentFields) {
        const currentVal = current[field] ?? "";
        const originalVal = original[field] ?? "";
        if (String(currentVal) !== String(originalVal)) {
          return true;
        }
      }
    }
    
    return false;
  }, [marksData, originalMarksData]);

  // Warn user before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Fetch exam sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const getInternalComponentNames = (subjectForScheme) => {
    const internalScheme = subjectForScheme?.markingScheme?.find(
      (scheme) => scheme.name?.toLowerCase() === "internal"
    );

    if (!internalScheme) return [];

    const validBreakdown = internalScheme.breakdown?.filter(
      (item) => item.value != null && item.value > 0
    );

    if (validBreakdown && validBreakdown.length > 0) {
      return validBreakdown.map((item) => item.name);
    }

    if (internalScheme.value != null) {
      return ["Internal"];
    }

    return [];
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await getExamSessionsForMarksAPI({});
      setSessions(response.sessions || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load exam sessions");
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeRequests = async (sessionId) => {
    try {
      setLoadingRequests(true);
      const params = {};
      if (sessionId) params.examSessionId = sessionId;
      const res = await getPendingMarkChangeRequestsAPI(params);
      setChangeRequests(res.requests || []);
      setPendingCount((res.requests || []).filter((r) => r.status === "pending").length);
    } catch (error) {
      console.error("Error fetching change requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleReviewRequest = async (requestId, status, remark) => {
    try {
      setReviewingId(requestId);
      await reviewMarkChangeRequestAPI(requestId, { status, remark });
      toast.success(`Change request ${status}`);
      setShowRejectModal(null);
      setRejectRemark("");
      // Refresh
      fetchChangeRequests(selectedSession?._id);
    } catch (error) {
      console.error("Error reviewing request:", error);
      toast.error("Failed to review change request");
    } finally {
      setReviewingId(null);
    }
  };

  const handleSessionChange = async (sessionId) => {
    const session = sessions.find((s) => s._id === sessionId);
    setSelectedSession(session);
    setSessionType(session?.sessionType || "");
    setSelectedBatch("");
    setSelectedCourse("");
    setSubjects([]);
    setSelectedSubject(null);
    setStudents([]);
    setMarksData({});

    if (session) {
      try {
        const [filtersResponse, subjectsResponse] = await Promise.all([
          getSessionFiltersAPI(sessionId, session.sessionType),
          getSessionSubjectsAPI(sessionId, session.sessionType, {}),
        ]);

        setFilters(filtersResponse.filters || { batches: [], courses: [] });
        setSubjects(subjectsResponse.subjects || []);

        if (subjectsResponse.warning) {
          toast.warning(subjectsResponse.warning);
        }

        // Fetch pending change requests count
        fetchChangeRequests(sessionId);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    }
  };

  const handleFilterChange = async (batch, course) => {
    setSelectedBatch(batch);
    setSelectedCourse(course);
    setSelectedSubject(null);
    setStudents([]);
    setMarksData({});

    if (selectedSession) {
      try {
        const subjectsResponse = await getSessionSubjectsAPI(
          selectedSession._id,
          sessionType,
          { batch: batch || undefined, course: course || undefined }
        );
        setSubjects(subjectsResponse.subjects || []);
        if (subjectsResponse.warning) {
          toast.warning(subjectsResponse.warning);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast.error("Failed to load subjects");
      }
    }
  };

  const handleSubjectChange = async (subjectId) => {
    // Check for unsaved changes before switching
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
      setPendingNavigation({ type: "subject", value: subjectId });
      return;
    }
    
    await loadSubject(subjectId);
  };

  const loadSubject = async (subjectId) => {
    // Handle "all" subjects option
    if (subjectId === "__all__") {
      setSelectedSubject({ id: "__all__", label: "All Subjects" });
    } else {
      const subject = subjects.find((s) => s.id === subjectId);
      setSelectedSubject(subject);
    }
    setStudents([]);
    setMarksData({});
    setOriginalMarksData({});

    if (selectedSession && subjectId) {
      try {
        setLoadingStudents(true);
        const response = await getStudentsForSubjectMarksAPI(
          selectedSession._id,
          sessionType,
          subjectId,
          { batch: selectedBatch, course: selectedCourse }
        );

        // Store ATKT patterns from response
        if (response.atktPatterns) {
          setAtktPatterns(response.atktPatterns);
        } else {
          setAtktPatterns([]);
        }

        const internalNames = new Set(
          getInternalComponentNames(response.subject || selectedSubject)
        );

        const studentsWithMarks = (response.students || []).map((student) => {
          const existingMarks = {};

          if (student.existingResult?.marks) {
            student.existingResult.marks.forEach((m) => {
              existingMarks[m.schemeName] = m.obtainedMarks;
            });
          }

          if (sessionType === "regular" && student.facultyMarks?.length > 0) {
            student.facultyMarks.forEach((m) => {
              if (internalNames.size === 0 || internalNames.has(m.schemeName)) {
                existingMarks[m.schemeName] = m.obtainedMarks;
              }
            });
          }

          return { ...student, marks: existingMarks };
        });

        setStudents(studentsWithMarks);

        // Initialize marksData state and original for change tracking
        const initialMarks = {};
        studentsWithMarks.forEach((s) => {
          initialMarks[s.studentId] = { ...s.marks };
        });
        setMarksData(initialMarks);
        setOriginalMarksData(JSON.parse(JSON.stringify(initialMarks)));
      } catch (error) {
        console.error("Error fetching students:", error);
        toast.error("Failed to load students");
      } finally {
        setLoadingStudents(false);
      }
    }
  };

  // Marking scheme - for ATKT use pattern, for Regular use subject marking scheme
  const markingScheme = useMemo(() => {
    // For ATKT exams, use pattern-based marking (External:Internal format)
    if (sessionType === "atkt" && atktPatterns.length > 0) {
      // Use the first pattern (or most common) - students might have different patterns
      const pattern = atktPatterns[0]; // e.g., "75:25" or "60:40"
      const [externalMax, internalMax] = pattern.split(":").map(Number);
      return {
        isAtkt: true,
        pattern,
        internal: {
          components: [{ name: "Internal", maxMarks: internalMax || 25 }],
          total: internalMax || 25,
        },
        external: { maxMarks: externalMax || 75 },
      };
    }

    // Transform backend marking scheme format to frontend expected format
    if (selectedSubject?.markingScheme && Array.isArray(selectedSubject.markingScheme)) {
      const internalScheme = selectedSubject.markingScheme.find(
        (s) => s.name?.toLowerCase() === "internal"
      );
      const externalScheme = selectedSubject.markingScheme.find(
        (s) => s.name?.toLowerCase() === "external"
      );

      // Build internal components from breakdown or use single Internal field
      let internalComponents = [];
      let internalTotal = internalScheme?.value || 25;

      if (internalScheme?.breakdown?.length > 0) {
        // Use breakdown components
        internalComponents = internalScheme.breakdown
          .filter((b) => b.value != null && b.value > 0)
          .map((b) => ({
            name: b.name,
            maxMarks: b.value,
          }));
      }
      
      // If no valid breakdown, use single Internal component
      if (internalComponents.length === 0 && internalScheme?.value) {
        internalComponents = [{ name: "Internal", maxMarks: internalScheme.value }];
      }

      return {
        internal: {
          components: internalComponents,
          total: internalTotal,
        },
        external: { maxMarks: externalScheme?.value || 75 },
      };
    }

    // Default scheme structure
    return {
      internal: {
        components: [
          { name: "Assignment", maxMarks: 10 },
          { name: "Class Test", maxMarks: 10 },
          { name: "Attendance", maxMarks: 5 },
        ],
        total: 25,
      },
      external: { maxMarks: 75 },
    };
  }, [selectedSubject, sessionType, atktPatterns]);

  // Get student-specific pattern-based marking for ATKT (since students may have different patterns)
  const getStudentMarkingScheme = (student) => {
    if (sessionType === "atkt" && student.pattern) {
      const [externalMax, internalMax] = student.pattern.split(":").map(Number);
      return {
        isAtkt: true,
        pattern: student.pattern,
        internal: {
          components: [{ name: "Internal", maxMarks: internalMax || 25 }],
          total: internalMax || 25,
        },
        external: { maxMarks: externalMax || 75 },
      };
    }
    return markingScheme;
  };

  const handleMarkChange = (studentId, schemeName, value) => {
    setMarksData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [schemeName]: value,
      },
    }));
  };

  // Save all marks at once
  const handleSaveAll = async () => {
    if (!hasUnsavedChanges) {
      toast.info("No changes to save");
      return;
    }

    try {
      setSavingAll(true);
      
      // Build bulk save data with only changed marks
      const studentsMarks = Object.entries(marksData)
        .map(([studentId, marks]) => {
          const original = originalMarksData[studentId] || {};
          const changedMarks = Object.entries(marks)
            .filter(([schemeName, value]) => {
              const originalValue = original[schemeName] ?? "";
              return String(value ?? "") !== String(originalValue);
            })
            .filter(([, value]) => value !== undefined && value !== "")
            .map(([schemeName, obtainedMarks]) => ({
              schemeName,
              obtainedMarks: Number(obtainedMarks) || 0,
            }));

          if (changedMarks.length === 0) return null;

          return {
            studentId,
            marks: changedMarks,
          };
        })
        .filter(Boolean);

      if (studentsMarks.length === 0) {
        toast.info("No marks to save");
        return;
      }

      await bulkSaveMarksAPI({
        sessionId: selectedSession._id,
        sessionType,
        subjectId: selectedSubject.id,
        studentsMarks,
      });

      // Update original marks to match current (no more unsaved changes)
      setOriginalMarksData(JSON.parse(JSON.stringify(marksData)));
      toast.success(`Marks saved for ${studentsMarks.length} student(s)`);
    } catch (error) {
      console.error("Error saving marks:", error);
      toast.error("Failed to save marks");
    } finally {
      setSavingAll(false);
    }
  };

  // Download marks template
  const handleDownloadTemplate = async () => {
    if (!selectedSession || !selectedSubject || selectedSubject.id === "__all__") return;
    try {
      const response = await downloadSubjectMarksTemplateAPI(
        selectedSession._id,
        sessionType,
        selectedSubject.id,
        { batch: selectedBatch, course: selectedCourse }
      );
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `marks-template-${selectedSubject.label}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded");
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      
      // Parse Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 2 }); // Skip header rows
      
      // Add studentId from Student ID column
      const processedData = jsonData.map(row => ({
        ...row,
        studentId: row["Student ID"],
        srNo: row["Sr No"],
      }));
      
      // Send to backend for preview
      const response = await parseUploadedMarksAPI(
        selectedSession._id,
        sessionType,
        selectedSubject.id,
        processedData
      );
      
      if (response.success) {
        setUploadPreview(response);
        setShowUploadModal(true);
      } else {
        toast.error(response.message || "Failed to parse uploaded file");
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Failed to parse uploaded file");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Apply uploaded marks
  const handleApplyUploadedMarks = () => {
    if (!uploadPreview?.preview) return;
    
    const newMarksData = { ...marksData };
    uploadPreview.preview.forEach((item) => {
      if (item.marks && item.marks.length > 0) {
        newMarksData[item.studentId] = {};
        item.marks.forEach((m) => {
          newMarksData[item.studentId][m.schemeName] = m.obtainedMarks;
        });
      }
    });
    
    setMarksData(newMarksData);
    setShowUploadModal(false);
    setUploadPreview(null);
    toast.success("Marks applied. Click 'Save All' to save changes.");
  };

  // Handle unsaved changes modal actions
  const handleDiscardChanges = () => {
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      if (pendingNavigation.type === "subject") {
        loadSubject(pendingNavigation.value);
      }
      setPendingNavigation(null);
    }
  };

  const handleSaveAndContinue = async () => {
    await handleSaveAll();
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      if (pendingNavigation.type === "subject") {
        loadSubject(pendingNavigation.value);
      }
      setPendingNavigation(null);
    }
  };

  const toggleRowExpansion = (studentId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const calculateInternalTotal = (studentId) => {
    const studentMarks = marksData[studentId] || {};
    if (markingScheme.internal?.components) {
      return markingScheme.internal.components.reduce((sum, comp) => {
        return sum + (parseFloat(studentMarks[comp.name]) || 0);
      }, 0);
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen text-black">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 max-w-7xl mx-auto mt-10">
            <h1 className="text-3xl font-bold mb-6">Exam Marks Entry</h1>

            {/* Notice: Export & Publish moved to Result Cards */}
            <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-lg">
              <span className="text-amber-600 text-lg mt-0.5">&#9432;</span>
              <div className="text-sm text-amber-800">
                <strong>Download Results</strong>, <strong>Publish</strong>, and <strong>Unpublish</strong> have moved to{" "}
                <Link to="/examiner/result-cards" className="font-semibold text-blue-700 underline hover:text-blue-900">
                  Result Cards
                </Link>. Use this page only for entering and editing marks.
              </div>
            </div>

            {/* Session Selection Section */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-lg font-semibold mb-4 text-blue-800">Select Exam Session</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Exam Session</label>
                  <select
                    value={selectedSession?._id || ""}
                    onChange={(e) => handleSessionChange(e.target.value)}
                    className="w-full p-2 border-2 border-blue-500 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    disabled={loading}
                  >
                    <option value="">-- Select Session --</option>
                    {sessions.map((session) => (
                      <option key={session._id} value={session._id}>
                        {session.title} ({session.academicYear} - {session.term})
                        {session.sessionType === "atkt" ? " [ATKT]" : " [Regular]"}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSession && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Batch</label>
                      <select
                        value={selectedBatch}
                        onChange={(e) => handleFilterChange(e.target.value, selectedCourse)}
                        className="w-full p-2 border-2 border-blue-500 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">-- All Batches --</option>
                        {filters.batches.map((batch) => (
                          <option key={batch} value={batch}>
                            {batch}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Subject</label>
                      <select
                        value={selectedSubject?.id || ""}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        className="w-full p-2 border-2 border-blue-500 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        disabled={subjects.length === 0}
                      >
                        <option value="">-- Select Subject --</option>
                        <option value="__all__">-- All Subjects (View Only) --</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Warning when no linked subjects found */}
              {selectedSession && subjects.length === 0 && !loading && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-amber-800 font-medium">No Linked Subjects Found</p>
                      <p className="text-amber-700 text-sm mt-1">
                        Subjects need to be linked before marks can be entered. Please go to the{" "}
                        <Link 
                          to="/examiner/subject-linking" 
                          className="text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          Subject Linking
                        </Link>{" "}
                        page to connect exam session subjects to the admin Subject database.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedSession && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className={`inline-block px-2 py-1 rounded ${
                    sessionType === "atkt" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                  }`}>
                    {sessionType === "atkt" ? "ATKT/Supplementary Exam" : "Regular Exam"}
                  </span>
                  <span className="text-sm text-gray-600">Academic Year: {selectedSession.academicYear}</span>
                  <span className="text-sm text-gray-600">Term: {selectedSession.term}</span>
                </div>
              )}
            </div>

            {/* Tabs */}
            {selectedSession && (
              <div className="mb-6 flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("marks")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "marks"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Marks Entry
                </button>
                <button
                  onClick={() => {
                    setActiveTab("change-requests");
                    fetchChangeRequests(selectedSession._id);
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === "change-requests"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Change Requests
                  {pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* ─── Change Requests Tab ─── */}
            {activeTab === "change-requests" && selectedSession && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Pending Change Requests
                  {selectedSession && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      — {selectedSession.title}
                    </span>
                  )}
                </h3>

                {loadingRequests ? (
                  <p className="text-center py-4 text-gray-500">Loading requests...</p>
                ) : changeRequests.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No pending change requests.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm">Student</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm">Subject</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm">Current Marks</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm">Proposed Marks</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm">Faculty Remark</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm">Requested By</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm">Date</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changeRequests.map((req) => {
                          const studentName = req.studentId
                            ? `${req.studentId.studentDetails?.firstName || ""} ${req.studentId.studentDetails?.lastName || ""}`.trim()
                            : "Unknown";
                          const rollNumber = req.studentId?.academicDetails?.rollNumber || "";

                          return (
                            <tr key={req._id} className="bg-white hover:bg-gray-50">
                              <td className="border border-gray-300 px-3 py-2 text-sm">
                                <div className="font-medium">{studentName}</div>
                                <div className="text-xs text-gray-500">{rollNumber}</div>
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">
                                {req.subjectId?.subjectName || "—"}
                                {req.subjectId?.subjectCode && (
                                  <span className="text-xs text-gray-500 block">{req.subjectId.subjectCode}</span>
                                )}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">
                                {(req.currentMarks || []).map((m, i) => (
                                  <div key={i} className="text-gray-600">
                                    {m.schemeName}: <span className="font-medium">{m.obtainedMarks}</span>/{m.maxMarks}
                                  </div>
                                ))}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">
                                {(req.proposedMarks || []).map((m, i) => {
                                  const current = req.currentMarks?.find((c) => c.schemeName === m.schemeName);
                                  const changed = current && Number(current.obtainedMarks) !== Number(m.obtainedMarks);
                                  return (
                                    <div key={i} className={changed ? "text-blue-700 font-semibold" : "text-gray-600"}>
                                      {m.schemeName}: <span>{m.obtainedMarks}</span>/{m.maxMarks}
                                      {changed && <span className="text-xs ml-1">(was {current.obtainedMarks})</span>}
                                    </div>
                                  );
                                })}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-sm text-gray-700 max-w-[200px]">
                                {req.remark}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">
                                {req.requestedBy?.name || req.requestedBy?.email || "—"}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-sm text-gray-500">
                                {new Date(req.createdAt).toLocaleDateString()}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                {req.status === "pending" ? (
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => handleReviewRequest(req._id, "approved", "")}
                                      disabled={reviewingId === req._id}
                                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => setShowRejectModal(req._id)}
                                      disabled={reviewingId === req._id}
                                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      req.status === "approved"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {req.status}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ─── Marks Entry Tab ─── */}
            {activeTab === "marks" && (
              <>
            {/* Loading State */}
            {loadingStudents && <p className="text-center py-4">Loading students...</p>}

            {/* All Subjects View - Read Only Overview */}
            {!loadingStudents && students.length > 0 && selectedSubject?.id === "__all__" && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    All Students in Session: {students.length}
                  </h3>
                  <span className="text-sm text-gray-500 bg-yellow-100 px-3 py-1 rounded">
                    View Only - Select a specific subject to enter marks
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="border border-gray-300 px-4 py-2 text-left">Roll No</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Student Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Batch</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Subjects</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Results Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const subjectResults = student.subjectsWithResults || [];
                        const completedCount = subjectResults.filter((s) => s.result).length;
                        const totalCount = subjectResults.length;

                        return (
                          <tr key={student.studentId || student.rollNumber} className="bg-white hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2">
                              {student.rollNumber}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {student.studentName}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {student.batch}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              <div className="flex flex-wrap gap-1">
                                {subjectResults.map((subj, idx) => (
                                  <span
                                    key={idx}
                                    className={`text-xs px-2 py-1 rounded ${
                                      subj.result
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                    title={subj.result ? `Marks entered` : `Pending`}
                                  >
                                    {subj.label?.substring(0, 20) || subj.id}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <span className={`text-sm font-medium ${
                                completedCount === totalCount && totalCount > 0
                                  ? "text-green-600"
                                  : completedCount > 0
                                    ? "text-yellow-600"
                                    : "text-gray-500"
                              }`}>
                                {completedCount} / {totalCount}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Single Subject View - Editable Marks Entry */}
            {!loadingStudents && students.length > 0 && selectedSubject && selectedSubject.id !== "__all__" && (
              <div>
                <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
                  <h3 className="text-lg font-semibold">
                    Students: {students.length} | Subject: {selectedSubject.label}
                    {hasUnsavedChanges && (
                      <span className="ml-3 text-sm text-orange-600 font-normal">
                        (Unsaved changes)
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Template
                    </button>
                    <label className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm flex items-center gap-2 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {uploading ? "Uploading..." : "Upload Marks"}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    <button
                      onClick={handleSaveAll}
                      disabled={savingAll || !hasUnsavedChanges}
                      className={`px-4 py-2 rounded text-sm flex items-center gap-2 ${
                        hasUnsavedChanges
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {savingAll ? "Saving..." : "Save All"}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="border border-gray-300 px-4 py-2 text-left">Roll No</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Student Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          Internal ({markingScheme.internal?.total || 25})
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          External ({markingScheme.external?.maxMarks || 75})
                        </th>
                        {sessionType === "atkt" && (
                          <th className="border border-gray-300 px-4 py-2 text-center">Attempt</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const isExpanded = expandedRows[student.studentId];
                        const studentScheme = getStudentMarkingScheme(student);
                        const internalTotal = calculateInternalTotal(student.studentId);

                        return (
                          <React.Fragment key={student.studentId}>
                            <tr className="bg-white hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2">
                                {student.rollNumber}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {student.studentName}
                                {sessionType === "atkt" && student.pattern && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({student.pattern})
                                  </span>
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleRowExpansion(student.studentId)}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium text-sm"
                                  >
                                    {isExpanded ? "Hide" : "Show"} Breakdown
                                  </button>
                                  <span className="font-semibold">
                                    {internalTotal} / {studentScheme.internal?.total || 25}
                                  </span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <input
                                  type="number"
                                  value={marksData[student.studentId]?.["External"] ?? ""}
                                  onChange={(e) =>
                                    handleMarkChange(student.studentId, "External", e.target.value)
                                  }
                                  onWheel={(e) => e.target.blur()}
                                  className="w-24 p-2 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  min="0"
                                  max={studentScheme.external?.maxMarks || 75}
                                />
                              </td>
                              {sessionType === "atkt" && (
                                <td className="border border-gray-300 px-4 py-2 text-center">
                                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                    #{student.attemptNumber || 1}
                                  </span>
                                </td>
                              )}
                            </tr>
                            {isExpanded && studentScheme.internal?.components && (
                              <tr className="bg-blue-50">
                                <td colSpan={sessionType === "atkt" ? 5 : 4} className="border border-gray-300 px-4 py-3">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {studentScheme.internal.components.map((comp) => (
                                      <div key={comp.name} className="flex flex-col">
                                        <label className="text-sm font-semibold text-gray-700 mb-1">
                                          {comp.name} (Max: {comp.maxMarks})
                                        </label>
                                        <input
                                          type="number"
                                          value={marksData[student.studentId]?.[comp.name] ?? ""}
                                          onChange={(e) =>
                                            handleMarkChange(student.studentId, comp.name, e.target.value)
                                          }
                                          onWheel={(e) => e.target.blur()}
                                          className="p-2 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                          min="0"
                                          max={comp.maxMarks}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty States */}
            {!loadingStudents && selectedSubject && students.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No students found for this subject in the selected session.
              </div>
            )}

            {!selectedSession && (
              <div className="text-center py-8 text-gray-500">
                Please select an exam session to start entering marks.
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload Preview Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Review Uploaded Marks</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadPreview(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {uploadPreview?.preview?.filter(p => p.hasChanges).length > 0 ? (
                <table className="w-full border-collapse text-gray-800">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">Roll No</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">Student Name</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 font-semibold">Field</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-gray-700 font-semibold">Current</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-gray-700 font-semibold">New</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadPreview.preview.filter(p => p.hasChanges).flatMap((item, idx) => 
                      item.changes.map((change, cIdx) => (
                        <tr key={`${idx}-${cIdx}`} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          {cIdx === 0 && (
                            <>
                              <td className="border border-gray-300 px-3 py-2 text-gray-800 font-medium" rowSpan={item.changes.length}>{item.rollNumber}</td>
                              <td className="border border-gray-300 px-3 py-2 text-gray-800" rowSpan={item.changes.length}>{item.studentName}</td>
                            </>
                          )}
                          <td className="border border-gray-300 px-3 py-2 text-gray-700">{change.field}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <span className="text-gray-500">{change.oldValue ?? "-"}</span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <span className="text-green-600 font-semibold">{change.newValue}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-center py-4">No changes detected from the uploaded file.</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadPreview(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyUploadedMarks}
                disabled={!uploadPreview?.preview?.length}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply {uploadPreview?.summary?.changed || 0} Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Unsaved Changes</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600">
                You have unsaved changes. Are you sure you want to leave without saving?
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Stay
              </button>
              <button
                onClick={handleDiscardChanges}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Leave Without Saving
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-3">Reject Change Request</h3>
            <p className="text-sm text-gray-500 mb-3">Optionally provide a reason for rejection.</p>
            <textarea
              className="w-full border rounded p-2 text-sm mb-4"
              rows={3}
              placeholder="Reason for rejection (optional)"
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectRemark("");
                }}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewRequest(showRejectModal, "rejected", rejectRemark)}
                disabled={reviewingId === showRejectModal}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {reviewingId === showRejectModal ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExaminerMarkEntry;
