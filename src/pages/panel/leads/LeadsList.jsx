import React from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { NavLink } from "react-router-dom";
import LeadLinksLists from "./LeadLinksLists";

const LeadsList = () => {
  return (
    <PanelDashboardLayout>
      <div>
        <button className="btn btn-success my-3 create-new-button d-flex align-items-center justify-content-end">
          <NavLink to="/panel-admin/add-new-link-form" className="text-white">
            + Generate New Link
          </NavLink>
        </button>

        <LeadLinksLists />
      </div>
    </PanelDashboardLayout>
  );
};

export default LeadsList;
