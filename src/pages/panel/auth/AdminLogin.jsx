import React from "react";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import { loginAPI, clearAuthTokens } from "../../../utils/Api";
import { toast } from "react-toastify";

const AdminLogin = () => {
  const navigate = useNavigate();

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm();

  // onformsubmit
  const onSubmit = async (data) => {
    console.log(data);
    try {
      const response = await loginAPI(data);
      console.log(response);
      toast.success(`${response.message}`);

      clearAuthTokens();

      if (response?.isAdmin) {
        localStorage.setItem("isAdmin", response?.isAdmin);
        localStorage.setItem("adminToken", response?.token);
        navigate("/panel-admin/dashboard");
      } else {
        toast.error("You are not authorized to access this page");
      }
    } catch (error) {
      toast.error(`Try Again, ${error?.response?.data?.message}`);
    }
  };

  const formInputs = [
    {
      label: "Email",
      type: "email",
      name: "email",
      required: true,
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      errorMessage: "Invalid email address",
    },
    {
      label: "Password",
      type: "password",
      name: "password",
      required: true,
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
                  className="md:w-3/5 lg:w-2/3 md:mr-8 md:mb-0"
                >
                  <h1 className="text-2xl md:text-3xl lg:text-4xl">
                    ADMIN <br />
                    <span className="text-blue-500">LOGIN PORTAL</span>
                  </h1>
                  <p className="text-sm md:text-base">
                    Welcome back to your academic journey
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
                      Important Information
                    </h3>
                    <ul
                      style={{ listStyle: "none", padding: 0 }}
                      className="text-sm md:text-base"
                    >
                      <li style={{ marginBottom: "0.8rem" }}>
                        • To all students of LL.B. Three Years Degree Course and
                        B.A.LL.B. Five Years Degree Course
                      </li>
                      <li style={{ marginBottom: "0.8rem" }}>
                        • This is to inform you that the admission process will
                        commence from July 7th, 2025, to July 17th, 2025. During
                        this period, kindly submit the admission form along with
                        the requisite fees.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Login form */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                  }}
                  className="md:w-2/5 lg:w-1/3"
                >
                  <div className="px-3 py-4 md:px-5 md:py-5">
                    <h3 className="text-left mb-3 md:mb-4 text-white font-bold text-xl md:text-2xl">
                      Admin Login
                    </h3>
                    <form onSubmit={handleSubmit(onSubmit)}>
                      {formInputs.map((input, index) => (
                        <div className="form-group mb-3" key={index}>
                          <input
                            className="form-control p_input w-full"
                            type={input.type}
                            placeholder={input.label}
                            {...register(input.name, {
                              required: input.required,
                              pattern: {
                                value: input?.pattern,
                                message: input?.errorMessage,
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
                          {errors[input.name]?.type === "required" && (
                            <p className="text-red-500 mt-1 text-sm">{`${input.label} is required`}</p>
                          )}
                        </div>
                      ))}
                      <div className="form-group d-flex align-items-center justify-content-between">
                        <NavLink
                          to="/forgot-pass"
                          className="text-white text-sm md:text-base"
                        >
                          Forgot password
                        </NavLink>
                      </div>
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
                          {isSubmitting ? "Please wait..." : "Login"}
                        </button>
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
          <span className="font-bold block md:inline">Bhagubai Changu Thakur College of Law</span>
          <span className="block md:inline md:ml-1">
            Plot No.04, Sector-11, Khanda Colony, New Panvel (W), Raigad, Maharashtra, Pin-410206.
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
