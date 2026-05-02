import React, { useEffect, useState, useRef } from "react";
import PanelDashboardLayout from "./PanelDashboardLayout";
import {
  getAllBatchesViaAdmin,
  getAllProgramsViaAdmin,
  getUnifiedReceipts,
  downloadReceiptsExcel,
  downloadReceiptPDF,
} from "../../utils/Api";
import { toast } from "react-toastify";
import { getPaymentTypeLabel, getPaymentTypeBadgeStyle, getPaymentTypeOptions, ensurePaymentTypes } from "../../utils/paymentTypes";

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

const PaymentHistory = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [allIds, setAllIds] = useState([]);
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
    startDate: "",
    endDate: "",
    receiptType: "",
  });

  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const [downloadingSingle, setDownloadingSingle] = useState({});
  const [paymentTypeOptions, setPaymentTypeOptions] = useState([]);

  const academicYears = ["2025-26", "2024-25", "2023-24", "2022-23", "2021-22"];
  
  const selectAllCheckboxRef = useRef(null);
  
  // Debounce search for performance
  const debouncedSearch = useDebounce(filters.search, 400);

  useEffect(() => {
    ensurePaymentTypes().then(() => setPaymentTypeOptions(getPaymentTypeOptions()));
  }, []);

  // Handle indeterminate state for select all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const isAllSelected = allIds.length > 0 && selectedReceipts.length === allIds.length;
      const isSomeSelected = selectedReceipts.length > 0 && selectedReceipts.length < allIds.length;
      selectAllCheckboxRef.current.indeterminate = isSomeSelected;
      setSelectAll(isAllSelected);
    }
  }, [selectedReceipts, allIds]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [debouncedSearch, filters.batch, filters.academicYear, filters.startDate, filters.endDate, filters.receiptType, pagination.currentPage, pagination.limit]);

  const fetchInitialData = async () => {
    try {
      const [batchesRes, programsRes] = await Promise.all([
        getAllBatchesViaAdmin(),
        getAllProgramsViaAdmin(),
      ]);
      setBatches(batchesRes.batches || []);
      setPrograms(programsRes.programs || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const searchFilters = { ...filters, search: debouncedSearch };
      const response = await getUnifiedReceipts(searchFilters, pagination.currentPage, pagination.limit);
      setReceipts(response.data || []);
      if (response.allIds) {
        setAllIds(response.allIds);
      }
      if (response.pagination) {
        setPagination(prev => ({ ...prev, ...response.pagination }));
      }
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error("Failed to fetch receipts");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setSelectedReceipts([]);
    setSelectAll(false);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      batch: "",
      academicYear: "",
      startDate: "",
      endDate: "",
      receiptType: "",
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setSelectedReceipts([]);
    setSelectAll(false);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    // Keep selections when changing pages
  };

  const handleDownloadSingle = async (receiptId, receiptNumber) => {
    try {
      setDownloadingSingle((prev) => ({ ...prev, [receiptId]: true }));
      const blob = await downloadReceiptPDF(receiptId, null, "modern");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Receipt_${receiptNumber || receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    } finally {
      setDownloadingSingle((prev) => ({ ...prev, [receiptId]: false }));
    }
  };

  const handleDownloadBulk = async () => {
    if (selectedReceipts.length === 0) {
      toast.warning("Please select receipts to download");
      return;
    }

    try {
      setDownloadingBulk(true);
      toast.info(`Generating ${selectedReceipts.length} receipt(s)...`, {
        autoClose: false,
        toastId: "bulk-download",
      });

      const blob = await downloadReceiptPDF(null, selectedReceipts, "modern");
      toast.dismiss("bulk-download");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Receipts_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`${selectedReceipts.length} receipts downloaded`);
    } catch (error) {
      toast.dismiss("bulk-download");
      toast.error("Failed to download receipts");
    } finally {
      setDownloadingBulk(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await downloadReceiptsExcel(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payment_history_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded");
    } catch (error) {
      toast.error("Failed to download Excel");
    }
  };

  const handleSelectReceipt = (receiptId) => {
    setSelectedReceipts((prev) =>
      prev.includes(receiptId)
        ? prev.filter((id) => id !== receiptId)
        : [...prev, receiptId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedReceipts([]);
    } else {
      // Select ALL receipts across all pages
      setSelectedReceipts(allIds);
    }
    setSelectAll(!selectAll);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getReceiptTypeBadge = (type) => {
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getPaymentTypeBadgeStyle(type)}`}>
        {getPaymentTypeLabel(type)}
      </span>
    );
  };

  const totalAmount = receipts.reduce(
    (sum, r) => sum + (r.paymentSummary?.amountPaid || 0),
    0
  );

  return (
    <PanelDashboardLayout>
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Transaction History</h1>
          <p className="text-gray-600 mt-1">
            View all transactions and download receipts
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by name, ID, receipt no..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.batch}
              onChange={(e) => handleFilterChange("batch", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {filters.receiptType === "application" ? "All Programs" : "All Batches"}
              </option>
              {filters.receiptType === "application"
                ? programs.map((p) => (
                    <option key={p._id} value={p.programName}>
                      {p.programName}
                    </option>
                  ))
                : batches.map((b) => (
                    <option key={b._id} value={b.batchName}>
                      {b.batchName}
                    </option>
                  ))}
            </select>

            <select
              value={filters.receiptType}
              onChange={(e) => handleFilterChange("receiptType", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {paymentTypeOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>

          {/* Summary & Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{pagination.totalCount}</span> receipts
              </span>
              {pagination.totalCount > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-gray-600">
                    Total:{" "}
                    <span className="font-semibold text-green-600">
                      {formatCurrency(totalAmount)}
                    </span>
                  </span>
                  {selectedReceipts.length > 0 && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-blue-600 font-medium">
                        {selectedReceipts.length} of {allIds.length} selected
                        {selectedReceipts.length === allIds.length && " (All)"}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-2">
              {selectedReceipts.length > 0 && (
                <button
                  onClick={handleDownloadBulk}
                  disabled={downloadingBulk}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {downloadingBulk ? "Generating..." : `Download PDFs (${selectedReceipts.length})`}
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
        ) : receipts.length === 0 ? (
          <EmptyState message="No receipts found" />
        ) : (
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
                        title={`Select all ${allIds.length} receipts`}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Receipt No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Batch / Program
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receipts.map((receipt) => (
                    <tr key={receipt._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedReceipts.includes(receipt._id)}
                          onChange={() => handleSelectReceipt(receipt._id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-blue-600">
                          {receipt.receiptNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {receipt.studentDetails?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {receipt.studentDetails?.rollNumber ||
                            receipt.studentDetails?.id ||
                            "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {receipt.studentDetails?.batch || receipt.studentDetails?.program}
                      </td>
                      <td className="px-4 py-3">
                        {getReceiptTypeBadge(receipt.receiptType)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(receipt.paymentSummary?.amountPaid)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(receipt.paymentDetails?.paymentDate)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            handleDownloadSingle(receipt._id, receipt.receiptNumber)
                          }
                          disabled={downloadingSingle[receipt._id]}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          {downloadingSingle[receipt._id] ? "..." : "Download"}
                        </button>
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
        )}
      </div>
    </PanelDashboardLayout>
  );
};

const EmptyState = ({ message }) => (
  <div className="bg-white rounded-lg shadow-md p-12 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
      <i className="mdi mdi-receipt text-gray-400 text-3xl"></i>
    </div>
    <h3 className="text-lg font-medium text-gray-700 mb-2">{message}</h3>
    <p className="text-gray-500">Try adjusting your filters or check back later</p>
  </div>
);

export default PaymentHistory;
