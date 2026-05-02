import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getUnifiedReceipts, downloadReceiptPDF } from "../utils/Api";
import { getPaymentTypeLabel, getPaymentTypeBadgeStyle, getPaymentTypeOptions, ensurePaymentTypes } from "../utils/paymentTypes";

const UnifiedReceiptViewer = ({ studentView = false, filters = {} }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const [downloadingSingle, setDownloadingSingle] = useState({});
  const [paymentTypeOptions, setPaymentTypeOptions] = useState([]);

  const [localFilters, setLocalFilters] = useState({
    search: "",
    receiptType: "",
    batch: "",
    academicYear: "",
    ...filters,
  });

  useEffect(() => {
    ensurePaymentTypes().then(() => setPaymentTypeOptions(getPaymentTypeOptions()));
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [localFilters]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await getUnifiedReceipts(localFilters);
      setReceipts(response.data || []);
    } catch (error) {
      console.error("Error fetching unified receipts:", error);
      toast.error("Failed to fetch receipts");
    } finally {
      setLoading(false);
    }
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

  const handleDownloadSingle = async (receiptId, receiptNumber) => {
    try {
      setDownloadingSingle((prev) => ({ ...prev, [receiptId]: true }));
      const blob = await downloadReceiptPDF(receiptId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Receipt_${receiptNumber || "download"}.pdf`);
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
      toast.info(
        `Preparing ${selectedReceipts.length} receipt(s) for download...`,
      );

      const blob = await downloadReceiptPDF(null, selectedReceipts);
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
      toast.success("Receipts downloaded successfully");
    } catch (error) {
      console.error("Error downloading bulk receipts:", error);
      toast.error("Failed to download receipts");
    } finally {
      setDownloadingBulk(false);
    }
  };

  const getReceiptTypeBadgeClass = (type) => getPaymentTypeBadgeStyle(type, "alt");

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!studentView && (
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, ID, receipt number..."
            value={localFilters.search}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, search: e.target.value })
            }
            className="px-4 py-2 border rounded-md flex-1 min-w-[200px]"
          />
          <select
            value={localFilters.receiptType}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, receiptType: e.target.value })
            }
            className="px-4 py-2 border rounded-md"
          >
            <option value="">All Types</option>
            {paymentTypeOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={localFilters.academicYear}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, academicYear: e.target.value })
            }
            className="px-4 py-2 border rounded-md"
          >
            <option value="">All Years</option>
            <option value="2025-26">2025-26</option>
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
            <option value="2022-23">2022-23</option>
          </select>
        </div>
      )}

      {!studentView && selectedReceipts.length > 0 && (
        <div className="flex gap-2 items-center mb-4">
          <button
            onClick={handleDownloadBulk}
            disabled={downloadingBulk}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {downloadingBulk
              ? "Downloading..."
              : `Download Selected (${selectedReceipts.length})`}
          </button>
          <button
            onClick={() => {
              setSelectedReceipts([]);
              setSelectAll(false);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Clear Selection
          </button>
        </div>
      )}

      {receipts.length === 0 ? (
        <div className="text-center py-8 text-gray-600">No receipts found</div>
      ) : (
        <div className="space-y-4">
          {!studentView && (
            <div className="flex items-center gap-2 pb-2 border-b">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({receipts.length})
              </span>
            </div>
          )}

          {receipts.map((receipt) => (
            <div
              key={receipt._id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {!studentView && (
                  <input
                    type="checkbox"
                    checked={selectedReceipts.includes(receipt._id)}
                    onChange={() => handleSelectReceipt(receipt._id)}
                    className="mt-1 h-4 w-4"
                  />
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">
                          {receipt.receiptNumber}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded ${getReceiptTypeBadgeClass(
                            receipt.receiptType,
                          )}`}
                        >
                          {getPaymentTypeLabel(receipt.receiptType)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {receipt.studentDetails?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ₹{receipt.paymentSummary?.amountPaid?.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(
                          receipt.paymentDetails?.paymentDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">Student/Applicant ID</p>
                      <p className="font-medium">
                        {receipt.studentDetails?.id}
                      </p>
                    </div>
                    {receipt.studentDetails?.program && (
                      <div>
                        <p className="text-gray-600">Program</p>
                        <p className="font-medium">
                          {receipt.studentDetails.program}
                        </p>
                      </div>
                    )}
                    {receipt.studentDetails?.batch && (
                      <div>
                        <p className="text-gray-600">Batch</p>
                        <p className="font-medium">
                          {receipt.studentDetails.batch}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">Transaction ID</p>
                      <p className="font-medium text-xs">
                        {receipt.paymentDetails?.transactionId?.substring(
                          0,
                          20,
                        )}
                        ...
                      </p>
                    </div>
                  </div>

                  {receipt.paymentSummary?.installmentNumber && (
                    <div className="mb-3">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        Installment {receipt.paymentSummary.installmentNumber}
                      </span>
                    </div>
                  )}

                  {receipt.subjects && receipt.subjects.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">
                        ATKT Subjects ({receipt.subjects.length}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {receipt.subjects.slice(0, 3).map((subject, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded"
                          >
                            {subject.label}
                          </span>
                        ))}
                        {receipt.subjects.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{receipt.subjects.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleDownloadSingle(receipt._id, receipt.receiptNumber)
                      }
                      disabled={downloadingSingle[receipt._id]}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {downloadingSingle[receipt._id]
                        ? "Downloading..."
                        : "Download PDF"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnifiedReceiptViewer;
