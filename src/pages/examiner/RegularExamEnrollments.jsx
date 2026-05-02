import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiDownload, FiPrinter, FiCheckSquare, FiSquare, FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import {
  getRegularExamSessionsAPI,
  getRegularExamEnrollmentsAPI,
  getRegularExamBatchNamesAPI,
  downloadRegularExamEnrollmentsExcelAPI,
  startBulkRegularExamHallTicketJobAPI,
  getBulkRegularExamHallTicketJobStatusAPI,
  downloadBulkRegularExamHallTicketResultAPI,
  downloadRegularExamHallTicketAPI,
  startSyncRegularExamEnrollmentsAPI,
  getSyncRegularExamEnrollmentsStatusAPI,
} from "../../utils/Api";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import GenericJobProgressBar from "../../components/GenericJobProgressBar";

const RegularExamEnrollments = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [jobId, setJobId] = useState(null);
  const [syncJobId, setSyncJobId] = useState(null);
  const [selectedEnrollments, setSelectedEnrollments] = useState(new Set());
  const [filters, setFilters] = useState({
    batch: "",
    course: "",
    searchTerm: "",
  });

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  useEffect(() => {
    applyFilters();
  }, [filters, enrollments]);

  // Reset selection when filters change
  useEffect(() => {
    setSelectedEnrollments(new Set());
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsResponse, enrollmentsResponse, batchesResponse] =
        await Promise.all([
          getRegularExamSessionsAPI(),
          getRegularExamEnrollmentsAPI({ examSessionId: sessionId }),
          getRegularExamBatchNamesAPI(sessionId),
        ]);

      const currentSession = sessionsResponse.sessions.find(
        (s) => s._id === sessionId,
      );
      setSession(currentSession);
      setEnrollments(enrollmentsResponse.enrollments || []);
      setBatches(batchesResponse.batches || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...enrollments];

    if (filters.batch) {
      filtered = filtered.filter((e) => e.batch === filters.batch);
    }

    if (filters.course) {
      filtered = filtered.filter((e) => e.course === filters.course);
    }

    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.studentName.toLowerCase().includes(search) ||
          e.rollNumber.toLowerCase().includes(search) ||
          e.hallTicketNumber.toLowerCase().includes(search),
      );
    }

    // Sort by roll number
    filtered.sort((a, b) => (a.rollNumber || "").localeCompare(b.rollNumber || ""));

    setFilteredEnrollments(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelectAll = () => {
    if (selectedEnrollments.size === filteredEnrollments.length && filteredEnrollments.length > 0) {
      setSelectedEnrollments(new Set());
    } else {
      setSelectedEnrollments(new Set(filteredEnrollments.map((e) => e._id)));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedEnrollments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEnrollments(newSelected);
  };

  const handleDownloadExcel = async () => {
    try {
      toast.info("Generating Excel file...");
      const filterParams = {
        examSessionId: sessionId,
      };
      if (filters.batch) filterParams.batch = filters.batch;
      if (filters.course) filterParams.course = filters.course;

      const blob = await downloadRegularExamEnrollmentsExcelAPI(filterParams);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `regular_exam_enrollments_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Failed to download Excel:", error);
      toast.error("Failed to download Excel. Please try again.");
    }
  };

  const handleBulkDownloadHallTickets = async () => {
    try {
      const filterParams = {
        examSessionId: sessionId,
      };

      // If specific students are selected, only download for them
      if (selectedEnrollments.size > 0) {
        filterParams.enrollmentIds = Array.from(selectedEnrollments).join(",");
      } else {
        // Otherwise use current filters
        if (filters.batch) filterParams.batch = filters.batch;
        if (filters.course) filterParams.course = filters.course;
      }

      const response = await startBulkRegularExamHallTicketJobAPI(filterParams);
      setJobId(response.jobId);
      toast.info(
        selectedEnrollments.size > 0
          ? `Generating hall tickets for ${selectedEnrollments.size} selected students...`
          : "Bulk hall ticket generation started...",
      );
    } catch (error) {
      console.error("Failed to start bulk download job:", error);
      toast.error("Failed to start bulk download. Please try again.");
    }
  };

  const handleJobComplete = async (completedJobId) => {
    try {
      toast.info("Downloading generated hall tickets...");
      const blob =
        await downloadBulkRegularExamHallTicketResultAPI(completedJobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Regular_Exam_Hall_Tickets_${new Date().toISOString().split("T")[0]}.zip`;
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

  const handleDownloadHallTicket = async (enrollmentId, studentName) => {
    try {
      toast.info(`Generating hall ticket for ${studentName}...`);
      const blob = await downloadRegularExamHallTicketAPI(enrollmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Hall_Ticket_${studentName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Hall ticket downloaded successfully!");
    } catch (error) {
      console.error("Failed to download hall ticket:", error);
      toast.error("Failed to download hall ticket. Please try again.");
    }
  };

  const handleSyncEnrollments = async () => {
    if (!window.confirm("This will sync all enrollments:\n- Remove inactive/graduated students\n- Enroll missing active students\n- Update student data (name, roll number, contact)\n- Update subject configurations\n\nContinue?")) {
      return;
    }
    try {
      const response = await startSyncRegularExamEnrollmentsAPI(sessionId);
      setSyncJobId(response.jobId);
      toast.info("Sync job started...");
    } catch (error) {
      console.error("Failed to start sync:", error);
      toast.error(error?.response?.data?.message || "Failed to start sync");
    }
  };

  const handleSyncJobComplete = (jobId, status) => {
    setSyncJobId(null);
    fetchData(); // Refresh the list
    
    const meta = status?.metadata || {};
    const summary = [];
    if (meta.removedInactive > 0) summary.push(`Removed ${meta.removedInactive} inactive`);
    if (meta.enrolledMissing > 0) summary.push(`Enrolled ${meta.enrolledMissing} missing`);
    if (meta.syncedStudentData > 0) summary.push(`Updated ${meta.syncedStudentData} student records`);
    if (meta.syncedSubjectConfig > 0) summary.push(`Updated ${meta.syncedSubjectConfig} subject configs`);
    
    if (summary.length > 0) {
      toast.success(`Sync completed: ${summary.join(", ")}`);
    } else {
      toast.success("Sync completed. No changes needed.");
    }
    
    if (meta.errors && meta.errors.length > 0) {
      toast.warning(`${meta.errors.length} error(s) occurred. Check console.`);
      console.error("Sync errors:", meta.errors);
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
        <div className="pt-20 min-h-screen text-black dark:text-white">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 max-w-7xl mx-auto mt-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <button
                  onClick={() => navigate("/examiner/regular-exam-sessions")}
                  className="flex items-center text-gray-500 hover:text-blue-600 mb-2 transition-colors"
                >
                  <FiArrowLeft className="mr-1" /> Back to Sessions
                </button>
                <h1 className="text-3xl font-bold">Exam Enrollments</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {session?.title || session?.name} ({session?.academicYear})
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {session?.status !== "closed" && (
                  <button
                    onClick={handleSyncEnrollments}
                    disabled={!!syncJobId}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm font-medium disabled:opacity-50"
                    title="Sync enrollments: remove inactive, enroll missing, update student data and subjects"
                  >
                    <FiRefreshCw className={syncJobId ? "animate-spin" : ""} />
                    {syncJobId ? "Syncing..." : "Sync Enrollments"}
                  </button>
                )}
                <button
                  onClick={handleDownloadExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                >
                  <FiDownload /> Download Excel
                </button>
                <button
                  onClick={handleBulkDownloadHallTickets}
                  disabled={!!jobId}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
                >
                  <FiPrinter />
                  {jobId
                    ? "Generating..."
                    : selectedEnrollments.size > 0
                      ? `Download Selected (${selectedEnrollments.size})`
                      : "Bulk Hall Tickets"}
                </button>
              </div>
            </div>

            {/* Sync Job Progress */}
            {syncJobId && (
              <div className="mb-6">
                <GenericJobProgressBar
                  jobId={syncJobId}
                  getStatusAPI={getSyncRegularExamEnrollmentsStatusAPI}
                  onComplete={handleSyncJobComplete}
                  title="Syncing Enrollments"
                />
              </div>
            )}

            {/* Hall Ticket Job Progress */}
            {jobId && (
              <div className="mb-6">
                <GenericJobProgressBar
                  jobId={jobId}
                  getStatusAPI={getBulkRegularExamHallTicketJobStatusAPI}
                  onComplete={handleJobComplete}
                  title="Generating Hall Tickets"
                />
              </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Filter by Batch
                </label>
                <select
                  name="batch"
                  value={filters.batch}
                  onChange={handleFilterChange}
                  className="w-full p-2 border-2 border-blue-500 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">All Batches</option>
                  {batches.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Filter by Course
                </label>
                <select
                  name="course"
                  value={filters.course}
                  onChange={handleFilterChange}
                  className="w-full p-2 border-2 border-blue-500 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">All Courses</option>
                  <option value="BA LLB">BA LLB</option>
                  <option value="LLB">LLB</option>
                  <option value="LLM">LLM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Search
                </label>
                <input
                  type="text"
                  name="searchTerm"
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  className="w-full p-2 border-2 border-blue-500 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Name, Roll No, or Hall Ticket..."
                />
              </div>
            </div>

            {/* Table */}
            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No enrollments found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="border border-gray-300 px-4 py-3 text-center w-12">
                        <button
                          onClick={toggleSelectAll}
                          className="text-white hover:text-gray-200 focus:outline-none"
                        >
                          {selectedEnrollments.size ===
                            filteredEnrollments.length &&
                          filteredEnrollments.length > 0 ? (
                            <FiCheckSquare size={20} />
                          ) : (
                            <FiSquare size={20} />
                          )}
                        </button>
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left">
                        Hall Ticket No.
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left">
                        Roll Number
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left">
                        Student Name
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left">
                        Course
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left">
                        Batch
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left">
                        Pattern
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center">
                        Subjects
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnrollments.map((enrollment) => (
                      <tr
                        key={enrollment._id}
                        className={`bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${selectedEnrollments.has(enrollment._id) ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                      >
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <button
                            onClick={() => toggleSelect(enrollment._id)}
                            className="text-blue-600 hover:text-blue-800 focus:outline-none"
                          >
                            {selectedEnrollments.has(enrollment._id) ? (
                              <FiCheckSquare size={20} />
                            ) : (
                              <FiSquare size={20} />
                            )}
                          </button>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 font-mono text-sm">
                          {enrollment.hallTicketNumber}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          {enrollment.rollNumber}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 font-medium">
                          {enrollment.studentName}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          {enrollment.course}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          {enrollment.batch}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          {enrollment.pattern}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {enrollment.subjects.length}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              handleDownloadHallTicket(
                                enrollment._id,
                                enrollment.studentName,
                              )
                            }
                            className="flex items-center justify-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs mx-auto"
                            title="Download Hall Ticket"
                          >
                            <FiDownload /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredEnrollments.length} of {enrollments.length}{" "}
              students
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegularExamEnrollments;
