import React from "react";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import { registerAPI } from "../../../utils/Api";
import { toast } from "react-toastify";

const Register = () => {
  const navigate = useNavigate();
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm();

  // onformsubmit
  const onSubmit = async (data) => {
    try {
      const response = await registerAPI(data);
      toast.success(`${response.message}`);
      navigate("/");
    } catch (error) {
      toast.error(`Try Again, ${error?.response?.data?.error}`);
    }
  };

  const formInputs = [
    {
      label: "First Name",
      type: "text",
      name: "firstName",
      required: true,
    },
    {
      label: "Middle Name",
      type: "text",
      name: "middleName",
    },
    {
      label: "Last Name",
      type: "text",
      name: "lastName",
      required: true,
    },
    {
      label: "Date of Birth",
      type: "date",
      name: "dateOfBirth",
      required: true,
    },
    {
      label: "Gender",
      type: "select",
      name: "gender",
      required: true,
      isEmpty: true,
      emptyOption: "Please Select Gender",
      options: [
        {
          male: "Male",
        },
        {
          female: "Female",
        },
        {
          others: "Others",
        },
      ],
    },
    {
      label: "Email",
      type: "email",
      name: "email",
      required: true,
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      errorMessage: "Invalid email address",
    },
    {
      label: "Mobile",
      type: "text",
      name: "mobile",
      required: true,
      pattern: /^[0-9]{10}$/,
      errorMessage: "Invalid mobile number must be 10 digit.",
    },
  ];

  return (
    <>
      <Header />
      <div>
        <div className="container-scroller">
          <div className="container-fluid page-body-wrapper full-page-wrapper">
            <div className="row w-100 m-0">
              <div
                className="content-wrapper full-page-wrapper flex flex-col md:flex-row align-items-center auth login-bg"
                style={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "1rem",
                }}
              >
                {/* Dark overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    zIndex: 1,
                  }}
                ></div>

                {/* Left side content */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    color: "white",
                    width: "100%",
                    marginRight: "0",
                    marginBottom: "2rem",
                  }}
                  className="md:w-3/5 md:mr-8 md:mb-0"
                >
                  <h1 className="text-2xl md:text-3xl lg:text-4xl">
                    NEW USER <br />
                    <span className="text-blue-500">REGISTRATION</span>
                  </h1>
                  <p className="text-sm md:text-base">
                    Begin your academic journey with us
                  </p>

                  {/* Information Box */}
                  <div
                    style={{
                      backgroundColor: "rgba(30, 58, 138, 0.6)",
                      backdropFilter: "blur(10px)",
                      padding: "1rem",
                      borderRadius: "8px",
                      marginTop: "1.5rem",
                      width: "100%",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                    className="md:p-6"
                  >
                    <h3
                      style={{
                        borderBottom: "2px solid rgba(255, 255, 255, 0.3)",
                        paddingBottom: "0.5rem",
                        marginBottom: "1rem",
                      }}
                      className="text-lg md:text-xl"
                    >
                      Registration Guide
                    </h3>
                    <ul
                      style={{ listStyle: "none", padding: 0 }}
                      className="text-sm md:text-base"
                    >
                      <li style={{ marginBottom: "0.8rem" }}>
                        • Fill in all required personal details accurately
                      </li>
                      <li style={{ marginBottom: "0.8rem" }}>
                        • Ensure your email address is valid for communication
                      </li>
                      <li style={{ marginBottom: "0.8rem" }}>
                        • Keep your registration details safe for future
                        reference
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Registration form */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                  }}
                  className="md:w-2/5"
                >
                  <div className="px-3 py-4 md:px-5 md:py-5">
                    <h3 className="text-left mb-3 md:mb-4 text-white font-bold text-xl md:text-2xl">
                      Register
                    </h3>
                    <form onSubmit={handleSubmit(onSubmit)}>
                      {formInputs.map((input, index) => (
                        <div className="form-group mb-3" key={index}>
                          {input.type === "select" ? (
                            <select
                              className="form-control p_input w-full"
                              {...register(input.name, {
                                required: input.required,
                              })}
                              style={{
                                background: "rgba(255, 255, 255, 0.1)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                color: "white",
                                padding: "0.75rem",
                                borderRadius: "4px",
                              }}
                            >
                              {input?.isEmpty && (
                                <option value="">{input?.emptyOption}</option>
                              )}
                              {input.options.map((option, index) => {
                                const [key, value] = Object.entries(option)[0];
                                return (
                                  <option key={index} value={key}>
                                    {value}
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <input
                              className="form-control p_input w-full"
                              type={input.type}
                              placeholder={input.label}
                              {...register(input.name, {
                                required: input.required,
                                pattern: input.pattern && {
                                  value: input.pattern,
                                  message: input.errorMessage,
                                },
                              })}
                              style={{
                                background: "rgba(255, 255, 255, 0.1)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                color: "white",
                                padding: "0.75rem",
                                borderRadius: "4px",
                              }}
                            />
                          )}
                          {errors[input.name]?.type === "required" && (
                            <p className="text-red-500 mt-1 text-sm">{`${input.label} is required`}</p>
                          )}
                          {errors[input.name]?.type === "pattern" && (
                            <p className="text-red-500 mt-1 text-sm">
                              {errors[input.name].message}
                            </p>
                          )}
                        </div>
                      ))}
                      <div className="text-center mt-4">
                        <button
                          type="submit"
                          className="btn btn-primary btn-block enter-btn w-full"
                          disabled={isSubmitting}
                          style={{
                            background: "rgba(59, 130, 246, 0.8)",
                            border: "none",
                            padding: "0.75rem",
                          }}
                        >
                          {isSubmitting ? "Please wait..." : "Register"}
                        </button>
                      </div>
                      <div className="mt-4 text-center text-white text-sm md:text-base">
                        <p className="sign-up">
                          Already have an Account?
                          <NavLink to="/" className="text-blue-300">
                            {" "}
                            Login
                          </NavLink>
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Add Header component with responsive styling
const Header = () => {
  return (
    <div className="flex items-center justify-between bg-gray-800 py-2 px-4">
      <div className="flex flex-col md:flex-row items-center justify-between w-full md:w-[90%] mx-auto">
        <img
          src="/agnel-logo.png"
          alt="logo"
          className="h-12 md:h-16 mb-2 md:mb-0"
        />
        <div className="text-center md:text-right text-white text-xs md:text-sm">
          <span className="font-bold block">Bhagubai Changu Thakur College of Law</span>
          <span className="block md:ml-1">
            Plot No.04, Sector-11, Khanda Colony, New Panvel (W), Raigad, Maharashtra, Pin-410206.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
