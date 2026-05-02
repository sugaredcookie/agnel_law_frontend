import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  UpdateSubjectViaAdmin,
  createSubjectViaAdmin,
  getAllFacultiesViaAdmin,
  getSingleSubjectViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const SubjectForm = () => {
  const [subjectData, setSubjectData] = useState({});
  const [allFaculties, setAllFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [markingSchemes, setMarkingSchemes] = useState([
    { name: "", value: "", breakdown: [] },
  ]);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchAllFaculties();
  }, []);

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
  }, [id]);

  const fetchOldData = async () => {
    const response = await getSingleSubjectViaAdmin({ id });
    const faculties = await getAllFacultiesViaAdmin();
    setAllFaculties(faculties?.faculties);
    setSubjectData(response?.subject);
    reset(response?.subject);

    if (response?.subject?.markingScheme) {
      setMarkingSchemes(
        response.subject.markingScheme.map((scheme) => ({
          ...scheme,
          breakdown: scheme.breakdown || [],
        })),
      );
    }

    const faculty = faculties?.faculties.find(
      (f) => f.facultyName === response?.subject.facultyName,
    );
    setSelectedFaculty(faculty);
  };

  const onSubmit = async (data) => {
    data.markingScheme = markingSchemes.filter(
      (scheme) => scheme.name && scheme.value,
    );

    if (selectedFaculty) {
      data.faculty = selectedFaculty;
    }
    data.rubricsMarking = !!data.rubricsMarking;
    data.isElective = !!data.isElective;

    console.log(data);
    try {
      let response;
      if (id !== undefined) {
        data.id = id;
        response = await UpdateSubjectViaAdmin(data);
        toast.success(`Subject Updated...`);
      } else {
        response = await createSubjectViaAdmin(data);
        toast.success(`Subject Created...`);
      }
      navigate("/panel-admin/subjects");
    } catch (error) {
      toast.error(`Try Again, ${error?.response?.data?.error}`);
    }
  };

  const fetchAllFaculties = async () => {
    try {
      const response = await getAllFacultiesViaAdmin();
      setAllFaculties(response.faculties);
    } catch (error) {}
  };

  const handleFacultyChange = (e) => {
    const selectedFacultyId = e.target.value;
    const faculty = allFaculties.find((f) => f._id === selectedFacultyId);
    setSelectedFaculty(faculty);
  };

  const handleSchemeChange = (index, field, value) => {
    const updated = [...markingSchemes];
    updated[index][field] = value;

    // Auto-populate breakdown for Internal marks
    if (
      field === "name" &&
      value.toLowerCase() === "internal" &&
      updated[index].value
    ) {
      updated[index].breakdown = getDefaultBreakdown(updated[index].value);
    } else if (
      field === "value" &&
      updated[index].name.toLowerCase() === "internal"
    ) {
      updated[index].breakdown = getDefaultBreakdown(value);
    }

    setMarkingSchemes(updated);
  };

  const getDefaultBreakdown = (totalMarks) => {
    const marks = parseInt(totalMarks);
    if (marks === 25) {
      return [
        { name: "Class Test", value: 10 },
        { name: "Assignment", value: 15 },
      ];
    } else if (marks === 40) {
      return [
        { name: "Class Test", value: 20 },
        { name: "Assignment", value: 20 },
      ];
    }
    return [];
  };

  const handleAddScheme = () => {
    setMarkingSchemes([
      ...markingSchemes,
      { name: "", value: "", breakdown: [] },
    ]);
  };

  const handleRemoveScheme = (index) => {
    setMarkingSchemes(markingSchemes.filter((_, i) => i !== index));
  };

  const handleBreakdownChange = (schemeIndex, breakdownIndex, field, value) => {
    const updated = [...markingSchemes];
    updated[schemeIndex].breakdown[breakdownIndex][field] = value;
    setMarkingSchemes(updated);
  };

  const handleAddBreakdown = (schemeIndex) => {
    const updated = [...markingSchemes];
    if (!updated[schemeIndex].breakdown) {
      updated[schemeIndex].breakdown = [];
    }
    updated[schemeIndex].breakdown.push({ name: "", value: "" });
    setMarkingSchemes(updated);
  };

  const handleRemoveBreakdown = (schemeIndex, breakdownIndex) => {
    const updated = [...markingSchemes];
    updated[schemeIndex].breakdown = updated[schemeIndex].breakdown.filter(
      (_, i) => i !== breakdownIndex,
    );
    setMarkingSchemes(updated);
  };

  const formInputs = [
    {
      label: "Subject Name",
      type: "text",
      name: "subjectName",
      required: true,
    },
    {
      label: "Subject Code",
      type: "text",
      name: "subjectCode",
      required: true,
    },
    {
      label: "Description",
      type: "text",
      name: "description",
      required: true,
    },
    {
      label: "Faculty",
      type: "select",
      name: "faculty", // This will remain here for form submission, but we use the whole object
      required: true,
    },
    {
      label: "Is Elective",
      type: "checkbox",
      name: "isElective",
      required: false,
    },
    {
      label: "Rubrics Marking",
      type: "checkbox",
      name: "rubricsMarking",
      required: false,
    },
    {
      label: "Passing Criteria",
      type: "text",
      name: "passCriteria",
      required: true,
    },
    {
      label: "Credits",
      type: "text",
      name: "credits",
      required: true,
    },
  ];

  return (
    <PanelDashboardLayout>
      <div className="card col-lg-4 mx-auto">
        <div className="card-body px-5 py-5">
          <div className="mb-3">
            <h3 className="alert alert-warning">
              {id !== undefined ? "Update" : "Create"} Subject
            </h3>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            {formInputs.map((input, index) =>
              input.type === "checkbox" &&
              (input.name === "isElective" ||
                input.name === "rubricsMarking") ? (
                <div
                  className="form-group d-flex align-items-center"
                  key={index}
                >
                  <label className="mr-2">{input.label}</label>
                  <input
                    className="form-control p_input ml-2"
                    type="checkbox"
                    {...register(input.name, {
                      required: input.required,
                    })}
                    aria-invalid={errors[input.name] ? "true" : "false"}
                  />
                  {errors[input.name]?.type === "required" && (
                    <p className="text-danger">{`${input.label} is required`}</p>
                  )}
                </div>
              ) : (
                <div className="form-group" key={index}>
                  <label>{input.label}</label>
                  {input.type === "text" && (
                    <input
                      className="form-control p_input"
                      type="text"
                      {...register(input.name, {
                        required: input.required,
                      })}
                      aria-invalid={errors[input.name] ? "true" : "false"}
                    />
                  )}
                  {input.type === "select" && (
                    <select
                      className="form-control p_input"
                      onChange={handleFacultyChange}
                      aria-invalid={errors[input.name] ? "true" : "false"}
                    >
                      <option value="">Select Faculty</option>
                      {allFaculties.map((faculty) => (
                        <option key={faculty._id} value={faculty._id}>
                          {faculty.facultyName}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors[input.name]?.type === "required" && (
                    <p className="text-danger">{`${input.label} is required`}</p>
                  )}
                </div>
              ),
            )}

            <div className="form-group">
              <label className="font-weight-bold">Marking Scheme</label>
              {markingSchemes.map((scheme, schemeIndex) => (
                <div key={schemeIndex} className="border p-3 mb-3 rounded">
                  <div className="d-flex mb-2 align-items-center">
                    <input
                      className="form-control p_input mr-2"
                      type="text"
                      placeholder="Scheme Name (e.g., Internal, External)"
                      value={scheme.name}
                      onChange={(e) =>
                        handleSchemeChange(schemeIndex, "name", e.target.value)
                      }
                    />
                    <input
                      className="form-control p_input mr-2"
                      type="number"
                      placeholder="Total Marks"
                      value={scheme.value}
                      onChange={(e) =>
                        handleSchemeChange(schemeIndex, "value", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveScheme(schemeIndex)}
                    >
                      ✕
                    </button>
                  </div>

                  {scheme.name.toLowerCase() === "internal" && (
                    <div className="ml-4 mt-2 p-3 bg-light rounded">
                      <label className="font-weight-bold text-primary">
                        Internal Breakdown:
                      </label>
                      {scheme.breakdown &&
                        scheme.breakdown.map((breakdown, breakdownIndex) => (
                          <div
                            key={breakdownIndex}
                            className="d-flex mb-2 align-items-center"
                          >
                            <input
                              className="form-control p_input mr-2"
                              type="text"
                              placeholder="Component (e.g., Viva-voce)"
                              value={breakdown.name}
                              onChange={(e) =>
                                handleBreakdownChange(
                                  schemeIndex,
                                  breakdownIndex,
                                  "name",
                                  e.target.value,
                                )
                              }
                            />
                            <input
                              className="form-control p_input mr-2"
                              type="number"
                              placeholder="Marks"
                              value={breakdown.value}
                              onChange={(e) =>
                                handleBreakdownChange(
                                  schemeIndex,
                                  breakdownIndex,
                                  "value",
                                  e.target.value,
                                )
                              }
                            />
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                handleRemoveBreakdown(
                                  schemeIndex,
                                  breakdownIndex,
                                )
                              }
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary mt-2"
                        onClick={() => handleAddBreakdown(schemeIndex)}
                      >
                        + Add Breakdown Component
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddScheme}
              >
                + Add Marking Scheme
              </button>
            </div>
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

export default SubjectForm;
