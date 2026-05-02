import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import {
  createInstallmentSettingViaAdmin,
  UpdateInstallmentSettingViaAdmin,
  getSingleInstallmentSettingViaAdmin,
  getAllProgramsViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const InstallmentSettingsForm = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedProgramData, setSelectedProgramData] = useState(null);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const {
    register,
    control,
    formState: { isSubmitting },
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      program: null,
      programName: "",
      isEnabled: true,
      applicableToApplicationFees: true,
      applicableToStudentFees: false, // Commented out for now
      installmentPlans: [
        {
          planId: "2-installments",
          name: "2 Installments (50-50)",
          numberOfInstallments: 2,
          isDefault: true,
          breakdown: [
            {
              installmentNumber: 1,
              percentage: 50,
              dueAfterDays: 0,
              description: "First Payment",
            },
            {
              installmentNumber: 2,
              percentage: 50,
              dueAfterDays: 7,
              description: "Second Payment",
            },
          ],
        },
      ],
      reminderSettings: {
        enableReminders: true,
        reminderDays: [
          { daysBefore: 7, reminderType: "upcoming", isActive: true },
          { daysBefore: 0, reminderType: "due_today", isActive: true },
          { daysBefore: -1, reminderType: "overdue", isActive: true },
        ],
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "installmentPlans",
  });

  useEffect(() => {
    fetchPrograms();
    if (isEdit) {
      fetchSettingsData();
    }
  }, [isEdit, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPrograms = async () => {
    try {
      const response = await getAllProgramsViaAdmin();
      console.log("Programs fetched:", response.programs);
      setPrograms(response.programs || []);
    } catch (error) {
      console.error("Failed to fetch programs:", error);
      toast.error("Failed to load programs");
    }
  };

  const handleProgramChange = (programId) => {
    setSelectedProgram(programId);

    if (programId) {
      const program = programs.find((p) => p._id === programId);
      setSelectedProgramData(program);
    } else {
      setSelectedProgramData(null);
    }
  };

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const response = await getSingleInstallmentSettingViaAdmin({ id });
      const data = response.data;

      // Reset form with fetched data
      reset({
        program: data.program,
        programName: data.programName,
        isEnabled: data.isEnabled,
        applicableToApplicationFees: data.applicableToApplicationFees,
        applicableToStudentFees: data.applicableToStudentFees,
        installmentPlans: data.installmentPlans || [],
        reminderSettings: data.reminderSettings || {
          enableReminders: true,
          reminderDays: [
            { daysBefore: 7, reminderType: "upcoming", isActive: true },
            { daysBefore: 0, reminderType: "due_today", isActive: true },
            { daysBefore: -1, reminderType: "overdue", isActive: true },
          ],
        },
      });

      setSelectedProgram(data.program || "");
      if (data.program) {
        const program = programs.find((p) => p._id === data.program);
        setSelectedProgramData(program);
      }
    } catch (error) {
      console.error("Failed to fetch settings data:", error);
      toast.error("Failed to load settings data");
      navigate("/panel-admin/installment-settings");
    } finally {
      setLoading(false);
    }
  };

  const addInstallmentPlan = () => {
    append({
      planId: `${fields.length + 2}-installments`,
      name: `${fields.length + 2} Installments`,
      numberOfInstallments: fields.length + 2,
      isDefault: false,
      breakdown: Array.from({ length: fields.length + 2 }, (_, index) => ({
        installmentNumber: index + 1,
        percentage: Math.round(100 / (fields.length + 2)),
        dueAfterDays: index === 0 ? 0 : 7 * index,
        description: `Installment ${index + 1}`,
      })),
    });
  };

  const addInstallmentBreakdown = (planIndex) => {
    const currentPlan = watch(`installmentPlans.${planIndex}`);
    const newBreakdownLength = currentPlan.breakdown.length + 1;

    setValue(
      `installmentPlans.${planIndex}.numberOfInstallments`,
      newBreakdownLength,
    );
    setValue(`installmentPlans.${planIndex}.breakdown`, [
      ...currentPlan.breakdown,
      {
        installmentNumber: newBreakdownLength,
        percentage: 0,
        dueAfterDays: 7 * newBreakdownLength,
        description: `Installment ${newBreakdownLength}`,
      },
    ]);
  };

  const removeInstallmentBreakdown = (planIndex, breakdownIndex) => {
    const currentPlan = watch(`installmentPlans.${planIndex}`);
    if (currentPlan.breakdown.length <= 2) {
      toast.warning("A plan must have at least 2 installments");
      return;
    }

    const newBreakdown = currentPlan.breakdown.filter(
      (_, index) => index !== breakdownIndex,
    );
    const newLength = newBreakdown.length;

    setValue(`installmentPlans.${planIndex}.numberOfInstallments`, newLength);
    setValue(
      `installmentPlans.${planIndex}.breakdown`,
      newBreakdown.map((item, index) => ({
        ...item,
        installmentNumber: index + 1,
      })),
    );
  };

  const validatePercentages = (planIndex) => {
    const currentPlan = watch(`installmentPlans.${planIndex}`);
    const total = currentPlan.breakdown.reduce(
      (sum, item) => sum + (parseInt(item.percentage) || 0),
      0,
    );
    return total === 100;
  };

  const onSubmit = async (data) => {
    try {
      // Validate all plans have 100% total
      for (let i = 0; i < data.installmentPlans.length; i++) {
        if (!validatePercentages(i)) {
          toast.error(`Plan ${i + 1} percentages must add up to 100%`);
          return;
        }
      }

      // Set program name based on selection
      if (data.program) {
        data.programName = selectedProgramData?.programName || "";
      } else {
        data.programName = "";
      }

      if (isEdit) {
        data.id = id;
        await UpdateInstallmentSettingViaAdmin(data);
        toast.success("Installment settings updated successfully");
      } else {
        await createInstallmentSettingViaAdmin(data);
        toast.success("Installment settings created successfully");
      }

      navigate("/panel-admin/installment-settings");
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error?.response?.data?.message || "Failed to save settings");
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

  return (
    <PanelDashboardLayout>
      <div className="row">
        <div className="col-lg-10 mx-auto">
          <div className="card">
            <div className="card-body px-4 py-4">
              <div className="mb-4">
                <h3 className="alert alert-info">
                  {isEdit ? "Update" : "Create"} Installment Payment Settings
                </h3>
                <p className="text-muted">
                  Configure payment plans and installment options for programs
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Basic Settings */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="font-weight-bold">
                        Program Selection
                      </label>
                      <select
                        className="form-control"
                        {...register("program", {
                          onChange: (e) => handleProgramChange(e.target.value),
                        })}
                        value={selectedProgram}
                        onChange={(e) => handleProgramChange(e.target.value)}
                      >
                        <option value="">Global (All Programs)</option>
                        {programs.length > 0 ? (
                          programs.map((program) => (
                            <option key={program._id} value={program._id}>
                              {program.programName} (
                              {program.applicationFee
                                ? `₹${program.applicationFee}`
                                : "No fee set"}
                              )
                            </option>
                          ))
                        ) : (
                          <option disabled>
                            {loading
                              ? "Loading programs..."
                              : "No programs found"}
                          </option>
                        )}
                      </select>
                      <small className="text-muted">
                        Leave empty for global settings that apply to all
                        programs
                      </small>

                      {/* Dynamic Program Info */}
                      {selectedProgramData && (
                        <div className="mt-2 p-2 bg-light border rounded">
                          <strong>Selected Program:</strong>
                          <div className="mt-1">
                            <small>
                              <i className="fas fa-graduation-cap me-1"></i>
                              <strong>{selectedProgramData.programName}</strong>
                            </small>
                            {selectedProgramData.applicationFee && (
                              <div>
                                <small className="text-muted">
                                  Application Fee: ₹
                                  {selectedProgramData.applicationFee}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!selectedProgram && (
                        <div className="mt-2 p-2 bg-info border rounded text-white">
                          <small>
                            <i className="fas fa-globe me-1"></i>
                            <strong>Global Settings</strong> - Will apply to all
                            programs
                          </small>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="font-weight-bold">Status</label>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          {...register("isEnabled")}
                        />
                        <label className="form-check-label">
                          Enable Installment Payments
                        </label>
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
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...register("applicableToApplicationFees")}
                            defaultChecked={true}
                          />
                          <label className="form-check-label">
                            <strong>Application Fees</strong>
                            <br />
                            <small className="text-muted">
                              Allow installments for application fees
                            </small>
                          </label>
                        </div>
                      </div>
                      {/* Student Fees - Commented out for now */}
                      {/* <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...register("applicableToStudentFees")}
                          />
                          <label className="form-check-label">
                            <strong>Student Fees</strong>
                            <br />
                            <small className="text-muted">
                              Allow installments for student fees
                            </small>
                          </label>
                        </div>
                      </div> */}
                    </div>
                    <div className="alert alert-info">
                      <small>
                        <i className="fas fa-info-circle me-1"></i>
                        Currently focusing on <strong>
                          Application Fee
                        </strong>{" "}
                        installments only. Student fee installments will be
                        available in future updates.
                      </small>
                    </div>
                  </div>
                </div>

                {/* Installment Plans */}
                <div className="card mb-4">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">📋 Installment Plans</h5>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={addInstallmentPlan}
                    >
                      + Add Plan
                    </button>
                  </div>
                  <div className="card-body">
                    {fields.map((plan, planIndex) => (
                      <div key={plan.id} className="border rounded p-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="text-primary mb-0">
                            Plan {planIndex + 1}
                          </h6>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => remove(planIndex)}
                            >
                              Remove Plan
                            </button>
                          )}
                        </div>

                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label>Plan Name</label>
                            <input
                              className="form-control"
                              {...register(
                                `installmentPlans.${planIndex}.name`,
                              )}
                            />
                          </div>
                          <div className="col-md-3">
                            <label>Plan ID</label>
                            <input
                              className="form-control"
                              {...register(
                                `installmentPlans.${planIndex}.planId`,
                              )}
                            />
                          </div>
                          <div className="col-md-3">
                            <div className="form-check mt-4">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                {...register(
                                  `installmentPlans.${planIndex}.isDefault`,
                                )}
                              />
                              <label className="form-check-label">
                                Default Plan
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Installment Breakdown */}
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>Installment Breakdown:</strong>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => addInstallmentBreakdown(planIndex)}
                            >
                              + Add Installment
                            </button>
                          </div>

                          {watch(
                            `installmentPlans.${planIndex}.breakdown`,
                          )?.map((breakdown, breakdownIndex) => (
                            <div
                              key={breakdownIndex}
                              className="row align-items-end mb-2"
                            >
                              <div className="col-md-2">
                                <label className="small">Installment #</label>
                                <input
                                  className="form-control form-control-sm"
                                  type="number"
                                  {...register(
                                    `installmentPlans.${planIndex}.breakdown.${breakdownIndex}.installmentNumber`,
                                  )}
                                  readOnly
                                />
                              </div>
                              <div className="col-md-2">
                                <label className="small">Percentage</label>
                                <div className="input-group">
                                  <input
                                    className="form-control form-control-sm"
                                    type="number"
                                    min="1"
                                    max="99"
                                    {...register(
                                      `installmentPlans.${planIndex}.breakdown.${breakdownIndex}.percentage`,
                                    )}
                                  />
                                  <div className="input-group-append">
                                    <span className="input-group-text">%</span>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-2">
                                <label className="small">
                                  Due After (Days)
                                </label>
                                <input
                                  className="form-control form-control-sm"
                                  type="number"
                                  min="0"
                                  {...register(
                                    `installmentPlans.${planIndex}.breakdown.${breakdownIndex}.dueAfterDays`,
                                  )}
                                />
                              </div>
                              <div className="col-md-4">
                                <label className="small">Description</label>
                                <input
                                  className="form-control form-control-sm"
                                  {...register(
                                    `installmentPlans.${planIndex}.breakdown.${breakdownIndex}.description`,
                                  )}
                                />
                              </div>
                              <div className="col-md-2">
                                {watch(
                                  `installmentPlans.${planIndex}.breakdown`,
                                )?.length > 2 && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() =>
                                      removeInstallmentBreakdown(
                                        planIndex,
                                        breakdownIndex,
                                      )
                                    }
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Percentage validation indicator */}
                          <div className="mt-2">
                            <small
                              className={`${validatePercentages(planIndex) ? "text-success" : "text-danger"}`}
                            >
                              Total:{" "}
                              {watch(
                                `installmentPlans.${planIndex}.breakdown`,
                              )?.reduce(
                                (sum, item) =>
                                  sum + (parseInt(item.percentage) || 0),
                                0,
                              )}
                              %
                              {validatePercentages(planIndex)
                                ? " ✓"
                                : " (Must equal 100%)"}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reminder Settings */}
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">📧 Reminder Settings</h5>
                  </div>
                  <div className="card-body">
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        {...register("reminderSettings.enableReminders")}
                      />
                      <label className="form-check-label">
                        Enable Automatic Payment Reminders
                      </label>
                    </div>

                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...register(
                              "reminderSettings.reminderDays.0.isActive",
                            )}
                          />
                          <label className="form-check-label">
                            7 days before due date
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...register(
                              "reminderSettings.reminderDays.1.isActive",
                            )}
                          />
                          <label className="form-check-label">
                            On due date
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...register(
                              "reminderSettings.reminderDays.2.isActive",
                            )}
                          />
                          <label className="form-check-label">
                            After due date (overdue)
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    onClick={() =>
                      navigate("/panel-admin/installment-settings")
                    }
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Please wait..."
                      : isEdit
                        ? "Update Settings"
                        : "Create Settings"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default InstallmentSettingsForm;
