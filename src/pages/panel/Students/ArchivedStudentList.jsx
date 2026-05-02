import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import ArchivedStudentCard from "./ArchivedStudentCard";
import ArchivedStudentFilter from "./ArchivedStudentFilter";
import {
  getArchivedStudentsViaAdmin,
  getArchiveStatsViaAdmin,
  bulkUpdateArchivedPermissionsViaAdmin,
} from "../../../utils/Api";
import Pagination from "../../../components/Pagination";
import { toast } from "react-toastify";

const ArchivedStudentList = () => {
  const [students, setStudents] = useState([]);
  const [expandedDetails, setExpandedDetails] = useState([]);
  const [filters, setFilters] = useState({
    reason: "",
    program: "",
    batch: "",
    searchText: "",
  });
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState(null);
  const [showBulkPerm, setShowBulkPerm] = useState(false);
  const [bulkPerm, setBulkPerm] = useState({
    canLogin: false,
    canResetPassword: false,
    canViewResults: false,
    canViewNotes: false,
    canSelectElectives: false,
  });
  const [bulkSaving, setBulkSaving] = useState(false);

  const fetchArchivedStudents = useCallback(
    async (page = 1, currentFilters = filters) => {
      setLoading(true);
      try {
        const response = await getArchivedStudentsViaAdmin(page, currentFilters);
        if (response) {
          setStudents(response.students);
          setCurrentPage(response.page);
          setTotalPages(response.totalPages);
          setTotalStudents(response.total);
        }
      } catch (error) {
        console.error("Error fetching archived students:", error);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const fetchStats = useCallback(async () => {
    try {
      const response = await getArchiveStatsViaAdmin();
      setStats(response);
    } catch (error) {
      console.error("Error fetching archive stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchArchivedStudents(currentPage, filters);
    fetchStats();
  }, [currentPage, fetchArchivedStudents, filters, refreshKey, fetchStats]);

  const handleUpdateAndRefresh = () => {
    setRefreshKey((oldKey) => oldKey + 1);
  };

  const handleToggleDetails = (student) => {
    setExpandedDetails((prev) =>
      prev.includes(student)
        ? prev.filter((s) => s !== student)
        : [...prev, student]
    );
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchArchivedStudents(1, filters);
  };

  const handleReset = () => {
    const resetFilters = {
      reason: "",
      program: "",
      batch: "",
      searchText: "",
    };
    setFilters(resetFilters);
    setCurrentPage(1);
    fetchArchivedStudents(1, resetFilters);
  };

  const toggleFilterVisibility = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  const handlePageChange = (page) => {
    if (!loading) {
      setCurrentPage(page);
    }
  };

  const handleBulkPermissions = async () => {
    const filter = {};
    if (filters.reason) filter.reason = filters.reason;
    if (filters.batch) filter.batchId = filters.batch;
    setBulkSaving(true);
    try {
      const res = await bulkUpdateArchivedPermissionsViaAdmin(bulkPerm, filter);
      toast.success(`Permissions updated for ${res.modifiedCount} students`);
      setShowBulkPerm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update permissions");
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Link
            to="/panel-admin/students"
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            &larr; Back to Active Students
          </Link>
          <button
            className="text-blue-500 font-bold"
            onClick={toggleFilterVisibility}
          >
            {isFilterVisible ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
        <button
          onClick={() => setShowBulkPerm(!showBulkPerm)}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Bulk Permissions
        </button>
      </div>

      {showBulkPerm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-indigo-800 mb-1">Bulk Update Permissions</h4>
          <p className="text-xs text-indigo-600 mb-3">
            Applies to {filters.reason ? `"${filters.reason}"` : "all"} archived students
            {filters.batch ? " in the selected batch" : ""}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
            {[
              { key: "canLogin", label: "Login" },
              { key: "canResetPassword", label: "Reset Password" },
              { key: "canViewResults", label: "View Results" },
              { key: "canViewNotes", label: "View Notes" },
              { key: "canSelectElectives", label: "Select Electives" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 bg-white p-2 rounded border cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkPerm[key]}
                  onChange={() => setBulkPerm((p) => ({ ...p, [key]: !p[key] }))}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkPermissions}
              disabled={bulkSaving}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {bulkSaving ? "Updating..." : "Apply to Filtered Students"}
            </button>
            <button
              onClick={() => setShowBulkPerm(false)}
              className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Archived</p>
          </div>
          <div className="bg-red-100 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.byReason?.cancelled || 0}</p>
            <p className="text-sm text-red-600">Cancelled</p>
          </div>
          <div className="bg-green-100 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.byReason?.graduated || 0}</p>
            <p className="text-sm text-green-600">Graduated</p>
          </div>
          <div className="bg-blue-100 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.byReason?.transferred || 0}</p>
            <p className="text-sm text-blue-600">Transferred</p>
          </div>
          <div className="bg-yellow-100 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{stats.byReason?.inactive || 0}</p>
            <p className="text-sm text-yellow-600">Inactive</p>
          </div>
        </div>
      )}

      <ArchivedStudentFilter
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
        onReset={handleReset}
        isVisible={isFilterVisible}
      />

      <h4 className="text-lg font-bold mb-2">
        Total Archived Students: {totalStudents}
      </h4>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No archived students found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map((student) => (
            <ArchivedStudentCard
              key={student._id}
              student={student}
              onToggleDetails={handleToggleDetails}
              showDetails={expandedDetails.includes(student)}
              onRestore={handleUpdateAndRefresh}
            />
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </div>
  );
};

export default ArchivedStudentList;
