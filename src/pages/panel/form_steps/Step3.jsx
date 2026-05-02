import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { updateApplicationFormForAdmin } from "../../../utils/Api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Step3 = ({ setActiveStep, oldFormData, updateFormData }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false); // Add this state for loader

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: oldFormData,
  });

  const [filePreviews, setFilePreviews] = useState({});
  const [acceptedUndertaking, setAcceptedUndertaking] = useState(false);

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size cannot exceed 10MB");
        e.target.value = null;
        return;
      }
      setFilePreviews((prev) => ({
        ...prev,
        [field.name]: file.type.startsWith("image")
          ? URL.createObjectURL(file)
          : file.name,
      }));
      field.onChange(file);
    }
  };

  useEffect(() => {
    if (oldFormData?.certificates) {
      const previews = {};
      oldFormData.certificates.forEach((cert) => {
        previews[`certificates.${cert.type}`] = cert.fileUrl;
      });
      setFilePreviews(previews);
      reset(oldFormData);
    }
  }, [reset, oldFormData]);

  useEffect(() => {
    if (oldFormData?.certificates) {
      reset(oldFormData);
    }
  }, [oldFormData, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true); // Set loading state to true when submission starts
    console.log(data);
    const formData = new FormData();

    if (data.certificates) {
      let index = 0;
      Object.entries(data.certificates).forEach(([key, value]) => {
        if (value !== undefined && !value?.fileUrl) {
          formData.append("certificates", value); // Append only the file
          formData.append(`certificateNames[${index}]`, key); // Append only the name
          index++;
        }
      });
    }

    if (!(data.stage > 3)) {
      formData.append("stage", 3);
    }
    formData.append("_id", data._id);
    formData.append("formStatusFromAdmin", "Completed By Student");

    try {
      const response = await updateApplicationFormForAdmin(formData);
      console.log(response);
      toast.success(`Step 3 Completed... `);
      navigate("/panel-admin/forms");
    } catch (error) {
      console.log(error);
      toast.error(`Try Again, ${error?.response?.data?.error}`);
    } finally {
      setIsSubmitting(false); // Set loading state to false regardless of success/failure
    }
  };

  // Helper function to check if course is LLB/LLM/BA LLB
  const isGraduate = (courseName) => {
    const courseNameLower = courseName?.toLowerCase();
    return courseNameLower === "llb" || courseNameLower === "llm";
  };

  const isBaLlb = (courseName) => {
    const courseNameLower = courseName?.toLowerCase();
    return courseNameLower === "ba llb";
  };

  const isChristian = (religion) => {
    return religion?.toLowerCase() === "christian";
  };

  const isGeneral = (category) => {
    return category?.toLowerCase() === "general";
  };

  const isObc = (category) => {
    return category?.toLowerCase() === "obc";
  };

  const isLlb = (courseName) => {
    const courseNameLower = courseName?.toLowerCase();
    return courseNameLower === "llb";
  };

  const isLLM = (courseName) => {
    const courseNameLower = courseName?.toLowerCase();
    return courseNameLower === "llm";
  };

  const certificateInputs = [
    {
      label: "Candidate Signature",
      name: "candidateSignature",
      required: true,
      accept: "image/*",
    },
    ...(!isLLM(oldFormData?.course)
      ? [
          {
            label: "12th (HSC) Marksheet",
            name: "hscMarksheet",
            required: true,
          },
          {
            label: "12th (HSC) Passing Certificate",
            name: "hscCertificate",
            required: true,
          },
        ]
      : []),
    // Conditionally add 12th hall ticket for BA LLB
    ...(isBaLlb(oldFormData?.course)
      ? [
          {
            label: "12th Hall Ticket",
            name: "hscHallTicket",
            required: true,
          },
        ]
      : []),
    // Conditionally add graduation certificate for LLB
    ...(isLlb(oldFormData?.course)
      ? [
          {
            label: "Graduation Degree Certificate",
            name: "graduationCertificate",
            required: true,
          },
        ]
      : []),
    ...(!isLLM(oldFormData?.course)
      ? [
          {
            label: "10th (SSC) Marksheet",
            name: "sscMarksheet",
            required: true,
          },
          {
            label: "Migration Certificate / Verification Report / L.C. / T.C.",
            name: "transferCertificate",
          },
          {
            label: "Domicile Certificate(If OMS)",
            name: "domicileCertificate",
          },
          {
            label: "Birth Certificate",
            name: "birthCertificate",
            required: true,
          },
        ]
      : []),
    { label: "Aadhar Card", name: "aadharCard", required: true },
    { label: "CET Exam Score Card", name: "cetScoreCard" },
    { label: "CET Exam Hall Ticket", name: "cetHallTicket", required: true },
    ...(!isLLM(oldFormData?.course)
      ? [
          {
            label: "Provisional Allotment Letter",
            name: "provisionalAllotmentLetter",
            required: true,
          },
        ]
      : []),
    {
      label: "Candidate Photo",
      name: "candidatePhoto",
      required: true,
      accept: "image/*",
    },
    ...(!isLLM(oldFormData?.course)
      ? [
          { label: "XI Marksheet", name: "xiMarksheet" },
          { label: "University Form", name: "universityForm", required: true },
        ]
      : []),
    // Conditionally add graduation marksheet for LLB/LLM courses
    ...(isGraduate(oldFormData?.course)
      ? [
          {
            label: "Graduation Marksheet(All year/sem combined pdf)",
            name: "graduationMarksheet",
            required: true,
          },
        ]
      : []),
    ...(!isLLM(oldFormData?.course)
      ? [{ label: "Gap Certificate", name: "gapCertificate" }]
      : []),
    { label: "Marriage Certificate", name: "marriageCertificate" },
    { label: "EWS Certificate", name: "ewsCertificate" },
    // Conditionally add caste certificate for non General category
    ...(isGeneral(oldFormData?.studentDetails.caste)
      ? []
      : [
          {
            label: "Caste Certificate",
            name: "casteCertificate",
            required: true,
          },
        ]),
    // Conditionally add non-creamy layer certificate for OBC
    ...(isObc(oldFormData?.studentDetails.caste)
      ? [
          {
            label: "Non-Creamy Layer Certificate(only for OBC)",
            name: "nonCreamyLayerCertificate",
          },
        ]
      : []),
    // Conditionally add baptism certificate for Christians
    ...(isChristian(oldFormData?.studentDetails.religion)
      ? [
          {
            label: "Baptism Certificate(only for Christian minority)",
            name: "baptismCertificate",
            required: true,
          },
        ]
      : []),
    // Conditionally add gazette copy if name changed
    ...(oldFormData?.studentDetails?.isNameChanged
      ? [
          {
            label: "Gazette Copy (Name Change Document)",
            name: "gazetteCopy",
            required: true,
          },
        ]
      : []),
  ];

  const undertakingPoints = [
    "I promise that I will inform the college immediately in writing in case I decided to discontinue my studies or change the college in the middle of the academic year.",
    "I understand that my admission is subject to my production of the transfer certificate issued under the signature of the Principal of the College / School Last attended.",
    "I am aware that my admission to the course applied is provisional until my original documents are verified by my earlier Board/University and subsequent confirmation of my eligibility/ enrollment by the University of Mumbai. If my eligibility /enrollment is denied under any circumstance, I will abide by the decision of the ASL/University of Mumbai/DHE/CET CELL.",
    "I am aware of the rules regarding attendance in the college and will not indulge in any unfair means while appearing in the examination. I am aware that my mobile phone or any other gadgets will be confiscated by the college authorities and proceed as per the rules of the University.",
    "I undertake that all the information provided in the application forms is correct to the best of my knowledge. If any information is found to be wrong, I agree to abide by the College/University rules.• I hereby undertake to abide by the rules and regulations made by the College authorities from time to time in regard to the conduct of students both in and outside the College and I also undertake to submit to the normal enforcement of the same to the satisfaction of the management whose decision in all matters will be final.",
    "I further declare that I am not enrolled for any other academic or professional course of any other University or Board/ Institution other than the add-on course as mentioned under the Bar Council of India rules.",
    "I agree to attend the classes regularly and secure minimum 75% attendance for each subject, failing which the institution will not allow me to appear for the examination if I am admitted to the course.",
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h4 className="text-light-black my-3">
        &larr; Certificates Upload &rarr;
      </h4>
      {certificateInputs.map((input, index) => (
        <div className="form-group" key={index}>
          <label>
            {input.label}{" "}
            <span className="text-danger">{input.required ? "*" : ""}</span>
          </label>
          <Controller
            control={control}
            name={`certificates.${input.name}`}
            render={({ field }) => (
              <>
                <input
                  type="file"
                  className="form-control p_input"
                  onChange={(e) => handleFileChange(e, field)}
                  accept={input.accept}
                />
                {filePreviews[`certificates.${input.name}`] && (
                  <div className="mt-2">
                    {filePreviews[`certificates.${input.name}`].endsWith(
                      ".pdf",
                    ) ? (
                      <a
                        href={filePreviews[`certificates.${input.name}`]}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {filePreviews[`certificates.${input.name}`]}
                      </a>
                    ) : (
                      <img
                        src={filePreviews[`certificates.${input.name}`]}
                        alt="Preview"
                        width="100"
                      />
                    )}
                  </div>
                )}
                {errors?.certificates?.[input.name] && (
                  <p className="text-danger">{`${input.label} is required`}</p>
                )}
              </>
            )}
          />
        </div>
      ))}

      {/* Undertaking Section */}
      <div className="my-4">
        <h4 className="text-light-black mb-3">Undertaking</h4>
        <div className="card p-3">
          {undertakingPoints.map((point, index) => (
            <p key={index} className="mb-2">
              {index + 1}. {point}
            </p>
          ))}
          <div className="form-check mt-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="acceptUndertaking"
              checked={acceptedUndertaking}
              onChange={(e) => setAcceptedUndertaking(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="acceptUndertaking">
              I have read and accept all the above points
            </label>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="text-center">
          <button
            className="btn btn-light btn-block enter-btn"
            onClick={() => setActiveStep((prevStep) => prevStep - 1)}
            type="button"
            disabled={isSubmitting} // Disable the previous button during submission
          >
            Previous
          </button>
        </div>
        <div className="text-center">
          <button
            type="submit"
            className="btn btn-primary btn-block enter-btn"
            disabled={isSubmitting || !acceptedUndertaking}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Please wait...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default Step3;
