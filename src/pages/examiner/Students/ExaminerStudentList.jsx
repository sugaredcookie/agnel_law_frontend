import React, { useEffect, useState, useCallback } from "react";
import ExaminerStudentCard from "./ExaminerStudentCard";
import ExaminerStudentFilter from "./ExaminerStudentFilter";
import ExaminerArchivedStudentsModal from "./ExaminerArchivedStudentsModal";
import { getAllStudentsViaExaminer } from "../../../utils/Api";
import Pagination from "../../../components/Pagination";

const ExaminerStudentList = () => {
  const [students, setStudents] = useState([]);
  const [expandedDetails, setExpandedDetails] = useState([]);
  const [filters, setFilters] = useState({
    program: "",
    batch: "",
    searchType: "Student Name",
    searchText: "",
    noBatch: false,
  });
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [archivedModalOpen, setArchivedModalOpen] = useState(false);

  const fetchAllStudents = useCallback(
    async (page = 1, currentFilters = filters) => {
      setLoading(true);
      try {
        const response = await getAllStudentsViaExaminer(page, currentFilters);
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
  }, [currentPage, fetchAllStudents, filters]);

  const handleToggleDetails = (student) => {
    setExpandedDetails((prev) =>
      prev.includes(student)
        ? prev.filter((s) => s !== student)
        : [...prev, student],
    );
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAllStudents(1, filters);
  };

  const handleReset = () => {
    const resetFilters = {
      program: "",
      batch: "",
      searchType: "Student Name",
      searchText: "",
      noBatch: false,
    };
    setFilters(resetFilters);
    setCurrentPage(1);
    fetchAllStudents(1, resetFilters);
  };

  const toggleFilterVisibility = () => {
    setIsFilterVisible(!isFilterVisible);
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
      </div>
      <ExaminerStudentFilter
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
        onReset={handleReset}
        isVisible={isFilterVisible}
        toggleVisibility={toggleFilterVisibility}
        onViewArchived={() => setArchivedModalOpen(true)}
      />
      <h4 className="text-lg font-bold mb-2">
        Total Students: {totalStudents}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {students.map((student) => (
          <ExaminerStudentCard
            key={student._id}
            student={student}
            onToggleDetails={handleToggleDetails}
            showDetails={expandedDetails.includes(student)}
          />
        ))}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={loading}
      />
      <ExaminerArchivedStudentsModal
        open={archivedModalOpen}
        onClose={() => setArchivedModalOpen(false)}
      />
    </div>
  );
};

export default ExaminerStudentList;
