import React, { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PersonIcon from "@mui/icons-material/Person";
import ExaminerStudentDetailsModal from "./ExaminerStudentDetailsModal";

const ExaminerStudentCard = ({ student, onToggleDetails, showDetails }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleToggleInfo = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <div className={`p-2 border rounded-lg shadow-sm bg-white`}>
      <div className="flex justify-between items-center">
        <div className="bg-gray-300 rounded-full w-12 h-12 flex items-center justify-center">
          <p className="m-auto font-semibold text-2xl">{`${student.studentDetails.firstName[0]}`}</p>
        </div>
        <div className="flex-1 ml-4">
          <h5 className="text-lg font-semibold">
            {student.studentDetails.firstName}{" "}
            {student.studentDetails.middleName}{" "}
            {student.studentDetails.lastName}
          </h5>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleToggleInfo}>
            <PersonIcon className="text-blue-500" />
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
        <div className="border-t pt-2">
          <p className="text-gray-500">
            Register No: {student.academicDetails.registerNumber}
          </p>
          <p className="text-gray-500">
            Roll No: {student.academicDetails.rollNumber}
          </p>
        </div>
      )}
      <ExaminerStudentDetailsModal
        open={modalOpen}
        onClose={handleCloseModal}
        student={student}
      />
    </div>
  );
};

export default ExaminerStudentCard;
