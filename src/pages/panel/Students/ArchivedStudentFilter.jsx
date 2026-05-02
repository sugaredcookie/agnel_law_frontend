import React, { useEffect, useState } from "react";
import {
  getAllBatchesViaAdmin,
  getAllProgramsViaAdmin,
} from "../../../utils/Api";

const ArchivedStudentFilter = ({
  filters,
  setFilters,
  onSearch,
  onReset,
  isVisible,
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
    if (response) {
      setPrograms(response.programs);
    }
  };

  const fetchBatches = async () => {
    const response = await getAllBatchesViaAdmin();
    if (response) {
      setBatches(response.batches || []);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchBatches();
  }, []);

  return (
    <div
      className={`p-4 bg-orange-50 rounded-lg shadow-md mb-6 border border-orange-200 ${
        isVisible ? "" : "hidden"
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Archive Reason
          </label>
          <select
            name="reason"
            value={filters.reason}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="">All Reasons</option>
            <option value="cancelled">Cancelled</option>
            <option value="graduated">Graduated</option>
            <option value="transferred">Transferred</option>
            <option value="inactive">Inactive</option>
            <option value="other">Other</option>
          </select>
        </div>
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
            <option value="">All Programs</option>
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
            <option value="">All Batches</option>
            {batches.map((batch) => (
              <option key={batch._id} value={batch.batchName}>
                {batch.batchName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Search (Name/Roll No)
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
      </div>
      <div className="flex items-end justify-end space-x-4 mt-4">
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded-md"
          onClick={onReset}
        >
          Reset
        </button>
        <button
          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
          onClick={onSearch}
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default ArchivedStudentFilter;
