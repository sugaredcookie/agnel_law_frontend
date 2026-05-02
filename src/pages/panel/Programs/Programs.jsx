import React from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { NavLink } from "react-router-dom";
import ProgramsList from "./ProgramsList";

const Programs = () => {
  return (
    <PanelDashboardLayout>
      <div>
        <button className="btn btn-success my-3 create-new-button d-flex align-items-center justify-content-end">
          <NavLink to="/panel-admin/select-department" className="text-white">
            + Add New Program
          </NavLink>
        </button>
        <ProgramsList />
      </div>
    </PanelDashboardLayout>
  );
};

export default Programs;
