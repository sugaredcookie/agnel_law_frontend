import React from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import GradeSchemeList from "./GradeSchemeList";
import { NavLink } from "react-router-dom";

const GradeSchemes = () => {
  return (
    <PanelDashboardLayout>
      <div>
        <h1>Grade Schemes</h1>
        <button className="btn btn-success my-3">
          <NavLink to={"/panel-admin/add-grade-scheme"} className="text-white">
            + Add Scheme
          </NavLink>
        </button>
        <GradeSchemeList />
      </div>
    </PanelDashboardLayout>
  );
};

export default GradeSchemes;
