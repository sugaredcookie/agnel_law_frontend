import React, { useState, useEffect } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { NavLink } from "react-router-dom";
import NonTeachingStaffList from "./NonTeachingStaffList";

const NonTeachingStaff = () => {
  return (
    <PanelDashboardLayout>
      <div>
        <button className="btn btn-success my-3 create-new-button d-flex align-items-center justify-content-end">
          <NavLink
            to="/panel-admin/add-new-non-teaching-staff-form"
            className="text-white"
          >
            + Add New Non-Teaching Staff
          </NavLink>
        </button>
        <NonTeachingStaffList />
      </div>
    </PanelDashboardLayout>
  );
};

export default NonTeachingStaff;