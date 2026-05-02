import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import {
  UpdateDepartmentViaAdmin,
  UpdateLinkViaAdmin,
  createDepartmentViaAdmin,
  createLeadCaptureLinkViaAdmin,
  getSingleDepartmentViaAdmin,
  getSingleLinkViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";
import PanelDashboardLayout from "../PanelDashboardLayout";

const DepartmentForm = () => {
  const [departmentData, setDepartmentData] = useState({});

  const navigate = useNavigate();
  const { id } = useParams();

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm();

  useEffect(() => {
    if (id) {
      fetchOldData();
    }
  }, [reset, id]);

  const fetchOldData = async () => {
    const response = await getSingleDepartmentViaAdmin({ id });
    setDepartmentData(response?.department);
    reset(response?.department);
  };

  const onSubmit = async (data) => {
    console.log(data);
    try {
      let response;
      if (id !== undefined) {
        data.id = id;
        response = await UpdateDepartmentViaAdmin(data);
        toast.success(`Department Updated...`);
      } else {
        // create
        response = await createDepartmentViaAdmin(data);
        toast.success(`Department Created...`);
      }
      navigate("/panel-admin/departments");
    } catch (error) {
      toast.error(`Try Again, ${error?.response?.data?.error}`);
    }
  };

  const formInputs = [
    {
      label: "Department Name",
      type: "text",
      name: "departmentName",
      required: true,
    },
    {
      label: "Description",
      type: "text",
      name: "description",
      required: true,
      isEmpty: true,
    },
  ];

  return (
    <>
      <PanelDashboardLayout>
        <div className="card col-lg-4 mx-auto">
          <div className="card-body px-5 py-5">
            <h3 className=" mb-5 alert alert-warning">
              {id != undefined ? "Update" : "Create"} Department
            </h3>
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
                  className="btn btn-primary btn-block enter-btn"
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
    </>
  );
};

export default DepartmentForm;
