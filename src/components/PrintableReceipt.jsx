import React from "react";

const PrintableReceipt = ({ receipt, onClose, logoUrl }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:shadow-none">
        <div className="print:hidden flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Receipt Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-8 print:p-4">
          {/* Institution Header with Logo */}
          <div className="text-center mb-8">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Institution Logo"
                className="mx-auto mb-4 h-20 print:h-16"
                style={{ maxHeight: "80px" }}
              />
            )}
            <h1 className="text-3xl font-bold text-blue-800 mb-2">
              {receipt.institutionDetails?.name || "AGNEL'S COLLEGE"}
            </h1>
            <p className="text-gray-600">
              {receipt.institutionDetails?.address || "College Address"}
            </p>
            <p className="text-gray-600">
              Phone: {receipt.institutionDetails?.phone || "Phone Number"} |
              Email: {receipt.institutionDetails?.email || "email@college.com"}
            </p>
            <div className="mt-4 border-t-2 border-b-2 border-blue-600 py-2">
              <h2 className="text-xl font-bold">FEE RECEIPT</h2>
            </div>
          </div>

          {/* Receipt Details */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="font-bold text-lg mb-3">Student Details</h3>
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong> {receipt.receiptDetails?.studentName}
                </p>
                <p>
                  <strong>Student ID:</strong>{" "}
                  {receipt.receiptDetails?.studentId}
                </p>
                <p>
                  <strong>Program:</strong> {receipt.receiptDetails?.program}
                </p>
                <p>
                  <strong>Batch:</strong> {receipt.receiptDetails?.batchName}
                </p>
                <p>
                  <strong>Department:</strong>{" "}
                  {receipt.receiptDetails?.department}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3">Receipt Details</h3>
              <div className="space-y-2">
                <p>
                  <strong>Receipt No:</strong> {receipt.receiptNumber}
                </p>
                <p>
                  <strong>Payment Date:</strong>{" "}
                  {new Date(
                    receipt.receiptDetails?.paymentDate,
                  ).toLocaleDateString()}
                </p>
                <p>
                  <strong>Payment Mode:</strong>{" "}
                  {receipt.receiptDetails?.paymentMode}
                </p>
                <p>
                  <strong>Transaction ID:</strong>{" "}
                  {receipt.receiptDetails?.transactionId}
                </p>
                {receipt.receiptDetails?.razorpayPaymentId && (
                  <p>
                    <strong>Razorpay ID:</strong>{" "}
                    {receipt.receiptDetails.razorpayPaymentId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">Fee Breakdown</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">
                    Description
                  </th>
                  <th className="border border-gray-300 p-2 text-right">
                    Amount (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">Tuition Fee</td>
                  <td className="border border-gray-300 p-2 text-right">
                    {(receipt.feeBreakdown?.tuitionFee || 0).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">
                    Development Fee
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {(receipt.feeBreakdown?.developmentFee || 0).toFixed(2)}
                  </td>
                </tr>
                {receipt.feeBreakdown?.latePaymentPenalty > 0 && (
                  <tr>
                    <td className="border border-gray-300 p-2">
                      Late Payment Penalty
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {(receipt.feeBreakdown.latePaymentPenalty || 0).toFixed(
                        2,
                      )}
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 p-2">
                    Total Amount Paid
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {(receipt.paymentSummary?.amountPaid || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Summary */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">Payment Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Total Fee Amount:</strong> ₹
                  {(receipt.paymentSummary?.totalFeeAmount || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Current Payment:</strong> ₹
                  {(receipt.paymentSummary?.amountPaid || 0).toFixed(2)}
                </p>
              </div>
              <div>
                {receipt.paymentSummary?.installmentNumber && (
                  <p>
                    <strong>Installment Number:</strong>{" "}
                    {receipt.paymentSummary.installmentNumber}
                  </p>
                )}
                <p>
                  <strong>Payment Type:</strong>{" "}
                  {receipt.paymentSummary?.isFullPayment
                    ? "Full Payment"
                    : "Installment"}
                </p>
              </div>
            </div>
          </div>

          {/* Footer with College Seal */}
          <div className="mt-8 pt-4 border-t border-gray-300">
            <div className="flex justify-between items-end mb-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  This is a computer-generated receipt and does not require a
                  signature.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  For any queries, please contact the accounts department.
                </p>
              </div>
              <div className="text-center">
                <img
                  src={`${process.env.REACT_APP_BASE_HOST_URL?.replace("/api", "") || "https://lms.raphaedu.com/backend"}/uploads/images/clg_seal.png`}
                  alt="College Seal"
                  className="h-24 w-24 mx-auto mb-2"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <p className="text-xs text-gray-600 font-semibold">
                  Authorized Seal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableReceipt;
