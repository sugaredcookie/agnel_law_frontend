import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [feeMenuOpen, setFeeMenuOpen] = useState(false);
  const location = useLocation();
  const sidebarScrollRef = useRef(null);

  useEffect(() => {
    const feeRoutes = [
      "/panel-admin/fee-structures",
      "/panel-admin/payment-history",
      "/panel-admin/pending-payments",
      "/panel-admin/payments",
      "/panel-admin/manual-payments",
    ];
    if (feeRoutes.some((route) => location.pathname.includes(route))) {
      setFeeMenuOpen(true);
    }
  }, [location]);

  // Restore scroll position after route change with multiple attempts
  useEffect(() => {
    const restoreScroll = () => {
      const savedScrollPosition = sessionStorage.getItem("sidebarScrollPosition");
      if (savedScrollPosition && sidebarScrollRef.current) {
        sidebarScrollRef.current.scrollTop = parseInt(savedScrollPosition, 10);
      }
    };

    // Restore immediately
    restoreScroll();
    
    // Also restore after a short delay to override any browser/React scroll behavior
    const timeoutId = setTimeout(restoreScroll, 50);
    const timeoutId2 = setTimeout(restoreScroll, 150);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [location.pathname]);

  // Save scroll position on scroll (debounced)
  useEffect(() => {
    const scrollContainer = sidebarScrollRef.current;
    if (!scrollContainer) return;

    let saveTimeout;
    const handleScroll = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        sessionStorage.setItem("sidebarScrollPosition", scrollContainer.scrollTop.toString());
      }, 100);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      clearTimeout(saveTimeout);
    };
  }, []);

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

  const toggleFeeMenu = () => {
    setFeeMenuOpen(!feeMenuOpen);
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
            to="/panel-admin/dashboard"
            className="px-4 hidden lg:flex items-center"
          >
            <img src="/agnel-logo2.png" alt="logo" className="h-10" />
          </NavLink>
          <NavLink
            to="/panel-admin/dashboard"
            className="px-4 flex lg:hidden items-center"
          >
            <img src="/agnel-logo2.png" alt="logo" className="h-8" />
          </NavLink>
        </div>

        {/* Navigation items */}
        <div 
          ref={sidebarScrollRef} 
          className="overflow-y-auto h-full pt-16 pb-20 sidebar-scroll"
          style={{ scrollBehavior: 'auto' }}
        >
          <ul className="mt-2">
            <NavItem to="/panel-admin/dashboard" icon="mdi-speedometer">
              Dashboard
            </NavItem>
            <NavItem to="/panel-admin/forms" icon="mdi-file-document">
              Forms
            </NavItem>
            <NavItem to="/panel-admin/leads" icon="mdi-source-branch">
              Lead Links
            </NavItem>
            <NavItem
              to="/panel-admin/admissions-enquiry"
              icon="mdi-account-question"
            >
              Admission Enquiries
            </NavItem>
            <NavItem to="/panel-admin/departments" icon="mdi-domain">
              Departments
            </NavItem>
            <NavItem to="/panel-admin/programs" icon="mdi-book-open-variant">
              Programs
            </NavItem>
            <NavItem to="/panel-admin/batches" icon="mdi-account-group">
              Batches
            </NavItem>
            <NavItem to="/panel-admin/batch-groups" icon="mdi-group">
              Batch Groups
            </NavItem>
            <NavItem to="/panel-admin/faculties" icon="mdi-teach">
              Faculties
            </NavItem>
            <NavItem to="/panel-admin/non-teaching-staff" icon="mdi-account-group">
              Non-Teaching Staffs
            </NavItem>
            <NavItem
              to="/panel-admin/subjects"
              icon="mdi-book-open-page-variant"
            >
              Subjects
            </NavItem>
            <NavItem to="/panel-admin/students" icon="mdi-school">
              Students
            </NavItem>
            <NavItem to="/panel-admin/profile-requests" icon="mdi-account-edit">
              Profile Requests
            </NavItem>
            <NavItem to="/panel-admin/grade-schemes" icon="mdi-certificate">
              Grade Schemes
            </NavItem>
            <NavItem to="/panel-admin/elective-sessions" icon="mdi-format-list-checks">
              Elective Sessions
            </NavItem>
            <NavItem to="/panel-admin/timetable" icon="mdi-calendar-clock">
              TimeTable
            </NavItem>
            <NavItem to="/panel-admin/academic-calender" icon="mdi-calendar">
              Academic Calender
            </NavItem>
            <NavItem to="/panel-admin/notification-center" icon="mdi-bell">
              Notification Center
            </NavItem>
            <NavItem
              to="/panel-admin/feedback"
              icon="mdi-comment-text-multiple"
            >
              <span>
                Subject + Faculty <br /> Feedback
              </span>
            </NavItem>

            <NavMenuGroup
              label="Fee Management"
              icon="mdi-cash-multiple"
              isOpen={feeMenuOpen}
              onToggle={toggleFeeMenu}
            >
              <SubNavItem to="/panel-admin/fee-structures" icon="mdi-file-document-edit">
                Fee Structures
              </SubNavItem>
              <SubNavItem to="/panel-admin/transaction-history" icon="mdi-history">
                Transaction History
              </SubNavItem>
              <SubNavItem
                to="/panel-admin/payments"
                icon="mdi-credit-card"
              >
                Payments
              </SubNavItem>
              <SubNavItem
                to="/panel-admin/manual-payments"
                icon="mdi-cash"
              >
                Manual Payments
              </SubNavItem>
            </NavMenuGroup>
            {/* leave Management Section for Admin */}
            <li className="px-2 py-1 mt-4">
              <div className="px-4 py-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Leave Management
                </span>
              </div>
            </li>
            <NavItem to="/panel-admin/leave-requests" icon="mdi-calendar-check">
              All Leave Requests
            </NavItem>
            <NavItem to="/panel-admin/leave-statistics" icon="mdi-chart-bar">
              Leave Statistics
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

const NavMenuGroup = ({ label, icon, isOpen, onToggle, children }) => {
  return (
    <li className="px-2 py-1">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 rounded-tr-full rounded-br-full transition-colors text-gray-300 hover:bg-gray-800"
      >
        <div className="flex items-center">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50 mr-3">
            <i className={`mdi ${icon} text-xl`}></i>
          </span>
          <span className="font-medium text-sm">{label}</span>
        </div>
        <i
          className={`mdi ${
            isOpen ? "mdi-chevron-up" : "mdi-chevron-down"
          } text-lg transition-transform`}
        ></i>
      </button>
      {isOpen && <ul className="ml-8 mt-1 space-y-1">{children}</ul>}
    </li>
  );
};

const SubNavItem = ({ to, icon, children }) => {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
            isActive
              ? "bg-blue-700 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          }`
        }
      >
        <i className={`mdi ${icon} text-base mr-2`}></i>
        <span>{children}</span>
      </NavLink>
    </li>
  );
};

export default Navbar;
