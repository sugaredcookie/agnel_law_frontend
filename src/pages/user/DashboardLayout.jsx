import React, { useEffect } from "react";
import TopHeader from "../student/TopHeader";
import Footer from "../student/Footer";
import Navbar from "./Navbar";

const DashboardLayout = ({ children }) => {
  // check if user is login or not
  useEffect(() => {
    if (!localStorage.getItem("userToken")) {
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

export default DashboardLayout;
