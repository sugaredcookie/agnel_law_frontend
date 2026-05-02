import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import NonTeachingStaffNavbar from "./NonTeachingStaffNavbar";
import NonTeachingStaffTopHeader from "./NonTeachingStaffTopHeader";
import NonTeachingStaffFooter from "./NonTeachingStaffFooter";

const NonTeachingStaffDashboardLayout = () => {
  useEffect(() => {
    const token = localStorage.getItem("nonTeachingStaffToken");
    if (!token) {
      window.location.href = "/non-teaching-staff/login";
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <NonTeachingStaffNavbar />
      <div className="lg:ml-64">
        <NonTeachingStaffTopHeader />
        <main className="pt-20 p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Outlet />
          </div>
        </main>
        <NonTeachingStaffFooter />
      </div>
    </div>
  );
};

export default NonTeachingStaffDashboardLayout;