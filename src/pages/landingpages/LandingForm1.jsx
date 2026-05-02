import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { captureLead } from "../../utils/Api";
import Modal from "@mui/material/Modal";
import { Box } from "@mui/material";
import Cookies from "js-cookie";
const LandingForm1 = ({ open, handleClose }) => {
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm();

  // onformsubmit
  const onSubmit = async (data) => {
    const uniqueId = Cookies.get("referral");
    data.uniqueId = uniqueId;
    try {
      let response;
      response = await captureLead(data);
      if (response) {
        toast.success(
          `Thanks you your application has been submitted successfully...`,
        );
        handleClose();
      }
    } catch (error) {
      toast.error(`Try Again, ${error?.response?.data?.error}`);
    }
  };

  const formInputs = [
    {
      label: "Student Name",
      type: "text",
      name: "stuName",
      required: true,
      placeholder: "Jhony Kumar Sharma",
    },
    {
      label: "Student Phone Number",
      type: "number",
      name: "stuPhone",
      required: true,
      placeholder: "9963202021",
      pattern: /^[0-9]{10}$/,
      errorMessage: "Invalid mobile number must be 10 digit.",
    },
    {
      label: "Student Email",
      type: "email",
      name: "stuEmail",
      required: true,
      placeholder: "jhonny220@gmail.com",
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      errorMessage: "Invalid email address",
    },
    {
      label: "Competitive Entrance Exam",
      type: "text",
      name: "compExam",
      required: false,
      placeholder: "CAT/MAT",
    },
    {
      label: "Score of Entrance Exam",
      type: "text",
      name: "compScore",
      required: false,
      placeholder: "99",
    },
  ];

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div className="d-flex justify-content-between align-items-center text-dark">
            <h2>Enquiry Form</h2>
            <button onClick={handleClose} className="btn btn-danger">
              X
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="fields">
              {formInputs.map((input, index) => {
                return (
                  <div
                    className="form-group"
                    key={index}
                    style={{ marginTop: `10px` }}
                  >
                    <label>{input.label}</label>
                    <input
                      className="form-control"
                      placeholder={input?.placeholder}
                      type={input?.type}
                      {...register(input.name, {
                        required: input.required,
                        pattern: {
                          value: input?.pattern,
                          message: input?.errorMessage,
                        },
                      })}
                      aria-invalid={errors[input.name] ? "true" : "false"}
                    />

                    {errors[input.name]?.type === "required" && (
                      <p className="text-danger">{`${input.label} is required`}</p>
                    )}
                    {errors[input.name]?.type === "pattern" && (
                      <p className="text-danger">
                        {errors[input.name].message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit">
              <span className="label">
                <strong>Submit</strong>
              </span>
            </button>
          </form>
        </Box>
      </Modal>
    </>
  );
};

export default LandingForm1;
