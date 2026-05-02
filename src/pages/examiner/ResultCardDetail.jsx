/**
 * Detail page for viewing result cards of a specific config.
 * Accessed via /examiner/result-cards/:configId
 * Shows student list with PDF view/download/bulk operations.
 * Includes publish/unpublish and per-student restrict/unrestrict management.
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiDownload,
  FiFileText,
  FiCheckSquare,
  FiSquare,
  FiPrinter,
  FiExternalLink,
  FiArrowLeft,
  FiGrid,
  FiList,
  FiClock,
  FiLock,
  FiUnlock,
} from "react-icons/fi";
import {
  getMultiResultListAPI,
  downloadMultiResultLinksExcelAPI,
  startMultiResultBulkJobAPI,
  getMultiResultBulkStatusAPI,
  downloadMultiResultBulkResultAPI,
  exportResultConfigExcelAPI,
  getResultConfigPublishStatusAPI,
  publishResultConfigAPI,
  unpublishResultConfigAPI,
  toggleRestrictedAPI,
} from "../../utils/Api";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import GenericJobProgressBar from "../../components/GenericJobProgressBar";
import ResultTableView from "./ResultTableView";

const ResultCardDetail = () => {
  const { configId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [configLabel, setConfigLabel] = useState("");
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobId, setJobId] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [filters, setFilters] = useState({ searchTerm: "", result: "" });
  const [viewMode, setViewMode] = useState(searchParams.get("view") === "table" ? "table" : "card");
  const [exportingExcel, setExportingExcel] = useState(false);

  // Publish state
  const [publishStatus, setPublishStatus] = useState(null);
  const [publishingResults, setPublishingResults] = useState(false);
  const [togglingRestricted, setTogglingRestricted] = useState(false);

  const isPublished = publishStatus?.hasAnyPublished;

  useEffect(() => {
    if (configId) {
      fetchStudents(configId);
      fetchPublishStatus(configId);
    }
  }, [configId]);

  useEffect(() => {
    applyFilters();
  }, [filters, students]);

  useEffect(() => {
    setSelectedStudents(new Set());
  }, [filters]);

  const fetchStudents = async (id) => {
    try {
      setLoading(true);
      setStudents([]);
      setFilteredStudents([]);
      const res = await getMultiResultListAPI(id);
      const studentList = res.students || [];
      setStudents(studentList);
      setConfigLabel(res.label || id);
      // Select all by default
      setSelectedStudents(new Set(studentList.map((s) => s.rollNo)));
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast.error("Failed to load result cards");
    } finally {
      setLoading(false);
    }
  };

  const fetchPublishStatus = async (id) => {
    try {
      const res = await getResultConfigPublishStatusAPI(id);
      setPublishStatus(res.status || null);
    } catch (error) {
      console.error("Failed to fetch publish status:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];
    if (filters.result === "RESTRICTED") {
      filtered = filtered.filter((s) => s.isRestricted);
    } else if (filters.result) {
      filtered = filtered.filter((s) => s.remark === filters.result);
    }
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          String(s.rollNo).toLowerCase().includes(search) ||
          String(s.seatNo).toLowerCase().includes(search)
      );
    }
    filtered.sort((a, b) => String(a.rollNo).localeCompare(String(b.rollNo)));
    setFilteredStudents(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.rollNo)));
    }
  };

  const toggleSelect = (rollNo) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(rollNo)) newSelected.delete(rollNo);
    else newSelected.add(rollNo);
    setSelectedStudents(newSelected);
  };

  const handleDownloadExcel = async () => {
    try {
      toast.info("Generating Excel file...");
      const blob = await downloadMultiResultLinksExcelAPI(configId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ResultLinks_${configId}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Excel downloaded!");
    } catch (error) {
      console.error("Failed to download Excel:", error);
      toast.error("Failed to download Excel.");
    }
  };

  const handleBulkDownload = async () => {
    try {
      const params = {};
      if (selectedStudents.size > 0 && selectedStudents.size < students.length) {
        params.rollNumbers = Array.from(selectedStudents).join(",");
      }
      const res = await startMultiResultBulkJobAPI(configId, params);
      setJobId(res.jobId);
      toast.info(
        selectedStudents.size > 0 && selectedStudents.size < students.length
          ? `Generating result cards for ${selectedStudents.size} selected students...`
          : "Bulk result card generation started..."
      );
    } catch (error) {
      console.error("Failed to start bulk job:", error);
      toast.error("Failed to start bulk download.");
    }
  };

  const handleJobComplete = async (completedJobId) => {
    try {
      toast.info("Downloading result cards...");
      const blob = await downloadMultiResultBulkResultAPI(completedJobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ResultCards_${configId}_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Result cards downloaded!");
      setJobId(null);
    } catch (error) {
      console.error("Failed to download result:", error);
      toast.error("Failed to download result.");
    }
  };

  const handleViewPdf = (pdfUrl) => window.open(pdfUrl, "_blank");

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const blob = await exportResultConfigExcelAPI(configId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${configLabel || "result"}_export.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Excel exported.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to export Excel.");
    } finally {
      setExportingExcel(false);
    }
  };

  // Publish: unselected students become restricted
  const handlePublish = async () => {
    const restrictedRollNos = students
      .filter((s) => !selectedStudents.has(s.rollNo))
      .map((s) => s.rollNo);

    const msg = restrictedRollNos.length > 0
      ? `Publish results for ${selectedStudents.size} students? ${restrictedRollNos.length} student(s) will be restricted.`
      : `Publish results for all ${students.length} students?`;

    if (!window.confirm(msg)) return;

    setPublishingResults(true);
    try {
      await publishResultConfigAPI(configId, { restrictedRollNos });
      toast.success(
        restrictedRollNos.length > 0
          ? `Results published. ${restrictedRollNos.length} student(s) restricted.`
          : "Results published successfully."
      );
      await Promise.all([fetchPublishStatus(configId), fetchStudents(configId)]);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to publish results.");
    } finally {
      setPublishingResults(false);
    }
  };

  const handleUnpublish = async () => {
    if (!window.confirm("Are you sure you want to unpublish all results?")) return;
    setPublishingResults(true);
    try {
      await unpublishResultConfigAPI(configId);
      toast.success("Results unpublished.");
      await Promise.all([fetchPublishStatus(configId), fetchStudents(configId)]);
    } catch (error) {
      toast.error("Failed to unpublish results.");
    } finally {
      setPublishingResults(false);
    }
  };

  // Toggle restricted for a single student (inline pill click)
  const handleToggleRestrictedSingle = async (rollNo, currentlyRestricted) => {
    setTogglingRestricted(true);
    try {
      await toggleRestrictedAPI(configId, [rollNo], !currentlyRestricted);
      // Update local state
      setStudents((prev) =>
        prev.map((s) =>
          s.rollNo === rollNo
            ? {
                ...s,
                isRestricted: !currentlyRestricted,
                remark: !currentlyRestricted ? "RESULT RESTRICTED" : s.remark,
              }
            : s
        )
      );
      // Refetch to get recalculated remarks for unrestricted students
      if (currentlyRestricted) await fetchStudents(configId);
      await fetchPublishStatus(configId);
      toast.success(`${rollNo} ${!currentlyRestricted ? "restricted" : "unrestricted"}.`);
    } catch (error) {
      toast.error("Failed to update restricted status.");
    } finally {
      setTogglingRestricted(false);
    }
  };

  // Bulk restrict/unrestrict selected
  const handleBulkRestrict = async (restrict) => {
    const rollNos = Array.from(selectedStudents);
    if (rollNos.length === 0) return toast.warn("No students selected.");
    if (!window.confirm(`${restrict ? "Restrict" : "Unrestrict"} ${rollNos.length} selected student(s)?`)) return;
    setTogglingRestricted(true);
    try {
      await toggleRestrictedAPI(configId, rollNos, restrict);
      await Promise.all([fetchStudents(configId), fetchPublishStatus(configId)]);
      toast.success(`${rollNos.length} student(s) ${restrict ? "restricted" : "unrestricted"}.`);
    } catch (error) {
      toast.error(`Failed to ${restrict ? "restrict" : "unrestrict"} students.`);
    } finally {
      setTogglingRestricted(false);
    }
  };

  const getRemarkBadge = (remark) => {
    switch (remark) {
      case "SUCCESSFUL": return "bg-green-100 text-green-800";
      case "UNSUCCESSFUL": return "bg-red-100 text-red-800";
      case "ABSENT": return "bg-yellow-100 text-yellow-800";
      case "RESULT RESTRICTED": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const restrictedCount = students.filter((s) => s.isRestricted).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen text-black">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 max-w-7xl mx-auto mt-4">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <button
                onClick={() => navigate("/examiner/result-cards")}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                <FiArrowLeft size={14} />
                Result Cards
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600 truncate">{configLabel || "Loading..."}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-4 mb-6">
              {/* Top row: Title + Publish status */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-bold">{configLabel || "Result Cards"}</h1>
                {publishStatus && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium whitespace-nowrap ${
                    publishStatus.isFullyPublished
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : publishStatus.hasAnyPublished
                        ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                        : "bg-gray-100 text-gray-600 border border-gray-300"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      publishStatus.isFullyPublished ? "bg-green-500"
                        : publishStatus.hasAnyPublished ? "bg-yellow-500"
                        : "bg-gray-400"
                    }`}></span>
                    {publishStatus.isFullyPublished ? "Published"
                      : publishStatus.hasAnyPublished
                        ? `Partially Published (${publishStatus.published}/${publishStatus.total})`
                        : "Not Published"}
                    {publishStatus.restricted > 0 && (
                      <span className="text-orange-600 ml-1">({publishStatus.restricted} restricted)</span>
                    )}
                  </span>
                )}
              </div>

              {/* Student count */}
              <p className="text-gray-600 text-sm">
                {students.length} student{students.length !== 1 ? "s" : ""} in this exam
                {restrictedCount > 0 && (
                  <span className="text-orange-600 ml-1 font-medium">({restrictedCount} restricted)</span>
                )}
              </p>

              {/* Action buttons row */}
              <div className="flex flex-wrap gap-2 items-center justify-end">
                {/* Publish/Unpublish button */}
                {publishStatus && (
                  <>
                    {publishStatus.hasAnyPublished ? (
                      <button
                        onClick={handleUnpublish}
                        disabled={publishingResults}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-medium disabled:opacity-50"
                      >
                        {publishingResults ? "Processing..." : "Unpublish Results"}
                      </button>
                    ) : (
                      <div className="relative group">
                        <button
                          onClick={handlePublish}
                          disabled={publishingResults || !publishStatus.hasExamSessionId || !publishStatus.total || selectedStudents.size === 0}
                          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
                            publishStatus.hasExamSessionId
                              ? "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {publishingResults
                            ? "Publishing..."
                            : selectedStudents.size < students.length && publishStatus.hasExamSessionId
                              ? `Publish Results (${selectedStudents.size}/${students.length})`
                              : "Publish Results"}
                        </button>
                        {!publishStatus.hasExamSessionId && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Publishing requires a linked Exam Session.
                            <br />Create a config with "From Exam Session" data source.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Restrict / Unrestrict bulk buttons (only after publish) */}
                {isPublished && viewMode === "card" && (
                  <>
                    <button
                      onClick={() => handleBulkRestrict(true)}
                      disabled={togglingRestricted || selectedStudents.size === 0}
                      className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm font-medium disabled:opacity-50"
                    >
                      <FiLock size={13} />
                      Restrict ({selectedStudents.size})
                    </button>
                    <button
                      onClick={() => handleBulkRestrict(false)}
                      disabled={togglingRestricted || selectedStudents.size === 0}
                      className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm font-medium disabled:opacity-50"
                    >
                      <FiUnlock size={13} />
                      Unrestrict ({selectedStudents.size})
                    </button>
                  </>
                )}

                {/* View toggle */}
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  <button
                    onClick={() => setViewMode("card")}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium ${viewMode === "card" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <FiList size={14} /> Cards
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <FiGrid size={14} /> Table
                  </button>
                </div>

                {/* Cards-only buttons */}
                {viewMode === "card" && (
                  <>
                    <button
                      onClick={handleDownloadExcel}
                      disabled={loading || students.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                    >
                      <FiFileText size={14} /> Excel with Links
                    </button>
                    <button
                      onClick={handleBulkDownload}
                      disabled={!!jobId || loading || students.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
                    >
                      <FiPrinter size={14} />
                      {jobId
                        ? "Generating..."
                        : selectedStudents.size > 0 && selectedStudents.size < students.length
                          ? `Download Selected (${selectedStudents.size})`
                          : "Bulk Download PDFs"}
                    </button>
                  </>
                )}

                {/* Table-only buttons */}
                {viewMode === "table" && (
                  <>
                    <button
                      onClick={handleExportExcel}
                      disabled={exportingExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                    >
                      <FiDownload size={14} /> {exportingExcel ? "Exporting..." : "Export Excel"}
                    </button>
                    <button
                      onClick={() => navigate(`/examiner/result-cards/${configId}/audit`)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-gray-300 rounded bg-white text-gray-600 hover:bg-gray-50"
                    >
                      <FiClock size={14} /> Edit History
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Job Progress */}
            {jobId && (
              <div className="mb-6">
                <GenericJobProgressBar
                  jobId={jobId}
                  getStatusAPI={getMultiResultBulkStatusAPI}
                  onComplete={handleJobComplete}
                  title="Generating Result Cards"
                />
              </div>
            )}

            {/* Filters */}
            {viewMode === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Filter by Result</label>
                <select
                  name="result"
                  value={filters.result}
                  onChange={handleFilterChange}
                  className="w-full p-2 border-2 border-blue-500 rounded-md bg-white"
                >
                  <option value="">All Results</option>
                  <option value="SUCCESSFUL">Successful</option>
                  <option value="UNSUCCESSFUL">Unsuccessful</option>
                  <option value="ABSENT">Absent</option>
                  <option value="RESULT RESTRICTED">Result Restricted</option>
                  {isPublished && <option value="RESTRICTED">Restricted (publish)</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Search</label>
                <input
                  type="text"
                  name="searchTerm"
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  className="w-full p-2 border-2 border-blue-500 rounded-md bg-white"
                  placeholder="Name or Roll No..."
                />
              </div>
            </div>
            )}

            {/* Table View */}
            {viewMode === "table" ? (
              <ResultTableView configId={configId} />
            ) : (
            <>
            {/* Card Table */}
            {loading ? (
              <div className="text-center py-8">Loading result cards...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No result cards found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="border border-gray-300 px-4 py-3 text-center w-12">
                        <button onClick={toggleSelectAll} className="text-white hover:text-gray-200 focus:outline-none">
                          {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0
                            ? <FiCheckSquare size={20} />
                            : <FiSquare size={20} />}
                        </button>
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left">Roll No.</th>
                      <th className="border border-gray-300 px-4 py-3 text-left">Student Name</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Result</th>
                      {isPublished && (
                        <th className="border border-gray-300 px-4 py-3 text-center">Status</th>
                      )}
                      <th className="border border-gray-300 px-4 py-3 text-center">SGPA</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Grade</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.rollNo}
                        className={`hover:bg-gray-50 ${
                          student.isRestricted
                            ? "bg-orange-50"
                            : selectedStudents.has(student.rollNo)
                              ? "bg-white"
                              : "bg-red-50 opacity-70"
                        }`}
                      >
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <button onClick={() => toggleSelect(student.rollNo)} className="text-blue-600 hover:text-blue-800 focus:outline-none">
                            {selectedStudents.has(student.rollNo) ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
                          </button>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 font-mono text-sm">{student.rollNo}</td>
                        <td className="border border-gray-300 px-4 py-3 font-medium">{student.name}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRemarkBadge(student.remark)}`}>
                            {student.remark}
                          </span>
                        </td>
                        {isPublished && (
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleRestrictedSingle(student.rollNo, student.isRestricted)}
                              disabled={togglingRestricted}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 ${
                                student.isRestricted
                                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300"
                                  : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                              }`}
                              title={student.isRestricted ? "Click to unrestrict" : "Click to restrict"}
                            >
                              {student.isRestricted ? <FiLock size={11} /> : <FiUnlock size={11} />}
                              {student.isRestricted ? "Restricted" : "Published"}
                            </button>
                          </td>
                        )}
                        <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                          {student.sgpa !== null && student.sgpa !== undefined ? Number(student.sgpa).toFixed(2) : "NA"}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center font-medium">{student.finalGrade}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewPdf(student.pdfUrl)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                              title="View Result Card"
                            >
                              <FiExternalLink /> View
                            </button>
                            <button
                              onClick={() => handleViewPdf(student.pdfUrl + "?download=true")}
                              className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                              title="Download Result Card"
                            >
                              <FiDownload /> PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredStudents.length} of {students.length} students
              {selectedStudents.size > 0 && selectedStudents.size < students.length && !isPublished && (
                <span className="ml-2 text-blue-600 font-medium">
                  ({selectedStudents.size} selected, {students.length - selectedStudents.size} will be restricted on publish)
                </span>
              )}
              {selectedStudents.size > 0 && isPublished && (
                <span className="ml-2 text-blue-600 font-medium">
                  ({selectedStudents.size} selected)
                </span>
              )}
            </div>
            </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCardDetail;
