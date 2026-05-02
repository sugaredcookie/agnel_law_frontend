import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "./PanelDashboardLayout";
import {
  getAllBatchesViaAdmin,
  getManualPayments,
  reverseManualPayment,
} from "../../utils/Api";
import { toast } from "react-toastify";

const ManualPaymentsHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [reversing, setReversing] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
  });

  const [filters, setFilters] = useState({
    search: "",
    batch: "",
    academicYear: "",
    includeReversed: false,
  });

  const academicYears = ["2025-26", "2024-25", "2023-24", "2022-23", "2021-22"];

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [filters, pagination.currentPage, pagination.limit]);

  const fetchBatches = async () => {
    try {
      const response = await getAllBatchesViaAdmin();
      setBatches(response.batches || []);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await getManualPayments(
        filters,
        pagination.currentPage,
        pagination.limit
      );
      if (response.success) {
        setPayments(response.data || []);
        if (response.pagination) {
          setPagination((prev) => ({ ...prev, ...response.pagination }));
        }
      }
    } catch (error) {
      console.error("Error fetching manual payments:", error);
      toast.error("Failed to fetch manual payments");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      batch: "",
      academicYear: "",
      includeReversed: false,
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handleReversePayment = async (paymentId) => {
    const reason = window.prompt(
      "Please provide a reason for reversing this payment:"
    );
    if (!reason) {
      toast.info("Reversal cancelled");
      return;
    }

    setReversing(paymentId);
    try {
      const response = await reverseManualPayment(paymentId, reason);
      if (response.success) {
        toast.success("Payment reversed successfully");
        fetchPayments();
      }
    } catch (error) {
      console.error("Error reversing payment:", error);
      toast.error(error.response?.data?.message || "Failed to reverse payment");
    } finally {
      setReversing(null);
    }
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

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentModeLabel = (mode) => {
    const labels = {
      cash: "Cash",
      cheque: "Cheque",
      bank_transfer: "Bank Transfer",
      dd: "Demand Draft",
      upi: "UPI",
      other: "Other",
    };
    return labels[mode] || mode;
  };

  return (
    <PanelDashboardLayout>
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Manual Payments History
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage all manually recorded payments
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search by name, roll no, reference..."
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
            <label className="flex items-center gap-2 px-3 py-2">
              <input
                type="checkbox"
                checked={filters.includeReversed}
                onChange={(e) =>
                  handleFilterChange("includeReversed", e.target.checked)
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Show Reversed</span>
            </label>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <i className="mdi mdi-cash-multiple text-gray-400 text-4xl"></i>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              No Manual Payments
            </h3>
            <p className="text-gray-500">
              No manual payments have been recorded yet
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Receipt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Payment Mode
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Reference
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Payment Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Recorded
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className={`hover:bg-gray-50 ${payment.isReversed ? "bg-red-50/50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-blue-600">
                          {payment.receiptNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {payment.studentName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.rollNumber} | {payment.batch}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold ${payment.isReversed ? "text-gray-400 line-through" : "text-green-600"}`}
                        >
                          {formatCurrency(payment.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {getPaymentModeLabel(
                          payment.manualPaymentDetails?.paymentMode
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.manualPaymentDetails?.referenceNumber || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(payment.manualPaymentDetails?.paymentDate)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDateTime(payment.manualPaymentDetails?.recordedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {payment.isReversed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                            Reversed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!payment.isReversed && (
                          <button
                            onClick={() => handleReversePayment(payment._id)}
                            disabled={reversing === payment._id}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                            title="Reverse this payment"
                          >
                            {reversing === payment._id ? "..." : "Reverse"}
                          </button>
                        )}
                        {payment.isReversed && payment.reversalDetails && (
                          <span
                            className="text-xs text-gray-500 cursor-help"
                            title={`Reversed on ${formatDateTime(payment.reversalDetails.reversedAt)}: ${payment.reversalDetails.reason}`}
                          >
                            {payment.reversalDetails.reason?.substring(0, 20)}
                            {payment.reversalDetails.reason?.length > 20 && "..."}
                          </span>
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
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.totalCount
                  )}{" "}
                  of {pagination.totalCount} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm font-medium">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PanelDashboardLayout>
  );
};

export default ManualPaymentsHistory;
