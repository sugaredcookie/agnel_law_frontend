import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clearAuthTokens, getMyProfileRequestsAPI } from "../../utils/Api";
import { StudentContext } from "./StudentContext";

const TopHeader = () => {
  const { student } = useContext(StudentContext);
  const [pendingCount, setPendingCount] = useState(0);
  const name = student
    ? `${student.studentDetails?.firstName || ""} ${student.studentDetails?.lastName || ""}`.trim()
    : "Student";

  useEffect(() => {
    getMyProfileRequestsAPI()
      .then((res) => setPendingCount(res.data.pendingCount || 0))
      .catch(() => {});
  }, []);

  const logout = () => {
    clearAuthTokens();
    window.location.href = "/";
  };

  return (
    <header className="bg-white shadow-sm z-20 w-full py-3 px-4 fixed lg:static">
      <div className="flex justify-between items-center">
        {/* Left side - Brand logo for mobile */}
        <div className="flex lg:hidden items-center">
          <Link to="/student/dashboard" className="flex items-center">
            <img src="/agnel-logo2.png" alt="Agnel LMS" className="h-8 ml-10" />
          </Link>
        </div>

        {/* Right side - Profile & Logout */}
        <div className="flex items-center ml-auto gap-3">
          <Link
            to="/student/profile"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          >
            <span className="relative w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              {name.charAt(0).toUpperCase()}
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </span>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {name}
            </span>
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
