import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { updateApplicationForm } from "../../../utils/Api";
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
    defaultValues: oldFormData,
  });
  const [graduationDuration, setGraduationDuration] = useState(
    oldFormData?.academicQualifications?.graduationDuration || 0,
  );

  useEffect(() => {
    if (oldFormData && oldFormData?.applicationNumber) {
      reset(oldFormData);
      if (oldFormData.academicQualifications?.graduationDuration) {
        setGraduationDuration(
          oldFormData.academicQualifications.graduationDuration,
        );
      }
    }
  }, [reset, oldFormData]);

  useFieldArray({
    control,
    name: "competitiveExamScore",
  });

  const {
    fields: graduationFields,
    append: appendGraduation,
    remove: removeGraduation,
  } = useFieldArray({
    control,
    name: "academicQualifications.graduation",
  });

  useEffect(() => {
    const currentGraduationFields =
      watch("academicQualifications.graduation")?.length || 0;
    if (currentGraduationFields < graduationDuration) {
      for (let i = currentGraduationFields; i < graduationDuration; i++) {
        appendGraduation({
          year: `Year ${i + 1}`,
          obtainedMarks: "",
          maximumMarks: "",
          percentage: "",
        });
      }
    } else if (currentGraduationFields > graduationDuration) {
      for (let i = currentGraduationFields; i > graduationDuration; i--) {
        removeGraduation(i - 1);
      }
    }
  }, [graduationDuration, appendGraduation, removeGraduation, watch]);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // Handle 10th percentage
      if (
        name === "academicQualifications.tenth.obtainedMarks" ||
        name === "academicQualifications.tenth.maximumMarks"
      ) {
        const obtained = value.academicQualifications?.tenth?.obtainedMarks;
        const max = value.academicQualifications?.tenth?.maximumMarks;
        if (obtained && max) {
          const percentage = (obtained / max) * 100;
          setTenthPercentage(percentage.toFixed(2));
          setValue(
            "academicQualifications.tenth.percentage",
            percentage.toFixed(2),
          );
        } else {
          setTenthPercentage(0);
          setValue("academicQualifications.tenth.percentage", "");
        }
      }

      // Handle 12th percentage
      if (
        name === "academicQualifications.twelfth.obtainedMarks" ||
        name === "academicQualifications.twelfth.maximumMarks"
      ) {
        const obtained = value.academicQualifications?.twelfth?.obtainedMarks;
        const max = value.academicQualifications?.twelfth?.maximumMarks;
        if (obtained && max) {
          const percentage = (obtained / max) * 100;
          setTwelfthPercentage(percentage.toFixed(2));
          setValue(
            "academicQualifications.twelfth.percentage",
            percentage.toFixed(2),
          );
        } else {
          setTwelfthPercentage(0);
          setValue("academicQualifications.twelfth.percentage", "");
        }
      }

      // Handle graduation percentages
      if (name && name.startsWith("academicQualifications.graduation")) {
        const parts = name.split(".");
        if (
          parts.length === 4 &&
          (parts[3] === "obtainedMarks" || parts[3] === "maximumMarks")
        ) {
          const index = parseInt(parts[2], 10);
          if (!isNaN(index)) {
            const gradYear = value.academicQualifications.graduation[index];
            if (gradYear && gradYear.obtainedMarks && gradYear.maximumMarks) {
              const percentage =
                (gradYear.obtainedMarks / gradYear.maximumMarks) * 100;
              setValue(
                `academicQualifications.graduation.${index}.percentage`,
                percentage.toFixed(2),
              );
            } else {
              setValue(
                `academicQualifications.graduation.${index}.percentage`,
                "",
              );
            }
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const onSubmit = async (data) => {
    const formData = new FormData();
    const aq = data.academicQualifications;

    if (aq) {
      // 10th details
      if (aq.tenth) {
        formData.append(
          "academicQualifications[tenth][institution]",
          aq.tenth.institution,
        );
        formData.append(
          "academicQualifications[tenth][percentage]",
          aq.tenth.percentage,
        );
        formData.append(
          "academicQualifications[tenth][yearOfPassing]",
          aq.tenth.yearOfPassing,
        );
      }

      // 12th details
      if (aq.twelfth) {
        formData.append(
          "academicQualifications[twelfth][institution]",
          aq.twelfth.institution,
        );
        formData.append(
          "academicQualifications[twelfth][percentage]",
          aq.twelfth.percentage,
        );
        formData.append(
          "academicQualifications[twelfth][yearOfPassing]",
          aq.twelfth.yearOfPassing,
        );
      }

      // CET Exam details
      if (aq.cetExam) {
        formData.append(
          "academicQualifications[cetExam][examYear]",
          aq.cetExam.examYear,
        );
        formData.append(
          "academicQualifications[cetExam][obtainedMarks]",
          aq.cetExam.obtainedMarks,
        );
        formData.append(
          "academicQualifications[cetExam][maximumMarks]",
          aq.cetExam.maximumMarks,
        );
        formData.append(
          "academicQualifications[cetExam][percentile]",
          aq.cetExam.percentile,
        );
      }

      // Graduation details
      formData.append(
        "academicQualifications[graduationDuration]",
        aq.graduationDuration,
      );
      formData.append(
        "academicQualifications[graduationInstitution]",
        aq.graduationInstitution,
      );
      formData.append(
        "academicQualifications[graduationYearOfPassing]",
        aq.graduationYearOfPassing,
      );

      if (aq.graduation) {
        aq.graduation.forEach((grad, index) => {
          formData.append(
            `academicQualifications[graduation][${index}][year]`,
            grad.year,
          );
          formData.append(
            `academicQualifications[graduation][${index}][obtainedMarks]`,
            grad.obtainedMarks,
          );
          formData.append(
            `academicQualifications[graduation][${index}][maximumMarks]`,
            grad.maximumMarks,
          );
          formData.append(
            `academicQualifications[graduation][${index}][percentage]`,
            grad.percentage,
          );
        });
      }
    }

    if (!(data.stage > 2)) {
      formData.append("stage", 2);
    }

    const formId = oldFormData?._id;
    if (!formId) {
      console.error("No _id found in oldFormData:", oldFormData);
      toast.error("Application ID not found");
      return;
    }

    formData.append("_id", formId);

    try {
      await updateApplicationForm(formData);

      updateFormData({
        ...oldFormData,
        academicQualifications: {
          ...oldFormData.academicQualifications,
          ...data.academicQualifications,
        },
      });

      setActiveStep((prevStep) => prevStep + 1);
    } catch (error) {
      console.log(error);
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
      required: false,
      placeholder: "80,90,95...",
    },
    {
      label: "CET Maximum Marks",
      type: "number",
      name: "academicQualifications.cetExam.maximumMarks",
      required: false,
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

      {/* Graduation Details */}
      <h4 className="text-light-black my-3">
        &larr; Graduation Details &rarr;
      </h4>
      <div className="form-group">
        <label>
          How many years was your graduation?
          <span className="text-danger">*</span>
        </label>
        <input
          type="number"
          className="form-control p_input"
          placeholder="e.g., 3"
          {...register("academicQualifications.graduationDuration", {
            valueAsNumber: true,
          })}
          onChange={(e) =>
            setGraduationDuration(parseInt(e.target.value, 10) || 0)
          }
        />
        <small className="form-text text-muted">
          Enter the duration of your graduation in years. If you haven't
          completed a graduation, please enter 0.
        </small>
        {errors?.academicQualifications?.graduationDuration?.type ===
          "required" && (
          <p className="text-danger">Graduation duration is required</p>
        )}
      </div>

      {graduationDuration > 0 && (
        <>
          <div className="form-group">
            <label>Institution Name</label>
            <input
              type="text"
              className="form-control p_input"
              placeholder="Institution Name"
              {...register("academicQualifications.graduationInstitution")}
            />
          </div>
          <div className="form-group">
            <label>Year of Passing</label>
            <input
              type="number"
              className="form-control p_input"
              placeholder="Year of Passing"
              {...register("academicQualifications.graduationYearOfPassing", {
                valueAsNumber: true,
              })}
            />
          </div>
        </>
      )}

      {graduationFields.map((field, index) => (
        <div key={field.id} className="border p-3 mb-3">
          <h5>Year {index + 1}</h5>
          <div className="row">
            {/* Add your graduation fields here, similar to 10th/12th */}
            {/* Example for one field: */}
            <div className="col-md-4">
              <div className="form-group">
                <label>Year</label>
                <input
                  className="form-control p_input"
                  readOnly
                  {...register(
                    `academicQualifications.graduation.${index}.year`,
                  )}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Obtained Marks</label>
                <input
                  type="number"
                  className="form-control p_input"
                  {...register(
                    `academicQualifications.graduation.${index}.obtainedMarks`,
                    { valueAsNumber: true },
                  )}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Maximum Marks</label>
                <input
                  type="number"
                  className="form-control p_input"
                  {...register(
                    `academicQualifications.graduation.${index}.maximumMarks`,
                    { valueAsNumber: true },
                  )}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>Percentage</label>
                <input
                  className="form-control p_input"
                  readOnly
                  {...register(
                    `academicQualifications.graduation.${index}.percentage`,
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

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
