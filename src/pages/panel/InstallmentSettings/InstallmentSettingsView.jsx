import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import { getSingleInstallmentSettingViaAdmin } from "../../../utils/Api";
import { toast } from "react-toastify";

const InstallmentSettingsView = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchSettingsData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const response = await getSingleInstallmentSettingViaAdmin({ id });
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch settings data:", error);
      toast.error("Failed to load settings data");
      navigate("/panel-admin/installment-settings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PanelDashboardLayout>
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-2">Loading settings...</p>
          </div>
        </div>
      </PanelDashboardLayout>
    );
  }

  if (!settings) {
    return (
      <PanelDashboardLayout>
        <div className="card">
          <div className="card-body text-center py-5">
            <h5>Settings not found</h5>
            <NavLink
              to="/panel-admin/installment-settings"
              className="btn btn-primary"
            >
              Back to Settings
            </NavLink>
          </div>
        </div>
      </PanelDashboardLayout>
    );
  }

  return (
    <PanelDashboardLayout>
      <div className="row">
        <div className="col-lg-10 mx-auto">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-1">💳 Installment Settings Details</h4>
              <p className="text-muted mb-0">View payment plan configuration</p>
            </div>
            <div>
              <NavLink
                to={`/panel-admin/installment-settings/edit/${id}`}
                className="btn btn-warning me-2"
              >
                Edit Settings
              </NavLink>
              <NavLink
                to="/panel-admin/installment-settings"
                className="btn btn-secondary"
              >
                Back to List
              </NavLink>
            </div>
          </div>

          {/* Basic Information */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">📋 Basic Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="font-weight-bold">Type:</label>
                    <span
                      className={`badge ms-2 ${settings.program ? "badge-info" : "badge-secondary"}`}
                    >
                      {settings.program ? "Program-specific" : "Global"}
                    </span>
                  </div>

                  {settings.program && (
                    <div className="mb-3">
                      <label className="font-weight-bold">Program:</label>
                      <p className="mb-0">{settings.programName}</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="font-weight-bold">Status:</label>
                    <span
                      className={`badge ms-2 ${settings.isEnabled ? "badge-success" : "badge-danger"}`}
                    >
                      {settings.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="font-weight-bold">Created:</label>
                    <p className="mb-0">
                      {new Date(settings.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="font-weight-bold">Last Updated:</label>
                    <p className="mb-0">
                      {new Date(settings.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {settings.createdBy && (
                    <div className="mb-3">
                      <label className="font-weight-bold">Created By:</label>
                      <p className="mb-0">
                        {settings.createdBy.name || settings.createdBy.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Applicable Payment Types */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">💳 Applicable Payment Types</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <i
                      className={`fas fa-file-invoice-dollar me-2 ${settings.applicableToApplicationFees ? "text-success" : "text-muted"}`}
                    ></i>
                    <div>
                      <strong>Application Fees</strong>
                      <div>
                        <span
                          className={`badge ${settings.applicableToApplicationFees ? "badge-success" : "badge-secondary"}`}
                        >
                          {settings.applicableToApplicationFees
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Student Fees - Commented out for now */}
                {/* <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <i className={`fas fa-graduation-cap me-2 ${settings.applicableToStudentFees ? 'text-success' : 'text-muted'}`}></i>
                    <div>
                      <strong>Student Fees</strong>
                      <div>
                        <span className={`badge ${settings.applicableToStudentFees ? 'badge-success' : 'badge-secondary'}`}>
                          {settings.applicableToStudentFees ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div> */}
                <div className="col-md-6">
                  <div className="alert alert-info mb-0">
                    <small>
                      <i className="fas fa-info-circle me-1"></i>
                      Currently focusing on <strong>
                        Application Fee
                      </strong>{" "}
                      installments only.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Installment Plans */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                📋 Installment Plans ({settings.installmentPlans?.length || 0})
              </h5>
            </div>
            <div className="card-body">
              {settings.installmentPlans?.length > 0 ? (
                settings.installmentPlans.map((plan, index) => (
                  <div key={index} className="border rounded p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="text-primary mb-1">{plan.name}</h6>
                        <small className="text-muted">
                          Plan ID: {plan.planId}
                        </small>
                        {plan.isDefault && (
                          <span className="badge badge-warning ms-2">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="badge badge-info">
                        {plan.numberOfInstallments} Installments
                      </span>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead>
                          <tr>
                            <th>Installment</th>
                            <th>Percentage</th>
                            <th>Due After</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.breakdown?.map((breakdown, breakdownIndex) => (
                            <tr key={breakdownIndex}>
                              <td>
                                <span className="badge badge-primary">
                                  {breakdown.installmentNumber}
                                </span>
                              </td>
                              <td>
                                <strong>{breakdown.percentage}%</strong>
                              </td>
                              <td>
                                {breakdown.dueAfterDays === 0
                                  ? "Immediate"
                                  : `${breakdown.dueAfterDays} day${breakdown.dueAfterDays > 1 ? "s" : ""}`}
                              </td>
                              <td>{breakdown.description}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-success">
                            <th>Total:</th>
                            <th>
                              {plan.breakdown?.reduce(
                                (sum, item) => sum + item.percentage,
                                0,
                              )}
                              %
                            </th>
                            <th colSpan="2">
                              <small className="text-success">
                                ✓ Valid breakdown
                              </small>
                            </th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-3">
                  <i className="fas fa-inbox fa-2x mb-2"></i>
                  <p>No installment plans configured</p>
                </div>
              )}
            </div>
          </div>

          {/* Reminder Settings */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">📧 Reminder Settings</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex align-items-center">
                  <i
                    className={`fas fa-bell me-2 ${settings.reminderSettings?.enableReminders ? "text-success" : "text-muted"}`}
                  ></i>
                  <div>
                    <strong>Automatic Reminders:</strong>
                    <span
                      className={`badge ms-2 ${settings.reminderSettings?.enableReminders ? "badge-success" : "badge-secondary"}`}
                    >
                      {settings.reminderSettings?.enableReminders
                        ? "Enabled"
                        : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              {settings.reminderSettings?.enableReminders &&
                settings.reminderSettings?.reminderDays && (
                  <div className="row">
                    {settings.reminderSettings.reminderDays.map(
                      (reminder, index) => (
                        <div key={index} className="col-md-4 mb-2">
                          <div
                            className={`alert ${reminder.isActive ? "alert-success" : "alert-secondary"} py-2`}
                          >
                            <div className="d-flex align-items-center">
                              <i
                                className={`fas fa-${reminder.reminderType === "upcoming" ? "clock" : reminder.reminderType === "due_today" ? "exclamation-triangle" : "times-circle"} me-2`}
                              ></i>
                              <div>
                                <strong>
                                  {reminder.reminderType === "upcoming" &&
                                    "7 days before"}
                                  {reminder.reminderType === "due_today" &&
                                    "On due date"}
                                  {reminder.reminderType === "overdue" &&
                                    "After overdue"}
                                </strong>
                                <div>
                                  <small
                                    className={
                                      reminder.isActive
                                        ? "text-success"
                                        : "text-muted"
                                    }
                                  >
                                    {reminder.isActive ? "Active" : "Inactive"}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default InstallmentSettingsView;
