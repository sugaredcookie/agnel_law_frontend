import React, { useState, useEffect } from "react";

const NonTeachingStaffProfile = () => {
  const [staffData, setStaffData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("nonTeachingStaffData");
    if (data) {
      setStaffData(JSON.parse(data));
    }
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!staffData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 rounded-t-lg">
        <div className="flex items-center">
          <div className="bg-white/20 rounded-full p-4 mr-4">
            <i className="mdi mdi-account text-white text-4xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{staffData.name}</h1>
            <p className="text-blue-100">{staffData.designation}</p>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">
          Personal Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Full Name</p>
              <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded">
                {staffData.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Designation</p>
              <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded">
                {staffData.designation}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email Address</p>
              <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded">
                {staffData.email}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Salary</p>
              <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded">
                {formatCurrency(staffData.salary)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Salary Disbursement Date</p>
              <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded">
                Day {staffData.salaryDisbursementDate} of every month
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Unique ID</p>
              <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded font-mono">
                {staffData.uniqueId}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonTeachingStaffProfile;