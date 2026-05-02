import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { NavLink } from "react-router-dom";
import CreateIcon from "@mui/icons-material/Create";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import InfoIcon from "@mui/icons-material/Info";
import {
  getAllInstallmentSettingsViaAdmin,
  deleteInstallmentSettingViaAdmin,
  toggleInstallmentSettingViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const InstallmentSettingsList = () => {
  const [allSettings, setAllSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const tableCustomStyles = {
    headRow: {
      style: {
        color: "#fff",
        backgroundColor: "#0F1015",
      },
    },
    striped: {
      default: "black",
    },
  };

  const columns = [
    {
      name: "SL. No",
      selector: (row, index) => ++index,
      width: "80px",
    },
    {
      name: "Type",
      selector: (row) => (row?.program ? "Program-specific" : "Global"),
      sortable: true,
      width: "140px",
      cell: (row) => (
        <span
          className={`badge ${row?.program ? "badge-info" : "badge-secondary"}`}
        >
          {row?.program ? "Program" : "Global"}
        </span>
      ),
    },
    {
      name: "Program",
      selector: (row) => row?.programName || "All Programs",
      sortable: true,
      width: "160px",
    },
    {
      name: "Status",
      selector: (row) => row?.isEnabled,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <span
          className={`badge ${row?.isEnabled ? "badge-success" : "badge-danger"}`}
        >
          {row?.isEnabled ? "Enabled" : "Disabled"}
        </span>
      ),
    },
    {
      name: "Plans",
      selector: (row) => row?.installmentPlans?.length || 0,
      sortable: true,
      width: "100px",
      cell: (row) => (
        <span className="badge badge-primary">
          {row?.installmentPlans?.length || 0} plans
        </span>
      ),
    },
    {
      name: "Application Fee",
      selector: (row) => row?.applicableToApplicationFees,
      width: "140px",
      cell: (row) => (
        <span
          className={`badge ${row?.applicableToApplicationFees ? "badge-success" : "badge-secondary"}`}
        >
          {row?.applicableToApplicationFees ? "Yes" : "No"}
        </span>
      ),
    },
    // Student Fee column - commented out for now
    // {
    //   name: "Student Fee",
    //   selector: (row) => row?.applicableToStudentFees,
    //   width: "130px",
    //   cell: (row) => (
    //     <span
    //       className={`badge ${row?.applicableToStudentFees ? 'badge-success' : 'badge-secondary'}`}
    //     >
    //       {row?.applicableToStudentFees ? 'Yes' : 'No'}
    //     </span>
    //   ),
    // },
    {
      name: "Created",
      selector: (row) => new Date(row?.createdAt).toLocaleDateString(),
      sortable: true,
      width: "120px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <NavLink
            className="text-info"
            title="View Details"
            to={`/panel-admin/installment-settings/view/${row._id}`}
          >
            <InfoIcon fontSize="small" />
          </NavLink>
          <NavLink
            className="text-warning"
            title="Edit"
            to={`/panel-admin/installment-settings/edit/${row._id}`}
          >
            <CreateIcon fontSize="small" />
          </NavLink>
          <button
            className="text-primary bg-none outline-none border-none p-0"
            title={`${row.isEnabled ? "Disable" : "Enable"}`}
            onClick={() => handleToggle(row._id, row.isEnabled)}
          >
            {row.isEnabled ? (
              <ToggleOnIcon fontSize="small" />
            ) : (
              <ToggleOffIcon fontSize="small" />
            )}
          </button>
          <button
            className="text-danger bg-none outline-none border-none p-0"
            title="Delete"
            onClick={() => handleDelete(row._id)}
          >
            <DeleteForeverIcon fontSize="small" />
          </button>
        </div>
      ),
      width: "160px",
    },
  ];

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      const response = await getAllInstallmentSettingsViaAdmin();
      console.log("Installment Settings:", response.data);
      setAllSettings(response.data || []);
    } catch (error) {
      console.error("Failed to fetch installment settings:", error);
      toast.error("Failed to fetch installment settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await toggleInstallmentSettingViaAdmin({ id });
      toast.success(
        `Settings ${currentStatus ? "disabled" : "enabled"} successfully`,
      );
      fetchAllSettings(); // Refresh the list
    } catch (error) {
      console.error("Toggle error:", error);
      toast.error("Failed to toggle settings");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this installment setting? This action cannot be undone.",
      )
    ) {
      try {
        await deleteInstallmentSettingViaAdmin({ id });
        toast.success("Installment setting deleted successfully");
        fetchAllSettings(); // Refresh the list
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete installment setting");
      }
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading installment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="col-lg-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 className="card-title mb-1">
                  Installment Payment Settings
                </h4>
                <p className="card-description mb-0">
                  Manage payment plans and installment configurations
                </p>
              </div>
              <div className="text-right">
                <small className="text-muted">
                  Total: {allSettings.length} setting
                  {allSettings.length !== 1 ? "s" : ""}
                </small>
              </div>
            </div>

            {allSettings.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="fas fa-credit-card fa-3x text-muted"></i>
                </div>
                <h5 className="text-muted">
                  No installment settings configured
                </h5>
                <p className="text-muted mb-4">
                  Create your first installment setting to enable payment plans
                  for your programs.
                </p>
                <NavLink
                  to="/panel-admin/installment-settings/create"
                  className="btn btn-primary"
                >
                  Create First Setting
                </NavLink>
              </div>
            ) : (
              <div className="table-responsive">
                <DataTable
                  columns={columns}
                  data={allSettings}
                  pagination={true}
                  customStyles={tableCustomStyles}
                  progressPending={loading}
                  progressComponent={
                    <div className="text-center py-3">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="sr-only">Loading...</span>
                      </div>
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallmentSettingsList;
