import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import {
  getRevalCatalogAPI,
  submitRevalApplicationAPI,
  getMyRevalApplicationsAPI,
} from "../../utils/Api";
import { StudentContext } from "../student/StudentContext";
import StudentDashboardLayout from "../student/StudentDashboardLayout";
import RazorpayRevalForm from "../../RazorpayRevalForm";

const REVAL_PRICE = 250;
const PHOTOCOPY_PRICE = 50;

const StudentRevaluation = () => {
  const { student } = useContext(StudentContext);
  const [catalog, setCatalog] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [existingApplications, setExistingApplications] = useState([]);

  // Payment redirect state
  const [paymentData, setPaymentData] = useState(null);

  // Form state
  const [applicationType, setApplicationType] = useState("revaluation");
  const [formData, setFormData] = useState({
    studentName: "",
    rollNumber: "",
    contactNumber: "",
    course: "",
    batch: "",
  });
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  useEffect(() => {
    fetchCatalogAndApplications();
  }, []); // eslint-disable-line

  useEffect(() => {
    // Auto-fill from student context
    if (student) {
      const details = student.studentDetails || {};
      const academic = student.academicDetails || {};
      const fullName = [details.firstName, details.middleName, details.lastName]
        .filter(Boolean)
        .join(" ");
      setFormData((prev) => ({
        ...prev,
        studentName: fullName || prev.studentName,
        rollNumber: academic.rollNumber || prev.rollNumber,
        contactNumber: details.studentMobileNumber || prev.contactNumber,
      }));
    }
  }, [student]);

  const fetchCatalogAndApplications = async () => {
    try {
      setLoading(true);
      const [catalogRes, appsRes] = await Promise.all([
        getRevalCatalogAPI().catch((err) => err.response?.data || {}),
        getMyRevalApplicationsAPI().catch(() => ({ applications: [] })),
      ]);

      if (catalogRes.hasActiveSession) {
        setHasActiveSession(true);
        setSession(catalogRes.session || null);
        setRegistrationOpen(catalogRes.registrationOpen || false);
        if (catalogRes.catalog) {
          setCatalog(catalogRes.catalog);
        }
      }

      setExistingApplications(appsRes.applications || []);
    } catch (error) {
      toast.error("Failed to load revaluation data");
    } finally {
      setLoading(false);
    }
  };

  // Derive batches when course changes
  useEffect(() => {
    if (!catalog || !formData.course) {
      setAvailableBatches([]);
      setAvailableSubjects([]);
      setSelectedSubjects([]);
      return;
    }
    const courseData = catalog.courses?.find(
      (c) => c.value === formData.course,
    );
    if (courseData) {
      setAvailableBatches(
        courseData.batches.map((bKey) => ({
          key: bKey,
          label: catalog.batches[bKey]?.label || bKey,
        })),
      );
    } else {
      setAvailableBatches([]);
    }
    setFormData((prev) => ({ ...prev, batch: "" }));
    setAvailableSubjects([]);
    setSelectedSubjects([]);
  }, [formData.course, catalog]);

  // Derive subjects when batch changes
  useEffect(() => {
    if (!catalog || !formData.batch) {
      setAvailableSubjects([]);
      setSelectedSubjects([]);
      return;
    }
    const batchData = catalog.batches?.[formData.batch];
    if (batchData) {
      setAvailableSubjects(batchData.subjects || []);
    } else {
      setAvailableSubjects([]);
    }
    setSelectedSubjects([]);
  }, [formData.batch, catalog]);

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );
  };

  const pricePerSubject =
    applicationType === "revaluation" ? REVAL_PRICE : PHOTOCOPY_PRICE;
  const totalAmount = selectedSubjects.length * pricePerSubject;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubjects.length) {
      return toast.error("Select at least one subject");
    }
    if (!formData.studentName || !formData.rollNumber || !formData.contactNumber) {
      return toast.error("All personal details are required");
    }

    try {
      setSubmitting(true);
      const res = await submitRevalApplicationAPI({
        ...formData,
        subjects: selectedSubjects,
        applicationType,
      });

      if (res.order) {
        setPaymentData({
          order_id: res.order.id,
          key_id: res.key,
          callback_url: res.callback_url,
          user: res.user,
          revalApplicationId: res.data?.applicationId,
          applicationType,
        });
      } else {
        toast.success(res.message || "Application submitted");
        fetchCatalogAndApplications();
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to submit application",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // If payment redirect is active, render the hidden Razorpay form
  if (paymentData) {
    return <RazorpayRevalForm {...paymentData} />;
  }

  // Check for existing paid applications of same type in current session
  const hasPaidRevaluation = existingApplications.some(
    (a) =>
      a.applicationType === "revaluation" &&
      a.paymentStatus === "paid" &&
      a.sessionId === session?.id,
  );
  const hasPaidPhotocopy = existingApplications.some(
    (a) =>
      a.applicationType === "photocopy" &&
      a.paymentStatus === "paid" &&
      a.sessionId === session?.id,
  );

  const currentTypeAlreadyPaid =
    applicationType === "revaluation" ? hasPaidRevaluation : hasPaidPhotocopy;

  return (
    <StudentDashboardLayout>
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : !hasActiveSession ? (
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">
            Revaluation / Photocopy
          </h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <i className="mdi mdi-information-outline text-5xl text-yellow-500 mb-4"></i>
            <p className="text-lg text-gray-700">
              No active revaluation/photocopy session available at this time.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please check back later.
            </p>
          </div>
        </div>
      ) : !registrationOpen ? (
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">
            Revaluation / Photocopy
          </h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <i className="mdi mdi-clock-outline text-5xl text-yellow-500 mb-4"></i>
            <p className="text-lg text-gray-700">Registration is currently closed.</p>
            {session && (
              <p className="text-sm text-gray-500 mt-2">
                Registration period:{" "}
                {new Date(session.registrationStartDate).toLocaleDateString("en-IN")} -{" "}
                {new Date(session.registrationEndDate).toLocaleDateString("en-IN")}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Revaluation / Photocopy Application
            </h1>
            <p className="text-gray-600 mt-1">{session?.title}</p>
            <p className="text-sm text-gray-500 mt-1">
              {session?.academicYear} | {session?.term}
            </p>
          </div>

          {/* Existing Paid Applications */}
          {existingApplications.filter((a) => a.paymentStatus === "paid").length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Your Submitted Applications
              </h2>
              <div className="space-y-4">
                {existingApplications
                  .filter((a) => a.paymentStatus === "paid")
                  .map((app) => (
                    <div
                      key={app._id}
                      className="p-4 border border-green-200 bg-green-50 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                              app.applicationType === "revaluation"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {app.applicationType === "revaluation"
                              ? "Revaluation"
                              : "Photocopy"}
                          </span>
                          <p className="text-sm text-gray-700 mt-2">
                            <strong>Subjects:</strong>{" "}
                            {(app.subjects || []).map((s) => s.label).join(", ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                            Paid
                          </span>
                          <p className="text-sm font-medium text-gray-700 mt-2">
                            Rs {app.amount}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Application Type */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Application Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    applicationType === "revaluation"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${hasPaidRevaluation ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="applicationType"
                    value="revaluation"
                    checked={applicationType === "revaluation"}
                    onChange={(e) => {
                      setApplicationType(e.target.value);
                      setSelectedSubjects([]);
                    }}
                    disabled={hasPaidRevaluation}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Revaluation</p>
                    <p className="text-sm text-gray-500">
                      Rs {REVAL_PRICE} per subject
                    </p>
                    {hasPaidRevaluation && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        Already submitted
                      </p>
                    )}
                  </div>
                </label>
                <label
                  className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    applicationType === "photocopy"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${hasPaidPhotocopy ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="applicationType"
                    value="photocopy"
                    checked={applicationType === "photocopy"}
                    onChange={(e) => {
                      setApplicationType(e.target.value);
                      setSelectedSubjects([]);
                    }}
                    disabled={hasPaidPhotocopy}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Photocopy</p>
                    <p className="text-sm text-gray-500">
                      Rs {PHOTOCOPY_PRICE} per subject
                    </p>
                    {hasPaidPhotocopy && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        Already submitted
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Section 2: Personal Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Personal Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        studentName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    required
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    value={formData.rollNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rollNumber: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    required
                    placeholder="Roll number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contactNumber: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    required
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Academic Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Academic Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course *
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        course: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    required
                    style={{ color: "#111827" }}
                  >
                    <option value="">Select Course</option>
                    {catalog?.courses?.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch *
                  </label>
                  <select
                    value={formData.batch}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        batch: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    required
                    disabled={!formData.course}
                    style={{ color: "#111827" }}
                  >
                    <option value="">Select Batch</option>
                    {availableBatches.map((b) => (
                      <option key={b.key} value={b.key}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Subject Selection */}
            {availableSubjects.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Select Subjects
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Choose the subjects for{" "}
                  {applicationType === "revaluation"
                    ? "revaluation"
                    : "photocopy"}{" "}
                  (Rs {pricePerSubject} per subject)
                </p>
                <div className="space-y-2">
                  {availableSubjects.map((subject) => (
                    <label
                      key={subject.id}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject.id)}
                        onChange={() => handleSubjectToggle(subject.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-900">{subject.label}</span>
                    </label>
                  ))}
                </div>

                {/* Fee summary */}
                {selectedSubjects.length > 0 && (
                  <div className="border-t pt-4 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-600">
                      {selectedSubjects.length} subject(s) selected
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      Total: Rs {totalAmount}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            {currentTypeAlreadyPaid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-700 font-medium">
                  You have already submitted and paid for{" "}
                  {applicationType === "revaluation"
                    ? "revaluation"
                    : "photocopy"}{" "}
                  in this session.
                </p>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    submitting || selectedSubjects.length === 0
                  }
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="mdi mdi-send"></i>
                      Submit & Pay Rs {totalAmount}
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </StudentDashboardLayout>
  );
};

export default StudentRevaluation;
