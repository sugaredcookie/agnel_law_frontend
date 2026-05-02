import React from "react";
import DashboardLayout from "./DashboardLayout";
import { NavLink } from "react-router-dom";
import FormList from "./form_list/FormList";

const Forms = () => {
  return (
    <DashboardLayout>
      <div>
        <button className="btn btn-success my-3 create-new-button d-flex align-items-center justify-content-end">
          <NavLink to="/add-new-application-form" className="text-white">
            + Add New Application
          </NavLink>
        </button>

        <FormList />
      </div>
    </DashboardLayout>
  );
};

export default Forms;
