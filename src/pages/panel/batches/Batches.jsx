import React from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { NavLink } from "react-router-dom";
import BatchesList from "./BatchesList";

const Batches = () => {
  return (
    <PanelDashboardLayout>
      <div>
        <button className="btn btn-success my-3 create-new-button d-flex align-items-center justify-content-end">
          <NavLink to="/panel-admin/add-new-batch-form" className="text-white">
            + Add New Batch
          </NavLink>
        </button>
        <BatchesList />
      </div>
    </PanelDashboardLayout>
  );
};

export default Batches;
