import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import {
  getAtktFormsAPI,
  getAtktSessionsAPI,
  updateAtktFormAPI,
  deleteAtktFormAPI,
  downloadAtktHallTicketAPI,
  downloadAtktFormsExcelAPI,
  startAtktBulkHallTicketJobAPI,
  getAtktBulkHallTicketJobStatusAPI,
  downloadAtktBulkHallTicketResultAPI,
  getSubjectConfigsAPI,
  createManualAtktFormAPI,
  lookupStudentByRollAPI,
} from "../../utils/Api";
import { toast } from "react-toastify";
import { FiArrowLeft, FiDownload, FiPlusCircle } from "react-icons/fi";
import GenericJobProgressBar from "../../components/GenericJobProgressBar";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const ATKTSessionSubmissions = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [forms, setForms] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [jobId, setJobId] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    course: "",
    batch: "",
    pattern: "",
    search: "",
    paymentStatus: "paid",
  });
  const [editingForm, setEditingForm] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingFormId, setDeletingFormId] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [manualSubjectLabel, setManualSubjectLabel] = useState("");

  // Manual hall ticket generation state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    rollNumber: "", studentName: "", contactNumber: "",
    course: "", batch: "", pattern: "", subjects: [],
  });
  const [manualLookup, setManualLookup] = useState(null); // { found, student }
  const [manualLooking, setManualLooking] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualAvailSubjects, setManualAvailSubjects] = useState([]);
  const [manualManualSubject, setManualManualSubject] = useState("");
  const manualLookupTimer = useRef(null);
  const [allConfigs, setAllConfigs] = useState([]);

  // Derive unique courses, batches, patterns from forms
  const [availableFilters, setAvailableFilters] = useState({
    courses: [],
    batches: [],
    patterns: [],
  });

  useEffect(() => {
    fetchSessionAndForms();
  }, [sessionId]);

  const fetchSessionAndForms = async () => {
    try {
      setLoading(true);
      const sessionsResponse = await getAtktSessionsAPI();
      const currentSession = sessionsResponse.sessions?.find(
        (s) => s._id === sessionId
      );
      setSession(currentSession);
    } catch (error) {
      console.error("Failed to fetch session:", error);
      toast.error("Failed to load session details");
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const response = await getAtktFormsAPI({
        ...filters,
        examSessionId: sessionId,
      });
      setForms(response.forms || []);
      setPagination(response.pagination || {});

      // Extract unique filter values from forms
      const allForms = response.forms || [];
      const courses = [...new Set(allForms.map((f) => f.course).filter(Boolean))];
      const batches = [...new Set(allForms.map((f) => f.batch).filter(Boolean))];
      const patterns = [...new Set(allForms.map((f) => f.pattern).filter(Boolean))];
      setAvailableFilters({ courses, batches, patterns });
    } catch (error) {
      toast.error("Failed to fetch ATKT forms");
    } finally {
      setLoading(false);
    }
  }, [filters, sessionId]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleEdit = (form) => {
    setEditingForm(form);
    setEditFormData({
      studentName: form.studentName,
      rollNumber: form.rollNumber,
      contactNumber: form.contactNumber,
      course: form.course,
      batch: form.batch,
      pattern: form.pattern,
      subjects: form.subjects?.map((s) => ({ ...s })) || [],
    });
    setManualSubjectLabel("");
    // Fetch available subjects from session configs for this student's course/batch/pattern
    (async () => {
      try {
        const res = await getSubjectConfigsAPI(sessionId);
        const configs = res.configs || [];
        const matching = configs.filter(
          (c) => c.course === form.course && c.batch === form.batch && c.pattern === form.pattern
        );
        // Collect all subjects (type=subject only) from matching configs
        const subjects = matching.flatMap(
          (c) => (c.subjects || []).filter((s) => s.type !== "section")
        );
        setAvailableSubjects(subjects);
      } catch {
        setAvailableSubjects([]);
      }
    })();
    setShowEditModal(true);
  };

  const handleUpdateForm = async () => {
    try {
      await updateAtktFormAPI(editingForm._id, editFormData);
      toast.success("Form updated successfully");
      setShowEditModal(false);
      setEditingForm(null);
      fetchForms();
    } catch (error) {
      toast.error("Failed to update form");
    }
  };

  const handleDelete = (formId) => {
    setDeletingFormId(formId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteAtktFormAPI(deletingFormId);
      toast.success("Form deleted successfully");
      setShowDeleteModal(false);
      setDeletingFormId(null);
      fetchForms();
    } catch (error) {
      toast.error("Failed to delete form");
    }
  };

  const handleDownloadHallTicket = async (form) => {
    try {
      if (form.paymentStatus !== "paid") {
        toast.error("Hall ticket is only available for paid forms");
        return;
      }

      toast.info("Generating hall ticket...");
      const blob = await downloadAtktHallTicketAPI(form._id);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HallTicket_${form.rollNumber}_${form.studentName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Hall ticket downloaded successfully");
    } catch (error) {
      console.error("Error downloading hall ticket:", error);
      toast.error(
        error.response?.data?.message || "Failed to download hall ticket"
      );
    }
  };

  const handleBulkDownloadHallTickets = async () => {
    try {
      const { page, limit, ...bulkFilters } = filters;
      bulkFilters.examSessionId = sessionId;

      const response = await startAtktBulkHallTicketJobAPI(bulkFilters);
      setJobId(response.jobId);
      toast.info("Bulk hall ticket generation started...");
    } catch (error) {
      console.error("Failed to start bulk download job:", error);
      toast.error(
        error.response?.data?.message || "Failed to start bulk download."
      );
    }
  };

  const handleJobComplete = async (completedJobId) => {
    try {
      toast.info("Downloading generated hall tickets...");
      const blob = await downloadAtktBulkHallTicketResultAPI(completedJobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ATKT_Hall_Tickets_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Hall tickets downloaded successfully!");
      setJobId(null);
    } catch (error) {
      console.error("Failed to download result:", error);
      toast.error("Failed to download result.");
    }
  };

  // ── Manual Hall Ticket Generation ────────────────────────────────────────

  const openManualModal = async () => {
    setManualForm({
      rollNumber: "", studentName: "", contactNumber: "",
      course: "", batch: "", pattern: "", subjects: [],
    });
    setManualLookup(null);
    setManualLooking(false);
    setManualSaving(false);
    setManualAvailSubjects([]);
    setManualManualSubject("");
    // Load all configs for this session
    try {
      const res = await getSubjectConfigsAPI(sessionId);
      setAllConfigs(res.configs || []);
    } catch {
      setAllConfigs([]);
    }
    setShowManualModal(true);
  };

  const handleManualRollLookup = (rollNo) => {
    setManualForm((prev) => ({ ...prev, rollNumber: rollNo }));
    setManualLookup(null);
    if (manualLookupTimer.current) clearTimeout(manualLookupTimer.current);
    if (!rollNo.trim()) return;
    manualLookupTimer.current = setTimeout(async () => {
      setManualLooking(true);
      try {
        const res = await lookupStudentByRollAPI(rollNo.trim());
        setManualLookup(res);
        if (res.found) {
          setManualForm((prev) => ({
            ...prev,
            studentName: prev.studentName || res.student.name || "",
          }));
        }
      } catch {
        setManualLookup(null);
      } finally {
        setManualLooking(false);
      }
    }, 500);
  };

  // When course/batch/pattern changes, update available subjects from configs
  const updateManualAvailSubjects = (course, batch, pattern) => {
    const matching = allConfigs.filter(
      (c) => c.course === course && c.batch === batch && c.pattern === pattern
    );
    const subs = matching.flatMap(
      (c) => (c.subjects || []).filter((s) => s.type !== "section")
    );
    setManualAvailSubjects(subs);
  };

  const handleManualFieldChange = (field, value) => {
    setManualForm((prev) => {
      const next = { ...prev, [field]: value };
      if (["course", "batch", "pattern"].includes(field)) {
        // Reset subjects when config fields change
        next.subjects = [];
        updateManualAvailSubjects(
          field === "course" ? value : prev.course,
          field === "batch" ? value : prev.batch,
          field === "pattern" ? value : prev.pattern
        );
      }
      return next;
    });
  };

  const handleManualSubmit = async () => {
    if (!manualForm.studentName.trim() || !manualForm.rollNumber.trim() ||
        !manualForm.course || !manualForm.batch || !manualForm.pattern) {
      return toast.error("Please fill student name, roll number, course, batch, and pattern.");
    }
    if (manualForm.subjects.length === 0) {
      return toast.error("Please add at least one subject.");
    }

    setManualSaving(true);
    try {
      // Create form with paymentStatus=paid
      const res = await createManualAtktFormAPI({
        ...manualForm,
        examSessionId: sessionId,
      });
      const formId = res.form._id;
      toast.success("Form created! Generating hall ticket...");

      // Immediately download the hall ticket
      const blob = await downloadAtktHallTicketAPI(formId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HallTicket_${manualForm.rollNumber}_${manualForm.studentName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Hall ticket downloaded!");
      setShowManualModal(false);
      fetchForms(); // Refresh list
    } catch (error) {
      console.error("Manual hall ticket error:", error);
      toast.error(error.response?.data?.message || "Failed to generate hall ticket.");
    } finally {
      setManualSaving(false);
    }
  };

  // Derive unique courses/batches/patterns from configs
  const configCourses = [...new Set(allConfigs.map((c) => c.course).filter(Boolean))];
  const configBatches = [...new Set(
    allConfigs.filter((c) => c.course === manualForm.course).map((c) => c.batch).filter(Boolean)
  )];
  const configPatterns = [...new Set(
    allConfigs.filter((c) => c.course === manualForm.course && c.batch === manualForm.batch)
      .map((c) => c.pattern).filter(Boolean)
  )];

  const exportToExcel = async () => {
    try {
      const response = await downloadAtktFormsExcelAPI({
        ...filters,
        examSessionId: sessionId,
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `atkt_submissions_${session?.title?.replace(/\s+/g, "_") || sessionId}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel file");
    }
  };

  if (loading && !session) {
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
        <div className="pt-20 min-h-screen text-black dark:text-white">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 max-w-7xl mx-auto mt-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <button
                  onClick={() => navigate("/examiner/atkt-sessions")}
                  className="flex items-center text-gray-600 hover:text-gray-800 mb-2"
                >
                  <FiArrowLeft className="mr-2" />
                  Back to Sessions
                </button>
                <h1 className="text-3xl font-bold">{session.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {session.academicYear} - {session.term} | ATKT Submissions
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Total Submissions: {pagination.total || 0}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.isActive
                      ? "bg-green-100 text-green-800"
                      : session.status === "closed"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {session.isActive
                    ? "Active"
                    : session.status === "closed"
                      ? "Closed"
                      : "Draft"}
                </span>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                <select
                  name="course"
                  value={filters.course}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                >
                  <option value="">All Courses</option>
                  {availableFilters.courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                <select
                  name="batch"
                  value={filters.batch}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                >
                  <option value="">All Batches</option>
                  {availableFilters.batches.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
                <select
                  name="pattern"
                  value={filters.pattern}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                >
                  <option value="">All Patterns</option>
                  {availableFilters.patterns.map((pattern) => (
                    <option key={pattern} value={pattern}>
                      {pattern}
                    </option>
                  ))}
                </select>
                <select
                  name="paymentStatus"
                  value={filters.paymentStatus}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="">All</option>
                </select>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                  placeholder="Search by name, roll no..."
                />
              </div>
              <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                <button
                  onClick={openManualModal}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
                >
                  <FiPlusCircle />
                  Generate Hall Ticket
                </button>
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <FiDownload />
                  Export to Excel
                </button>
                <button
                  onClick={handleBulkDownloadHallTickets}
                  disabled={jobId !== null}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FiDownload />
                  Bulk Download Hall Tickets
                </button>
              </div>
            </div>

            {/* Job Progress Bar */}
            {jobId && (
              <GenericJobProgressBar
                jobId={jobId}
                getStatusAPI={getAtktBulkHallTicketJobStatusAPI}
                onComplete={handleJobComplete}
                onCancel={() => setJobId(null)}
                title="ATKT Hall Ticket Generation Progress"
              />
            )}

            {/* Table */}
            {loading ? (
              <p>Loading...</p>
            ) : forms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No submissions found for this session.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Student Name</th>
                      <th className="border p-2">Roll Number</th>
                      <th className="border p-2">Contact</th>
                      <th className="border p-2">Course</th>
                      <th className="border p-2">Batch</th>
                      <th className="border p-2">Pattern</th>
                      <th className="border p-2">Subjects</th>
                      <th className="border p-2">Date</th>
                      <th className="border p-2">Payment Status</th>
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forms.map((form) => (
                      <tr
                        key={form._id}
                        className={
                          form.batchMismatch
                            ? "bg-yellow-100 border-yellow-300"
                            : ""
                        }
                      >
                        <td className="border p-2">{form.studentName}</td>
                        <td className="border p-2">{form.rollNumber}</td>
                        <td className="border p-2">{form.contactNumber}</td>
                        <td className="border p-2">{form.course}</td>
                        <td className="border p-2">
                          {form.batch}
                          {form.batchMismatch && (
                            <span className="text-xs text-red-600 block">
                              Assigned: {form.assignedBatch}
                            </span>
                          )}
                        </td>
                        <td className="border p-2">{form.pattern}</td>
                        <td className="border p-2">
                          {form.subjects.map((s) => s.label).join(", ")}
                        </td>
                        <td className="border p-2">
                          {formatDateTime(form.createdAt)}
                        </td>
                        <td className="border p-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                              (form.paymentStatus || "").toLowerCase() ===
                              "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {(form.paymentStatus || "pending").toUpperCase()}
                          </span>
                        </td>
                        <td className="border p-2">
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(form)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(form._id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                            {form.paymentStatus === "paid" && (
                              <button
                                onClick={() => handleDownloadHallTicket(form)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Download Hall Ticket
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <select
                  name="limit"
                  value={filters.limit}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page || 1} of {pagination.pages || 1}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-black">
              Edit ATKT Form
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.studentName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        studentName: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.rollNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        rollNumber: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.contactNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        contactNumber: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Course
                  </label>
                  <input
                    type="text"
                    value={editFormData.course}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        course: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Batch
                  </label>
                  <input
                    type="text"
                    value={editFormData.batch}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        batch: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Pattern
                  </label>
                  <input
                    type="text"
                    value={editFormData.pattern}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        pattern: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Subjects ({editFormData.subjects?.length || 0})
                </label>

                {/* Current subjects list */}
                {editFormData.subjects?.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded p-2 mb-3 space-y-1">
                    {editFormData.subjects.map((subject, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                      >
                        <span className="text-gray-900 text-sm flex-1">{subject.label}</span>
                        <button
                          onClick={() => {
                            const newSubjects = editFormData.subjects.filter(
                              (_, i) => i !== index
                            );
                            setEditFormData({
                              ...editFormData,
                              subjects: newSubjects,
                            });
                          }}
                          className="ml-2 text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 mb-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                    No subjects selected. Add at least one subject below.
                  </div>
                )}

                {/* Add from available config subjects */}
                {availableSubjects.length > 0 && (() => {
                  const selectedIds = new Set((editFormData.subjects || []).map((s) => s.id));
                  const remaining = availableSubjects.filter((s) => !selectedIds.has(s.id));
                  if (remaining.length === 0) return null;
                  return (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Add from configured subjects:</p>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-blue-200 bg-blue-50 rounded p-2">
                        {remaining.map((subject) => (
                          <button
                            key={subject.id}
                            type="button"
                            onClick={() => {
                              setEditFormData({
                                ...editFormData,
                                subjects: [
                                  ...editFormData.subjects,
                                  { id: subject.id, label: subject.label, subjectId: subject.subjectId || null, group: subject.group || null },
                                ],
                              });
                            }}
                            className="px-2.5 py-1 text-xs bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                          >
                            + {subject.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Manual add */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualSubjectLabel}
                    onChange={(e) => setManualSubjectLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!manualSubjectLabel.trim()) return;
                        const id = manualSubjectLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
                        const exists = editFormData.subjects?.some((s) => s.id === id || s.label.toLowerCase() === manualSubjectLabel.trim().toLowerCase());
                        if (exists) return;
                        setEditFormData({
                          ...editFormData,
                          subjects: [...(editFormData.subjects || []), { id, label: manualSubjectLabel.trim(), subjectId: null, group: null }],
                        });
                        setManualSubjectLabel("");
                      }
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded text-black text-sm"
                    placeholder="Add subject manually..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!manualSubjectLabel.trim()) return;
                      const id = manualSubjectLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      const exists = editFormData.subjects?.some((s) => s.id === id || s.label.toLowerCase() === manualSubjectLabel.trim().toLowerCase());
                      if (exists) return;
                      setEditFormData({
                        ...editFormData,
                        subjects: [...(editFormData.subjects || []), { id, label: manualSubjectLabel.trim(), subjectId: null, group: null }],
                      });
                      setManualSubjectLabel("");
                    }}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateForm}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-black">
              Confirm Delete
            </h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete this ATKT form? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Hall Ticket Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-1 text-black">Generate Hall Ticket</h2>
            <p className="text-sm text-gray-500 mb-5">Create an ATKT form and download the hall ticket directly.</p>

            <div className="space-y-4">
              {/* Roll Number with auto-lookup */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Roll Number *</label>
                <input
                  type="text"
                  value={manualForm.rollNumber}
                  onChange={(e) => handleManualRollLookup(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-black"
                  placeholder="Enter roll number..."
                />
                {manualLooking && <p className="text-xs text-blue-500 mt-1">Looking up student...</p>}
                {manualLookup?.found && (
                  <p className="text-xs text-green-600 mt-1">Found: {manualLookup.student.name}</p>
                )}
                {manualLookup && !manualLookup.found && (
                  <p className="text-xs text-yellow-600 mt-1">Student not found in database. Fill details manually.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Student Name *</label>
                  <input
                    type="text"
                    value={manualForm.studentName}
                    onChange={(e) => handleManualFieldChange("studentName", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Contact Number</label>
                  <input
                    type="text"
                    value={manualForm.contactNumber}
                    onChange={(e) => handleManualFieldChange("contactNumber", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-black"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Course / Batch / Pattern selectors from configs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Course *</label>
                  <select
                    value={manualForm.course}
                    onChange={(e) => handleManualFieldChange("course", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  >
                    <option value="">Select Course</option>
                    {configCourses.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Batch *</label>
                  <select
                    value={manualForm.batch}
                    onChange={(e) => handleManualFieldChange("batch", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-black"
                    disabled={!manualForm.course}
                  >
                    <option value="">Select Batch</option>
                    {configBatches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Pattern *</label>
                  <select
                    value={manualForm.pattern}
                    onChange={(e) => handleManualFieldChange("pattern", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-black"
                    disabled={!manualForm.batch}
                  >
                    <option value="">Select Pattern</option>
                    {configPatterns.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Subjects ({manualForm.subjects.length})
                </label>

                {/* Selected subjects */}
                {manualForm.subjects.length > 0 && (
                  <div className="space-y-1 mb-3 max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
                    {manualForm.subjects.map((s, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5">
                        <span className="text-sm text-gray-900">{s.label}</span>
                        <button
                          onClick={() => setManualForm((prev) => ({
                            ...prev,
                            subjects: prev.subjects.filter((_, idx) => idx !== i),
                          }))}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add from available */}
                {manualAvailSubjects.length > 0 && (() => {
                  const selectedIds = new Set(manualForm.subjects.map((s) => s.id));
                  const remaining = manualAvailSubjects.filter((s) => !selectedIds.has(s.id));
                  if (remaining.length === 0) return null;
                  return (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Select subjects:</p>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-blue-200 bg-blue-50 rounded p-2">
                        {remaining.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setManualForm((prev) => ({
                              ...prev,
                              subjects: [...prev.subjects, { id: s.id, label: s.label, subjectId: s.subjectId || null, group: s.group || null }],
                            }))}
                            className="px-2.5 py-1 text-xs bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-100"
                          >
                            + {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Manual subject add */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualManualSubject}
                    onChange={(e) => setManualManualSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!manualManualSubject.trim()) return;
                        const id = manualManualSubject.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
                        setManualForm((prev) => ({
                          ...prev,
                          subjects: [...prev.subjects, { id, label: manualManualSubject.trim(), subjectId: null, group: null }],
                        }));
                        setManualManualSubject("");
                      }
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded text-black text-sm"
                    placeholder="Or type subject name manually..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!manualManualSubject.trim()) return;
                      const id = manualManualSubject.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      setManualForm((prev) => ({
                        ...prev,
                        subjects: [...prev.subjects, { id, label: manualManualSubject.trim(), subjectId: null, group: null }],
                      }));
                      setManualManualSubject("");
                    }}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >+ Add</button>
                </div>

                {!manualForm.course && (
                  <p className="text-xs text-amber-600 mt-2">Select course, batch, and pattern to see available subjects.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                disabled={manualSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={manualSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {manualSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <FiDownload />
                    Create & Download Hall Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATKTSessionSubmissions;
