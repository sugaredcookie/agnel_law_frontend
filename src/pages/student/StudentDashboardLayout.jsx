import React, { useEffect } from "react";
import TopHeader from "./TopHeader";
import Footer from "./Footer";
import StudentNavbar from "./StudentNavbar";

const StudentDashboardLayout = ({ children }) => {
  // check if user is login or not
  useEffect(() => {
    if (!localStorage.getItem("studentToken")) {
      window.location.href = "/";
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <StudentNavbar />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <TopHeader />
        <div className="pt-20 lg:pt-0 min-h-screen text-black">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            {children}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default StudentDashboardLayout;
