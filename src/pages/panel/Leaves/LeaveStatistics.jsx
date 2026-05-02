import React, { useState, useEffect } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { getLeaveStatisticsAdminAPI } from "../../../utils/Api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-toastify";

const COLORS = {
  PENDING: "#FBBF24",
  APPROVED: "#10B981",
  REJECTED: "#EF4444",
  CASUAL: "#3B82F6",
  SICK: "#8B5CF6",
  EARNED: "#EC4899",
};

const LeaveStatistics = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("status");

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await getLeaveStatisticsAdminAPI();
      setStats(response);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Failed to fetch leave statistics");
    } finally {
      setLoading(false);
    }
  };

  const prepareStatusData = () => {
    return stats.map((item) => ({
      name: item._id,
      count: item.totalCount,
      days: item.totalDays,
    }));
  };

  const prepareTypeData = () => {
    const typeData = [];
    stats.forEach((statusItem) => {
      statusItem.leaves.forEach((leave) => {
        typeData.push({
          name: leave.leaveType,
          count: leave.count,
          days: leave.totalDays,
          status: statusItem._id,
        });
      });
    });
    return typeData;
  };

  const preparePieData = () => {
    if (view === "status") {
      return stats.map((item) => ({
        name: item._id,
        value: item.totalCount,
      }));
    } else {
      const typeMap = new Map();
      stats.forEach((statusItem) => {
        statusItem.leaves.forEach((leave) => {
          const current = typeMap.get(leave.leaveType) || 0;
          typeMap.set(leave.leaveType, current + leave.count);
        });
      });
      return Array.from(typeMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    }
  };

  if (loading) {
    return (
      <PanelDashboardLayout>
        <div className="mb-4 text-2xl font-bold">Leave Statistics</div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center text-gray-500">Loading statistics...</div>
        </div>
      </PanelDashboardLayout>
    );
  }

  return (
    <PanelDashboardLayout>
      <div className="mb-4 text-2xl font-bold">Leave Statistics</div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-sm text-gray-500 mb-1">Total Applications</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.reduce((acc, item) => acc + item.totalCount, 0)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-sm text-gray-500 mb-1">Total Leave Days</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.reduce((acc, item) => acc + item.totalDays, 0)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-sm text-gray-500 mb-1">Pending Applications</div>
          <div className="text-3xl font-bold text-yellow-600">
            {stats.find((item) => item._id === "PENDING")?.totalCount || 0}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Analytics Overview</h3>
          
          {/* View Toggle */}
          <div className="inline-flex rounded-lg shadow-sm">
            <button
              onClick={() => setView("status")}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                view === "status"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              By Status
            </button>
            <button
              onClick={() => setView("type")}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                view === "type"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              By Leave Type
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-semibold mb-4">
              {view === "status" ? "Applications by Status" : "Applications by Leave Type"}
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={view === "status" ? prepareStatusData() : prepareTypeData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" name="Applications" />
                <Bar dataKey="days" fill="#10B981" name="Total Days" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-semibold mb-4">
              {view === "status" ? "Status Distribution" : "Leave Type Distribution"}
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={preparePieData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {preparePieData().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name] || "#9CA3AF"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold">Detailed Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Days
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.length > 0 ? (
                stats.map((statusItem) =>
                  statusItem.leaves.map((leave, index) => (
                    <tr key={`${statusItem._id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            statusItem._id === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : statusItem._id === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {statusItem._id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.leaveType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {leave.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {leave.totalDays}
                      </td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No statistics available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default LeaveStatistics;