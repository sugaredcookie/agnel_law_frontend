import React, { useEffect, useState, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { getArchivedStudentsViaExaminer } from "../../../utils/Api";
import Pagination from "../../../components/Pagination";

const getReasonBadgeColor = (reason) => {
  switch (reason) {
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "graduated":
      return "bg-green-100 text-green-800";
    case "transferred":
      return "bg-blue-100 text-blue-800";
    case "inactive":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ExaminerArchivedStudentsModal = ({ open, onClose }) => {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({
    reason: "",
    searchText: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchArchivedStudents = useCallback(
    async (page = 1, currentFilters = filters) => {
      setLoading(true);
      try {
        const response = await getArchivedStudentsViaExaminer(page, currentFilters);
        if (response) {
          setStudents(response.students);
          setCurrentPage(response.page);
          setTotalPages(response.totalPages);
          setTotalStudents(response.total);
        }
      } catch (error) {
        console.error("Error fetching archived students:", error);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (open) {
      fetchArchivedStudents(1);
    }
  }, [open, fetchArchivedStudents]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchArchivedStudents(1, filters);
  };

  const handlePageChange = (page) => {
    if (!loading) {
      setCurrentPage(page);
      fetchArchivedStudents(page, filters);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Archived Students (Read Only)</DialogTitle>
      <DialogContent>
        {/* Filters */}
        <div className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <select
            value={filters.reason}
            onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">All Reasons</option>
            <option value="cancelled">Cancelled</option>
            <option value="graduated">Graduated</option>
            <option value="transferred">Transferred</option>
            <option value="inactive">Inactive</option>
          </select>
          <input
            type="text"
            placeholder="Search by name or roll no..."
            value={filters.searchText}
            onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
            className="border rounded px-3 py-2 flex-1"
          />
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          Total Archived: {totalStudents}
        </p>

        {/* Student List */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No archived students found
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student._id}
                className="p-3 border rounded-lg bg-white flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {student.studentDetails?.firstName}{" "}
                      {student.studentDetails?.lastName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${getReasonBadgeColor(
                        student.archiveReason
                      )}`}
                    >
                      {student.archiveReason}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {student.academicDetails?.program} |{" "}
                    {student.academicDetails?.batch?.name} |{" "}
                    Roll: {student.academicDetails?.rollNumber || "-"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Archived: {formatDate(student.archivedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExaminerArchivedStudentsModal;
