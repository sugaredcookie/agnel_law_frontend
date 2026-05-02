import React from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { NavLink } from "react-router-dom";
import BatchGroupsList from "./BatchGroupsList";

const BatchGroups = () => {
  return (
    <PanelDashboardLayout>
      <div>
        <button className="btn btn-success my-3 create-new-button d-flex align-items-center justify-content-end">
          <NavLink to="/panel-admin/add-batch-group" className="text-white">
            + Add New Batch Group
          </NavLink>
        </button>
        <BatchGroupsList />
      </div>
    </PanelDashboardLayout>
  );
};

export default BatchGroups;
