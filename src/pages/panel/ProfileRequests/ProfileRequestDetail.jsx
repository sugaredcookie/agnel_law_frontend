import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PanelDashboardLayout from "../PanelDashboardLayout";
import Pagination from "../../../components/Pagination";
import { downloadExcel } from "../../../utils/excelHelper";
import { getProfileRequestByIdAdmin } from "../../../utils/Api";

const PAGE_SIZE = 15;

const ProfileRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | completed | pending
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDetail = async () => {
    try {
      const res = await getProfileRequestByIdAdmin(id);
      setData(res.data);
    } catch {
      toast.error("Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Build unified student list with status
  const allStudents = useMemo(() => {
    if (!data) return [];

    const completedMap = new Map();
    (data.request?.completedBy || []).forEach((c) => {
      if (c.student?._id) {
        completedMap.set(c.student._id, {
          value: c.value,
          completedAt: c.completedAt,
        });
      }
    });

    const rows = [];

    // Completed students (from request.completedBy — populated)
    (data.request?.completedBy || []).forEach((c) => {
      rows.push({
        _id: c.student?._id,
        name: `${c.student?.studentDetails?.firstName || ""} ${c.student?.studentDetails?.lastName || ""}`.trim(),
        rollNumber: c.student?.academicDetails?.rollNumber || "-",
        batch: c.student?.academicDetails?.batch?.name || "-",
        status: "completed",
        value: c.value || "-",
        completedAt: c.completedAt,
      });
    });

    // Pending students
    (data.pendingStudents || []).forEach((s) => {
      rows.push({
        _id: s._id,
        name: `${s.studentDetails?.firstName || ""} ${s.studentDetails?.lastName || ""}`.trim(),
        rollNumber: s.academicDetails?.rollNumber || "-",
        batch: s.academicDetails?.batch?.name || "-",
        status: "pending",
        value: "-",
        completedAt: null,
      });
    });

    return rows;
  }, [data]);

  // Filtered + searched list
  const filteredStudents = useMemo(() => {
    let list = allStudents;

    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q),
      );
    }

    return list;
  }, [allStudents, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const pagedStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Stats
  const completedCount = allStudents.filter((s) => s.status === "completed").length;
  const pendingCount = allStudents.filter((s) => s.status === "pending").length;
  const totalCount = allStudents.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Export
  const handleExport = () => {
    if (filteredStudents.length === 0) {
      toast.warning("Nothing to export");
      return;
    }

    const exportData = filteredStudents.map((s) => ({
      Name: s.name,
      "Roll No": s.rollNumber,
      Batch: s.batch,
      Status: s.status === "completed" ? "Completed" : "Pending",
      "Submitted Value": s.value,
      "Completed At": s.completedAt
        ? new Date(s.completedAt).toLocaleDateString()
        : "-",
    }));

    const headers = [
      { key: "Name", label: "Name" },
      { key: "Roll No", label: "Roll No" },
      { key: "Batch", label: "Batch" },
      { key: "Status", label: "Status" },
      { key: "Submitted Value", label: "Submitted Value" },
      { key: "Completed At", label: "Completed At" },
    ];

    const filename = `${data?.request?.title || "profile-request"}-export`;
    downloadExcel(exportData, filename, headers);
  };

  if (loading) {
    return (
      <PanelDashboardLayout>
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PanelDashboardLayout>
    );
  }

  if (!data) {
    return (
      <PanelDashboardLayout>
        <div className="text-center py-16 text-gray-500">
          Request not found or failed to load.
          <button
            onClick={() => navigate("/panel-admin/profile-requests")}
            className="ml-2 text-blue-600 hover:underline"
          >
            Go Back
          </button>
        </div>
      </PanelDashboardLayout>
    );
  }

  const { request } = data;

  return (
    <PanelDashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Back + Title */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/panel-admin/profile-requests")}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Back"
          >
            <i className="mdi mdi-arrow-left text-xl" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{request.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Field: <span className="font-medium">{request.fieldLabel}</span>
              &nbsp;&middot;&nbsp;
              Target: <span className="font-medium capitalize">{request.targetType}</span>
              {request.targetBatches?.length > 0 && (
                <> ({request.targetBatches.map((b) => b.batchName || b).join(", ")})</>
              )}
              {request.targetProgram && <> ({request.targetProgram})</>}
              {request.deadline && (
                <>
                  &nbsp;&middot;&nbsp;
                  Deadline: {new Date(request.deadline).toLocaleDateString()}
                </>
              )}
            </p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              request.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {request.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Targeted" value={totalCount} color="blue" />
          <StatCard label="Completed" value={completedCount} color="green" />
          <StatCard label="Pending" value={pendingCount} color="orange" />
          <StatCard label="Completion" value={`${completionPct}%`} color="purple" />
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Toolbar: Search + Filters + Export */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <i className="mdi mdi-magnify absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or roll number..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
              {[
                { key: "all", label: "All", count: totalCount },
                { key: "completed", label: "Completed", count: completedCount },
                { key: "pending", label: "Pending", count: pendingCount },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    statusFilter === f.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* Export */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <i className="mdi mdi-download text-base" />
              Export
            </button>
          </div>

          {/* Active filter indicator */}
          {(search.trim() || statusFilter !== "all") && (
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
              <span>
                Showing {filteredStudents.length} of {totalCount} students
              </span>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {search.trim() || statusFilter !== "all"
                ? "No students match your filters."
                : "No students found for this request."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Roll No</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Batch</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted Value</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedStudents.map((s, idx) => (
                      <tr key={s._id || idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">
                          {s.name || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{s.rollNumber}</td>
                        <td className="px-4 py-2.5 text-gray-600">{s.batch}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              s.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {s.status === "completed" ? "Completed" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-800">{s.value}</td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {s.completedAt
                            ? new Date(s.completedAt).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
                <span>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of{" "}
                  {filteredStudents.length}
                </span>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

// Reusable stat card
const StatCard = ({ label, value, color }) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color] || colorMap.blue}`}>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default ProfileRequestDetail;
