import React from "react";
import PanelDashboardLayout from "./PanelDashboardLayout";

const PanelDashboard = () => {
  return (
    <PanelDashboardLayout>
      <div className="flex flex-col gap-4">
        <div>Hello from admin dashboard...</div>
      </div>
    </PanelDashboardLayout>
  );
};

export default PanelDashboard;
