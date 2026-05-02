import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FacultyDashboardLayout from "../FacultyDashboardLayout";
import { applyLeaveAPI, getMyLeavesAPI } from "../../../utils/Api.js";
import { toast } from "react-toastify";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const ApplyLeave = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [myLeaves, setMyLeaves] = useState([]);
  const [leaveStats, setLeaveStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  
  const [formData, setFormData] = useState({
    leaveType: "CASUAL",
    fromDate: "",
    toDate: "",
    reason: "",
    proofDocument: "",
  });

  const [errors, setErrors] = useState({});
  const [showProofField, setShowProofField] = useState(false);

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  // Check if proof document is needed (SICK leave > 2 days)
  useEffect(() => {
    if (formData.leaveType === "SICK" && formData.fromDate && formData.toDate) {
      const from = new Date(formData.fromDate);
      const to = new Date(formData.toDate);
      const diffTime = Math.abs(to - from);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setShowProofField(diffDays > 2);
    } else {
      setShowProofField(false);
    }
  }, [formData.leaveType, formData.fromDate, formData.toDate]);

  const fetchMyLeaves = async () => {
    try {
      const response = await getMyLeavesAPI(1, 5);
      if (response && response.leaves) {
        setMyLeaves(response.leaves);
        
        // Calculate stats
        const stats = {
          total: response.total || 0,
          pending: response.leaves.filter(l => l.status === "PENDING").length,
          approved: response.leaves.filter(l => l.status === "APPROVED").length,
          rejected: response.leaves.filter(l => l.status === "REJECTED").length,
        };
        setLeaveStats(stats);
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fromDate) {
      newErrors.fromDate = "From date is required";
    }
    if (!formData.toDate) {
      newErrors.toDate = "To date is required";
    }
    if (formData.fromDate && formData.toDate) {
      const from = new Date(formData.fromDate);
      const to = new Date(formData.toDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (from < today) {
        newErrors.fromDate = "Cannot apply for leave in the past";
      }
      if (from > to) {
        newErrors.toDate = "To date must be after from date";
      }
    }
    if (!formData.reason.trim()) {
      newErrors.reason = "Reason is required";
    }
    if (showProofField && !formData.proofDocument) {
      newErrors.proofDocument = "Doctor certificate is required for sick leave of more than 2 days";
    }

    return newErrors;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  const newErrors = validateForm();
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  // Prepare data - only include proofDocument if it has a value
  const submitData = {
    leaveType: formData.leaveType,
    fromDate: formData.fromDate,
    toDate: formData.toDate,
    reason: formData.reason.trim(),
  };
  
  // Only add proofDocument if it's not empty
  if (formData.proofDocument && formData.proofDocument.trim() !== '') {
    submitData.proofDocument = formData.proofDocument.trim();
  }

  console.log("Submitting form data:", submitData);
  
  setLoading(true);
  try {
    const response = await applyLeaveAPI(submitData);
    console.log("Success response:", response);
    toast.success("Leave application submitted successfully!");
    
    // Reset form
    setFormData({
      leaveType: "CASUAL",
      fromDate: "",
      toDate: "",
      reason: "",
      proofDocument: "",
    });
    
    // Refresh leaves list
    fetchMyLeaves();
  } catch (error) {
    console.error("Error applying for leave:", error);
    console.error("Error response data:", error.response?.data);
    
    // Handle validation errors array
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const validationErrors = error.response.data.errors;
      validationErrors.forEach(err => {
        toast.error(err.msg);
      });
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Failed to submit leave application");
    }
  } finally {
    setLoading(false);
  }
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

  // Convert leaves to calendar events
  const calendarEvents = myLeaves.map(leave => ({
    id: leave._id,
    title: `${leave.leaveType} - ${leave.status}`,
    start: new Date(leave.fromDate),
    end: new Date(leave.toDate),
    allDay: true,
    resource: leave,
  }));

  const eventStyleGetter = (event) => {
    let backgroundColor = "#4299e1"; // blue for pending
    if (event.resource.status === "APPROVED") {
      backgroundColor = "#48bb78"; // green for approved
    } else if (event.resource.status === "REJECTED") {
      backgroundColor = "#f56565"; // red for rejected
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "12px",
      },
    };
  };

  return (
    <FacultyDashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Apply for leave and track your applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Leaves</div>
            <div className="text-2xl font-bold">{leaveStats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-yellow-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{leaveStats.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-green-600">Approved</div>
            <div className="text-2xl font-bold text-green-600">{leaveStats.approved}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-red-600">Rejected</div>
            <div className="text-2xl font-bold text-red-600">{leaveStats.rejected}</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Apply Leave Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Apply for Leave</h2>
            
            <form onSubmit={handleSubmit}>
              {/* Leave Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leave Type *
                </label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick Leave (SL)</option>
                  <option value="EARNED">Earned Leave (EL)</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date *
                  </label>
                  <input
                    type="date"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fromDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.fromDate && (
                    <p className="mt-1 text-xs text-red-500">{errors.fromDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date *
                  </label>
                  <input
                    type="date"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleChange}
                    min={formData.fromDate || new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.toDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.toDate && (
                    <p className="mt-1 text-xs text-red-500">{errors.toDate}</p>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.reason ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter reason for leave..."
                />
                {errors.reason && (
                  <p className="mt-1 text-xs text-red-500">{errors.reason}</p>
                )}
              </div>

              {/* Proof Document (conditional) */}
              {showProofField && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doctor Certificate URL *
                  </label>
                  <input
                    type="url"
                    name="proofDocument"
                    value={formData.proofDocument}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.proofDocument ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="https://example.com/certificate.pdf"
                  />
                  {errors.proofDocument && (
                    <p className="mt-1 text-xs text-red-500">{errors.proofDocument}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Upload your doctor certificate to a cloud storage and paste the link here
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Apply for Leave"}
              </button>
            </form>
          </div>

          {/* Recent Leaves Calendar */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Leaves Calendar</h2>
            <div className="h-80">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                eventPropGetter={eventStyleGetter}
                style={{ height: "100%" }}
                views={['month']}
                defaultView="month"
                tooltipAccessor={(event) => 
                  `${event.resource.leaveType}: ${event.resource.reason} (${event.resource.status})`
                }
              />
            </div>
          </div>
        </div>

        {/* Recent Leaves Table */}
        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Leave Applications</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myLeaves.length > 0 ? (
                  myLeaves.map((leave) => (
                    <tr key={leave._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {leave.leaveType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {moment(leave.fromDate).format("DD MMM")} - {moment(leave.toDate).format("DD MMM yyyy")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{leave.numberOfDays} days</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 line-clamp-1">
                          {leave.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {moment(leave.appliedAt).format("DD MMM yyyy")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No leave applications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => navigate("/faculty/all-leaves")}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all leaves →
            </button>
          </div>
        </div>
      </div>
    </FacultyDashboardLayout>
  );
};

export default ApplyLeave;