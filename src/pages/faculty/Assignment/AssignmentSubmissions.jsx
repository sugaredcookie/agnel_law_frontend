import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FacultyDashboardLayout from "../FacultyDashboardLayout";
import { getAssignmentSubmissions } from "../../../utils/Api";
import { toast } from "react-toastify";

const AssignmentSubmissions = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, submitted, late, pending

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await getAssignmentSubmissions(assignmentId);
      setAssignment(response.data.assignment);
      setSubmissions(response.data.submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Error loading submissions");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === "all") return true;
    if (filter === "submitted") return sub.status === "submitted";
    if (filter === "late") return sub.status === "late";
    if (filter === "pending") return sub.status === "pending";
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "submitted":
        return "bg-green-100 text-green-800 border-green-300";
      case "late":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <FacultyDashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          ← Back
        </button>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading submissions...</p>
          </div>
        ) : (
          <>
            {/* Assignment Header */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {assignment?.title}
              </h1>
              <p className="text-gray-700 mb-4">{assignment?.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Subject:</span>{" "}
                  <span className="text-gray-600">
                    {assignment?.subject.name}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Due Date:</span>{" "}
                  <span className="text-gray-600">
                    {new Date(assignment?.dueDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">
                    Total Submissions:
                  </span>{" "}
                  <span className="text-gray-600">{submissions.length}</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All ({submissions.length})
              </button>
              <button
                onClick={() => setFilter("submitted")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  filter === "submitted"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                On Time (
                {submissions.filter((s) => s.status === "submitted").length})
              </button>
              <button
                onClick={() => setFilter("late")}
                className={`px-4 py-2 rounded-md transition-colors ${
                  filter === "late"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Late ({submissions.filter((s) => s.status === "late").length})
              </button>
            </div>

            {/* Submissions List */}
            <div className="space-y-4">
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-600 text-lg font-semibold mt-4 mb-2">
                    No submissions yet
                  </p>
                  <p className="text-gray-500 text-sm">
                    Student submissions will appear here
                  </p>
                </div>
              ) : (
                filteredSubmissions.map((submission) => (
                  <div
                    key={submission._id}
                    className={`border-2 rounded-lg p-5 ${getStatusColor(submission.status)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">
                          {submission.studentName || "Unknown Student"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-semibold">Submitted:</span>{" "}
                            {new Date(
                              submission.submissionDate,
                            ).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-semibold">Status:</span>{" "}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                submission.status === "submitted"
                                  ? "bg-green-200 text-green-800"
                                  : submission.status === "late"
                                    ? "bg-orange-200 text-orange-800"
                                    : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {submission.status === "submitted"
                                ? "On Time"
                                : submission.status === "late"
                                  ? "Late Submission"
                                  : "Pending"}
                            </span>
                          </div>
                          {submission.fileName && (
                            <div className="md:col-span-2">
                              <span className="font-semibold">File:</span>{" "}
                              {submission.fileName}
                            </div>
                          )}
                        </div>
                      </div>
                      {submission.submissionUrl && (
                        <a
                          href={submission.submissionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          View Submission
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </FacultyDashboardLayout>
  );
};

export default AssignmentSubmissions;
