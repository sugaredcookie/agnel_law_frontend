import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

const NonTeachingStaffNavbar = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileSidebarOpen && !event.target.closest("#sidebar")) {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileSidebarOpen]);

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <button
        onClick={toggleMobileSidebar}
        className="lg:hidden fixed z-50 top-4 left-4 bg-blue-600 text-white p-2 rounded-md shadow-lg"
        aria-label="Toggle sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <nav
        id="sidebar"
        className={`bg-gray-900 text-white h-screen fixed top-0 left-0 w-64 shadow-lg transition-transform duration-300 ease-in-out z-40
                   ${
                     isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                   } lg:translate-x-0`}
      >
        {/* Brand logo wrapper */}
        <div className="h-16 bg-gray-900 flex items-center justify-center border-b border-gray-800 fixed top-0 left-0 w-64 z-10">
          <NavLink
            to="/non-teaching-staff/dashboard"
            className="px-4 hidden lg:flex items-center"
          >
            <img src="/agnel-logo2.png" alt="logo" className="h-10" />
          </NavLink>
          <NavLink
            to="/non-teaching-staff/dashboard"
            className="px-4 flex lg:hidden items-center"
          >
            <img src="/agnel-logo2.png" alt="logo" className="h-8" />
          </NavLink>
        </div>

        {/* Navigation items */}
        <div className="overflow-y-auto h-full pt-16 pb-20">
          <ul className="mt-2">
            <NavItem to="/non-teaching-staff/dashboard" icon="mdi-speedometer">
              Dashboard
            </NavItem>
            
            {/* Leave Management Section */}
            <li className="px-2 py-1 mt-2">
              <div className="px-4 py-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Leave Management
                </span>
              </div>
            </li>
            <NavItem to="/non-teaching-staff/apply-leave" icon="mdi-calendar-plus">
              Apply Leave
            </NavItem>
            <NavItem to="/non-teaching-staff/leave-history" icon="mdi-format-list-bulleted">
              My Leaves
            </NavItem>
            
            {/* Profile Section */}
            <li className="px-2 py-1 mt-2">
              <div className="px-4 py-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Profile
                </span>
              </div>
            </li>
            <NavItem to="/non-teaching-staff/profile" icon="mdi-account">
              My Profile
            </NavItem>
            <NavItem to="/non-teaching-staff/change-password" icon="mdi-lock">
              Change Password
            </NavItem>
          </ul>
        </div>
      </nav>
    </>
  );
};

const NavItem = ({ to, icon, children }) => {
  return (
    <li className="px-2 py-1">
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center px-4 py-3 rounded-tr-full rounded-br-full transition-colors ${
            isActive
              ? "bg-blue-700 text-white"
              : "text-gray-300 hover:bg-gray-800"
          }`
        }
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 mr-3">
          <i className={`mdi ${icon} text-xl`}></i>
        </span>
        <span className="font-medium text-sm">{children}</span>
      </NavLink>
    </li>
  );
};

export default NonTeachingStaffNavbar;