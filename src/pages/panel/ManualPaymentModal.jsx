import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getStudentFeeDetails,
  recordManualPayment,
} from "../../utils/Api";

const ManualPaymentModal = ({ isOpen, onClose, student, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feeDetails, setFeeDetails] = useState(null);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    paymentMode: "",
    referenceNumber: "",
    paymentDate: new Date().toISOString().split("T")[0],
    remarks: "",
    installmentNumber: "",
    isFullPayment: false,
  });

  useEffect(() => {
    if (isOpen && student?._id) {
      fetchFeeDetails();
    }
  }, [isOpen, student]);

  const fetchFeeDetails = async () => {
    setLoading(true);
    try {
      const response = await getStudentFeeDetails(student._id);
      if (response.success) {
        setFeeDetails(response);
        if (response.feeDetails?.length > 0) {
          setSelectedFeeStructure(response.feeDetails[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching fee details:", error);
      toast.error("Failed to fetch fee details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFeeStructureChange = (e) => {
    const selected = feeDetails?.feeDetails?.find(
      (fd) => fd.feeStructure._id === e.target.value
    );
    setSelectedFeeStructure(selected);
    setFormData((prev) => ({ ...prev, amount: "", installmentNumber: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFeeStructure) {
      toast.error("Please select a fee structure");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!formData.paymentMode) {
      toast.error("Please select a payment mode");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount > selectedFeeStructure.remainingAmount) {
      toast.error(
        `Amount cannot exceed remaining balance of ${formatCurrency(selectedFeeStructure.remainingAmount)}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const paymentData = {
        studentId: student._id,
        feeStructureId: selectedFeeStructure.feeStructure._id,
        academicYear: selectedFeeStructure.feeStructure.academicYear,
        amount: amount,
        paymentMode: formData.paymentMode,
        referenceNumber: formData.referenceNumber || null,
        paymentDate: formData.paymentDate,
        remarks: formData.remarks || null,
        installmentNumber: formData.installmentNumber
          ? parseInt(formData.installmentNumber)
          : null,
        isFullPayment: amount >= selectedFeeStructure.remainingAmount,
      };

      const response = await recordManualPayment(paymentData);
      if (response.success) {
        toast.success(
          `Payment recorded successfully. Receipt: ${response.receipt.receiptNumber}`
        );
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(error.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const paymentModes = [
    { value: "cash", label: "Cash" },
    { value: "cheque", label: "Cheque" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "dd", label: "Demand Draft" },
    { value: "upi", label: "UPI" },
    { value: "other", label: "Other" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <h3 className="text-xl font-semibold">Record Manual Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !feeDetails ? (
            <div className="text-center py-8 text-gray-500">
              Failed to load fee details
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-800 mb-2">
                  Student Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>{" "}
                    <span className="font-medium">{feeDetails.student.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Roll No:</span>{" "}
                    <span className="font-medium">
                      {feeDetails.student.rollNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Batch:</span>{" "}
                    <span className="font-medium">{feeDetails.student.batch}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Program:</span>{" "}
                    <span className="font-medium">
                      {feeDetails.student.program}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fee Structure Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year / Fee Structure *
                </label>
                <select
                  value={selectedFeeStructure?.feeStructure._id || ""}
                  onChange={handleFeeStructureChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Fee Structure</option>
                  {feeDetails.feeDetails?.map((fd) => (
                    <option key={fd.feeStructure._id} value={fd.feeStructure._id}>
                      {fd.feeStructure.academicYear} - Total:{" "}
                      {formatCurrency(fd.feeStructure.totalAmount)} | Paid:{" "}
                      {formatCurrency(fd.totalPaid)} | Remaining:{" "}
                      {formatCurrency(fd.remainingAmount)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fee Summary */}
              {selectedFeeStructure && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Total Fee</p>
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(selectedFeeStructure.feeStructure.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Paid</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(selectedFeeStructure.totalPaid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Remaining</p>
                      <p className="font-semibold text-red-600">
                        {formatCurrency(selectedFeeStructure.remainingAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Previous Payments */}
                  {selectedFeeStructure.payments?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-xs text-gray-500 mb-2">
                        Previous Payments ({selectedFeeStructure.payments.length})
                      </p>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {selectedFeeStructure.payments.map((p, idx) => (
                          <div
                            key={p._id || idx}
                            className="flex justify-between text-xs bg-white px-2 py-1 rounded"
                          >
                            <span>
                              {new Date(p.date).toLocaleDateString("en-IN")} -{" "}
                              {p.isApplicationFee 
                                ? "Application Fee" 
                                : p.isManualPayment 
                                  ? p.paymentMode 
                                  : "Online"}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(p.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    max={selectedFeeStructure?.remainingAmount || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Mode</option>
                    {paymentModes.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference / Cheque No.
                  </label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleInputChange}
                    placeholder="Enter reference number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Installment Selection */}
              {selectedFeeStructure?.feeStructure?.paymentStructure
                ?.allowInstallments && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Installment Number
                  </label>
                  <select
                    name="installmentNumber"
                    value={formData.installmentNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Installment (Optional)</option>
                    {selectedFeeStructure.feeStructure.paymentStructure.installments?.map(
                      (inst) => (
                        <option
                          key={inst.installmentNumber}
                          value={inst.installmentNumber}
                        >
                          Installment {inst.installmentNumber} -{" "}
                          {formatCurrency(inst.amount)}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedFeeStructure}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualPaymentModal;
