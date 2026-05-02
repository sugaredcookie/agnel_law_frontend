/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  UpdateFacultyViaAdmin,
  createFacultyViaAdmin,
  getAllDepartmentsViaAdmin,
  getSingleFacultyViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const FacultyForm = () => {
  const [facultyData, setFacultyData] = useState({});
  const [allDepartments, setAllDepartments] = useState([]);

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
      const response = await getAllDepartmentsViaAdmin();
      setAllDepartments(response?.departments);
    }
    fetchData();
  }, [0]);
  console.log(allDepartments);
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
    const response = await getSingleFacultyViaAdmin({ id });
    setFacultyData(response?.faculty);
    reset(response?.faculty);
  };

  const onSubmit = async (data) => {
    console.log(data);
    try {
      let response;
      if (id !== undefined) {
        // call update method
        data.id = id;
        response = await UpdateFacultyViaAdmin(data);
        toast.success(`Faculty Updated...`);
      } else {
        // create
        response = await createFacultyViaAdmin(data);
        toast.success(`Faculty Created...`);
      }
      navigate("/panel-admin/faculties");
    } catch (error) {
      toast.error(`Try Again, ${error?.response?.data?.error}`);
    }
  };
  const formInputs = [
    {
      label: "Faculty Name",
      type: "text",
      name: "facultyName",
      required: true,
    },
    {
      label: "Department",
      type: "select",
      name: "department",
      required: true,
      options: allDepartments.map((dept) => ({
        id: dept._id,
        name: dept.departmentName,
      })),
    },
    {
      label: "Email",
      type: "email",
      name: "email",
      required: true,
    },
    {
      label: "Phone",
      type: "text",
      name: "phone",
      required: true,
    },
    {
      label: "Date of Birth",
      type: "date",
      name: "dateOfBirth",
      required: true,
    },
  ];
  return (
    <PanelDashboardLayout>
      <div className="card col-lg-4 mx-auto">
        <div className="card-body px-5 py-5">
          <div className="mb-3">
            <h3 className="alert alert-warning">
              {id !== undefined ? "Update" : "Create"} Faculty
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
                      pattern: {
                        value: input?.pattern,
                        message: input?.errorMessage,
                      },
                    })}
                    aria-invalid={errors[input.name] ? "true" : "false"}
                  />
                )}
                {input.type === "number" && (
                  <input
                    className="form-control p_input"
                    type="number"
                    {...register(input.name, {
                      required: input.required,
                      pattern: {
                        value: input?.pattern,
                        message: input?.errorMessage,
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
                        value: input?.pattern,
                        message: input?.errorMessage,
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
                    <option value="">Select a department</option>
                    {input.options.map((dept, idx) => (
                      <option key={idx} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                )}
                {input.type === "date" && (
                  <input
                    className="form-control p_input"
                    type="date"
                    {...register(input.name, {
                      required: input.required,
                      pattern: {
                        value: input?.pattern,
                        message: input?.errorMessage,
                      },
                    })}
                    aria-invalid={errors[input.name] ? "true" : "false"}
                  />
                )}
                {errors[input.name]?.type === "required" && (
                  <p className="text-danger">{`${input.label} is required`}</p>
                )}
                {errors[input.name]?.type === "pattern" && (
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
                    ? "Update"
                    : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default FacultyForm;
