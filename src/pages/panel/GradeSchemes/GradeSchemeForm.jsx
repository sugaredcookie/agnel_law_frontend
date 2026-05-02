import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { getAllProgramsViaAdmin } from "../../../utils/Api";

const GradeSchemeForm = () => {
  const [selectedProgram, setSelectedProgram] = useState("");
  const [allPrograms, setAllPrograms] = useState([]);
  const [schemeName, setSchemeName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchAllPrograms();
  }, []);

  const fetchAllPrograms = async () => {
    try {
      const response = await getAllProgramsViaAdmin();
      setAllPrograms(response.programs);
    } catch (error) {}
  };
  const handleNext = () => {
    if (!selectedProgram || !schemeName) {
      alert("Please select Program and enter Scheme Name before proceeding.");
      return;
    }
    navigate("/panel-admin/add-grades", {
      state: {
        selectedProgram,
        schemeName,
      },
    });
  };

  return (
    <PanelDashboardLayout>
      <div className="p-2">
        <h1 className="text-2xl font-bold mb-6">Grade Scheme Form</h1>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="program"
          >
            Program:
          </label>
          <select
            required
            id="program"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="" disabled>
              Select Program
            </option>
            {allPrograms.map((program) => (
              <option key={program._id} value={program.programName}>
                {program.programName}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="schemeName"
          >
            Scheme Name:
          </label>
          <input
            required
            id="schemeName"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Scheme Name"
            value={schemeName}
            onChange={(e) => setSchemeName(e.target.value)}
          />
        </div>
        <button
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </PanelDashboardLayout>
  );
};

export default GradeSchemeForm;
