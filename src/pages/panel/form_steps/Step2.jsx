import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { updateApplicationFormForAdmin } from "../../../utils/Api";
import { toast } from "react-toastify";

const Step2 = ({ setActiveStep, oldFormData, updateFormData }) => {
  const [tenthPercentage, setTenthPercentage] = useState(0);
  const [twelfthPercentage, setTwelfthPercentage] = useState(0);

  const {
    register,
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: oldFormData || {},
  });

  useEffect(() => {
    if (oldFormData) {
      reset(oldFormData);
      // Initialize percentages if they exist in oldFormData
      if (oldFormData.academicQualifications?.tenth) {
        const tenth = oldFormData.academicQualifications.tenth;
        if (tenth.obtainedMarks && tenth.maximumMarks) {
          const percentage = (tenth.obtainedMarks / tenth.maximumMarks) * 100;
          setTenthPercentage(percentage.toFixed(2));
        }
      }
      if (oldFormData.academicQualifications?.twelfth) {
        const twelfth = oldFormData.academicQualifications.twelfth;
        if (twelfth.obtainedMarks && twelfth.maximumMarks) {
          const percentage =
            (twelfth.obtainedMarks / twelfth.maximumMarks) * 100;
          setTwelfthPercentage(percentage.toFixed(2));
        }
      }
    }
  }, [oldFormData, reset]);
  console.log("Step 2 oldFormData", oldFormData);
  const { fields, append, remove } = useFieldArray({
    control,
    name: "competitiveExamScore",
  });

  useEffect(() => {
    const tenthWatcher = watch([
      "academicQualifications.tenth.obtainedMarks",
      "academicQualifications.tenth.maximumMarks",
    ]);

    if (tenthWatcher[0] && tenthWatcher[1]) {
      const percentage = (tenthWatcher[0] / tenthWatcher[1]) * 100;
      setTenthPercentage(percentage.toFixed(2));
      setValue("academicQualifications.tenth.percentage", percentage);
    }
  }, [
    watch("academicQualifications.tenth.obtainedMarks"),
    watch("academicQualifications.tenth.maximumMarks"),
  ]);

  useEffect(() => {
    const twelfthWatcher = watch([
      "academicQualifications.twelfth.obtainedMarks",
      "academicQualifications.twelfth.maximumMarks",
    ]);

    if (twelfthWatcher[0] && twelfthWatcher[1]) {
      const percentage = (twelfthWatcher[0] / twelfthWatcher[1]) * 100;
      setTwelfthPercentage(percentage.toFixed(2));
      setValue("academicQualifications.twelfth.percentage", percentage);
    }
  }, [
    watch("academicQualifications.twelfth.obtainedMarks"),
    watch("academicQualifications.twelfth.maximumMarks"),
  ]);

  const onSubmit = async (data) => {
    console.log("Step 2 Form Data:", data);
    console.log("Step 2 Old Form Data:", oldFormData);

    const formData = new FormData();

    // Get application ID from oldFormData
    const applicationId = oldFormData?._id;
    console.log("Application ID in Step 2:", applicationId);

    if (!applicationId) {
      console.error("No application ID found");
      toast.error("Application ID is missing");
      return;
    }

    // Add application ID to formData
    formData.append("_id", applicationId);

    // Define fields and their corresponding sections
    const fields = [
      {
        section: "academicQualifications.tenth",
        inputs: [
          "institution",
          "percentage",
          "yearOfPassing",
          "obtainedMarks",
          "maximumMarks",
        ],
      },
      {
        section: "academicQualifications.twelfth",
        inputs: [
          "institution",
          "percentage",
          "yearOfPassing",
          "obtainedMarks",
          "maximumMarks",
        ],
      },
      {
        section: "academicQualifications.cetExam",
        inputs: ["examYear", "obtainedMarks", "maximumMarks", "percentile"],
      },
    ];

    // Append form data
    fields.forEach(({ section, inputs }) => {
      const sectionData = section
        .split(".")
        .reduce((obj, key) => obj && obj[key], data);
      if (sectionData) {
        inputs.forEach((input) => {
          if (sectionData[input] !== undefined) {
            formData.append(`${section}.${input}`, sectionData[input]);
          }
        });
      } else {
        console.warn(`Section ${section} not found in data`);
      }
    });

    // Set stage if not already higher
    if (!(oldFormData?.stage > 2)) {
      formData.append("stage", 2);
    }

    try {
      let response = await updateApplicationFormForAdmin(formData);
      console.log("Step 2 API Response:", response);

      // Update form data in parent before moving to next step
      updateFormData({
        ...oldFormData,
        _id: applicationId, // Ensure ID is preserved
        stage: oldFormData?.stage > 2 ? oldFormData.stage : 2,
        academicQualifications: {
          tenth: data.academicQualifications.tenth,
          twelfth: data.academicQualifications.twelfth,
          cetExam: data.academicQualifications.cetExam,
        },
      });

      toast.success(`Step 2 Completed... `);
      setActiveStep((prevStep) => prevStep + 1);
    } catch (error) {
      console.error("Step 2 submission error:", error);
      toast.error(`Try Again, ${error?.response?.data?.error}`);
    }
  };

  const formInputsAcademic10 = [
    {
      label: "10th Institution",
      type: "text",
      name: "academicQualifications.tenth.institution",
      required: true,
      placeholder: "ABC College, XYZ School...",
    },
    {
      label: "10th Obtained Marks",
      type: "number",
      name: "academicQualifications.tenth.obtainedMarks",
      required: true,
      placeholder: "Enter marks obtained",
    },
    {
      label: "10th Maximum Marks",
      type: "number",
      name: "academicQualifications.tenth.maximumMarks",
      required: true,
      placeholder: "Enter maximum marks",
    },
    {
      label: "10th Percentage",
      type: "text",
      name: "academicQualifications.tenth.percentage",
      required: true,
      readOnly: true,
      value: tenthPercentage,
    },
    {
      label: "10th Year of Passing",
      type: "year",
      name: "academicQualifications.tenth.yearOfPassing",
      required: true,
      placeholder: "2021,2020,2022...",
    },
  ];
  const formInputsAcademic12 = [
    {
      label: "12th Institution",
      type: "text",
      name: "academicQualifications.twelfth.institution",
      required: true,
      placeholder: "ABC College, XYZ School...",
    },
    {
      label: "12th Obtained Marks",
      type: "number",
      name: "academicQualifications.twelfth.obtainedMarks",
      required: true,
      placeholder: "Enter marks obtained",
    },
    {
      label: "12th Maximum Marks",
      type: "number",
      name: "academicQualifications.twelfth.maximumMarks",
      required: true,
      placeholder: "Enter maximum marks",
    },
    {
      label: "12th Percentage",
      type: "text",
      name: "academicQualifications.twelfth.percentage",
      required: true,
      readOnly: true,
      value: twelfthPercentage,
    },
    {
      label: "12th Year of Passing",
      type: "year",
      name: "academicQualifications.twelfth.yearOfPassing",
      required: true,
      placeholder: "2021,2020,2022...",
    },
  ];

  const cetExamInputs = [
    {
      label: "CET Exam Year",
      type: "text",
      name: "academicQualifications.cetExam.examYear",
      required: true,
      placeholder: "2023",
    },
    {
      label: "CET Obtained Marks",
      type: "number",
      name: "academicQualifications.cetExam.obtainedMarks",
      required: true,
      placeholder: "80,90,95...",
    },
    {
      label: "CET Maximum Marks",
      type: "number",
      name: "academicQualifications.cetExam.maximumMarks",
      required: true,
      placeholder: "100,150,200...",
    },
    {
      label: "CET Percentile",
      type: "text",
      name: "academicQualifications.cetExam.percentile",
      required: true,
      placeholder: "Enter percentile",
    },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 10th details */}
      <h4 className="text-light-black my-3">
        &larr; 10th Standard Details &rarr;
      </h4>
      {formInputsAcademic10.map((input, index) => (
        <div className="form-group" key={index}>
          <label>
            {input.label}{" "}
            <span className="text-danger">{input.required ? "*" : ""}</span>
          </label>
          <input
            className="form-control p_input"
            placeholder={input?.placeholder}
            type={input.type}
            readOnly={input.readOnly}
            value={input.readOnly ? input.value : undefined}
            {...register(input.name, {
              required: input.required && !input.readOnly,
            })}
            aria-invalid={
              errors?.academicQualifications?.tenth?.[
                input.name.split(".").pop()
              ]
                ? "true"
                : "false"
            }
          />
          {errors?.academicQualifications?.tenth?.[input.name.split(".").pop()]
            ?.type === "required" && (
            <p className="text-danger">{`${input.label} is required`}</p>
          )}
          {errors?.academicQualifications?.tenth?.[input.name.split(".").pop()]
            ?.type === "pattern" && (
            <p className="text-danger">
              {
                errors?.academicQualifications?.tenth?.[
                  input.name.split(".").pop()
                ]?.message
              }
            </p>
          )}
        </div>
      ))}

      {/* 12th details */}
      <h4 className="text-light-black my-3">
        &larr; 12th Standard Details &rarr;
      </h4>
      {formInputsAcademic12.map((input, index) => (
        <div className="form-group" key={index}>
          <label>
            {input.label}{" "}
            <span className="text-danger">{input.required ? "*" : ""}</span>
          </label>
          <input
            className="form-control p_input"
            placeholder={input?.placeholder}
            type={input.type}
            readOnly={input.readOnly}
            value={input.readOnly ? input.value : undefined}
            {...register(input.name, {
              required: input.required && !input.readOnly,
            })}
            aria-invalid={
              errors?.academicQualifications?.twelfth?.[
                input.name.split(".").pop()
              ]
                ? "true"
                : "false"
            }
          />
          {errors?.academicQualifications?.twelfth?.[
            input.name.split(".").pop()
          ]?.type === "required" && (
            <p className="text-danger">{`${input.label} is required`}</p>
          )}
          {errors?.academicQualifications?.twelfth?.[
            input.name.split(".").pop()
          ]?.type === "pattern" && (
            <p className="text-danger">
              {
                errors?.academicQualifications?.twelfth?.[
                  input.name.split(".").pop()
                ]?.message
              }
            </p>
          )}
        </div>
      ))}

      {/* CET Exam Details */}
      <h4 className="text-light-black my-3">&larr; CET Exam Details &rarr;</h4>
      <div className="row">
        {cetExamInputs.map((input) => (
          <div className="col-md-4" key={input.name}>
            <div className="form-group">
              <label>
                {input.label}
                <span className="text-danger">{input.required ? "*" : ""}</span>
              </label>
              <input
                className="form-control p_input"
                placeholder={input.placeholder}
                type={input.type}
                {...register(input.name, {
                  required: input.required,
                })}
                aria-invalid={
                  errors?.academicQualifications?.cetExam?.[
                    input.name.split(".").pop()
                  ]
                    ? "true"
                    : "false"
                }
              />
              {errors?.academicQualifications?.cetExam?.[
                input.name.split(".").pop()
              ]?.type === "required" && (
                <p className="text-danger">{`${input.label} is required`}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <div className="text-center">
          <button
            className="btn btn-light btn-block enter-btn"
            onClick={() => setActiveStep((prevStep) => prevStep - 1)}
          >
            Previous
          </button>
        </div>
        <div className="text-center">
          <button
            type="submit"
            className="btn btn-primary btn-block enter-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Please wait..." : "Next"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default Step2;
