import React, { useEffect, useState, useCallback } from "react";
import StudentCard from "./StudentCard";
import StudentFilter from "./StudentFilter";
import StudentDetailsModal from "./StudentDetailsModal";
import AddStudentModal from "./AddStudentModal";
import {
  getAllStudentsViaAdmin,
  startIdCardJob,
  downloadAllStudentsExcel,
} from "../../../utils/Api";
import JobProgressBar from "./JobProgressBar";
import Pagination from "../../../components/Pagination";
import { toast } from "react-toastify";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [expandedDetails, setExpandedDetails] = useState([]);
  const [filters, setFilters] = useState({
    program: "",
    batch: "",
    searchType: "Student Name",
    searchText: "",
    noBatch: false,
    caste: "",
  });
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAllStudents = useCallback(
    async (page = 1, currentFilters = filters) => {
      setLoading(true);
      try {
        const response = await getAllStudentsViaAdmin(page, currentFilters);
        if (response) {
          setStudents(response.students);
          setCurrentPage(response.currentPage);
          setTotalPages(response.totalPages);
          setTotalStudents(response.totalStudents);
        } else {
          console.error("Error fetching students:", response.message);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    fetchAllStudents(currentPage, filters);
  }, [currentPage, fetchAllStudents, filters, refreshKey]);

  const handleUpdateAndRefresh = () => {
    setRefreshKey((oldKey) => oldKey + 1);
  };

  const handleToggleDetails = (student) => {
    setExpandedDetails((prev) =>
      prev.includes(student)
        ? prev.filter((s) => s !== student)
        : [...prev, student],
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setStudentDetails(null);
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on new search
    fetchAllStudents(1, filters);
  };

  const handleReset = () => {
    const resetFilters = {
      program: "",
      batch: "",
      searchType: "Student Name",
      searchText: "",
      noBatch: false,
      caste: "",
    };
    setFilters(resetFilters);
    setCurrentPage(1);
    fetchAllStudents(1, resetFilters);
  };

  const toggleFilterVisibility = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await downloadAllStudentsExcel(filters);
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "students_data.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Error downloading Excel");
    }
  };

  const handleBulkDownload = async () => {
    try {
      const studentIds = students.map((student) => student._id);
      const response = await startIdCardJob(studentIds);
      setJobId(response.jobId);
    } catch (error) {
      console.error("Error starting ID card generation job:", error);
    }
  };

  const handlePageChange = (page) => {
    if (!loading) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          className="text-blue-500 font-bold"
          onClick={toggleFilterVisibility}
        >
          {isFilterVisible ? "Hide Filters" : "Show Filters"}
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Student
          </button>
          {/* <ExcelUploader onUploadSuccess={fetchAllStudents} /> */}
          <button
            onClick={handleDownloadExcel}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Download Excel
          </button>
          <button
            onClick={handleBulkDownload}
            disabled={students.length === 0}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          >
            Download ID Cards
          </button>
        </div>
      </div>
      <StudentFilter
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
        onReset={handleReset}
        isVisible={isFilterVisible}
        toggleVisibility={toggleFilterVisibility}
      />
      {jobId && (
        <JobProgressBar
          jobId={jobId}
          onComplete={() => console.log("Job completed!")}
        />
      )}
      <h4 className="text-lg font-bold mb-2">
        Total Students: {totalStudents}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {students.map((student) => (
          <StudentCard
            key={student._id}
            student={student}
            onToggleDetails={handleToggleDetails}
            showDetails={expandedDetails.includes(student)}
            onUpdate={handleUpdateAndRefresh}
          />
        ))}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={loading}
      />
      {studentDetails && (
        <StudentDetailsModal
          open={isModalOpen}
          onClose={handleCloseModal}
          student={studentDetails}
          onUpdate={handleUpdateAndRefresh}
        />
      )}
      <AddStudentModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleUpdateAndRefresh}
      />
    </div>
  );
};

export default StudentList;
