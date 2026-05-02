import React from "react";
import { NavLink } from "react-router-dom";

const ExaminerNavbar = () => {
  return (
    <nav
      className="bg-gray-900 text-white h-screen fixed top-0 left-0 w-64 shadow-lg z-40"
      id="sidebar"
    >
      {/* Brand logo wrapper */}
      <div className="h-16 bg-gray-900 flex items-center justify-center border-b border-gray-800 w-64 z-10">
        <NavLink to="/examiner/dashboard" className="px-4 flex items-center">
          <img src="/agnel-logo2.png" alt="logo" className="h-10" />
        </NavLink>
      </div>
      {/* Dashboard and Grade History links */}
      <div className="overflow-y-auto h-full pt-16 pb-20">
        <ul className="mt-2">
          <li className="px-2 py-1">
            <NavLink
              to="/examiner/dashboard"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-tr-full rounded-br-full transition-colors ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 mr-3">
                <i className="mdi mdi-speedometer text-xl"></i>
              </span>
              <span className="font-medium text-sm">Examiner Dashboard</span>
            </NavLink>
          </li>
          <li className="px-2 py-1">
            <NavLink
              to="/examiner/mark-entry"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-tr-full rounded-br-full transition-colors ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 mr-3">
                <i className="mdi mdi-history text-xl"></i>
              </span>
              <span className="font-medium text-sm">Mark Entry</span>
            </NavLink>
          </li>
          <li className="px-2 py-1">
            <NavLink
              to="/examiner/sgpa-calculator"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-tr-full rounded-br-full transition-colors ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 mr-3">
                <i className="mdi mdi-calculator text-xl"></i>
              </span>
              <span className="font-medium text-sm">SGPA Calculator</span>
            </NavLink>
          </li>
          <li className="px-2 py-1">
            <NavLink
              to="/examiner/atkt-sessions"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-tr-full rounded-br-full transition-colors ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 mr-3">
                <i className="mdi mdi-calendar-edit text-xl"></i>
              </span>
              <span className="font-medium text-sm">A.T.K.T Sessions</span>
            </NavLink>
          </li>
          <li className="px-2 py-1">
            <NavLink
              to="/examiner/regular-exam-sessions"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-tr-full rounded-br-full transition-colors ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 mr-3">
                <i className="mdi mdi-book-open text-xl"></i>
              </span>
              <span className="font-medium text-sm">Exam Sessions</span>
            </NavLink>
          </li>
          <li className="px-2 py-1">
            <NavLink
              to="/examiner/subject-linking"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-tr-full rounded-br-full transition-colors ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 mr-3">
                <i className="mdi mdi-link-variant text-xl"></i>
              </span>
              <span className="font-medium text-sm">Subject Linking</span>
            </NavLink>
          </li>
          <li className="px-2 py-1">
            <NavLink
              to="/examiner/reval-sessions"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-tr-full rounded-br-full transition-colors ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 mr-3">
                <i className="mdi mdi-file-restore text-xl"></i>
              </span>
              <span className="font-medium text-sm">Reval / Photocopy</span>
            </NavLink>
          </li>
          <li className="px-2 py-1">
            <NavLink
              to="/examiner/result-cards"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-tr-full rounded-br-full transition-colors ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 mr-3">
                <i className="mdi mdi-certificate text-xl"></i>
              </span>
              <span className="font-medium text-sm">Result Cards</span>
            </NavLink>
          </li>

          <li className="px-2 py-1">
            <NavLink
              to="/examiner/students"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-tr-full rounded-br-full transition-colors ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 mr-3">
                <i className="mdi mdi-school text-xl"></i>
              </span>
              <span className="font-medium text-sm">Students</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default ExaminerNavbar;
