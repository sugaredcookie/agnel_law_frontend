import React from "react";
import PanelDashboardLayout from "./PanelDashboardLayout";
import UnifiedReceiptViewer from "../../components/UnifiedReceiptViewer";
import { ToastContainer } from "react-toastify";

const AllReceiptsAdmin = () => {
  return (
    <PanelDashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            All Payment Receipts
          </h1>
          <p className="text-gray-600">
            View and manage all payment receipts across all payment types
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <UnifiedReceiptViewer studentView={false} />
        </div>
      </div>
      <ToastContainer />
    </PanelDashboardLayout>
  );
};

export default AllReceiptsAdmin;
