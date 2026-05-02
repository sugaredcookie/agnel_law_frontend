import React, { useEffect, useState, useRef, useCallback } from "react";
import PanelDashboardLayout from "./PanelDashboardLayout";
import {
  getAllBatchesViaAdmin,
  getPendingPayments,
  downloadPendingPaymentsExcel,
} from "../../utils/Api";
import { toast } from "react-toastify";
import ManualPaymentModal from "./ManualPaymentModal";

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const PendingPaymentsNew = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [allIds, setAllIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [manualPaymentModal, setManualPaymentModal] = useState({
    isOpen: false,
    student: null,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [filters, setFilters] = useState({
    search: "",
    batch: "",
    academicYear: "",
    paymentStatus: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    partial: 0,
    overdue: 0,
    totalPending: 0,
  });

  const academicYears = ["2025-26", "2024-25", "2023-24", "2022-23", "2021-22"];
  
  const selectAllCheckboxRef = useRef(null);
  
  // Debounce search for performance
  const debouncedSearch = useDebounce(filters.search, 400);

  // Handle indeterminate state for select all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const isAllSelected = allIds.length > 0 && selectedStudents.length === allIds.length;
      const isSomeSelected = selectedStudents.length > 0 && selectedStudents.length < allIds.length;
      selectAllCheckboxRef.current.indeterminate = isSomeSelected;
      setSelectAll(isAllSelected);
    }
  }, [selectedStudents, allIds]);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchPendingPayments();
  }, [debouncedSearch, filters.batch, filters.academicYear, filters.paymentStatus, pagination.currentPage, pagination.limit]);

  const fetchBatches = async () => {
    try {
      const response = await getAllBatchesViaAdmin();
      setBatches(response.batches || []);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const searchFilters = { ...filters, search: debouncedSearch };
      const response = await getPendingPayments(searchFilters, pagination.currentPage, pagination.limit);
      const data = response.data || [];
      setPendingPayments(data);

      // Use stats from backend if available
      if (response.stats) {
        setStats(response.stats);
      } else {
        const paidCount = data.filter((p) => p.paymentStatus === "paid").length;
        const unpaidCount = data.filter((p) => p.paymentStatus === "unpaid").length;
        const partialCount = data.filter((p) => p.paymentStatus === "partial").length;
        const overdueCount = data.filter((p) => p.isOverdue).length;
        const totalPendingAmount = data.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

        setStats({
          total: data.length,
          paid: paidCount,
          unpaid: unpaidCount,
          partial: partialCount,
          overdue: overdueCount,
          totalPending: totalPendingAmount,
        });
      }

      // Store all IDs for select all functionality
      if (response.allIds) {
        setAllIds(response.allIds);
      }

      if (response.pagination) {
        setPagination(prev => ({ ...prev, ...response.pagination }));
      }
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      toast.error("Failed to fetch pending payments");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setSelectedStudents([]);
    setSelectAll(false);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      batch: "",
      academicYear: "",
      paymentStatus: "",
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setSelectedStudents([]);
    setSelectAll(false);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    // Keep selections when changing pages
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await downloadPendingPaymentsExcel(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pending_payments_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded");
    } catch (error) {
      toast.error("Failed to download Excel");
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(allIds);
    }
    setSelectAll(!selectAll);
  };

  const sendReminders = () => {
    if (selectedStudents.length === 0) {
      toast.warning("Please select students");
      return;
    }
    toast.info(`Reminder feature coming soon for ${selectedStudents.length} students`);
  };

  const openManualPaymentModal = (payment) => {
    setManualPaymentModal({
      isOpen: true,
      student: {
        _id: payment._id,
        name: payment.studentName,
        email: payment.email,
        batch: payment.batch,
      },
    });
  };

  const closeManualPaymentModal = () => {
    setManualPaymentModal({ isOpen: false, student: null });
  };

  const handleManualPaymentSuccess = () => {
    fetchPendingPayments();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status, isOverdue) => {
    if (isOverdue && status !== "paid") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Overdue
        </span>
      );
    }
    const styles = {
      paid: "bg-green-100 text-green-700",
      unpaid: "bg-red-100 text-red-700",
      partial: "bg-yellow-100 text-yellow-700",
    };
    const labels = {
      paid: "Paid",
      unpaid: "Unpaid",
      partial: "Partial",
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getProgressPercent = (paid, total) => {
    if (!total) return 0;
    return Math.round((paid / total) * 100);
  };

  return (
    <PanelDashboardLayout>
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
          <p className="text-gray-600 mt-1">Track and manage all student fee payments</p>
        </div>

        {/* Stats Summary */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Total:</span>
              <span className="font-semibold text-gray-800">{stats.total}</span>
            </div>
            <div className="h-5 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-gray-600">Paid: {stats.paid}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-gray-600">Unpaid: {stats.unpaid}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="text-gray-600">Partial: {stats.partial}</span>
            </div>
            {stats.overdue > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span className="text-orange-600 font-medium">Overdue: {stats.overdue}</span>
              </div>
            )}
            <div className="h-5 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Pending:</span>
              <span className="font-semibold text-red-600">{formatCurrency(stats.totalPending)}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search by name, ID, email..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.batch}
              onChange={(e) => handleFilterChange("batch", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b._id} value={b.batchName}>
                  {b.batchName}
                </option>
              ))}
            </select>
            <select
              value={filters.academicYear}
              onChange={(e) => handleFilterChange("academicYear", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange("paymentStatus", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
            </select>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              {selectedStudents.length > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {selectedStudents.length} of {allIds.length} selected
                  {selectedStudents.length === allIds.length && " (All)"}
                </span>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded ${viewMode === "table" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  <i className="mdi mdi-format-list-bulleted"></i>
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`p-2 rounded ${viewMode === "cards" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  <i className="mdi mdi-view-grid"></i>
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedStudents.length > 0 && (
                <button
                  onClick={sendReminders}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Reminder ({selectedStudents.length})
                </button>
              )}
              <button
                onClick={handleDownloadExcel}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Download Excel
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : pendingPayments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <i className="mdi mdi-check-all text-green-600 text-4xl"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">All Clear</h3>
            <p className="text-gray-500">No pending payments found</p>
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        ref={selectAllCheckboxRef}
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        title={`Select all ${allIds.length} students`}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Remaining
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingPayments.map((payment) => (
                    <tr
                      key={payment._id}
                      className={`hover:bg-gray-50 ${payment.isOverdue ? "bg-red-50/50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(payment._id)}
                          onChange={() => handleSelectStudent(payment._id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{payment.studentName}</div>
                        <div className="text-xs text-gray-500">{payment.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">{payment.batch}</div>
                        <div className="text-xs text-gray-500">{payment.academicYear}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-32">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>{formatCurrency(payment.paidAmount)}</span>
                            <span>{formatCurrency(payment.totalAmount)}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{
                                width: `${getProgressPercent(payment.paidAmount, payment.totalAmount)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-red-600">
                          {formatCurrency(payment.remainingAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(payment.paymentStatus, payment.isOverdue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(payment.nextDueDate)}
                      </td>
                      <td className="px-4 py-3">
                        {payment.paymentStatus !== "paid" && (
                          <button
                            onClick={() => openManualPaymentModal(payment)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                            title="Record offline/manual payment"
                          >
                            Record Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
                    {pagination.totalCount} results
                  </div>
                  <select
                    value={pagination.limit}
                    onChange={(e) => {
                      setPagination(prev => ({ ...prev, limit: parseInt(e.target.value, 10), currentPage: 1 }));
                    }}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm font-medium">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPayments.map((payment) => (
              <div
                key={payment._id}
                className={`bg-white rounded-lg shadow-md p-4 ${
                  payment.isOverdue ? "border-l-4 border-red-500" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(payment._id)}
                      onChange={() => handleSelectStudent(payment._id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <h4 className="font-medium text-gray-800">{payment.studentName}</h4>
                      <p className="text-xs text-gray-500">{payment.studentId}</p>
                    </div>
                  </div>
                  {getStatusBadge(payment.paymentStatus, payment.isOverdue)}
                </div>

                <div className="space-y-2 mb-3">
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-500">Batch:</span> {payment.batch}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-500">Year:</span> {payment.academicYear}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Payment Progress</span>
                    <span className="font-medium">
                      {getProgressPercent(payment.paidAmount, payment.totalAmount)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{
                        width: `${getProgressPercent(payment.paidAmount, payment.totalAmount)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Paid: {formatCurrency(payment.paidAmount)}</span>
                    <span>Total: {formatCurrency(payment.totalAmount)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(payment.remainingAmount)}
                    </p>
                  </div>
                  {payment.nextDueDate && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Due Date</p>
                      <p className={`text-sm font-medium ${payment.isOverdue ? "text-red-600" : "text-gray-700"}`}>
                        {formatDate(payment.nextDueDate)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Record Payment Button for Card View */}
                {payment.paymentStatus !== "paid" && (
                  <button
                    onClick={() => openManualPaymentModal(payment)}
                    className="w-full mt-3 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Record Manual Payment
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination for Card View */}
        {!loading && pendingPayments.length > 0 && viewMode === "cards" && pagination.totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-md mt-4 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} results
              </div>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  setPagination(prev => ({ ...prev, limit: parseInt(e.target.value, 10), currentPage: 1 }));
                }}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm font-medium">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Payment Modal */}
      <ManualPaymentModal
        isOpen={manualPaymentModal.isOpen}
        onClose={closeManualPaymentModal}
        student={manualPaymentModal.student}
        onSuccess={handleManualPaymentSuccess}
      />
    </PanelDashboardLayout>
  );
};

export default PendingPaymentsNew;
