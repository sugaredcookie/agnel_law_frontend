import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAllBatchesViaAdmin,
  getAllProgramsViaAdmin,
} from "../../../utils/Api";

const StudentFilter = ({
  filters,
  setFilters,
  onSearch,
  onReset,
  isVisible,
  toggleVisibility,
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);

  const fetchPrograms = async () => {
    const response = await getAllProgramsViaAdmin();
    console.log("Programs fetched:", response);
    if (response) {
      setPrograms(response.programs);
    } else {
      console.error("Error fetching programs:", response.message);
    }
  };
  const fetchBatches = async () => {
    const response = await getAllBatchesViaAdmin();
    console.log("Batches fetched:", response);
    if (response) {
      setBatches(response.batches || []); // Adjust based on your API response structure
    } else {
      console.error("Error fetching batches:", response.message);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchBatches();
  }, []);

  return (
    <div
      className={`p-4 bg-gray-100 rounded-lg shadow-md mb-6 ${
        isVisible ? "" : "hidden"
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Program
          </label>
          <select
            name="program"
            value={filters.program}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="">Select Program</option>
            {programs.map((program) => (
              <option key={program._id} value={program.programName}>
                {program.programName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Batch
          </label>
          <select
            name="batch"
            value={filters.batch}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="">Select Batch</option>
            {batches.map((batch) => (
              <option key={batch._id} value={batch.batchName}>
                {batch.batchName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Caste
          </label>
          <input
            type="text"
            name="caste"
            value={filters.caste || ""}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            placeholder="Enter caste"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Search Type
          </label>
          <select
            name="searchType"
            value={filters.searchType}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="Student Name">Student Name</option>
            <option value="Register No">Register No</option>
            <option value="Roll No">Roll No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Search Text
          </label>
          <input
            type="text"
            name="searchText"
            value={filters.searchText}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            placeholder="Enter search text"
          />
        </div>
        <div className="flex items-end justify-end space-x-4 col-span-full md:col-span-1">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
            onClick={onReset}
          >
            Reset
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            onClick={onSearch}
          >
            Search
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="noBatchFilter"
            checked={filters.noBatch}
            onChange={(e) =>
              setFilters({ ...filters, noBatch: e.target.checked })
            }
            className="mr-2"
          />
          <label htmlFor="noBatchFilter">Show Students with No Batch</label>
        </div>
        <Link
          to="/panel-admin/archived-students"
          className="text-orange-600 hover:text-orange-800 font-medium"
        >
          View Archived Students
        </Link>
      </div>
    </div>
  );
};

export default StudentFilter;
