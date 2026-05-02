import React, { useContext, useEffect, useState } from "react";
import FacultyDashboardLayout from "../FacultyDashboardLayout";
import {
  createAssignment,
  fetchAssignmentsBySubject,
  getFacultyDetails,
  getFacultySubjectsByBatch,
  getAssignmentSubmissions,
  removeAssignment,
} from "../../../utils/Api";
import { toast } from "react-toastify";
import { FacultyContext } from "../FacultyContext";

const Assignment = () => {
  const faculty_data = useContext(FacultyContext).faculty;
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showSubmissions, setShowSubmissions] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const facultyId = faculty_data._id;

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const fetchFacultyData = async () => {
    try {
      const res = await getFacultyDetails();
      setBatches(res.batches);
    } catch (error) {
      console.error("Error fetching faculty data:", error);
      toast.error("Error fetching batches");
    }
  };

  const handleBatchChange = async (batchId) => {
    const batch = batches.find((b) => b._id === batchId);
    setSelectedBatch(batch);
    setSubjects([]);
    setAssignments({});

    if (batchId) {
      try {
        setLoadingSubjects(true);
        const res = await getFacultySubjectsByBatch(batchId);
        setSubjects(res.subjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast.error("Failed to load subjects for this batch");
      } finally {
        setLoadingSubjects(false);
      }
    }
  };

  const handleSubjectClick = async (subject) => {
    if (!selectedBatch) {
      toast.error("Please select a batch first");
      return;
    }
    try {
      const assignmentRes = await fetchAssignmentsBySubject(
        subject._id,
        facultyId,
        selectedBatch._id,
      );
      setAssignments((prev) => ({
        ...prev,
        [subject._id]: assignmentRes.assignments,
      }));
    } catch (error) {
      console.error("Error fetching subject data:", error);
      toast.error("Error loading assignments for this subject");
    }
  };

  const handleCreateAssignment = (subject) => {
    if (!selectedBatch) {
      toast.error("Please select a batch first");
      return;
    }
    setSelectedSubject(subject);
    setShowForm(true);
    setFormData({
      title: "",
      description: "",
      deadline: "",
      file: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      if (files[0].size > 10 * 1024 * 1024) {
        toast.error("File size cannot exceed 10MB");
        e.target.value = null;
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleDelete = async (assignmentId, subjectId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this assignment?")) {
        return;
      }
      await removeAssignment(assignmentId);
      toast.success("Assignment deleted successfully");
      // Refresh assignments for this subject with batch filter
      const assignmentRes = await fetchAssignmentsBySubject(
        subjectId,
        facultyId,
        selectedBatch._id,
      );
      setAssignments((prev) => ({
        ...prev,
        [subjectId]: assignmentRes.assignments,
      }));
    } catch (error) {
      toast.error("Error deleting assignment");
    }
  };

  const handleViewSubmissions = async (assignmentId, assignmentTitle) => {
    try {
      setLoadingSubmissions(true);
      setShowSubmissions({ id: assignmentId, title: assignmentTitle });
      const response = await getAssignmentSubmissions(assignmentId);
      setSubmissions(response.data.submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Error loading submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        title: formData.title,
        description: formData.description,
        subject: {
          id: selectedSubject._id,
          name: selectedSubject.subjectName,
        },
        batch: {
          id: selectedBatch._id,
          name: selectedBatch.batchName,
        },
        dueDate: formData.deadline,
        faculty: facultyId,
      };

      if (formData.file) {
        dataToSend.file = formData.file;
        dataToSend.fileName = formData.file.name;
      }

      await createAssignment(dataToSend);

      toast.success("Assignment created successfully!");

      // Refresh assignments for this subject with batch filter
      const assignmentRes = await fetchAssignmentsBySubject(
        selectedSubject._id,
        facultyId,
        selectedBatch._id,
      );
      setAssignments((prev) => ({
        ...prev,
        [selectedSubject._id]: assignmentRes.assignments,
      }));

      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        deadline: "",
        file: null,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FacultyDashboardLayout>
      <h1 className="mb-4 text-2xl font-bold">Assignments</h1>

      {/* Batch Selection */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Batch
        </label>
        <select
          value={selectedBatch?._id || ""}
          onChange={(e) => handleBatchChange(e.target.value)}
          className="w-full md:w-64 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Select a Batch --</option>
          {batches.map((batch) => (
            <option key={batch._id} value={batch._id}>
              {batch.batchName}
            </option>
          ))}
        </select>
        {selectedBatch && (
          <p className="mt-2 text-sm text-gray-600">
            Viewing assignments for: <strong>{selectedBatch.batchName}</strong>
          </p>
        )}
      </div>

      {/* Subjects and Assignments */}
      {!selectedBatch ? (
        <div className="text-center py-8 text-gray-500">
          Please select a batch to view subjects and assignments
        </div>
      ) : loadingSubjects ? (
        <div className="text-center py-8 text-gray-500">
          Loading subjects...
        </div>
      ) : (
        <div className="space-y-6">
          {subjects.map((subject, index) => (
          <div
            key={subject._id}
            className="p-4 border rounded-lg bg-white shadow-sm"
          >
            <div
              className="cursor-pointer"
              onClick={() => handleSubjectClick(subject)}
            >
              <h2 className="text-xl font-semibold">
                {index + 1}. {subject.subjectName}
              </h2>
              <p className="text-gray-600">{subject.description}</p>
            </div>

            {assignments[subject._id] && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Assignments</h3>
                  <button
                    onClick={() => handleCreateAssignment(subject)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    + Create Assignment
                  </button>
                </div>

                <div className="space-y-3">
                  {assignments[subject._id].length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No assignments created yet for this subject
                    </p>
                  ) : (
                    assignments[subject._id].map((assignment) => (
                      <div
                        key={assignment._id}
                        className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">
                              {assignment.title}
                            </h4>
                            <p className="text-gray-600 mt-1">
                              {assignment.description}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                              <span>
                                📅 Due:{" "}
                                {new Date(
                                  assignment.dueDate,
                                ).toLocaleDateString()}{" "}
                                {new Date(
                                  assignment.dueDate,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span>
                                🕒 Created:{" "}
                                {new Date(
                                  assignment.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {assignment.fileUrl && (
                              <a
                                href={assignment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                              >
                                <span>
                                  📎 View{" "}
                                  {assignment.type === "image"
                                    ? "Image"
                                    : "Document"}
                                </span>
                              </a>
                            )}
                            <button
                              onClick={() =>
                                handleViewSubmissions(
                                  assignment._id,
                                  assignment.title,
                                )
                              }
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              View Submissions
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(assignment._id, subject._id)
                              }
                              className="text-red-500 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {subjects.length === 0 && (
          <p className="text-center text-gray-500">
            No subjects assigned to you in this batch
          </p>
        )}
      </div>
      )}

      {/* Assignment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white mt-16 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Create Assignment for {selectedSubject?.subjectName} ({selectedBatch?.batchName})
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="font-medium">Assignment Title:</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Chapter 5 Exercise"
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-medium">Description:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                  placeholder="Describe the assignment requirements..."
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-medium">
                  Upload Assignment (Optional):
                </label>
                <input
                  type="file"
                  name="file"
                  onChange={handleInputChange}
                  accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.ppt,.pptx,.odp,.xls,.xlsx,.ods,.csv,.jpeg,.jpg,.png,.gif,.webp,.svg,.bmp,.zip,.rar,.7z,.mp4,.mp3,.wav,.avi,.mkv,.mov"
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500">
                  Supported: PDF, Word, PowerPoint, Excel, Images, Archives, Audio/Video (Max 10MB)
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-medium">Deadline:</label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-blue-300"
                >
                  {loading ? "Creating..." : "Create Assignment"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white mt-16 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Submissions for: {showSubmissions.title}
              </h2>
              <button
                onClick={() => {
                  setShowSubmissions(null);
                  setSubmissions([]);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                X
              </button>
            </div>

            {loadingSubmissions ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    Total Submissions: {submissions.length}
                  </p>
                </div>

                <div className="space-y-3">
                  {submissions.map((submission, index) => (
                    <div
                      key={submission._id}
                      className="p-4 border rounded-lg bg-gray-50 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">
                            {index + 1}.{" "}
                            {submission.studentName ||
                              `${submission.student?.studentDetails?.firstName || ""} ${submission.student?.studentDetails?.lastName || ""}`.trim()}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Roll No:{" "}
                            {submission.student?.academicDetails?.rollNumber ||
                              "N/A"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm">
                            <span className="text-gray-600">
                              Submitted:{" "}
                              {new Date(
                                submission.submissionDate,
                              ).toLocaleDateString()}{" "}
                              {new Date(
                                submission.submissionDate,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span
                              className={`px-2 py-1 rounded ${
                                submission.status === "late"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {submission.status === "late"
                                ? "Late Submission"
                                : "On Time"}
                            </span>
                          </div>
                        </div>
                        <div>
                          {submission.submissionUrl && (
                            <a
                              href={submission.submissionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              View File
                            </a>
                          )}
                        </div>
                      </div>
                      {submission.fileName && (
                        <p className="text-sm text-gray-500 mt-2">
                          File: {submission.fileName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </FacultyDashboardLayout>
  );
};

export default Assignment;
