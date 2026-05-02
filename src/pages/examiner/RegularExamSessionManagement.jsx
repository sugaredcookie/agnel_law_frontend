import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getRegularExamSessionsAPI,
  createRegularExamSessionAPI,
  updateRegularExamSessionAPI,
  activateRegularExamSessionAPI,
  deactivateRegularExamSessionAPI,
  closeRegularExamSessionAPI,
  deleteRegularExamSessionAPI,
  autoEnrollRegularExamStudentsAPI,
  getRegularExamSubjectConfigsAPI,
} from "../../utils/Api";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import { useNavigate } from "react-router-dom";

const RegularExamSessionManagement = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [sessionBatches, setSessionBatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    academicYear: "",
    term: "",
    examType: "",
    examStartDate: "",
    examEndDate: "",
    description: "",
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await getRegularExamSessionsAPI();
      const sessionsData = response.sessions || [];
      setSessions(sessionsData);

      // Fetch batch configurations for each session
      const batchesMap = {};
      for (const session of sessionsData) {
        try {
          const configResponse = await getRegularExamSubjectConfigsAPI(session._id);
          const configs = configResponse.configs || [];
          const batches = configs.map((c) => c.batchLabel || c.batch).filter(Boolean);
          batchesMap[session._id] = [...new Set(batches)];
        } catch (err) {
          batchesMap[session._id] = [];
        }
      }
      setSessionBatches(batchesMap);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      toast.error("Failed to load Regular Exam sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (session = null) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        title: session.title,
        academicYear: session.academicYear,
        term: session.term,
        examType: session.examType,
        examStartDate: session.examStartDate.split("T")[0],
        examEndDate: session.examEndDate.split("T")[0],
        description: session.description || "",
      });
    } else {
      setEditingSession(null);
      setFormData({
        title: "",
        academicYear: "",
        term: "",
        examType: "",
        examStartDate: "",
        examEndDate: "",
        description: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSession(null);
    setFormData({
      title: "",
      academicYear: "",
      term: "",
      examType: "",
      examStartDate: "",
      examEndDate: "",
      description: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSession) {
        await updateRegularExamSessionAPI(editingSession._id, formData);
        toast.success("Session updated successfully");
      } else {
        await createRegularExamSessionAPI(formData);
        toast.success("Session created successfully");
      }
      handleCloseModal();
      fetchSessions();
    } catch (error) {
      console.error("Failed to save session:", error);
      toast.error(error?.response?.data?.message || "Failed to save session");
    }
  };

  const handleActivate = async (sessionId) => {
    try {
      const response = await activateRegularExamSessionAPI(sessionId);
      
      // Check if there are overlap warnings
      if (response.overlapWarnings && response.overlapWarnings.length > 0) {
        const batchList = [...new Set(response.overlapWarnings.flatMap((w) => w.overlappingBatches))].join(", ");
        toast.warning(
          `Session activated with warning: Batch overlap detected for: ${batchList}. Students may be enrolled in multiple sessions.`,
          { autoClose: 8000 }
        );
      } else {
        toast.success(
          "Session activated successfully. Now you can trigger auto-enrollment.",
        );
      }
      fetchSessions();
    } catch (error) {
      console.error("Failed to activate session:", error);
      toast.error(
        error?.response?.data?.message || "Failed to activate session",
      );
    }
  };

  const handleAutoEnroll = async (sessionId) => {
    if (
      window.confirm(
        "This will automatically enroll all eligible students. Continue?",
      )
    ) {
      try {
        const response = await autoEnrollRegularExamStudentsAPI(sessionId);
        
        let message = response.message || `Successfully enrolled ${response.enrolledCount} students`;
        
        // Show warning if students were already in other sessions
        if (response.alreadyInOtherSessionCount > 0) {
          toast.warning(
            `${response.alreadyInOtherSessionCount} student(s) were already enrolled in another active session.`,
            { autoClose: 6000 }
          );
        }
        
        toast.success(message);
        fetchSessions();
      } catch (error) {
        console.error("Failed to auto-enroll students:", error);
        toast.error(
          error?.response?.data?.message || "Failed to auto-enroll students",
        );
      }
    }
  };

  const handleDeactivate = async (sessionId) => {
    try {
      await deactivateRegularExamSessionAPI(sessionId);
      toast.success("Session deactivated successfully");
      fetchSessions();
    } catch (error) {
      console.error("Failed to deactivate session:", error);
      toast.error(
        error?.response?.data?.message || "Failed to deactivate session",
      );
    }
  };

  const handleClose = async (sessionId) => {
    if (
      window.confirm(
        "Are you sure you want to close this session? This action cannot be undone.",
      )
    ) {
      try {
        await closeRegularExamSessionAPI(sessionId);
        toast.success("Session closed successfully");
        fetchSessions();
      } catch (error) {
        console.error("Failed to close session:", error);
        toast.error(
          error?.response?.data?.message || "Failed to close session",
        );
      }
    }
  };

  const handleDelete = async (sessionId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this session? This will also delete all related configurations.",
      )
    ) {
      try {
        await deleteRegularExamSessionAPI(sessionId);
        toast.success("Session deleted successfully");
        fetchSessions();
      } catch (error) {
        console.error("Failed to delete session:", error);
        toast.error(
          error?.response?.data?.message || "Failed to delete session",
        );
      }
    }
  };

  const navigateToSubjectConfig = (sessionId) => {
    navigate(`/examiner/regular-exam-sessions/${sessionId}/subjects`);
  };

  const navigateToEnrollments = (sessionId) => {
    navigate(`/examiner/regular-exam-sessions/${sessionId}/enrollments`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen text-black dark:text-white">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 max-w-7xl mx-auto mt-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold">
                  Regular Exam Session Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Create and manage regular examination sessions
                </p>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                + New Session
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No exam sessions found. Create your first session to get
                started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="border border-gray-300 px-4 py-3 text-left">
                        Title
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left max-w-[150px]">
                        Batches
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left">
                        Academic Year
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left">
                        Term
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left">
                        Exam Type
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left">
                        Status
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left">
                        Exam Period
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr
                        key={session._id}
                        className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <td className="border border-gray-300 px-4 py-3">
                          {session.title}
                          {session.isActive && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 max-w-[150px]">
                          {sessionBatches[session._id]?.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                              {sessionBatches[session._id].map((batch, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full whitespace-nowrap"
                                >
                                  {batch}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">None</span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          {session.academicYear}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          {session.term}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          {session.examType}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              session.isActive
                                ? "bg-green-100 text-green-800"
                                : session.status === "closed"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {session.isActive
                              ? "active"
                              : session.status === "active"
                                ? "draft"
                                : session.status}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {new Date(
                            session.examStartDate,
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(session.examEndDate).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex flex-wrap gap-2 justify-center">
                            {session.status !== "closed" && (
                              <>
                                <button
                                  onClick={() =>
                                    navigateToSubjectConfig(session._id)
                                  }
                                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                                  title="Configure Subjects"
                                >
                                  Subjects
                                </button>
                                {!session.isActive ? (
                                  <button
                                    onClick={() => handleActivate(session._id)}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                  >
                                    Activate
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleAutoEnroll(session._id)
                                      }
                                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                    >
                                      Auto-Enroll
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeactivate(session._id)
                                      }
                                      className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs"
                                    >
                                      Deactivate
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleOpenModal(session)}
                                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                                >
                                  Edit
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => navigateToEnrollments(session._id)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs"
                            >
                              View Enrollments
                            </button>
                            {session.status !== "closed" && (
                              <button
                                onClick={() => handleClose(session._id)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                              >
                                Close
                              </button>
                            )}
                            {session.status === "draft" && (
                              <button
                                onClick={() => handleDelete(session._id)}
                                className="px-3 py-1 bg-red-800 text-white rounded hover:bg-red-900 text-xs"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
                {editingSession ? "Edit Session" : "Create New Session"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full p-2 border-2 border-blue-500 rounded-md bg-white text-black"
                      required
                      placeholder="e.g., Semester I Final Exam - December 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                      Academic Year *
                    </label>
                    <input
                      type="text"
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleInputChange}
                      className="w-full p-2 border-2 border-blue-500 rounded-md bg-white text-black"
                      required
                      placeholder="e.g., 2024-25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                      Term *
                    </label>
                    <select
                      name="term"
                      value={formData.term}
                      onChange={handleInputChange}
                      className="w-full p-2 border-2 border-blue-500 rounded-md bg-white text-black"
                      required
                    >
                      <option value="">Select Term</option>
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Annual">Annual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                      Exam Type *
                    </label>
                    <input
                      type="text"
                      name="examType"
                      value={formData.examType}
                      onChange={handleInputChange}
                      className="w-full p-2 border-2 border-blue-500 rounded-md bg-white text-black"
                      required
                      placeholder="e.g., Mid-Term, End-Term, Unit Test"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                      Exam Start Date *
                    </label>
                    <input
                      type="date"
                      name="examStartDate"
                      value={formData.examStartDate}
                      onChange={handleInputChange}
                      className="w-full p-2 border-2 border-blue-500 rounded-md bg-white text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                      Exam End Date *
                    </label>
                    <input
                      type="date"
                      name="examEndDate"
                      value={formData.examEndDate}
                      onChange={handleInputChange}
                      className="w-full p-2 border-2 border-blue-500 rounded-md bg-white text-black"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-black dark:text-white">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full p-2 border-2 border-blue-500 rounded-md bg-white text-black"
                      rows="3"
                      placeholder="Additional information about this exam session"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingSession ? "Update Session" : "Create Session"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegularExamSessionManagement;
