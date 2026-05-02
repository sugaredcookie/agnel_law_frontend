import React from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { NavLink } from "react-router-dom";
import DepartmentsList from "./DepartmentsList";

const Departments = () => {
  return (
    <PanelDashboardLayout>
      <div>
        <button className="btn btn-success my-3 create-new-button d-flex align-items-center justify-content-end">
          <NavLink
            to="/panel-admin/add-new-department-form"
            className="text-white"
          >
            + Add New Department
          </NavLink>
        </button>
        <DepartmentsList />
      </div>
    </PanelDashboardLayout>
  );
};

export default Departments;
