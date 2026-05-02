import React, { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PersonIcon from "@mui/icons-material/Person";
import StudentDetailsModal from "./StudentDetailsModal";
import IdCardModal from "./IdCardModal";

const StudentCard = ({ student, onToggleDetails, showDetails, onUpdate }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [idCardModalOpen, setIdCardModalOpen] = useState(false);

  const handleToggleInfo = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleGenerateIdCard = () => {
    setIdCardModalOpen(true);
  };

  const handleCloseIdCardModal = () => {
    setIdCardModalOpen(false);
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
          {/* <p className="text-gray-500">
              {student.program}, {student.batch}
            </p> */}
        </div>
        <button
          onClick={handleGenerateIdCard}
          className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Generate ID
        </button>
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
      <StudentDetailsModal
        open={modalOpen}
        onClose={handleCloseModal}
        student={student}
        onUpdate={onUpdate}
      />
      <IdCardModal
        open={idCardModalOpen}
        onClose={handleCloseIdCardModal}
        student={student}
      />
    </div>
  );
};

export default StudentCard;
