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

const FeeManagement = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState(null);
  const [formData, setFormData] = useState({
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
        {
          installmentNumber: 1,
          amount: 0,
          dueDate: "",
          description: "First Installment",
        },
        {
          installmentNumber: 2,
          amount: 0,
          dueDate: "",
          description: "Second Installment",
        },
      ],
    },
    paymentAcceptance: {
      startDate: "",
      endDate: "",
      isAcceptingPayments: true,
      latePaymentAllowed: false,
      latePaymentPenalty: 0,
    },
  });

  useEffect(() => {
    fetchFeeStructures();
    fetchBatches();
  }, []);

  const fetchFeeStructures = async () => {
    try {
      const response = await getAllFeeStructures();
      setFeeStructures(response.data);
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      toast.error("Failed to fetch fee structures");
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await getAllBatchesViaAdmin();
      setBatches(response.batches);
    } catch (error) {
      console.error("Error fetching batches:", error);
      toast.error("Failed to fetch batches");
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
          [field]:
            type === "checkbox"
              ? checked
              : type === "number"
                ? Number(value)
                : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
              ? Number(value)
              : value,
      }));
    }
  };

  const handleInstallmentChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      paymentStructure: {
        ...prev.paymentStructure,
        installments: prev.paymentStructure.installments.map((inst, i) =>
          i === index
            ? { ...inst, [field]: field === "amount" ? Number(value) : value }
            : inst,
        ),
      },
    }));
  };

  const calculateTotalAmount = () => {
    return Object.values(formData.fees).reduce(
      (sum, fee) => sum + Number(fee),
      0,
    );
  };

  const handleBatchChange = (e) => {
    const selectedBatch = batches.find((batch) => batch._id === e.target.value);
    setFormData((prev) => ({
      ...prev,
      batchId: e.target.value,
      batchName: selectedBatch ? selectedBatch.batchName : "",
    }));
  };

  const handleCreateFeeStructure = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalAmount = calculateTotalAmount();

      // Update installment amounts if installments are enabled
      if (formData.paymentStructure.allowInstallments) {
        const updatedFormData = {
          ...formData,
          paymentStructure: {
            ...formData.paymentStructure,
            installments: formData.paymentStructure.installments.map(
              (inst) => ({
                ...inst,
                amount: inst.amount || totalAmount / 2, // Default to half each
              }),
            ),
          },
        };

        await createFeeStructure(updatedFormData);
      } else {
        await createFeeStructure(formData);
      }

      toast.success("Fee structure created successfully!");
      setShowCreateForm(false);
      fetchFeeStructures();
      resetForm();
    } catch (error) {
      console.error("Error creating fee structure:", error);
      toast.error(
        error.response?.data?.message || "Failed to create fee structure",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
          {
            installmentNumber: 1,
            amount: 0,
            dueDate: "",
            description: "First Installment",
          },
          {
            installmentNumber: 2,
            amount: 0,
            dueDate: "",
            description: "Second Installment",
          },
        ],
      },
      paymentAcceptance: {
        startDate: "",
        endDate: "",
        isAcceptingPayments: true,
        latePaymentAllowed: false,
        latePaymentPenalty: 0,
      },
    });
  };

  const togglePaymentAcceptance = async (feeStructureId, currentStatus) => {
    try {
      await controlPaymentAcceptance(feeStructureId, {
        isAcceptingPayments: !currentStatus,
      });
      toast.success("Payment acceptance updated successfully!");
      fetchFeeStructures();
    } catch (error) {
      console.error("Error updating payment acceptance:", error);
      toast.error("Failed to update payment acceptance");
    }
  };

  const handleEditFeeStructure = (structure) => {
    setEditMode(true);
    setEditingStructureId(structure._id);
    setShowCreateForm(true);
    // Deep copy to avoid mutation
    setFormData({
      batchId:
        structure.batch?.id?._id || structure.batch?.id || structure.batchId,
      batchName: structure.batch?.name || structure.batch?.batchName || "",
      academicYear: structure.academicYear,
      fees: { ...structure.fees },
      paymentStructure: {
        allowInstallments:
          structure.paymentStructure?.allowInstallments || false,
        installments: structure.paymentStructure?.installments
          ? structure.paymentStructure.installments.map((inst) => ({ ...inst }))
          : [
              {
                installmentNumber: 1,
                amount: 0,
                dueDate: "",
                description: "First Installment",
              },
              {
                installmentNumber: 2,
                amount: 0,
                dueDate: "",
                description: "Second Installment",
              },
            ],
      },
      paymentAcceptance: {
        startDate: structure.paymentAcceptance?.startDate
          ? structure.paymentAcceptance.startDate.slice(0, 10)
          : "",
        endDate: structure.paymentAcceptance?.endDate
          ? structure.paymentAcceptance.endDate.slice(0, 10)
          : "",
        isAcceptingPayments:
          structure.paymentAcceptance?.isAcceptingPayments ?? true,
        latePaymentAllowed:
          structure.paymentAcceptance?.latePaymentAllowed ?? false,
        latePaymentPenalty:
          structure.paymentAcceptance?.latePaymentPenalty ?? 0,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingStructureId(null);
    setShowCreateForm(false);
    resetForm();
  };

  const handleSubmitFeeStructure = async (e) => {
    e.preventDefault();
    setLoading(true);

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

      if (editMode && editingStructureId) {
        await updateFeeStructure(editingStructureId, payload);
        toast.success("Fee structure updated successfully!");
      } else {
        await createFeeStructure(payload);
        toast.success("Fee structure created successfully!");
      }

      setShowCreateForm(false);
      setEditMode(false);
      setEditingStructureId(null);
      fetchFeeStructures();
      resetForm();
    } catch (error) {
      console.error(
        editMode
          ? "Error updating fee structure:"
          : "Error creating fee structure:",
        error,
      );
      toast.error(
        error.response?.data?.message ||
          (editMode
            ? "Failed to update fee structure"
            : "Failed to create fee structure"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Fee Management</h1>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              if (showCreateForm) {
                setEditMode(false);
                setEditingStructureId(null);
                resetForm();
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showCreateForm ? "Cancel" : "Create Fee Structure"}
          </button>
        </div>

        {/* Create/Edit Fee Structure Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editMode ? "Edit Fee Structure" : "Create Fee Structure"}
            </h2>
            <form onSubmit={handleSubmitFeeStructure}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div>
                  <h3 className="font-medium mb-3">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Batch
                      </label>
                      <select
                        value={formData.batchId}
                        onChange={handleBatchChange}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Batch</option>
                        {batches.map((batch) => (
                          <option key={batch._id} value={batch._id}>
                            {batch.batchName} ({batch.department.departmentName}
                            )
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Academic Year
                      </label>
                      <input
                        type="text"
                        name="academicYear"
                        value={formData.academicYear}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div>
                  <h3 className="font-medium mb-3">Fee Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(formData.fees).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium mb-1">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </label>
                        <input
                          type="number"
                          name={`fees.${key}`}
                          value={value}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                    ))}
                    <div className="font-bold">
                      Total Amount: ₹{calculateTotalAmount()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Structure */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">Payment Structure</h3>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="paymentStructure.allowInstallments"
                      checked={formData.paymentStructure.allowInstallments}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Allow Installment Payments
                  </label>
                </div>

                {formData.paymentStructure.allowInstallments && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.paymentStructure.installments.map(
                      (installment, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">
                            Installment {installment.installmentNumber}
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Amount
                              </label>
                              <input
                                type="number"
                                value={installment.amount}
                                onChange={(e) =>
                                  handleInstallmentChange(
                                    index,
                                    "amount",
                                    e.target.value,
                                  )
                                }
                                min="0"
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Due Date
                              </label>
                              <input
                                type="date"
                                value={installment.dueDate}
                                onChange={(e) =>
                                  handleInstallmentChange(
                                    index,
                                    "dueDate",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Payment Acceptance */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">Payment Acceptance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="paymentAcceptance.startDate"
                      value={formData.paymentAcceptance.startDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="paymentAcceptance.endDate"
                      value={formData.paymentAcceptance.endDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="paymentAcceptance.latePaymentAllowed"
                        checked={formData.paymentAcceptance.latePaymentAllowed}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Allow Late Payments
                    </label>
                  </div>
                  {formData.paymentAcceptance.latePaymentAllowed && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Late Payment Penalty
                      </label>
                      <input
                        type="number"
                        name="paymentAcceptance.latePaymentPenalty"
                        value={formData.paymentAcceptance.latePaymentPenalty}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                {editMode && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading
                    ? editMode
                      ? "Updating..."
                      : "Creating..."
                    : editMode
                      ? "Update Fee Structure"
                      : "Create Fee Structure"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Fee Structures List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Fee Structures</h2>
            {feeStructures.length === 0 ? (
              <p className="text-gray-600">No fee structures found.</p>
            ) : (
              <div className="space-y-4">
                {feeStructures.map((structure) => (
                  <div key={structure._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">
                          {structure.batch?.name ||
                            structure.batch?.batchName ||
                            "Unknown Batch"}{" "}
                          - {structure.academicYear}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Total Amount: ₹{structure.totalAmount}
                        </p>
                        <p className="text-sm text-gray-600">
                          Payment Period:{" "}
                          {structure.paymentAcceptance?.startDate
                            ? new Date(
                                structure.paymentAcceptance.startDate,
                              ).toLocaleDateString()
                            : "N/A"}{" "}
                          -{" "}
                          {structure.paymentAcceptance?.endDate
                            ? new Date(
                                structure.paymentAcceptance.endDate,
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            togglePaymentAcceptance(
                              structure._id,
                              structure.paymentAcceptance?.isAcceptingPayments,
                            )
                          }
                          className={`px-3 py-1 rounded-md text-sm ${
                            structure.paymentAcceptance?.isAcceptingPayments
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                        >
                          {structure.paymentAcceptance?.isAcceptingPayments
                            ? "Stop Payments"
                            : "Start Payments"}
                        </button>
                        <button
                          onClick={() => handleEditFeeStructure(structure)}
                          className="px-3 py-1 rounded-md text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        >
                          Edit
                        </button>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            structure.paymentStatus?.canAcceptPayments
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {structure.paymentStatus?.canAcceptPayments
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="mt-3">
                      <h4 className="font-medium mb-2">Fee Breakdown:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div>Tuition: ₹{structure.fees?.tuitionFee || 0}</div>
                        <div>
                          Development: ₹{structure.fees?.developmentFee || 0}
                        </div>
                      </div>
                    </div>

                    {/* Installments */}
                    {structure.paymentStructure?.allowInstallments && (
                      <div className="mt-3">
                        <h4 className="font-medium mb-2">Installments:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {structure.paymentStructure?.installments?.map(
                            (installment) => (
                              <div
                                key={installment.installmentNumber}
                                className="bg-gray-50 p-2 rounded"
                              >
                                Installment {installment.installmentNumber}: ₹
                                {installment.amount}
                                (Due:{" "}
                                {installment.dueDate
                                  ? new Date(
                                      installment.dueDate,
                                    ).toLocaleDateString()
                                  : "N/A"}
                                )
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <ToastContainer />
      </div>
    </PanelDashboardLayout>
  );
};

export default FeeManagement;
