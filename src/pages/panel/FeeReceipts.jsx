import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "./PanelDashboardLayout";
import {
  getAllBatchesViaAdmin,
  getAllProgramsViaAdmin,
  getUnifiedReceipts,
  downloadReceiptsExcel,
  downloadReceiptPDF,
} from "../../utils/Api";
import { toast } from "react-toastify";

const FeeReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    batch: "",
    academicYear: "",
    startDate: "",
    endDate: "",
    receiptType: "student_fee",
  });
  const [batches, setBatches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const [downloadingSingle, setDownloadingSingle] = useState({});
  const [receiptFormat, setReceiptFormat] = useState("modern"); // 'modern' or 'legacy'

  const academicYears = ["2025-26", "2024-25", "2023-24", "2022-23", "2021-22"];

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await getUnifiedReceipts(filters);
      setReceipts(response.data || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error("Failed to fetch receipts");
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

  const fetchAllPrograms = async () => {
    try {
      const response = await getAllProgramsViaAdmin();
      setPrograms(response.programs || []);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  useEffect(() => {
    fetchAllBatches();
    fetchAllPrograms();
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedReceipts([]);
    setSelectAll(false);
  };

  const handleDownloadSingle = async (receiptId, receiptNumber) => {
    try {
      setDownloadingSingle((prev) => ({ ...prev, [receiptId]: true }));
      const blob = await downloadReceiptPDF(receiptId, null, receiptFormat);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Receipt_${receiptNumber || receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded successfully");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    } finally {
      setDownloadingSingle((prev) => ({ ...prev, [receiptId]: false }));
    }
  };

  const handleDownloadBulk = async () => {
    if (selectedReceipts.length === 0) {
      toast.warning("Please select at least one receipt to download");
      return;
    }

    try {
      setDownloadingBulk(true);

      // Show progress toast with estimated time
      const estimatedTime = Math.ceil(selectedReceipts.length / 5); // ~5 receipts per second in batches
      toast.info(
        `Generating ${selectedReceipts.length} receipt(s)... This may take ~${estimatedTime} seconds`,
        { autoClose: false, toastId: "bulk-download" },
      );

      const blob = await downloadReceiptPDF(
        null,
        selectedReceipts,
        receiptFormat,
      );

      // Dismiss the progress toast
      toast.dismiss("bulk-download");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Receipts_${new Date().toISOString().split("T")[0]}.zip`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(
        `${selectedReceipts.length} receipts downloaded successfully!`,
      );
    } catch (error) {
      console.error("Error downloading bulk receipts:", error);
      toast.dismiss("bulk-download");
      toast.error("Failed to download receipts");
    } finally {
      setDownloadingBulk(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const blob = await downloadReceiptsExcel(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `fee_receipts_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Excel:", error);
      alert("Failed to download receipts Excel file");
    }
  };

  const downloadSelectedExcel = async () => {
    if (selectedReceipts.length === 0) {
      toast.warning("Please select at least one receipt to download");
      return;
    }

    await handleDownloadBulk();
  };

  const handleSelectReceipt = (receiptId) => {
    setSelectedReceipts((prev) =>
      prev.includes(receiptId)
        ? prev.filter((id) => id !== receiptId)
        : [...prev, receiptId],
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedReceipts([]);
    } else {
      setSelectedReceipts(receipts.map((r) => r._id));
    }
    setSelectAll(!selectAll);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      batch: "",
      academicYear: "",
      startDate: "",
      endDate: "",
      receiptType: "student_fee",
    });
  };

  return (
    <PanelDashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Fee Receipts Management
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Search by name, ID, receipt no."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />

            <select
              className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filters.batch}
              onChange={(e) => handleFilterChange("batch", e.target.value)}
            >
              <option value="">
                {filters.receiptType === "application"
                  ? "All Programs"
                  : "All Batches"}
              </option>
              {filters.receiptType === "application"
                ? programs.map((program) => (
                    <option key={program._id} value={program.programName}>
                      {program.programName}
                    </option>
                  ))
                : batches.map((batch) => (
                    <option
                      key={batch._id || batch.name}
                      value={batch.batchName}
                    >
                      {batch.batchName}
                    </option>
                  ))}
            </select>

            <select
              className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filters.receiptType}
              onChange={(e) =>
                handleFilterChange("receiptType", e.target.value)
              }
            >
              <option value="">All Receipt Types</option>
              <option value="student_fee">Student Fee</option>
              <option value="application">Application Fee</option>
              <option value="atkt">ATKT Fee</option>
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

            <input
              type="date"
              className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />

            <input
              type="date"
              className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />

            <button
              onClick={clearFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-gray-700 font-medium">
                Total Receipts: {receipts.length}
                {selectedReceipts.length > 0 && (
                  <span className="ml-3 text-blue-600">
                    ({selectedReceipts.length} selected)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">
                  Receipt Format:
                </label>
                <select
                  value={receiptFormat}
                  onChange={(e) => setReceiptFormat(e.target.value)}
                  className="border border-gray-300 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="modern">Modern (New)</option>
                  <option value="legacy">Legacy (Classic)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
                onClick={downloadExcel}
              >
                Download All (Excel)
              </button>
              {selectedReceipts.length > 0 && (
                <button
                  className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition ${
                    downloadingBulk ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={downloadSelectedExcel}
                  disabled={downloadingBulk}
                >
                  {downloadingBulk ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Generating PDFs...
                    </>
                  ) : (
                    `Download PDFs (${selectedReceipts.length})`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : receipts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
            No receipts found matching your filters.
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
                      Receipt No.
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Student Name
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Roll Number
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Batch
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Amount Paid
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Payment Date
                    </th>
                    <th className="px-4 py-3 border-b font-semibold text-gray-700 text-left">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr
                      key={receipt._id}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-4 py-3 border-b">
                        <input
                          type="checkbox"
                          checked={selectedReceipts.includes(receipt._id)}
                          onChange={() => handleSelectReceipt(receipt._id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3 border-b font-medium text-blue-600">
                        {receipt.receiptNumber}
                      </td>
                      <td className="px-4 py-3 border-b">
                        {receipt.studentDetails?.name}
                      </td>
                      <td className="px-4 py-3 border-b">
                        {receipt.studentDetails?.rollNumber ||
                          receipt.studentDetails?.id ||
                          "-"}
                      </td>
                      <td className="px-4 py-3 border-b">
                        {receipt.studentDetails?.batch}
                      </td>
                      <td className="px-4 py-3 border-b text-green-600 font-semibold">
                        ₹{receipt.paymentSummary?.amountPaid?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 border-b">
                        {receipt.paymentDetails?.paymentDate
                          ? new Date(
                              receipt.paymentDetails.paymentDate,
                            ).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3 border-b">
                        <button
                          onClick={() =>
                            handleDownloadSingle(
                              receipt._id,
                              receipt.receiptNumber,
                            )
                          }
                          disabled={downloadingSingle[receipt._id]}
                          className={`bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition ${
                            downloadingSingle[receipt._id]
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {downloadingSingle[receipt._id]
                            ? "Downloading..."
                            : "Download PDF"}
                        </button>
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

export default FeeReceipts;
