import React, { useState, useEffect, useCallback } from "react";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import {
  getAtktFormsAPI,
  getAtktCatalogAPI,
  getAtktStatusAPI,
  toggleAtktStatusAPI,
  updateAtktFormAPI,
  deleteAtktFormAPI,
  downloadAtktHallTicketAPI,
  downloadAtktFormsExcelAPI,
  startAtktBulkHallTicketJobAPI,
  getAtktBulkHallTicketJobStatusAPI,
  downloadAtktBulkHallTicketResultAPI,
} from "../../utils/Api";
import { toast } from "react-toastify";
import GenericJobProgressBar from "../../components/GenericJobProgressBar";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const ExaminerATKTSubmissions = () => {
  const [forms, setForms] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    course: "",
    batch: "",
    pattern: "",
    search: "",
    startDate: "",
    endDate: "",
    batchMismatch: "",
    batchName: "",
    paymentStatus: "",
  });
  const [catalog, setCatalog] = useState(null);
  const [editingForm, setEditingForm] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingFormId, setDeletingFormId] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await getAtktCatalogAPI();
        setCatalog(response.catalog);
      } catch (error) {
        console.error("Failed to load catalog", error);
      }
    };
    fetchCatalog();
  }, []);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAtktFormsAPI(filters);
      setForms(response.forms);
      setPagination(response.pagination);
    } catch (error) {
      toast.error("Failed to fetch ATKT forms");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchForms();
    fetchStatus();
  }, [fetchForms]);

  const fetchStatus = async () => {
    try {
      const response = await getAtktStatusAPI();
      setStatus(response);
    } catch (error) {
      console.error("Failed to fetch status", error);
    }
  };

  const handleToggleStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await toggleAtktStatusAPI();
      setStatus(response);
      toast.success(
        `ATKT form ${response.enabled ? "enabled" : "disabled"} for students`,
      );
    } catch (error) {
      toast.error("Failed to toggle status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleEdit = (form) => {
    setEditingForm(form);
    setEditFormData({
      studentName: form.studentName,
      rollNumber: form.rollNumber,
      contactNumber: form.contactNumber,
      course: form.course,
      batch: form.batch,
      pattern: form.pattern,
      subjects: form.subjects,
    });
    setShowEditModal(true);
  };

  const handleUpdateForm = async () => {
    try {
      await updateAtktFormAPI(editingForm._id, editFormData);
      toast.success("Form updated successfully");
      setShowEditModal(false);
      setEditingForm(null);
      fetchForms();
    } catch (error) {
      toast.error("Failed to update form");
    }
  };

  const handleDelete = (formId) => {
    setDeletingFormId(formId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteAtktFormAPI(deletingFormId);
      toast.success("Form deleted successfully");
      setShowDeleteModal(false);
      setDeletingFormId(null);
      fetchForms();
    } catch (error) {
      toast.error("Failed to delete form");
    }
  };

  const handleDownloadHallTicket = async (form) => {
    try {
      if (form.paymentStatus !== "paid") {
        toast.error("Hall ticket is only available for paid forms");
        return;
      }

      toast.info("Generating hall ticket...");
      const blob = await downloadAtktHallTicketAPI(form._id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HallTicket_${form.rollNumber}_${form.studentName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Hall ticket downloaded successfully");
    } catch (error) {
      console.error("Error downloading hall ticket:", error);
      toast.error(
        error.response?.data?.message || "Failed to download hall ticket",
      );
    }
  };

  const handleBulkDownloadHallTickets = async () => {
    try {
      // Exclude pagination params for bulk download
      const { page, limit, ...bulkFilters } = filters;

      const response = await startAtktBulkHallTicketJobAPI(bulkFilters);
      setJobId(response.jobId);
      toast.info("Bulk hall ticket generation started...");
    } catch (error) {
      console.error("Failed to start bulk download job:", error);
      toast.error(
        error.response?.data?.message || "Failed to start bulk download.",
      );
    }
  };

  const handleJobComplete = async (completedJobId) => {
    try {
      toast.info("Downloading generated hall tickets...");
      const blob = await downloadAtktBulkHallTicketResultAPI(completedJobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ATKT_Hall_Tickets_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Hall tickets downloaded successfully!");
      setJobId(null);
    } catch (error) {
      console.error("Failed to download result:", error);
      toast.error("Failed to download result.");
    }
  };

  const exportToExcel = async () => {
    if (!forms || forms.length === 0) {
      toast.info("No submissions to export");
      return;
    }

    try {
      const response = await downloadAtktFormsExcelAPI(filters);

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `atkt_submissions_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel file");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen text-black dark:text-white">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 max-w-6xl mx-auto mt-10">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">A.T.K.T Submissions</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Total Submissions: {pagination.total || 0}
                </span>
                <span className="text-sm text-gray-600">
                  Status: {status?.enabled ? "Enabled" : "Disabled"} for
                  students
                </span>
                <button
                  onClick={handleToggleStatus}
                  disabled={statusLoading}
                  className={`px-4 py-2 rounded ${
                    status?.enabled
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  } disabled:opacity-50`}
                >
                  {statusLoading
                    ? "Loading..."
                    : status?.enabled
                      ? "Disable"
                      : "Enable"}
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                <select
                  name="course"
                  value={filters.course}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                >
                  <option value="">All Courses</option>
                  {catalog?.courses.map((course) => (
                    <option key={course.id} value={course.value}>
                      {course.label}
                    </option>
                  ))}
                </select>
                <select
                  name="batch"
                  value={filters.batch}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                >
                  <option value="">All Batches</option>
                  {catalog?.batches &&
                    Object.entries(catalog.batches).map(([key, batch]) => (
                      <option key={key} value={key}>
                        {batch.label}
                      </option>
                    ))}
                </select>
                {/* <select
                  name="batchName"
                  value={filters.batchName}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                >
                  <option value="">All Batch Names</option>
                  {batchNames.map((batchName) => (
                    <option key={batchName} value={batchName}>
                      {batchName}
                    </option>
                  ))}
                </select> */}
                <select
                  name="pattern"
                  value={filters.pattern}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                >
                  <option value="">All Patterns</option>
                  {catalog?.patterns.map((pattern) => (
                    <option key={pattern.id} value={pattern.value}>
                      {pattern.label}
                    </option>
                  ))}
                </select>
                {/* <select
                  name="batchMismatch"
                  value={filters.batchMismatch}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                >
                  <option value="">All Status</option>
                  <option value="false">OK</option>
                  <option value="true">Batch Mismatch</option>
                </select> */}
                <select
                  name="paymentStatus"
                  value={filters.paymentStatus}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                >
                  {/* <option value="">All Payment Statuses</option> */}
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="p-2 w-full md:w-auto border rounded"
                  placeholder="Search by name, roll no., contact..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                  placeholder="End Date"
                />
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Export to Excel
                </button>
                <button
                  onClick={handleBulkDownloadHallTickets}
                  disabled={jobId !== null}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Bulk Download Hall Tickets
                </button>
              </div>
            </div>

            {/* Job Progress Bar */}
            {jobId && (
              <GenericJobProgressBar
                jobId={jobId}
                getStatusAPI={getAtktBulkHallTicketJobStatusAPI}
                onComplete={handleJobComplete}
                onCancel={() => setJobId(null)}
                title="ATKT Hall Ticket Generation Progress"
              />
            )}

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Student Name</th>
                      <th className="border p-2">Roll Number</th>
                      <th className="border p-2">Contact</th>
                      <th className="border p-2">Course</th>
                      <th className="border p-2">Batch</th>
                      <th className="border p-2">Pattern</th>
                      <th className="border p-2">Subjects</th>
                      <th className="border p-2">Date</th>
                      <th className="border p-2">Payment Status</th>
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forms.map((form) => (
                      <tr
                        key={form._id}
                        className={
                          form.batchMismatch
                            ? "bg-yellow-100 border-yellow-300"
                            : ""
                        }
                      >
                        <td className="border p-2">{form.studentName}</td>
                        <td className="border p-2">{form.rollNumber}</td>
                        <td className="border p-2">{form.contactNumber}</td>
                        <td className="border p-2">{form.course}</td>
                        <td className="border p-2">
                          {form.batch}
                          {form.batchMismatch && (
                            <span className="text-xs text-red-600 block">
                              Assigned: {form.assignedBatch}
                            </span>
                          )}
                        </td>
                        <td className="border p-2">{form.pattern}</td>
                        <td className="border p-2">
                          {form.subjects.map((s) => s.label).join(", ")}
                        </td>
                        <td className="border p-2">
                          {formatDateTime(form.createdAt)}
                        </td>
                        <td className="border p-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                              (form.paymentStatus || "").toLowerCase() ===
                              "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {(form.paymentStatus || "pending").toUpperCase()}
                          </span>
                          {form.paymentDetails?.captured === false && (
                            <span className="block text-xs text-orange-600 mt-1">
                              Awaiting capture
                            </span>
                          )}
                        </td>
                        <td className="border p-2">
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(form)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(form._id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                            {form.paymentStatus === "paid" && (
                              <button
                                onClick={() => handleDownloadHallTicket(form)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Download Hall Ticket
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
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <select
                  name="limit"
                  value={filters.limit}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-black">
              Edit ATKT Form
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.studentName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        studentName: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.rollNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        rollNumber: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.contactNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        contactNumber: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Course
                  </label>
                  <select
                    value={editFormData.course}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        course: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  >
                    <option value="">Select Course</option>
                    {catalog?.courses.map((course) => (
                      <option key={course.id} value={course.value}>
                        {course.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Batch
                  </label>
                  <select
                    value={editFormData.batch}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        batch: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  >
                    <option value="">Select Batch</option>
                    {catalog?.batches &&
                      Object.entries(catalog.batches).map(([key, batch]) => (
                        <option key={key} value={key}>
                          {batch.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Pattern
                  </label>
                  <select
                    value={editFormData.pattern}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        pattern: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  >
                    <option value="">Select Pattern</option>
                    {catalog?.patterns.map((pattern) => (
                      <option key={pattern.id} value={pattern.value}>
                        {pattern.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Subjects
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
                  {editFormData.subjects?.map((subject, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <span className="text-gray-900 flex-1">
                        {subject.label}
                      </span>
                      <button
                        onClick={() => {
                          const newSubjects = editFormData.subjects.filter(
                            (_, i) => i !== index,
                          );
                          setEditFormData({
                            ...editFormData,
                            subjects: newSubjects,
                          });
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateForm}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-black">
              Confirm Delete
            </h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete this ATKT form? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExaminerATKTSubmissions;
