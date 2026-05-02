import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StudentDashboardLayout from "./StudentDashboardLayout";
import { StudentContext } from "./StudentContext";
import { getMyProfileRequestsAPI, submitProfileRequestAPI } from "../../utils/Api";
import { toast } from "react-toastify";

const StudentDashboard = () => {
  const { student } = useContext(StudentContext);
  const firstName = student?.studentDetails?.firstName || "Student";

  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState({});
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    getMyProfileRequestsAPI()
      .then((res) => {
        const reqs = res.data.pendingRequests || [];
        setPendingRequests(reqs);
        const initial = {};
        reqs.forEach((r) => { initial[r._id] = r.currentValue || ""; });
        setFormValues(initial);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (requestId) => {
    const value = formValues[requestId];
    if (!value || !value.trim()) {
      toast.warning("Please enter a value");
      return;
    }
    setSubmitting((prev) => ({ ...prev, [requestId]: true }));
    try {
      await submitProfileRequestAPI(requestId, value.trim());
      toast.success("Updated successfully!");
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const daysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <StudentDashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
          <p className="text-sm text-gray-500 mt-1">Here's what needs your attention.</p>
        </div>

        {/* Action Required */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : pendingRequests.length > 0 ? (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-base font-semibold text-gray-800">
                Action Required
              </h2>
              <span className="ml-auto text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {pendingRequests.length} pending
              </span>
            </div>

            <div className="space-y-3">
              {pendingRequests.map((req) => {
                const daysLeft = daysUntilDeadline(req.deadline);
                const isUrgent = daysLeft !== null && daysLeft <= 3;

                return (
                  <div
                    key={req._id}
                    className={`bg-white rounded-lg border shadow-sm overflow-hidden ${
                      isUrgent ? "border-red-300" : "border-gray-200"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {req.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <i className="mdi mdi-form-textbox" />
                              {req.fieldLabel}
                            </span>
                            {req.deadline && (
                              <span className={`flex items-center gap-1 ${
                                isUrgent ? "text-red-600 font-medium" : ""
                              }`}>
                                <i className="mdi mdi-calendar-clock" />
                                {new Date(req.deadline).toLocaleDateString()}
                                {daysLeft !== null && (
                                  <> &middot; {daysLeft <= 0 ? "Overdue" : `${daysLeft}d left`}</>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        {isUrgent && (
                          <span className="shrink-0 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          {req.fieldType === "select" ? (
                            <select
                              value={formValues[req._id] || ""}
                              onChange={(e) =>
                                setFormValues((p) => ({ ...p, [req._id]: e.target.value }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">-- Select --</option>
                              {(req.selectOptions || []).map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={req.fieldType === "date" ? "date" : "text"}
                              value={formValues[req._id] || ""}
                              onChange={(e) =>
                                setFormValues((p) => ({ ...p, [req._id]: e.target.value }))
                              }
                              placeholder={req.placeholder || `Enter ${req.fieldLabel}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                        <button
                          onClick={() => handleSubmit(req._id)}
                          disabled={submitting[req._id]}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          {submitting[req._id] ? "Saving..." : "Submit"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center mb-8">
            <i className="mdi mdi-check-circle-outline text-4xl text-green-500" />
            <p className="text-sm text-gray-600 mt-2">You're all caught up. No pending actions.</p>
          </div>
        )}

        {/* Quick Links */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <QuickLink to="/student/profile" icon="mdi-account" label="My Profile" />
            <QuickLink to="/student/elective-selection" icon="mdi-book-open-page-variant" label="Elective Selection" />
            <QuickLink to="/student/notes" icon="mdi-notebook" label="Notes" />
          </div>
        </section>
      </div>
    </StudentDashboardLayout>
  );
};

const QuickLink = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 hover:border-blue-300 hover:shadow transition-all"
  >
    <i className={`mdi ${icon} text-xl text-blue-600`} />
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </Link>
);

export default StudentDashboard;
