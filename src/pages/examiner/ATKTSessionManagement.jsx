import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getAtktSessionsAPI,
  createAtktSessionAPI,
  updateAtktSessionAPI,
  activateAtktSessionAPI,
  deactivateAtktSessionAPI,
  closeAtktSessionAPI,
  deleteAtktSessionAPI,
} from "../../utils/Api";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import { useNavigate } from "react-router-dom";

const ATKTSessionManagement = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    academicYear: "",
    term: "",
    registrationStartDate: "",
    registrationEndDate: "",
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
      const response = await getAtktSessionsAPI();
      setSessions(response.sessions || []);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      toast.error("Failed to load ATKT sessions");
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
        registrationStartDate: session.registrationStartDate.split("T")[0],
        registrationEndDate: session.registrationEndDate.split("T")[0],
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
        registrationStartDate: "",
        registrationEndDate: "",
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
      registrationStartDate: "",
      registrationEndDate: "",
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
        await updateAtktSessionAPI(editingSession._id, formData);
        toast.success("Session updated successfully");
      } else {
        await createAtktSessionAPI(formData);
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
      await activateAtktSessionAPI(sessionId);
      toast.success("Session activated successfully");
      fetchSessions();
    } catch (error) {
      console.error("Failed to activate session:", error);
      toast.error(
        error?.response?.data?.message || "Failed to activate session",
      );
    }
  };

  const handleDeactivate = async (sessionId) => {
    try {
      await deactivateAtktSessionAPI(sessionId);
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
        await closeAtktSessionAPI(sessionId);
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
        "Are you sure you want to delete this session? This will also delete all subject configurations.",
      )
    ) {
      try {
        await deleteAtktSessionAPI(sessionId);
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

  const getStatusBadge = (session) => {
    const isActive = session.isActive;
    const status = session.status;

    if (status === "closed") {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white">
          Closed
        </span>
      );
    }
    if (isActive) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">
          Active
        </span>
      );
    }
    if (status === "draft") {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500 text-white">
          Draft
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-400 text-white">
        Inactive
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  ATKT Session Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Create and manage ATKT examination sessions
                </p>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
              >
                <i className="mdi mdi-plus"></i>
                Create New Session
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <i className="mdi mdi-calendar-blank text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-600 text-lg">No ATKT sessions found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Create your first session to get started
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {sessions.map((session) => (
                  <div
                    key={session._id}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {session.title}
                          </h3>
                          {getStatusBadge(session)}
                        </div>
                        <p className="text-gray-600 text-sm">
                          {session.description}
                        </p>
                        <div className="flex gap-4 mt-3 text-sm text-gray-600">
                          <span>
                            <strong>Academic Year:</strong>{" "}
                            {session.academicYear}
                          </span>
                          <span>
                            <strong>Term:</strong> {session.term}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/examiner/atkt-sessions/${session._id}/subjects`,
                            )
                          }
                          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          <i className="mdi mdi-book-open-variant mr-1"></i>
                          Subjects
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/examiner/atkt-sessions/${session._id}/submissions`,
                            )
                          }
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                        >
                          <i className="mdi mdi-file-document-multiple mr-1"></i>
                          Submissions
                        </button>
                        {session.status !== "closed" && (
                          <button
                            onClick={() => handleOpenModal(session)}
                            className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                          >
                            <i className="mdi mdi-pencil mr-1"></i>
                            Edit
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-600 font-medium mb-1">
                          Registration Period
                        </p>
                        <p className="text-gray-800">
                          {new Date(
                            session.registrationStartDate,
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(
                            session.registrationEndDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-600 font-medium mb-1">
                          Examination Period
                        </p>
                        <p className="text-gray-800">
                          {new Date(session.examStartDate).toLocaleDateString()}{" "}
                          - {new Date(session.examEndDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      {!session.isActive && session.status !== "closed" && (
                        <button
                          onClick={() => handleActivate(session._id)}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          <i className="mdi mdi-check-circle mr-1"></i>
                          Activate
                        </button>
                      )}
                      {session.isActive && session.status !== "closed" && (
                        <button
                          onClick={() => handleDeactivate(session._id)}
                          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                        >
                          <i className="mdi mdi-pause-circle mr-1"></i>
                          Deactivate
                        </button>
                      )}
                      {session.status !== "closed" && (
                        <button
                          onClick={() => handleClose(session._id)}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          <i className="mdi mdi-close-circle mr-1"></i>
                          Close Session
                        </button>
                      )}
                      {session.status === "draft" && (
                        <button
                          onClick={() => handleDelete(session._id)}
                          className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 text-sm ml-auto"
                        >
                          <i className="mdi mdi-delete mr-1"></i>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingSession ? "Edit Session" : "Create New Session"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="mdi mdi-close text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                  placeholder="e.g., ATKT Examination - Term 1 (AY 2024-2025)"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                    placeholder="e.g., 2024-2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term *
                  </label>
                  <select
                    name="term"
                    value={formData.term}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                    style={{ color: "#111827" }}
                    required
                  >
                    <option value="" style={{ color: "#111827" }}>
                      Select Term
                    </option>
                    <option value="Term 1" style={{ color: "#111827" }}>
                      Term 1
                    </option>
                    <option value="Term 2" style={{ color: "#111827" }}>
                      Term 2
                    </option>
                    <option value="Annual" style={{ color: "#111827" }}>
                      Annual
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Start Date *
                  </label>
                  <input
                    type="date"
                    name="registrationStartDate"
                    value={formData.registrationStartDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration End Date *
                  </label>
                  <input
                    type="date"
                    name="registrationEndDate"
                    value={formData.registrationEndDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Start Date *
                  </label>
                  <input
                    type="date"
                    name="examStartDate"
                    value={formData.examStartDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam End Date *
                  </label>
                  <input
                    type="date"
                    name="examEndDate"
                    value={formData.examEndDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                  rows="3"
                  placeholder="Optional description for this session"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  {editingSession ? "Update Session" : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATKTSessionManagement;
