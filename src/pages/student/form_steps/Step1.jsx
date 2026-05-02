/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  submitStep1,
  updateApplicationForm,
  getAllProgramsViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const Step1 = ({ setActiveStep, oldFormData, setFormId, updateFormData }) => {
  const [isImage, setIsImage] = useState(false);
  const [imgPath, setImgPath] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [courses, setCourses] = useState([]);

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: oldFormData,
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size cannot exceed 10MB");
        e.target.value = null;
        return;
      }
      setImagePreview(URL.createObjectURL(file));
      setValue("studentImage", e.target.files);
    }
  };

  useEffect(() => {
    if (oldFormData?.studentDetails?.studentImage) {
      setImagePreview(oldFormData.studentDetails.studentImage);
    }
  }, [oldFormData]);

  useEffect(() => {
    if (oldFormData && oldFormData?.applicationNumber) {
      if (oldFormData?.studentDetails?.studentImage) {
        setIsImage(true);
        setImgPath(oldFormData?.studentDetails?.studentImage);
      }
      reset(oldFormData);
    }
  }, [reset, oldFormData]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await getAllProgramsViaAdmin();
        setCourses(response.programs);
      } catch (error) {
        console.error("Error fetching programs:", error);
        toast.error("Failed to load programs");
      }
    };
    fetchCourses();
  }, []);

  const onSubmit = async (data) => {
    const formData = new FormData();

    // Define fields and their corresponding sections
    const fields = [
      {
        section: "studentDetails",
        inputs: [
          "firstName",
          "middleName",
          "lastName",
          "dateOfBirth",
          "bloodGroup",
          "birthPlace",
          "motherTongue",
          "casteCategory",
          "caste",
          "aadharCardNumber",
          "religion",
          "studentMobileNumber",
          "emailAddress",
          "prnNumber",
          "abcNumber",
          "grNumber",
          "capApplicationId",
          "address",
          "isNameChanged",
        ],
      },
      {
        section: "familyBackground",
        inputs: [
          "fatherName",
          "fatherEmail",
          "motherEmail",
          "fatherOccupation",
          "fatherMobileNo",
          "motherName",
          "motherOccupation",
          "motherMobileNo",
          "familyAnnualIncome",
          "isLawyerOrJudge",
        ],
      },
    ];

    // Append form data
    fields.forEach(({ section, inputs }) => {
      inputs.forEach((input) => {
        formData.append(`${section}.${input}`, data[section][input]);
      });
    });

    // Append extras
    formData.append("studentImage", data.studentImage?.[0]);
    formData.append("course", data.course);

    // Set additional form data for new submissions

    if (!data?._id) {
      formData.append("stage", 1);
      formData.append("formMode", "online");
      // formData.append("paymentStatus", false);
    } else {
      if (!(data.stage > 1)) {
        formData.append("stage", 1);
      }
      formData.append("_id", data._id);
    }

    try {
      let response = "";
      if (!data?._id) {
        response = await submitStep1(formData);
        setFormId(response.data._id); // Store the ID from new submission
      } else {
        response = await updateApplicationForm(formData);
        setFormId(data._id); // Store the ID from update
      }

      // Update the form data in parent component
      updateFormData({ ...data, course: data.course });

      toast.success(`Step 1 Completed... `);
      setActiveStep((prevStep) => prevStep + 1);
    } catch (error) {
      console.log(error);
      toast.error(`Try Again, ${error?.response?.data?.error}`);
    }
  };

  const formInputsStudents = [
    {
      label: "First Name",
      type: "text",
      name: "studentDetails.firstName",
      required: true,
      placeholder: "Amit, Sumit, Anuj...",
    },
    {
      label: "Middle Name",
      type: "text",
      name: "studentDetails.middleName",
      required: false,
      placeholder: "Kumar...",
    },
    {
      label: "Last Name",
      type: "text",
      name: "studentDetails.lastName",
      required: true,
      placeholder: "Sharma, Verma, Jain...",
    },
    {
      label: "Student Image",
      type: "file",
      name: "studentImage",
      required: true,
      accept: "image/*",
    },
    {
      label: "Date of Birth",
      type: "date",
      name: "studentDetails.dateOfBirth",
      required: true,
      placeholder: "Date of Birth",
    },
    {
      label: "Blood Group",
      type: "select",
      name: "studentDetails.bloodGroup",
      required: true,
      isEmpty: true,
      emptyOption: "Please Select Blood Group",
      options: [
        { value: "A+", label: "A+" },
        { value: "A-", label: "A-" },
        { value: "B+", label: "B+" },
        { value: "B-", label: "B-" },
        { value: "AB+", label: "AB+" },
        { value: "AB-", label: "AB-" },
        { value: "O+", label: "O+" },
        { value: "O-", label: "O-" },
      ],
      placeholder: "A+, B+, O+...",
    },
    {
      label: "Birth Place",
      type: "text",
      name: "studentDetails.birthPlace",
      required: false,
      placeholder: "Delhi, Mumbai...",
    },
    {
      label: "Mother Tongue",
      type: "text",
      name: "studentDetails.motherTongue",
      required: false,
      placeholder: "Hindi, Marathi...",
    },
    {
      label: "Caste Category",
      type: "text",
      name: "studentDetails.casteCategory",
      required: false,
    },
    {
      label: "Caste",
      type: "select",
      name: "studentDetails.caste",
      required: true,
      isEmpty: true,
      emptyOption: "Please Select Caste/Category",
      options: [
        { value: "general", label: "General" },
        { value: "obc", label: "OBC" },
        { value: "sc", label: "SC" },
        { value: "st", label: "ST" },
        { value: "other", label: "Other" },
      ],
      placeholder: "General...",
    },
    {
      label: "Aadhar Card Number",
      type: "text",
      name: "studentDetails.aadharCardNumber",
      required: true,
      pattern: /^[0-9]{12}$/,
      errorMessage: "Invalid Aadhar Card Number, must be 12 digits.",
      placeholder: "123456789012...",
    },
    {
      label: "Religion",
      type: "select",
      name: "studentDetails.religion",
      required: true,
      isEmpty: true,
      emptyOption: "Please Select Religion",
      options: [
        { value: "buddhism", label: "Buddhism" },
        { value: "christian", label: "Christian" },
        { value: "hindu", label: "Hindu" },
        { value: "islam", label: "Islam" },
        { value: "jainism", label: "Jainism" },
        { value: "sikhism", label: "Sikhism" },
        { value: "other", label: "Other" },
      ],
      placeholder: "Hindi, Islam/Muslim ...",
    },
    {
      label: "Student Mobile No",
      type: "text",
      name: "studentDetails.studentMobileNumber",
      required: true,
      pattern: /^[0-9]{10}$/,
      errorMessage: "Invalid mobile number, must be 10 digits.",
      placeholder: "9639639632...",
    },
    {
      label: "Student Email ID",
      type: "email",
      name: "studentDetails.emailAddress",
      required: true,
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      errorMessage: "Invalid email address",
      placeholder: "amitji@email.com...",
    },
    {
      label: "PRN No",
      type: "text",
      name: "studentDetails.prnNumber",
      required: true,
      placeholder: "1234567890...",
    },
    {
      label: "ABC No",
      type: "text",
      name: "studentDetails.abcNumber",
      required: true,
      placeholder: "1234567890...",
    },
    {
      label: "GR No",
      type: "text",
      name: "studentDetails.grNumber",
      required: false,
      placeholder: "1234567890...",
    },
    {
      label: "CAP Application ID",
      type: "text",
      name: "studentDetails.capApplicationId",
      required: true,
      placeholder: "L123456789",
    },
    {
      label: "Address",
      type: "text",
      name: "studentDetails.address",
      required: false,
      placeholder: "123, Street Name, City, State, Pincode...",
    },
    {
      label: "Name Changed",
      type: "checkbox",
      name: "studentDetails.isNameChanged",
      required: false,
    },
  ];

  const formInputsFamilyBackground = [
    {
      label: "Father's Full Name",
      type: "text",
      name: "familyBackground.fatherName",
      required: true,
      placeholder: "Mr. Ram Sharma...",
    },
    {
      label: "Mother's Full Name",
      type: "text",
      name: "familyBackground.motherName",
      required: true,
      placeholder: "Mr. Sita Sharma...",
    },
    {
      label: "Father's email",
      type: "email",
      name: "familyBackground.fatherEmail",
      required: false,
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      errorMessage: "Invalid email address",
      placeholder: "example@gmail.com",
    },
    {
      label: "Mother's email",
      type: "email",
      name: "familyBackground.motherEmail",
      required: false,
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      errorMessage: "Invalid email address",
      placeholder: "example@gmail.com",
    },
    {
      label: "Father's Mobile Number",
      type: "text",
      name: "familyBackground.fatherMobileNo",
      required: true,
      pattern: /^[0-9]{10}$/,
      errorMessage: "Invalid mobile number, must be 10 digits.",
      placeholder: "9639639632...",
    },
    {
      label: "Mother's Mobile Number",
      type: "text",
      name: "familyBackground.motherMobileNo",
      required: true,
      pattern: /^[0-9]{10}$/,
      errorMessage: "Invalid mobile number, must be 10 digits.",
      placeholder: "9639639632...",
    },
    {
      label: "Father's Occupation",
      type: "text",
      name: "familyBackground.fatherOccupation",
      required: true,
      placeholder: "Doctor, Master, Engineer...",
    },
    {
      label: "Mother's Occupation",
      type: "text",
      name: "familyBackground.motherOccupation",
      required: true,
      placeholder: "Doctor, Master, Engineer...",
    },
    {
      label: "Family Annual Income",
      type: "select",
      name: "familyBackground.familyAnnualIncome",
      required: true,
      isEmpty: true,
      emptyOption: "Please Select Annual Income",
      options: [
        { value: "lessThan1L", label: "Below 2 Lakh" },
        { value: "1Lto5L", label: "2 Lakh to 5 Lakh" },
        { value: "5Lto10L", label: "5 Lakh to 10 Lakh" },
        { value: "10Lto20L", label: "10 Lakh to 20 Lakh" },
        { value: "20Lto50L", label: "20 Lakh to 50 Lakh" },
        { value: "50Lto1Cr", label: "50 Lakh to 1 Crore" },
        { value: "moreThan1Cr", label: "More than 1 Crore" },
      ],
    },
    {
      label: "Is there any Lawyers/Judge in your family",
      type: "select",
      name: "familyBackground.isLawyerOrJudge",
      required: true,
      isEmpty: true,
      emptyOption: "Please Select",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h4 className=" my-3 text-light-black">&larr; Select Course &rarr;</h4>
      <div className="form-group">
        <label>
          Please Selection Course
          <span className="text-danger">*</span>
        </label>
        <select
          className="form-control p_input"
          {...register("course", {
            required: true,
          })}
          aria-invalid={errors?.course ? "true" : "false"}
        >
          <option value="">Please Select Application Form</option>
          {courses.map((course) => (
            <option key={course._id} value={course.programName}>
              {course.programName}
            </option>
          ))}
        </select>
        {errors.course?.type === "required" && (
          <p className="text-danger">{`Course Name is required`}</p>
        )}
      </div>

      <h4 className="text-light-black my-3">&larr; Student Details &rarr;</h4>
      {formInputsStudents.map((input, index) => (
        <div className="form-group" key={index}>
          <label>
            {input.label}{" "}
            <span className="text-danger">{input.required ? "*" : ""}</span>
          </label>
          {input.type === "text" && (
            <input
              className="form-control p_input"
              placeholder={input?.placeholder}
              type="text"
              {...register(input.name, {
                required: input.required,
                pattern: input.pattern && {
                  value: input.pattern,
                  message: input.errorMessage,
                },
              })}
              aria-invalid={
                errors?.studentDetails?.[input.name.split(".").pop()]
                  ? "true"
                  : "false"
              }
            />
          )}
          {input.type === "date" && (
            <input
              className="form-control p_input"
              type="date"
              placeholder={input?.placeholder}
              {...register(input.name, {
                required: input.required,
              })}
              aria-invalid={
                errors?.studentDetails?.[input.name.split(".").pop()]
                  ? "true"
                  : "false"
              }
            />
          )}
          {input.type === "select" && (
            <select
              className="form-control p_input"
              {...register(input.name, {
                required: input.required,
              })}
              aria-invalid={
                errors?.studentDetails?.[input.name.split(".").pop()]
                  ? "true"
                  : "false"
              }
            >
              {input?.isEmpty && <option value="">{input?.emptyOption}</option>}
              {input.options.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {input.type === "email" && (
            <input
              className="form-control p_input"
              placeholder={input?.placeholder}
              type="email"
              {...register(input.name, {
                required: input.required,
                pattern: input.pattern && {
                  value: input.pattern,
                  message: input.errorMessage,
                },
              })}
              aria-invalid={
                errors?.studentDetails?.[input.name.split(".").pop()]
                  ? "true"
                  : "false"
              }
            />
          )}
          {input.type === "file" && (
            <div>
              <input
                className="form-control p_input"
                placeholder={input?.placeholder}
                type="file"
                accept={input.accept}
                {...register(input.name, {
                  required: input.required && !imagePreview, // Make it required only if no image preview is available
                })}
                onChange={handleImageChange}
                aria-invalid={errors?.studentDetails?.image ? "true" : "false"}
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" width="100" />
                </div>
              )}
              {errors?.studentDetails?.image?.type === "required" && (
                <p className="text-danger">Image is required</p>
              )}
            </div>
          )}
          {input.type === "checkbox" && (
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                {...register(input.name)}
                id={input.name}
              />
              <label className="form-check-label" htmlFor={input.name}>
                {input.label}
              </label>
            </div>
          )}

          {errors[input.name]?.type === "required" && (
            <p className="text-danger">{`${input.label} is required`}</p>
          )}
          {errors[input.name]?.type === "pattern" && (
            <p className="text-danger">{errors[input.name].message}</p>
          )}

          {errors?.studentDetails?.[input.name.split(".").pop()]?.type ===
            "required" && (
            <p className="text-danger">{`${input.label} is required`}</p>
          )}
          {errors?.studentDetails?.[input.name.split(".").pop()]?.type ===
            "pattern" && (
            <p className="text-danger">
              {errors?.studentDetails?.[input.name.split(".").pop()]?.message}
            </p>
          )}
        </div>
      ))}

      <h4 className="my-3 text-light-black">&larr; Family Background &rarr;</h4>
      {formInputsFamilyBackground.map((input, index) => (
        <div className="form-group" key={index}>
          <label>
            {input.label}{" "}
            <span className="text-danger">{input.required ? "*" : ""}</span>
          </label>
          {input.type === "text" && (
            <input
              className="form-control p_input"
              placeholder={input?.placeholder}
              type="text"
              {...register(input.name, {
                required: input.required,
                pattern: input.pattern && {
                  value: input.pattern,
                  message: input.errorMessage,
                },
              })}
              aria-invalid={
                errors?.familyBackground?.[input.name.split(".").pop()]
                  ? "true"
                  : "false"
              }
            />
          )}
          {input.type === "select" && (
            <select
              className="form-control p_input"
              {...register(input.name, {
                required: input.required,
              })}
              aria-invalid={
                errors?.familyBackground?.[input.name.split(".").pop()]
                  ? "true"
                  : "false"
              }
            >
              {input?.isEmpty && <option value="">{input?.emptyOption}</option>}
              {input.options.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {input.type === "email" && (
            <input
              className="form-control p_input"
              placeholder={input?.placeholder}
              type="email"
              {...register(input.name, {
                required: input.required,
                pattern: input.pattern && {
                  value: input.pattern,
                  message: input.errorMessage,
                },
              })}
              aria-invalid={
                errors?.familyBackground?.[input.name.split(".").pop()]
                  ? "true"
                  : "false"
              }
            />
          )}

          {errors?.familyBackground?.[input.name.split(".").pop()]?.type ===
            "required" && (
            <p className="text-danger">{`${input.label} is required`}</p>
          )}
          {errors?.familyBackground?.[input.name.split(".").pop()]?.type ===
            "pattern" && (
            <p className="text-danger">
              {errors?.familyBackground?.[input.name.split(".").pop()]?.message}
            </p>
          )}
        </div>
      ))}

      <div className="text-center">
        <button
          type="submit"
          className="btn btn-primary btn-block enter-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Please wait..." : "Next"}
        </button>
      </div>
    </form>
  );
};

export default Step1;
