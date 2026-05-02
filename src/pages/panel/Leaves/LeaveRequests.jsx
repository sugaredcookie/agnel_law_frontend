import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getAllLeavesAdminAPI,
  approveLeaveAdminAPI,
  rejectLeaveAdminAPI,
} from "../../../utils/Api";
import PanelDashboardLayout from "../PanelDashboardLayout";
import moment from "moment";

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    leaveId: null,
    reason: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    leaveType: "",
    applicantType: "", // Add filter for user type
    fromDate: "",
    toDate: "",
  });

  useEffect(() => {
    fetchLeaves();
  }, [pagination.page, filters]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await getAllLeavesAdminAPI(
        filters,
        pagination.page,
        10
      );
      setLeaves(response.leaves);
      setPagination({
        page: response.currentPage,
        totalPages: response.totalPages,
        total: response.total,
      });
    } catch (error) {
      console.error("Error fetching leaves:", error);
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    if (!window.confirm("Are you sure you want to approve this leave?")) {
      return;
    }

    setProcessingId(leaveId);
    try {
      await approveLeaveAdminAPI(leaveId);
      toast.success("Leave approved successfully");
      fetchLeaves();
    } catch (error) {
      console.error("Error approving leave:", error);
      toast.error(error.response?.data?.message || "Failed to approve leave");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionModal.reason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setProcessingId(rejectionModal.leaveId);
    try {
      await rejectLeaveAdminAPI(rejectionModal.leaveId, rejectionModal.reason);
      toast.success("Leave rejected successfully");
      setRejectionModal({ isOpen: false, leaveId: null, reason: "" });
      fetchLeaves();
    } catch (error) {
      console.error("Error rejecting leave:", error);
      toast.error(error.response?.data?.message || "Failed to reject leave");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectionModal = (leaveId) => {
    setRejectionModal({ isOpen: true, leaveId, reason: "" });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // Get applicant display name based on type
  const getApplicantName = (leave) => {
    if (!leave.applicantId) return "N/A";
    
    // If populated, get the name based on type
    if (leave.applicantType === 'Faculty') {
      return leave.applicantId?.facultyName || "Unknown Faculty";
    } else if (leave.applicantType === 'NonTeachingStaff') {
      return leave.applicantId?.name || "Unknown Staff";
    }
    return "N/A";
  };

  // Get applicant designation/department based on type
  const getApplicantDetail = (leave) => {
    if (!leave.applicantId) return "N/A";
    
    if (leave.applicantType === 'Faculty') {
      return leave.applicantId?.department || "No Department";
    } else if (leave.applicantType === 'NonTeachingStaff') {
      return leave.applicantId?.designation || "No Designation";
    }
    return "N/A";
  };

  // Get applicant type badge
  const getApplicantTypeBadge = (type) => {
    switch (type) {
      case 'Faculty':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 ml-2">Faculty</span>;
      case 'NonTeachingStaff':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 ml-2">Staff</span>;
      default:
        return null;
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      leaveType: "",
      applicantType: "",
      fromDate: "",
      toDate: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <PanelDashboardLayout>
      <div className="mb-4 text-2xl font-bold">Leave Requests</div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h3 className="text-lg font-bold mb-4">Filter Leave Requests</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Leave Type</label>
            <select
              name="leaveType"
              value={filters.leaveType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="CASUAL">Casual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="EARNED">Earned Leave</option>
              <option value="emergency">Emergency Leave</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">User Type</label>
            <select
              name="applicantType"
              value={filters.applicantType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              <option value="Faculty">Faculty</option>
              <option value="NonTeachingStaff">Non-Teaching Staff</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">From Date</label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">To Date</label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Leaves Table Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : leaves.length > 0 ? (
                leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-gray-900">
                            {getApplicantName(leave)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getApplicantDetail(leave)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getApplicantTypeBadge(leave.applicantType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{leave.leaveType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {moment(leave.fromDate).format("DD MMM")} -{" "}
                        {moment(leave.toDate).format("DD MMM yyyy")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{leave.numberOfDays} days</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          leave.status
                        )}`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(leave.appliedAt || leave.createdAt).format("DD MMM yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {leave.status === "PENDING" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(leave._id)}
                            disabled={processingId === leave._id}
                            className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            {processingId === leave._id ? (
                              <span className="flex items-center">
                                <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                ...
                              </span>
                            ) : (
                              "Approve"
                            )}
                          </button>
                          <button
                            onClick={() => openRejectionModal(leave._id)}
                            disabled={processingId === leave._id}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <p className="text-gray-500">No leave requests found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {leaves.length > 0 && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * 10 + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Rejection Reason
              </h3>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) =>
                  setRejectionModal({
                    ...rejectionModal,
                    reason: e.target.value,
                  })
                }
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reason for rejection..."
                autoFocus
              />
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() =>
                    setRejectionModal({ isOpen: false, leaveId: null, reason: "" })
                  }
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionModal.reason.trim() || processingId === rejectionModal.leaveId}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {processingId === rejectionModal.leaveId ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PanelDashboardLayout>
  );
};

export default LeaveRequests;