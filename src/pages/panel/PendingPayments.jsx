import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "./PanelDashboardLayout";
import {
  getAllBatchesViaAdmin,
  getPendingPayments,
  downloadPendingPaymentsExcel,
} from "../../utils/Api";
import { toast } from "react-toastify";

const PendingPayments = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    batch: "",
    academicYear: "",
    paymentStatus: "",
  });
  const [batches, setBatches] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unpaid: 0,
    partial: 0,
    overdue: 0,
    totalPending: 0,
  });

  const academicYears = ["2025-26", "2024-25", "2023-24", "2022-23", "2021-22"];

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await getPendingPayments(filters);
      const data = response.data || [];
      setPendingPayments(data);

      const unpaidCount = data.filter(
        (p) => p.paymentStatus === "unpaid",
      ).length;
      const partialCount = data.filter(
        (p) => p.paymentStatus === "partial",
      ).length;
      const overdueCount = data.filter((p) => p.isOverdue).length;
      const totalPendingAmount = data.reduce(
        (sum, p) => sum + p.remainingAmount,
        0,
      );

      setStats({
        total: data.length,
        unpaid: unpaidCount,
        partial: partialCount,
        overdue: overdueCount,
        totalPending: totalPendingAmount,
      });
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      toast.error("Failed to fetch pending payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBatches = async () => {
    try {
      const response = await getAllBatchesViaAdmin();
      setBatches(response.batches || []);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  useEffect(() => {
    fetchAllBatches();
  }, []);

  useEffect(() => {
    fetchPendingPayments();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedStudents([]);
    setSelectAll(false);
  };

  const downloadExcel = async () => {
    try {
      const blob = await downloadPendingPaymentsExcel(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `pending_payments_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel file");
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(pendingPayments.map((p) => p._id));
    }
    setSelectAll(!selectAll);
  };

  const sendPaymentReminders = () => {
    if (selectedStudents.length === 0) {
      toast.warning("Please select at least one student");
      return;
    }
    toast.info(
      `Payment reminder feature coming soon for ${selectedStudents.length} students`,
    );
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      batch: "",
      academicYear: "",
      paymentStatus: "",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "unpaid":
        return "text-red-600 bg-red-50";
      case "partial":
        return "text-yellow-600 bg-yellow-50";
      case "paid":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <PanelDashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Pending Payments
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">Total Students</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.total}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-600 mb-1">Unpaid</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.unpaid}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600 mb-1">Partial Payment</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.partial}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
            <div className="text-sm text-gray-600 mb-1">Overdue</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.overdue}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 mb-1">Total Pending</div>
            <div className="text-lg font-bold text-purple-600">
              ₹{stats.totalPending.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Search by name, ID, email"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />

            <select
              className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filters.batch}
              onChange={(e) => handleFilterChange("batch", e.target.value)}
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch._id || batch.name} value={batch.batchName}>
                  {batch.batchName}
                </option>
              ))}
            </select>

            <select
              className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filters.academicYear}
              onChange={(e) =>
                handleFilterChange("academicYear", e.target.value)
              }
            >
              <option value="">All Academic Years</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filters.paymentStatus}
              onChange={(e) =>
                handleFilterChange("paymentStatus", e.target.value)
              }
            >
              <option value="">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-between">
            <button
              onClick={clearFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              Clear Filters
            </button>
            <div className="flex gap-2">
              {selectedStudents.length > 0 && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
                  onClick={sendPaymentReminders}
                >
                  Send Reminder ({selectedStudents.length})
                </button>
              )}
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
                onClick={downloadExcel}
              >
                Download Excel
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : pendingPayments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
            <div className="text-5xl mb-4">🎉</div>
            <div className="text-xl font-semibold mb-2">All Clear!</div>
            <div>No pending payments found.</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-3 border-b">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Student Name
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Student ID
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Batch
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Total Fee
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Paid
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Remaining
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Status
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Next Due
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((payment) => (
                    <tr
                      key={payment._id}
                      className={`hover:bg-blue-50 transition-colors ${
                        payment.isOverdue ? "bg-red-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 border-b">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(payment._id)}
                          onChange={() => handleSelectStudent(payment._id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3 border-b">
                        <div className="font-medium">{payment.studentName}</div>
                        <div className="text-xs text-gray-500">
                          {payment.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b">
                        {payment.studentId}
                      </td>
                      <td className="px-4 py-3 border-b">
                        <div>{payment.batch}</div>
                        <div className="text-xs text-gray-500">
                          {payment.academicYear}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b">
                        ₹{payment.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 border-b text-green-600">
                        ₹{payment.paidAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 border-b text-red-600 font-semibold">
                        ₹{payment.remainingAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 border-b">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                            payment.paymentStatus,
                          )}`}
                        >
                          {payment.paymentStatus.toUpperCase()}
                        </span>
                        {payment.isOverdue && (
                          <div className="text-xs text-red-600 font-semibold mt-1">
                            OVERDUE
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b">
                        {payment.nextDueDate
                          ? new Date(payment.nextDueDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PanelDashboardLayout>
  );
};

export default PendingPayments;
