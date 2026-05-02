import React from "react";
import { useNavigate } from "react-router-dom";

const ExaminerTopHeader = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("examinerToken");
    navigate("/examiner/login");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 lg:ml-64 fixed top-0 right-0 left-0 lg:left-0 z-30 h-16 flex items-center">
      <div className="flex items-center justify-between w-full px-8">
        <h2 className="text-xl font-semibold text-gray-800">Examiner Portal</h2>
        <button
          onClick={handleLogout}
          className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default ExaminerTopHeader;
