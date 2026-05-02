import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { toast } from "react-toastify";
import {
  getGradeSchemeByIdViaAdmin,
  createGradeSchemeViaAdmin,
  updateGradeSchemeViaAdmin, // Ensure this function is implemented in your API utils
} from "../../../utils/Api";

const GradesEntry = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const initialData = location.state || {};
  console.log(initialData);
  const [program, setProgram] = useState(
    initialData.program || initialData.selectedProgram || "",
  );
  const [name, setSchemeName] = useState(
    initialData.gradeSchemeName || initialData.schemeName || "",
  );
  const initialGrades = initialData.grades || [
    {
      rangeFrom: 0,
      rangeTo: 0,
      grade: "",
      className: "",
      gradePoint: 0,
      isFail: false,
    },
  ];
  const [grades, setGrades] = useState(initialGrades);

  useEffect(() => {
    if (id && !location.state) {
      fetchGradeScheme();
    }
  }, [id]);

  const fetchGradeScheme = async () => {
    try {
      const response = await getGradeSchemeByIdViaAdmin(id);
      const { program, gradeSchemeName, grades } = response;
      setProgram(program);
      setSchemeName(gradeSchemeName);
      setGrades(grades);
    } catch (error) {
      toast.error("Failed to fetch grade scheme data.");
    }
  };

  const handleGradeChange = (index, field, value) => {
    const newGrades = [...grades];
    newGrades[index][field] = value;
    setGrades(newGrades);
  };

  const addGradeRow = () => {
    setGrades([
      ...grades,
      {
        rangeFrom: 0,
        rangeTo: 0,
        grade: "",
        className: "",
        gradePoint: 0,
        isFail: false,
      },
    ]);
  };

  const handleSubmit = async () => {
    // Frontend validation
    if (!program.trim() || !name.trim()) {
      toast.error("Program and Scheme Name are required.");
      return;
    }
    if (!grades.length) {
      toast.error("At least one grade entry is required.");
      return;
    }
    for (let i = 0; i < grades.length; i++) {
      const g = grades[i];
      if (
        g.grade === "" ||
        g.className === "" ||
        g.rangeFrom === "" ||
        g.rangeTo === "" ||
        g.gradePoint === "" ||
        typeof g.isFail !== "boolean"
      ) {
        toast.error(`All fields are required for grade row ${i + 1}.`);
        return;
      }
    }
    try {
      if (id) {
        // Update existing grade scheme
        const updatedGradeScheme = {
          program,
          gradeSchemeName: name,
          grades,
        };
        await updateGradeSchemeViaAdmin(id, updatedGradeScheme);
        toast.success("Grade scheme updated successfully.");
      } else {
        // Create new grade scheme
        const newGradeScheme = {
          program,
          gradeSchemeName: name,
          grades,
        };
        await createGradeSchemeViaAdmin(newGradeScheme);
        toast.success("Grade scheme created successfully.");
      }
      navigate("/panel-admin/grade-schemes");
    } catch (error) {
      toast.error("Failed to save grade scheme.");
    }
  };

  return (
    <PanelDashboardLayout>
      <div className="p-2">
        <h1 className="text-2xl font-bold mb-6">
          {id ? "Edit" : "Add"} Grade Scheme Form
        </h1>
        <div>
          <div className="mb-2 flex gap-3">
            <p className="text-gray-700 text-xl font-semibold">Program:</p>
            <input
              type="text"
              className="text-lg border rounded px-2 py-1"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              placeholder="Enter Program"
            />
          </div>
          <div className="mb-2 flex gap-3">
            <p className="text-gray-700 text-xl font-semibold">Scheme Name:</p>
            <input
              type="text"
              className="text-lg border rounded px-2 py-1"
              value={name}
              onChange={(e) => setSchemeName(e.target.value)}
              placeholder="Enter Scheme Name"
            />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">Grades</h2>
        <table className="table-auto w-full mb-4">
          <thead>
            <tr>
              <th>#</th>
              <th>Range From</th>
              <th>Range To</th>
              <th>Grade</th>
              <th>Class Name</th>
              <th>Grade Point</th>
              <th>Is Fail</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {grades &&
              grades.map((grade, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="number"
                      value={grade.rangeFrom}
                      onChange={(e) =>
                        handleGradeChange(index, "rangeFrom", e.target.value)
                      }
                      className="shadow appearance-none border rounded py-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={grade.rangeTo}
                      onChange={(e) =>
                        handleGradeChange(index, "rangeTo", e.target.value)
                      }
                      className="shadow appearance-none border rounded py-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={grade.grade}
                      onChange={(e) =>
                        handleGradeChange(index, "grade", e.target.value)
                      }
                      className="shadow appearance-none border rounded py-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={grade.className}
                      onChange={(e) =>
                        handleGradeChange(index, "className", e.target.value)
                      }
                      className="shadow appearance-none border rounded py-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={grade.gradePoint}
                      onChange={(e) =>
                        handleGradeChange(index, "gradePoint", e.target.value)
                      }
                      className="shadow appearance-none border rounded py-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={grade.isFail}
                      onChange={(e) =>
                        handleGradeChange(index, "isFail", e.target.checked)
                      }
                      className="leading-tight"
                    />
                  </td>
                  <td>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() =>
                        setGrades(grades.filter((_, i) => i !== index))
                      }
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mr-3 rounded focus:outline-none focus:shadow-outline"
          onClick={addGradeRow}
        >
          Add Grade
        </button>
        <button
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </PanelDashboardLayout>
  );
};

export default GradesEntry;
