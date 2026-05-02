import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getNonTeachingStaffLeaveStatsAPI } from "../../utils/Api";

const NonTeachingStaffDashboard = () => {
  const [staffData, setStaffData] = useState(null);
  const [stats, setStats] = useState({
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem("nonTeachingStaffData");
    if (data) {
      setStaffData(JSON.parse(data));
    }
    fetchLeaveStats();
  }, []);

  const fetchLeaveStats = async () => {
    try {
      const response = await getNonTeachingStaffLeaveStatsAPI();
      setStats(response.data || {});
    } catch (error) {
      console.error("Error fetching leave stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!staffData) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
      </div>
      
      {/* Staff info */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">{staffData.name}</h2>
        <p className="text-gray-600">{staffData.email}</p>
        <p className="text-gray-600">{staffData.designation}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total Leaves</p>
          <p className="text-2xl font-bold">{loading ? "..." : stats.totalLeaves}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold">{loading ? "..." : stats.pendingLeaves}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold">{loading ? "..." : stats.approvedLeaves}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-2xl font-bold">{loading ? "..." : stats.rejectedLeaves}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/non-teaching-staff/apply-leave"
          className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition-shadow border"
        >
          Apply Leave
        </Link>
        <Link
          to="/non-teaching-staff/leave-history"
          className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition-shadow border"
        >
          Leave History
        </Link>
        <Link
          to="/non-teaching-staff/profile"
          className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition-shadow border"
        >
          My Profile
        </Link>
      </div>
    </>
  );
};

export default NonTeachingStaffDashboard;