import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const NonTeachingStaffTopHeader = () => {
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("nonTeachingStaffData");
    if (data) {
      setStaffData(JSON.parse(data));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("nonTeachingStaffToken");
    localStorage.removeItem("nonTeachingStaffData");
    toast.success("Logged out successfully");
    navigate("/non-teaching-staff/login");
  };

  return (
    <nav className="fixed top-0 right-0 left-64 h-16 bg-white shadow-md z-40 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h5 className="text-gray-800 font-semibold">Non-Teaching Staff Portal</h5>
      </div>
      <div className="flex items-center">
        <div className="flex items-center mr-4">
          <div className="text-right mr-3">
            <div className="font-medium text-gray-800">{staffData?.name || "Staff Member"}</div>
            <div className="text-sm text-gray-500">{staffData?.designation || "Non-Teaching Staff"}</div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NonTeachingStaffTopHeader;