import React from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { NavLink } from "react-router-dom";
import FacultiesList from "./FacultiesList";

const Faculties = () => {
  return (
    <PanelDashboardLayout>
      <div>
        <button className="btn btn-success my-3 create-new-button d-flex align-items-center justify-content-end">
          <NavLink
            to="/panel-admin/add-new-faculty-form"
            className="text-white"
          >
            + Add New Faculty
          </NavLink>
        </button>
        <FacultiesList />
      </div>
    </PanelDashboardLayout>
  );
};

export default Faculties;
