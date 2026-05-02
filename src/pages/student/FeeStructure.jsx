import React, { useState, useEffect } from "react";
import StudentDashboardLayout from "./StudentDashboardLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getStudentFeeData, getStudentApplicationFee } from "../../utils/Api";
import { payStudentFees, payApplicationFeeStudent } from "../../utils/RazorpayCheckout";
import RazorpayStudentFeeForm from "../../RazorpayStudentFeeForm";
import RazorpayHostedForm from "../../RazorpayHostedForm";

const FeeStructure = () => {
  const [feeData, setFeeData] = useState(null);
  const [applicationFeeData, setApplicationFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("2025-26");
  const [hostedCheckoutData, setHostedCheckoutData] = useState(null);
  const [applicationCheckoutData, setApplicationCheckoutData] = useState(null);

  useEffect(() => {
    fetchFeeData();
    fetchApplicationFeeData();
  }, [selectedAcademicYear]);

  const fetchFeeData = async () => {
    try {
      const response = await getStudentFeeData(selectedAcademicYear);
      setFeeData(response.data);
    } catch (error) {
      console.error("Error fetching fee data:", error);
      if (error.response?.status === 404) {
        setFeeData(null);
      } else {
        toast.error("Failed to fetch fee data");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationFeeData = async () => {
    try {
      const response = await getStudentApplicationFee();
      setApplicationFeeData(response.data);
    } catch (error) {
      console.error("Error fetching application fee data:", error);
      setApplicationFeeData(null);
    }
  };

  const handleInstallmentPayment = async (installmentNumber) => {
    setPaymentLoading(true);
    try {
      await payStudentFees(
        feeData.feeStructure._id,
        selectedAcademicYear,
        setHostedCheckoutData,
        "installment",
        installmentNumber,
      );
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error(error.response?.data?.message || "Failed to create payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleFullPayment = async () => {
    setPaymentLoading(true);
    try {
      await payStudentFees(
        feeData.feeStructure._id,
        selectedAcademicYear,
        setHostedCheckoutData,
        "full",
        null,
      );
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error(error.response?.data?.message || "Failed to create payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleApplicationFeePayment = async (type, installmentNumber = null) => {
    setPaymentLoading(true);
    try {
      await payApplicationFeeStudent(
        applicationFeeData.applicationId,
        setApplicationCheckoutData,
        type,
        installmentNumber,
      );
    } catch (error) {
      console.error("Error creating application fee payment:", error);
      toast.error(error.response?.data?.message || "Failed to create payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentDashboardLayout>
        <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
          <div />
          <div className="flex gap-4 items-center">
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
              <option value="2022-23">2022-23</option>
            </select>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </StudentDashboardLayout>
    );
  }

  if (!feeData) {
    return (
      <StudentDashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Fee Structure</h2>
            <div className="flex gap-4">
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
              </select>
            </div>
          </div>
          
          {/* Show message only if no application fee pending either */}
          {(!applicationFeeData || applicationFeeData.remainingAmount <= 0) && (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No fee structure found for academic year {selectedAcademicYear}
              </p>
            </div>
          )}

          {/* Application Fee Section - Show if there's pending application fee */}
          {applicationFeeData && applicationFeeData.remainingAmount > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-orange-500">
              <h3 className="text-xl font-semibold mb-4 text-orange-700">
                Pending Application Fee
              </h3>
              <div className="bg-orange-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Application Number</p>
                    <p className="font-medium">{applicationFeeData.applicationNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Course</p>
                    <p className="font-medium">{applicationFeeData.course}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Application Fee</p>
                    <p className="font-medium">₹{applicationFeeData.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Paid Amount</p>
                    <p className="font-medium text-green-600">₹{applicationFeeData.paidAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining Amount</p>
                    <p className="font-medium text-red-600">₹{applicationFeeData.remainingAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                      {applicationFeeData.paymentStatus?.toUpperCase() || "PARTIAL"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Fee Payment Options */}
              <div className="space-y-3">
                {/* Full Remaining Payment */}
                <button
                  onClick={() => handleApplicationFeePayment("full")}
                  disabled={paymentLoading}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {paymentLoading
                    ? "Processing..."
                    : `Pay Remaining Amount (₹${applicationFeeData.remainingAmount})`}
                </button>

                {/* Installment Options */}
                {applicationFeeData.installmentOptions?.isEnabled &&
                  applicationFeeData.installmentOptions?.pendingInstallments?.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-3 text-gray-700">Or Pay by Installment</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {applicationFeeData.installmentOptions.pendingInstallments.map((inst) => (
                          <button
                            key={inst.installmentNumber}
                            onClick={() => handleApplicationFeePayment("installment", inst.installmentNumber)}
                            disabled={paymentLoading}
                            className="border border-orange-300 bg-white text-orange-700 py-2 px-4 rounded-md hover:bg-orange-50 disabled:opacity-50 text-left"
                          >
                            <div className="font-medium">
                              Installment {inst.installmentNumber} - ₹{inst.amount}
                            </div>
                            <div className="text-xs text-gray-500">
                              {inst.description || `${inst.percentage}% of total`}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Hosted Checkout Form for Application Fee */}
        {applicationCheckoutData && (
          <RazorpayHostedForm
            order_id={applicationCheckoutData.order_id}
            key_id={applicationCheckoutData.key_id}
            callback_url={applicationCheckoutData.callback_url}
            user={applicationCheckoutData.user}
            applicationId={applicationCheckoutData.applicationId}
            installmentNumber={applicationCheckoutData.installmentNumber}
            isFullPayment={applicationCheckoutData.isFullPayment}
          />
        )}

        <ToastContainer />
      </StudentDashboardLayout>
    );
  }

  return (
    <StudentDashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Fee Structure</h2>
          <div className="flex gap-4">
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
              <option value="2022-23">2022-23</option>
            </select>
          </div>
        </div>

        {/* Fee Details Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Fee Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Fee Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tuition Fee:</span>
                  <span>₹{feeData.feeStructure.fees.tuitionFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Development Fee:</span>
                  <span>₹{feeData.feeStructure.fees.developmentFee}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total Fee:</span>
                  <span>₹{feeData.totalAmount}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Payment Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>₹{feeData.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Amount:</span>
                  <span className="text-green-600">₹{feeData.paidAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining Balance:</span>
                  <span className="text-red-600">
                    ₹{feeData.remainingAmount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span
                    className={`font-medium ${
                      feeData.paymentStatus === "paid"
                        ? "text-green-600"
                        : feeData.paymentStatus === "partial"
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {feeData.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        {feeData.remainingAmount > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Payment Options</h3>
            {!feeData.feeStructure.paymentAcceptance.isAcceptingPayments ? (
              <div className="text-red-600 font-medium text-center py-4">
                Fee payment is currently not allowed. Please contact the
                administration or try again later.
              </div>
            ) : (
              <>
                {/* Full Payment Option */}
                <div className="mb-4">
                  <button
                    onClick={handleFullPayment}
                    disabled={paymentLoading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {paymentLoading
                      ? "Processing..."
                      : `Pay Full Amount (₹${feeData.remainingAmount})`}
                  </button>
                </div>

                {/* Installment Options */}
                {feeData.feeStructure.paymentStructure.allowInstallments && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Pay by Installments</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {feeData.installmentDetails.map((installment) => (
                        <div
                          key={installment.installmentNumber}
                          className={`border rounded-lg p-4 ${
                            installment.status === "paid"
                              ? "bg-green-50 border-green-200"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">
                              Installment {installment.installmentNumber}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                installment.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {installment.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            Amount: ₹{installment.amount}
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            Due Date:{" "}
                            {new Date(installment.dueDate).toLocaleDateString()}
                          </div>
                          {installment.status === "pending" && (
                            <button
                              onClick={() =>
                                handleInstallmentPayment(
                                  installment.installmentNumber,
                                )
                              }
                              disabled={paymentLoading}
                              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                              {paymentLoading ? "Processing..." : "Pay Now"}
                            </button>
                          )}
                          {installment.status === "paid" &&
                            installment.paidDate && (
                              <div className="text-sm text-green-600">
                                Paid on:{" "}
                                {new Date(
                                  installment.paidDate,
                                ).toLocaleDateString()}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Application Fee Section - Show if there's pending application fee */}
        {applicationFeeData && applicationFeeData.remainingAmount > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-orange-500">
            <h3 className="text-xl font-semibold mb-4 text-orange-700">
              Pending Application Fee
            </h3>
            <div className="bg-orange-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Application Number</p>
                  <p className="font-medium">{applicationFeeData.applicationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Course</p>
                  <p className="font-medium">{applicationFeeData.course}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Application Fee</p>
                  <p className="font-medium">₹{applicationFeeData.totalAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid Amount</p>
                  <p className="font-medium text-green-600">₹{applicationFeeData.paidAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining Amount</p>
                  <p className="font-medium text-red-600">₹{applicationFeeData.remainingAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    {applicationFeeData.paymentStatus?.toUpperCase() || "PARTIAL"}
                  </span>
                </div>
              </div>
            </div>

            {/* Application Fee Payment Options */}
            <div className="space-y-3">
              {/* Full Remaining Payment */}
              <button
                onClick={() => handleApplicationFeePayment("full")}
                disabled={paymentLoading}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {paymentLoading
                  ? "Processing..."
                  : `Pay Remaining Amount (₹${applicationFeeData.remainingAmount})`}
              </button>

              {/* Installment Options */}
              {applicationFeeData.installmentOptions?.isEnabled &&
                applicationFeeData.installmentOptions?.pendingInstallments?.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3 text-gray-700">Or Pay by Installment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {applicationFeeData.installmentOptions.pendingInstallments.map((inst) => (
                        <button
                          key={inst.installmentNumber}
                          onClick={() => handleApplicationFeePayment("installment", inst.installmentNumber)}
                          disabled={paymentLoading}
                          className="border border-orange-300 bg-white text-orange-700 py-2 px-4 rounded-md hover:bg-orange-50 disabled:opacity-50 text-left"
                        >
                          <div className="font-medium">
                            Installment {inst.installmentNumber} - ₹{inst.amount}
                          </div>
                          <div className="text-xs text-gray-500">
                            {inst.description || `${inst.percentage}% of total`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Hosted Checkout Form for Student Fee */}
      {hostedCheckoutData && (
        <RazorpayStudentFeeForm
          order_id={hostedCheckoutData.order_id}
          key_id={hostedCheckoutData.key_id}
          callback_url={hostedCheckoutData.callback_url}
          user={hostedCheckoutData.user}
          studentId={hostedCheckoutData.studentId}
          feeStructureId={hostedCheckoutData.feeStructureId}
          academicYear={hostedCheckoutData.academicYear}
          installmentNumber={hostedCheckoutData.installmentNumber}
          isFullPayment={hostedCheckoutData.isFullPayment}
        />
      )}

      {/* Hosted Checkout Form for Application Fee */}
      {applicationCheckoutData && (
        <RazorpayHostedForm
          order_id={applicationCheckoutData.order_id}
          key_id={applicationCheckoutData.key_id}
          callback_url={applicationCheckoutData.callback_url}
          user={applicationCheckoutData.user}
          applicationId={applicationCheckoutData.applicationId}
          installmentNumber={applicationCheckoutData.installmentNumber}
          isFullPayment={applicationCheckoutData.isFullPayment}
        />
      )}

      <ToastContainer />
    </StudentDashboardLayout>
  );
};

export default FeeStructure;
