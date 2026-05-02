import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  updateNonTeachingStaffViaAdmin,
  createNonTeachingStaffViaAdmin,
  getAllDesignationsViaAdmin,
  getSingleNonTeachingStaffViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const NonTeachingStaffForm = () => {
  const [staffData, setStaffData] = useState({});
  const [allDesignations, setAllDesignations] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams();

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm();

  useEffect(() => {
    async function fetchData() {
      const response = await getAllDesignationsViaAdmin();
      setAllDesignations(response?.designations || []);
    }
    fetchData();
  }, [0]);

  useEffect(() => {
    if (id) {
      fetchOldData();
    }
  }, [0]);

  useEffect(() => {
    if (id) {
      fetchOldData();
    }
  }, [reset, id]);

  const fetchOldData = async () => {
    const response = await getSingleNonTeachingStaffViaAdmin({ id });
    setStaffData(response?.staff);
    reset(response?.staff);
  };

  const onSubmit = async (data) => {
    console.log(data);
    try {
      let response;
      if (id !== undefined) {
        data.id = id;
        response = await updateNonTeachingStaffViaAdmin(data);
        toast.success(`Staff member updated successfully...`);
      } else {
        // create
        response = await createNonTeachingStaffViaAdmin(data);
        toast.success(`Staff member created successfully. Login details sent to email.`);
      }
      navigate("/panel-admin/non-teaching-staff");
    } catch (error) {
      toast.error(`Try Again, ${error?.response?.data?.error || error.message}`);
    }
  };

  const formInputs = [
    {
      label: "Full Name",
      type: "text",
      name: "name",
      required: true,
    },
    {
      label: "Designation",
      type: "select",
      name: "designation",
      required: true,
      options: allDesignations.length > 0 ? allDesignations : [
        { id: "lab-assistant", name: "Lab Assistant" },
        { id: "accountant", name: "Accountant" },
        { id: "librarian", name: "Librarian" },
        { id: "office-staff", name: "Office Staff" },
        { id: "security", name: "Security" },
        { id: "cleaner", name: "Cleaner" },
        { id: "driver", name: "Driver" },
        { id: "technician", name: "Technician" },
      ],
    },
    {
      label: "Email",
      type: "email",
      name: "email",
      required: true,
    },
    {
      label: "Salary (₹)",
      type: "number",
      name: "salary",
      required: true,
    },
    {
      label: "Salary Disbursement Date (1-31)",
      type: "number",
      name: "salaryDisbursementDate",
      required: true,
      min: 1,
      max: 31,
      errorMessage: "Date must be between 1 and 31",
    },
  ];

  return (
    <PanelDashboardLayout>
      <div className="card col-lg-4 mx-auto">
        <div className="card-body px-5 py-5">
          <div className="mb-3">
            <h3 className="alert alert-warning">
              {id !== undefined ? "Update" : "Create"} Non-Teaching Staff
            </h3>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            {formInputs.map((input, index) => (
              <div className="form-group" key={index}>
                <label>{input.label}</label>
                
                {input.type === "text" && (
                  <input
                    className="form-control p_input"
                    type="text"
                    {...register(input.name, {
                      required: input.required,
                    })}
                    aria-invalid={errors[input.name] ? "true" : "false"}
                  />
                )}
                
                {input.type === "number" && (
                  <input
                    className="form-control p_input"
                    type="number"
                    min={input.min}
                    max={input.max}
                    {...register(input.name, {
                      required: input.required,
                      min: {
                        value: input.min || 0,
                        message: input.errorMessage || `Minimum value is ${input.min}`,
                      },
                      max: {
                        value: input.max || 999999,
                        message: input.errorMessage || `Maximum value is ${input.max}`,
                      },
                    })}
                    aria-invalid={errors[input.name] ? "true" : "false"}
                  />
                )}
                
                {input.type === "email" && (
                  <input
                    className="form-control p_input"
                    type="email"
                    {...register(input.name, {
                      required: input.required,
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    aria-invalid={errors[input.name] ? "true" : "false"}
                  />
                )}
                
                {input.type === "select" && (
                  <select
                    className="form-control p_input"
                    {...register(input.name, {
                      required: input.required,
                    })}
                    aria-invalid={errors[input.name] ? "true" : "false"}
                  >
                    <option value="">Select {input.label}</option>
                    {input.options.map((option, idx) => (
                      <option key={idx} value={option.name || option}>
                        {option.name || option}
                      </option>
                    ))}
                  </select>
                )}

                {errors[input.name]?.type === "required" && (
                  <p className="text-danger">{`${input.label} is required`}</p>
                )}
                {errors[input.name]?.type === "pattern" && (
                  <p className="text-danger">{errors[input.name].message}</p>
                )}
                {errors[input.name]?.type === "min" && (
                  <p className="text-danger">{errors[input.name].message}</p>
                )}
                {errors[input.name]?.type === "max" && (
                  <p className="text-danger">{errors[input.name].message}</p>
                )}
              </div>
            ))}

            <div className="text-center">
              <button
                type="submit"
                className="btn btn-success btn-block enter-btn"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Please wait..."
                  : id !== undefined
                    ? "Update Staff"
                    : "Create Staff"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default NonTeachingStaffForm;