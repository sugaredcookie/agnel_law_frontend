import React, { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import RestoreIcon from "@mui/icons-material/Restore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { restoreArchivedStudentViaAdmin } from "../../../utils/Api";
import { toast } from "react-toastify";
import ArchivedStudentDetailsModal from "./ArchivedStudentDetailsModal";

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

const ArchivedStudentCard = ({ student, onToggleDetails, showDetails, onRestore }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleRestore = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to restore ${student.studentDetails.firstName} ${student.studentDetails.lastName}?\n\n` +
      "This will move the student back to the active students list."
    );

    if (confirmed) {
      setRestoring(true);
      try {
        await restoreArchivedStudentViaAdmin(student._id);
        toast.success("Student restored successfully");
        onRestore();
      } catch (error) {
        console.error("Error restoring student:", error);
        toast.error(error.response?.data?.message || "Failed to restore student");
      } finally {
        setRestoring(false);
      }
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
    <div className="p-3 border rounded-lg shadow-sm bg-white">
      <div className="flex justify-between items-start">
        <div className="bg-gray-300 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
          <p className="m-auto font-semibold text-2xl">
            {student.studentDetails?.firstName?.[0] || "?"}
          </p>
        </div>
        <div className="flex-1 ml-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="text-lg font-semibold">
              {student.studentDetails?.firstName || ""}{" "}
              {student.studentDetails?.middleName || ""}{" "}
              {student.studentDetails?.lastName || ""}
            </h5>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getReasonBadgeColor(student.archiveReason)}`}>
              {student.archiveReason?.charAt(0).toUpperCase() + student.archiveReason?.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {student.academicDetails?.program} | {student.academicDetails?.batch?.name}
          </p>
          <p className="text-xs text-gray-400">
            Archived: {formatDate(student.archivedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 flex items-center gap-1"
            title="Restore student"
          >
            <RestoreIcon fontSize="small" />
            {restoring ? "..." : "Restore"}
          </button>
          <button onClick={() => setModalOpen(true)} title="View details">
            <VisibilityIcon className="text-blue-500" />
          </button>
          <button onClick={() => onToggleDetails(student)}>
            {showDetails ? (
              <ExpandLessIcon className="text-blue-500" />
            ) : (
              <ExpandMoreIcon className="text-blue-500" />
            )}
          </button>
        </div>
      </div>
      {showDetails && (
        <div className="border-t pt-2 mt-2">
          <p className="text-gray-500 text-sm">
            Roll No: {student.academicDetails?.rollNumber || "-"}
          </p>
          <p className="text-gray-500 text-sm">
            Email: {student.studentDetails?.emailAddress || "-"}
          </p>
          {student.archiveNote && (
            <p className="text-gray-500 text-sm">
              Note: {student.archiveNote}
            </p>
          )}
        </div>
      )}
      <ArchivedStudentDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        student={student}
        onRestore={onRestore}
      />
    </div>
  );
};

export default ArchivedStudentCard;
