import React from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { NavLink } from "react-router-dom";
import SubjectList from "./SubjectList";

const Subjects = () => {
  return (
    <PanelDashboardLayout>
      <div>
        <button className="btn btn-success my-3 create-new-button d-flex align-items-center justify-content-end">
          <NavLink to="/panel-admin/select-program" className="text-white">
            + Add New Subject
          </NavLink>
        </button>
        <SubjectList />
      </div>
    </PanelDashboardLayout>
  );
};

export default Subjects;
