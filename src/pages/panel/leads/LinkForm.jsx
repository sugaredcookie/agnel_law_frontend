import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import {
  UpdateLinkViaAdmin,
  createLeadCaptureLinkViaAdmin,
  getSingleLinkViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";
import PanelDashboardLayout from "../PanelDashboardLayout";

const LinkForm = () => {
  const [linkData, setLinkData] = useState({});

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
    const response = await getSingleLinkViaAdmin({ id });
    setLinkData(response?.link);
    reset(response?.link);
  };

  // onformsubmit
  const onSubmit = async (data) => {
    console.log(data);
    try {
      let response;
      if (id !== undefined) {
        // call update method
        data.id = id;
        response = await UpdateLinkViaAdmin(data);
        toast.success(`Link Updated...`);
      } else {
        // create
        response = await createLeadCaptureLinkViaAdmin(data);
        toast.success(`Link Generated...`);
      }

      navigate("/panel-admin/leads");
    } catch (error) {
      toast.error(`Try Again, ${error?.response?.data?.error}`);
    }
  };

  const formInputs = [
    {
      label: "Agent Name / Link Name",
      type: "text",
      name: "agentName",
      required: true,
    },
    {
      label: "Select Landing Page",
      type: "select",
      name: "landingPage",
      required: true,
      isEmpty: true,
      emptyOption: "Please Select Page",
      options: [
        {
          1: "Landing Page 1",
        },
      ],
    },
    {
      label: "Purpose of this Link",
      type: "text",
      name: "purpose",
      required: false,
    },
  ];

  return (
    <>
      <PanelDashboardLayout>
        <div className="card col-lg-4 mx-auto">
          <div className="card-body px-5 py-5">
            <h3 className=" mb-5 alert alert-warning">
              {" "}
              {id !== undefined ? "Update" : "Create"} Link
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
                  {input.type === "select" && (
                    <select
                      className="form-control p_input"
                      {...register(input.name, {
                        required: input.required,
                      })}
                      aria-invalid={errors[input.name] ? "true" : "false"}
                    >
                      {input?.isEmpty && <option>{input?.emptyOption}</option>}
                      {input.options.map((option, index) => {
                        const [key, value] = Object.entries(option)[0];
                        return (
                          <option key={index} value={key}>
                            {value}
                          </option>
                        );
                      })}
                    </select>
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

export default LinkForm;
