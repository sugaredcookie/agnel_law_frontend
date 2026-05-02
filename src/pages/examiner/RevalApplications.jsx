import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getRevalApplicationsAPI, getRevalSessionsAPI, downloadRevalApplicationsExcelAPI } from "../../utils/Api";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";

const RevalApplications = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    search: "",
    applicationType: "",
    paymentStatus: "",
    course: "",
  });

  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    revenue: 0,
    revalCount: 0,
    photocopyCount: 0,
  });

  const [downloading, setDownloading] = useState(false);

  // Expandable row tracking
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getRevalApplicationsAPI(sessionId, filters);
      setApplications(res.applications || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });

      const apps = res.applications || [];
      const paid = apps.filter((a) => a.paymentStatus === "paid");
      const pending = apps.filter((a) => a.paymentStatus !== "paid");
      const revenue = paid.reduce((sum, a) => sum + (a.amount || 0), 0);
      const revalCount = apps.filter(
        (a) => a.applicationType === "revaluation",
      ).length;
      const photocopyCount = apps.filter(
        (a) => a.applicationType === "photocopy",
      ).length;

      setSummary({
        total: res.pagination?.total || apps.length,
        paid: paid.length,
        pending: pending.length,
        revenue,
        revalCount,
        photocopyCount,
      });
    } catch (error) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [sessionId, filters]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await getRevalSessionsAPI();
        const found = (res.sessions || []).find((s) => s._id === sessionId);
        setSession(found || null);
      } catch (err) {
        /* ignore */
      }
    };
    fetchSession();
  }, [sessionId]);

  const exportToExcel = async () => {
    try {
      setDownloading(true);
      const response = await downloadRevalApplicationsExcelAPI({
        sessionId,
        course: filters.course,
        applicationType: filters.applicationType,
        paymentStatus: filters.paymentStatus,
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reval_applications_${session?.title?.replace(/\s+/g, "_") || sessionId}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel file");
    } finally {
      setDownloading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const hasData = summary.total > 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen">
          <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate("/examiner/reval-sessions")}
                className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2"
              >
                <i className="mdi mdi-arrow-left"></i>
                Back to Sessions
              </button>

              {/* Session info card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Applications
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {session?.title || "Loading..."}
                    </p>
                    {session && (
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>
                          <i className="mdi mdi-calendar-range mr-1"></i>
                          {session.academicYear}
                        </span>
                        <span>
                          <i className="mdi mdi-clock-outline mr-1"></i>
                          {session.term}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            session.status === "active"
                              ? "bg-green-100 text-green-700"
                              : session.status === "closed"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                    )}
                  </div>
                  {applications.length > 0 && (
                    <button
                      onClick={exportToExcel}
                      disabled={downloading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium self-start"
                    >
                      <i className={`mdi ${downloading ? "mdi-loading mdi-spin" : "mdi-download"}`}></i>
                      {downloading ? "Exporting..." : "Export to Excel"}
                    </button>
                  )}
                </div>

                {/* Inline stat strip -- only rendered when there's data */}
                {hasData && (
                  <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap gap-x-8 gap-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="text-sm font-bold text-gray-900">
                        {summary.total}
                      </span>
                    </div>
                    {summary.paid > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-500">Paid</span>
                        <span className="text-sm font-bold text-green-700">
                          {summary.paid}
                        </span>
                      </div>
                    )}
                    {summary.pending > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        <span className="text-sm text-gray-500">Pending</span>
                        <span className="text-sm font-bold text-yellow-700">
                          {summary.pending}
                        </span>
                      </div>
                    )}
                    {summary.revalCount > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                        <span className="text-sm text-gray-500">
                          Revaluation
                        </span>
                        <span className="text-sm font-bold text-purple-700">
                          {summary.revalCount}
                        </span>
                      </div>
                    )}
                    {summary.photocopyCount > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-gray-500">Photocopy</span>
                        <span className="text-sm font-bold text-blue-700">
                          {summary.photocopyCount}
                        </span>
                      </div>
                    )}
                    {summary.revenue > 0 && (
                      <div className="flex items-center gap-2 ml-auto">
                        <i className="mdi mdi-currency-inr text-green-600"></i>
                        <span className="text-sm text-gray-500">Revenue</span>
                        <span className="text-sm font-bold text-green-700">
                          Rs {summary.revenue.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="mb-6 bg-white rounded-lg shadow-md p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Search
                  </label>
                  <div className="relative">
                    <i className="mdi mdi-magnify absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      placeholder="Name or roll number..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Type
                  </label>
                  <select
                    name="applicationType"
                    value={filters.applicationType}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 text-sm"
                    style={{ color: "#111827" }}
                  >
                    <option value="">All Types</option>
                    <option value="revaluation">Revaluation</option>
                    <option value="photocopy">Photocopy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Payment Status
                  </label>
                  <select
                    name="paymentStatus"
                    value={filters.paymentStatus}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 text-sm"
                    style={{ color: "#111827" }}
                  >
                    <option value="">All</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Course
                  </label>
                  <select
                    name="course"
                    value={filters.course}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 text-sm"
                    style={{ color: "#111827" }}
                  >
                    <option value="">All Courses</option>
                    <option value="BA LLB">BA LLB</option>
                    <option value="LLB">LLB</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                  <i className="mdi mdi-clipboard-text-outline text-4xl text-gray-400"></i>
                </div>
                <p className="text-gray-700 text-lg font-medium">
                  No applications yet
                </p>
                <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">
                  {filters.search ||
                  filters.applicationType ||
                  filters.paymentStatus ||
                  filters.course
                    ? "No results match your current filters. Try adjusting them."
                    : "Applications will appear here once students start applying."}
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-purple-600 text-white">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            Roll No.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            Course / Batch
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            Subjects
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                            Payment
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {applications.map((app, idx) => {
                          const subjectList = (app.subjects || []).map(
                            (s) => s.label,
                          );
                          const isExpanded = expandedRow === app._id;
                          const showExpand = subjectList.length > 2;
                          const displaySubjects =
                            showExpand && !isExpanded
                              ? subjectList.slice(0, 2)
                              : subjectList;

                          return (
                            <tr
                              key={app._id}
                              className="hover:bg-purple-50 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {(filters.page - 1) * filters.limit + idx + 1}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-900">
                                  {app.studentName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {app.contactNumber}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                {app.rollNumber}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-gray-900">
                                  {app.course}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {app.batch}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    app.applicationType === "revaluation"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {app.applicationType === "revaluation"
                                    ? "Reval"
                                    : "Photocopy"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px]">
                                {displaySubjects.join(", ")}
                                {showExpand && (
                                  <button
                                    onClick={() =>
                                      setExpandedRow(
                                        isExpanded ? null : app._id,
                                      )
                                    }
                                    className="ml-1 text-purple-600 hover:text-purple-800 text-xs font-medium"
                                  >
                                    {isExpanded
                                      ? "less"
                                      : `+${subjectList.length - 2} more`}
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right tabular-nums">
                                Rs {app.amount}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    app.paymentStatus === "paid"
                                      ? "bg-green-100 text-green-700"
                                      : app.paymentStatus === "failed"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  <i
                                    className={`mdi ${
                                      app.paymentStatus === "paid"
                                        ? "mdi-check-circle"
                                        : app.paymentStatus === "failed"
                                          ? "mdi-close-circle"
                                          : "mdi-clock-outline"
                                    } text-xs`}
                                  ></i>
                                  {app.paymentStatus === "paid"
                                    ? "Paid"
                                    : app.paymentStatus === "failed"
                                      ? "Failed"
                                      : "Pending"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {new Date(app.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer: pagination inside the table card */}
                  <div className="border-t border-gray-100 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>
                        Showing{" "}
                        {Math.min(
                          (filters.page - 1) * filters.limit + 1,
                          pagination.total || 0,
                        )}{" "}
                        -{" "}
                        {Math.min(
                          filters.page * filters.limit,
                          pagination.total || 0,
                        )}{" "}
                        of {pagination.total || 0}
                      </span>
                      <select
                        name="limit"
                        value={filters.limit}
                        onChange={handleFilterChange}
                        className="px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900"
                        style={{ color: "#111827" }}
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                      <span>per page</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={pagination.page <= 1}
                        onClick={() => handlePageChange(pagination.page - 1)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <i className="mdi mdi-chevron-left"></i>
                      </button>
                      <span className="text-sm text-gray-700 px-2">
                        {pagination.page} / {pagination.pages}
                      </span>
                      <button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => handlePageChange(pagination.page + 1)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <i className="mdi mdi-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevalApplications;
