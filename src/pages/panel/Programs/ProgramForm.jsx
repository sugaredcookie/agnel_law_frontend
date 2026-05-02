/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  UpdateDepartmentViaAdmin,
  UpdateProgramViaAdmin,
  createProgramViaAdmin,
  getSingleProgramViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";
import { DepartmentContext } from "../../../DepartmentContext";
// import { StreamContext } from "../../../StreamContext";

const ProgramForm = () => {
  const [programData, setProgramData] = useState({});

  const { department } = useContext(DepartmentContext);
  // const { streams } = useContext(StreamContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm();

  // useEffect(() => {
  //   if (id) {
  //     fetchOldData();
  //   }
  // }, [0]);
  useEffect(() => {
    if (id) {
      fetchOldData();
    }
  }, [reset, id]);

  useEffect(() => {
    const savedData = localStorage.getItem("programForm");
    if (savedData) {
      reset(JSON.parse(savedData));
    }
  }, [reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem("programForm", JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const fetchOldData = async () => {
    const response = await getSingleProgramViaAdmin({ id });
    setProgramData(response?.program);
    reset(response?.program);
    // setStream(response?.program.streams || []);
    localStorage.setItem("programForm", JSON.stringify(response?.program));
  };

  const onSubmit = async (data) => {
    console.log(data);
    try {
      let response;
      // data.streams = streams;
      if (id !== undefined) {
        // call update method
        data.id = id;
        response = await UpdateProgramViaAdmin(data);
        toast.success(`Program Updated...`);
      } else {
        // create
        response = await createProgramViaAdmin(data);
        toast.success(`Program Created...`);
      }
      localStorage.removeItem("programForm");
      navigate("/panel-admin/programs");
    } catch (error) {
      toast.error(`Try Again, ${error?.response?.data?.error}`);
    }
  };
  const formInputs = [
    {
      label: "Degree Name",
      type: "text",
      name: "programName",
      required: true,
    },
    {
      label: "Degree Description",
      type: "text",
      name: "description",
      required: true,
      isEmpty: true,
    },
    {
      label: "Application Fee",
      type: "number",
      name: "applicationFee",
      required: true,
    },
    {
      label: "Development Fee",
      type: "number",
      name: "developmentFee",
      required: false,
    },
  ];
  return (
    <PanelDashboardLayout>
      <div className="card col-lg-4 mx-auto">
        <div className="card-body px-5 py-5">
          <div className="mb-3">
            <h3 className="alert alert-warning">
              {id !== undefined ? "Update" : "Create"} Program
            </h3>
            <h2 className="mx-auto">{department}</h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            {formInputs.map((input, index) => (
              <div className="form-group" key={index}>
                <label>{input.label}</label>
                {(input.type === "text" || input.type === "number") && (
                  <input
                    className="form-control p_input"
                    type={input.type}
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
            {/* <div>
              <h4>Streams:</h4>
              {id !== undefined ? (
                <div>
                  {stream.map((stream, index) => (
                    <div key={index}>
                      <h5>
                        {index + 1}) {stream.streamName}
                      </h5>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {streams.map((stream, index) => (
                    <div key={index}>
                      <h5>
                        {index + 1}) {stream.streamName}
                      </h5>
                    </div>
                  ))}
                </div>
              )}
            </div> */}
            {/* <div className="mb-3">
              <Link
                className="btn btn-primary enter-btn"
                to={`/panel-admin/stream-form${
                  id !== undefined ? `/${id}` : ""
                }`}
              >
                Add Stream
              </Link>
            </div> */}

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

export default ProgramForm;
