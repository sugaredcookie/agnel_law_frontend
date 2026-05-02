import React, { useContext, useEffect, useState } from "react";
import {
  fetchStudentAssignments,
  submitAssignment,
  getStudentSubmissionStatus,
  deleteSubmission,
} from "../../../utils/Api";
import { toast } from "react-toastify";
import { StudentContext } from "../StudentContext";
import StudentDashboardLayout from "../StudentDashboardLayout";

const StudentAssignment = () => {
  const student = useContext(StudentContext).student;
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState({});

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      // Get subject IDs from student's enrolled subjects
      const subjectIds =
        student.academicDetails?.subjects?.map(
          (subj) => subj.subject._id || subj.subject,
        ) || [];
      const batchId = student.academicDetails?.batch?.id || student.batch?.id;

      if (subjectIds.length === 0) {
        console.warn(
          "No subjects found for student, using batch-based fallback",
        );
        toast.info("Loading assignments for your batch...");
      }

      const response = await fetchStudentAssignments(batchId, subjectIds);
      setAssignments(response.assignments);

      // Fetch submission status for each assignment
      const statusMap = {};
      for (const assignment of response.assignments) {
        try {
          const statusRes = await getStudentSubmissionStatus(
            assignment._id,
            student._id,
          );
          statusMap[assignment._id] = statusRes.data;
        } catch (error) {
          statusMap[assignment._id] = { hasSubmitted: false, submission: null };
        }
      }
      setSubmissionStatus(statusMap);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Error fetching assignments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB");
      e.target.value = null;
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (assignmentId) => {
    if (!selectedFile) {
      toast.error("Please select a file to submit");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("assignmentId", assignmentId);
      formData.append("studentId", student._id);
      formData.append(
        "studentName",
        `${student.studentDetails?.firstName} ${student.studentDetails?.lastName}`,
      );

      await submitAssignment(formData);
      toast.success("Assignment submitted successfully!");
      setShowSubmitModal(null);
      setSelectedFile(null);

      // Refresh assignments and status
      fetchAssignments();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        error.response?.data?.message || "Error submitting assignment",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmission = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete your submission?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteSubmission(assignmentId, student._id);
      toast.success("Submission deleted successfully!");
      fetchAssignments();
    } catch (error) {
      console.error("Delete submission error:", error);
      toast.error(
        error.response?.data?.message || "Error deleting submission",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <StudentDashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Assignments</h1>
            {!loading && assignments.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {assignments.length} assignment
                {assignments.length !== 1 ? "s" : ""} found
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading assignments...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const daysRemaining = getDaysRemaining(assignment.dueDate);
              const overdue = isOverdue(assignment.dueDate);
              const hasSubmitted =
                submissionStatus[assignment._id]?.hasSubmitted;
              const submission = submissionStatus[assignment._id]?.submission;

              return (
                <div
                  key={assignment._id}
                  className={`p-5 border-2 rounded-lg shadow-sm hover:shadow-lg transition-all ${
                    hasSubmitted
                      ? "border-green-400 bg-green-50"
                      : overdue
                        ? "border-red-400 bg-red-50"
                        : daysRemaining <= 3 && daysRemaining >= 0
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-xl text-gray-800">
                          {assignment.title}
                        </h3>
                        {hasSubmitted && (
                          <span className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
                            Submitted
                          </span>
                        )}
                        {!hasSubmitted && overdue && (
                          <span className="px-3 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">
                            OVERDUE
                          </span>
                        )}
                        {!hasSubmitted &&
                          !overdue &&
                          daysRemaining <= 3 &&
                          daysRemaining >= 0 && (
                            <span className="px-3 py-1 text-xs font-semibold text-orange-800 bg-orange-200 rounded-full">
                              DUE SOON
                            </span>
                          )}
                        {!hasSubmitted && !overdue && daysRemaining > 3 && (
                          <span className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 mt-2 mb-3 leading-relaxed">
                        {assignment.description}
                      </p>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {assignment.subject && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">
                              Subject:
                            </span>
                            <span className="text-gray-900">
                              {assignment.subject.name}
                            </span>
                          </div>
                        )}
                        {assignment.faculty && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">
                              Faculty:
                            </span>
                            <span className="text-gray-900">
                              {assignment.faculty.facultyName || `${assignment.faculty.firstName || ""} ${assignment.faculty.lastName || ""}`.trim() || "N/A"}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">
                            Due Date:
                          </span>
                          <span className="text-gray-900">
                            {new Date(assignment.dueDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}{" "}
                            at{" "}
                            {new Date(assignment.dueDate).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">
                            Status:
                          </span>
                          <span
                            className={`font-medium ${
                              hasSubmitted
                                ? "text-green-600"
                                : overdue
                                  ? "text-red-600"
                                  : daysRemaining <= 3
                                    ? "text-orange-600"
                                    : "text-green-600"
                            }`}
                          >
                            {hasSubmitted
                              ? `Submitted${submission?.status === "late" ? " (Late)" : ""}`
                              : overdue
                                ? `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? "s" : ""}`
                                : daysRemaining === 0
                                  ? "Due today"
                                  : `${daysRemaining} day${daysRemaining > 1 ? "s" : ""} remaining`}
                          </span>
                        </div>
                      </div>

                      {hasSubmitted && submission && (
                        <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-md">
                          <p className="text-sm font-semibold text-green-800 mb-1">
                            Your Submission
                          </p>
                          <div className="text-sm text-green-700">
                            <p>
                              Submitted on:{" "}
                              {new Date(
                                submission.submissionDate,
                              ).toLocaleString()}
                            </p>
                            {submission.submissionUrl && (
                              <a
                                href={submission.submissionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View your submission
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {assignment.fileUrl && (
                        <a
                          href={assignment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors text-center"
                        >
                          View Question
                        </a>
                      )}
                      {!hasSubmitted && (
                        <button
                          onClick={() => setShowSubmitModal(assignment._id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Submit Assignment
                        </button>
                      )}
                      {hasSubmitted && (
                        <button
                          onClick={() => handleDeleteSubmission(assignment._id)}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                        >
                          Delete Submission
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {assignments.length === 0 && (
              <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-600 text-xl font-semibold mb-2">
                  No assignments yet
                </p>
                <p className="text-gray-500 text-sm">
                  New assignments will appear here when your teachers post them
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Assignment Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Submit Assignment</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File to Upload
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.ppt,.pptx,.odp,.xls,.xlsx,.ods,.csv,.jpeg,.jpg,.png,.gif,.webp,.svg,.bmp,.zip,.rar,.7z,.mp4,.mp3,.wav,.avi,.mkv,.mov"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported: PDF, Word, PowerPoint, Excel, Images, Archives, Audio/Video (Max 10MB)
              </p>
            </div>

            {selectedFile && (
              <p className="text-sm text-gray-600 mb-4">
                Selected: {selectedFile.name}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit(showSubmitModal)}
                disabled={submitting || !selectedFile}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(null);
                  setSelectedFile(null);
                }}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentDashboardLayout>
  );
};

export default StudentAssignment;
