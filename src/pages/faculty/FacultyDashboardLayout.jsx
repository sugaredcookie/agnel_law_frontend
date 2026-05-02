import React, { useEffect } from "react";
import Navbar from "./Navbar";
import TopHeader from "./TopHeader";
import Footer from "./Footer";

const FacultyDashboardLayout = ({ children }) => {
  // check if faculty is logged in
  useEffect(() => {
    const token = localStorage.getItem("facultyToken");
    console.log("FacultyDashboardLayout mounted. Token:", token);
    if (!token) {
      console.log("No faculty token found, redirecting to /");
      window.location.href = "/";
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <TopHeader />
        <div className="pt-20 lg:pt-0 min-h-screen text-black dark:text-white">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
            {children}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default FacultyDashboardLayout;
