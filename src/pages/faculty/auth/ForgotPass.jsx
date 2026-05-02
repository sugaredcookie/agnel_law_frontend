import React from "react";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import { forgotPassAPI } from "../../../utils/Api";
import { toast } from "react-toastify";
const ForgotPass = () => {
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
      const response = await forgotPassAPI(data);
      console.log(response.token);
      toast.success(
        `New Password has been sent to your email id, please check and login`,
      );
      navigate("/");
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
  ];

  return (
    <>
      <div>
        <div className="container-scroller">
          <div className="container-fluid page-body-wrapper full-page-wrapper">
            <div className="row w-100 m-0">
              <div className="content-wrapper full-page-wrapper d-flex align-items-center auth login-bg">
                <div className="card col-lg-4 mx-auto">
                  <div className="card-body px-5 py-5">
                    <h3 className="card-title text-left mb-3">
                      Forgot Password
                    </h3>
                    <p className="text-sm alert alert-warning">
                      We will send you new password on your email address, if we
                      found your account.
                    </p>
                    <form onSubmit={handleSubmit(onSubmit)}>
                      {formInputs.map((input, index) => (
                        <div className="form-group" key={index}>
                          <label>{input.label}</label>

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
                              aria-invalid={
                                errors[input.name] ? "true" : "false"
                              }
                            />
                          )}
                          {errors[input.name]?.type === "required" && (
                            <p className="text-danger">{`${input.label} is required`}</p>
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
                            : "Send New Password"}
                        </button>
                      </div>
                      <p className="sign-up text-center">
                        Back to login?
                        <NavLink to="/"> Login</NavLink>
                      </p>
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

export default ForgotPass;
