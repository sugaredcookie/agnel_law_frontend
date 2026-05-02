import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  createFeeStructure,
  getAllFeeStructures,
  controlPaymentAcceptance,
  getAllBatchesViaAdmin,
  updateFeeStructure,
} from "../../utils/Api";
import PanelDashboardLayout from "./PanelDashboardLayout";

const FeeStructures = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const academicYears = ["2025-26", "2024-25", "2023-24", "2022-23"];

  const initialFormData = {
    batchId: "",
    batchName: "",
    academicYear: "2024-25",
    fees: {
      tuitionFee: 0,
      developmentFee: 0,
    },
    paymentStructure: {
      allowInstallments: false,
      installments: [
        { installmentNumber: 1, amount: 0, dueDate: "", description: "First Installment" },
        { installmentNumber: 2, amount: 0, dueDate: "", description: "Second Installment" },
      ],
    },
    paymentAcceptance: {
      startDate: "",
      endDate: "",
      isAcceptingPayments: true,
      latePaymentAllowed: false,
      latePaymentPenalty: 0,
    },
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [structuresRes, batchesRes] = await Promise.all([
        getAllFeeStructures(),
        getAllBatchesViaAdmin(),
      ]);
      setFeeStructures(structuresRes.data || []);
      setBatches(batchesRes.batches || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [section, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
      }));
    }
  };

  const handleInstallmentChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      paymentStructure: {
        ...prev.paymentStructure,
        installments: prev.paymentStructure.installments.map((inst, i) =>
          i === index ? { ...inst, [field]: field === "amount" ? Number(value) : value } : inst
        ),
      },
    }));
  };

  const calculateTotalAmount = () => {
    return Object.values(formData.fees).reduce((sum, fee) => sum + Number(fee), 0);
  };

  const handleBatchChange = (e) => {
    const selectedBatch = batches.find((batch) => batch._id === e.target.value);
    setFormData((prev) => ({
      ...prev,
      batchId: e.target.value,
      batchName: selectedBatch ? selectedBatch.batchName : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const totalAmount = calculateTotalAmount();
      let payload = { ...formData };

      if (formData.paymentStructure.allowInstallments) {
        payload = {
          ...payload,
          paymentStructure: {
            ...payload.paymentStructure,
            installments: payload.paymentStructure.installments.map((inst) => ({
              ...inst,
              amount: inst.amount || totalAmount / 2,
            })),
          },
        };
      }

      if (editMode && editingId) {
        await updateFeeStructure(editingId, payload);
        toast.success("Fee structure updated successfully");
      } else {
        await createFeeStructure(payload);
        toast.success("Fee structure created successfully");
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving fee structure:", error);
      toast.error(error.response?.data?.message || "Failed to save fee structure");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setShowForm(false);
    setEditMode(false);
    setEditingId(null);
  };

  const handleEdit = (structure) => {
    setEditMode(true);
    setEditingId(structure._id);
    setShowForm(true);
    setFormData({
      batchId: structure.batch?.id?._id || structure.batch?.id || "",
      batchName: structure.batch?.name || "",
      academicYear: structure.academicYear,
      fees: { ...structure.fees },
      paymentStructure: {
        allowInstallments: structure.paymentStructure?.allowInstallments || false,
        installments: structure.paymentStructure?.installments?.length
          ? structure.paymentStructure.installments.map((inst) => ({
              ...inst,
              dueDate: inst.dueDate ? inst.dueDate.slice(0, 10) : "",
            }))
          : initialFormData.paymentStructure.installments,
      },
      paymentAcceptance: {
        startDate: structure.paymentAcceptance?.startDate?.slice(0, 10) || "",
        endDate: structure.paymentAcceptance?.endDate?.slice(0, 10) || "",
        isAcceptingPayments: structure.paymentAcceptance?.isAcceptingPayments ?? true,
        latePaymentAllowed: structure.paymentAcceptance?.latePaymentAllowed ?? false,
        latePaymentPenalty: structure.paymentAcceptance?.latePaymentPenalty ?? 0,
      },
    });
  };

  const togglePaymentAcceptance = async (id, currentStatus) => {
    try {
      await controlPaymentAcceptance(id, { isAcceptingPayments: !currentStatus });
      toast.success("Payment status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

  const filteredStructures = feeStructures.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      (s.batch?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = !filterYear || s.academicYear === filterYear;
    const matchesStatus =
      !filterStatus ||
      (filterStatus === "active" && s.paymentAcceptance?.isAcceptingPayments) ||
      (filterStatus === "inactive" && !s.paymentAcceptance?.isAcceptingPayments);
    return matchesSearch && matchesYear && matchesStatus;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <PanelDashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PanelDashboardLayout>
    );
  }

  return (
    <PanelDashboardLayout>
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fee Structures</h1>
            <p className="text-gray-600 mt-1">
              Manage fee configurations for different batches
            </p>
          </div>
          <button
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showForm
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {showForm ? "Cancel" : "Create Fee Structure"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {editMode ? "Edit Fee Structure" : "Create New Fee Structure"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Batch <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.batchId}
                          onChange={handleBatchChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Batch</option>
                          {batches.map((batch) => (
                            <option key={batch._id} value={batch._id}>
                              {batch.batchName} ({batch.department?.departmentName})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Academic Year <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="academicYear"
                          value={formData.academicYear}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {academicYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                      Fee Breakdown
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tuition Fee
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            ₹
                          </span>
                          <input
                            type="number"
                            name="fees.tuitionFee"
                            value={formData.fees.tuitionFee}
                            onChange={handleInputChange}
                            min="0"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Development Fee
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            ₹
                          </span>
                          <input
                            type="number"
                            name="fees.developmentFee"
                            value={formData.fees.developmentFee}
                            onChange={handleInputChange}
                            min="0"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Total Amount</span>
                          <span className="text-xl font-bold text-blue-600">
                            {formatCurrency(calculateTotalAmount())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                      Payment Period
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="paymentAcceptance.startDate"
                          value={formData.paymentAcceptance.startDate}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="paymentAcceptance.endDate"
                          value={formData.paymentAcceptance.endDate}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                      Payment Options
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="paymentStructure.allowInstallments"
                          checked={formData.paymentStructure.allowInstallments}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Allow installment payments</span>
                      </label>

                      {formData.paymentStructure.allowInstallments && (
                        <div className="ml-7 space-y-3">
                          {formData.paymentStructure.installments.map((inst, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                              <div className="text-sm font-medium text-gray-700 mb-2">
                                Installment {inst.installmentNumber}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    value={inst.amount}
                                    onChange={(e) =>
                                      handleInstallmentChange(idx, "amount", e.target.value)
                                    }
                                    placeholder="Amount"
                                    className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <input
                                  type="date"
                                  value={inst.dueDate}
                                  onChange={(e) =>
                                    handleInstallmentChange(idx, "dueDate", e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="paymentAcceptance.latePaymentAllowed"
                          checked={formData.paymentAcceptance.latePaymentAllowed}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Allow late payments</span>
                      </label>

                      {formData.paymentAcceptance.latePaymentAllowed && (
                        <div className="ml-7">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Late Payment Penalty
                          </label>
                          <div className="relative w-48">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              ₹
                            </span>
                            <input
                              type="number"
                              name="paymentAcceptance.latePaymentPenalty"
                              value={formData.paymentAcceptance.latePaymentPenalty}
                              onChange={handleInputChange}
                              min="0"
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editMode ? "Update" : "Create"} Fee Structure
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by batch name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Academic Years</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Fee Structures List */}
        {filteredStructures.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <i className="mdi mdi-file-document-outline text-gray-400 text-3xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No fee structures found</h3>
            <p className="text-gray-500">
              {searchTerm || filterYear || filterStatus
                ? "Try adjusting your filters"
                : "Create your first fee structure to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredStructures.map((structure) => (
              <div
                key={structure._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {structure.batch?.name || "Unknown Batch"}
                      </h3>
                      <p className="text-sm text-gray-500">{structure.academicYear}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        structure.paymentAcceptance?.isAcceptingPayments
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {structure.paymentAcceptance?.isAcceptingPayments ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Total Fee</p>
                      <p className="text-lg font-bold text-gray-800">
                        {formatCurrency(structure.totalAmount)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Payment Period</p>
                      <p className="text-sm text-gray-700">
                        {formatDate(structure.paymentAcceptance?.startDate)} -{" "}
                        {formatDate(structure.paymentAcceptance?.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    <div className="flex justify-between py-1">
                      <span>Tuition Fee:</span>
                      <span>{formatCurrency(structure.fees?.tuitionFee || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Development Fee:</span>
                      <span>{formatCurrency(structure.fees?.developmentFee || 0)}</span>
                    </div>
                    {structure.paymentStructure?.allowInstallments && (
                      <div className="flex items-center gap-2 py-1 text-blue-600">
                        <i className="mdi mdi-credit-card-check text-sm"></i>
                        <span>Installments enabled</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(structure)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        togglePaymentAcceptance(
                          structure._id,
                          structure.paymentAcceptance?.isAcceptingPayments
                        )
                      }
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        structure.paymentAcceptance?.isAcceptingPayments
                          ? "text-red-600 bg-red-50 hover:bg-red-100"
                          : "text-green-600 bg-green-50 hover:bg-green-100"
                      }`}
                    >
                      {structure.paymentAcceptance?.isAcceptingPayments
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <ToastContainer />
      </div>
    </PanelDashboardLayout>
  );
};

export default FeeStructures;
