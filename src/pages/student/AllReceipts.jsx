import React from "react";
import StudentDashboardLayout from "./StudentDashboardLayout";
import UnifiedReceiptViewer from "../../components/UnifiedReceiptViewer";
import { ToastContainer } from "react-toastify";

const AllReceipts = () => {
  return (
    <StudentDashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            All Payment Receipts
          </h1>
          <p className="text-gray-600">
            View and download all your payment receipts including student fees,
            application fees, and ATKT exam fees
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <UnifiedReceiptViewer studentView={true} />
        </div>
      </div>
      <ToastContainer />
    </StudentDashboardLayout>
  );
};

export default AllReceipts;
