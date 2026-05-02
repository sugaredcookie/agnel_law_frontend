import React from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { NavLink } from "react-router-dom";
import InstallmentSettingsList from "./InstallmentSettingsList";

const InstallmentSettings = () => {
  return (
    <PanelDashboardLayout>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="mb-1">💳 Installment Payment Settings</h4>
            <p className="text-muted mb-0">
              Configure payment plans and installment options
            </p>
          </div>
          <button className="btn btn-success create-new-button d-flex align-items-center">
            <NavLink
              to="/panel-admin/installment-settings/create"
              className="text-white"
            >
              + Add New Setting
            </NavLink>
          </button>
        </div>
        <InstallmentSettingsList />
      </div>
    </PanelDashboardLayout>
  );
};

export default InstallmentSettings;
