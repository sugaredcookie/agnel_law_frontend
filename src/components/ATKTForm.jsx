import React, { useEffect, useMemo, useState, useContext } from "react";
import { toast } from "react-toastify";
import {
  getAtktCatalogAPI,
  submitAtktFormAPI,
  downloadReceiptPDF,
} from "../utils/Api";
import { StudentContext } from "../pages/student/StudentContext";
import RazorpayATKTForm from "../RazorpayATKTForm";
import { useLocation } from "react-router-dom";

const initialFormState = {
  studentName: "",
  rollNumber: "",
  contactNumber: "",
  course: "",
  batch: "",
  pattern: "",
};

const getBatchBase = (batchName) => {
  if (!batchName) return "";
  const parts = batchName.split("-");
  if (
    parts.length > 1 &&
    parts[parts.length - 1].length === 1 &&
    /^[A-Z0-9]$/i.test(parts[parts.length - 1])
  ) {
    return parts.slice(0, -1).join("-");
  }
  return batchName;
};

const ATKTForm = ({
  portal = "student",
  existingForm = null,
  paidSubjectIds = [],
  examSessionId = null,
}) => {
  const { student } = useContext(StudentContext);
  const [formData, setFormData] = useState(initialFormState);
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [catalog, setCatalog] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [redirectingToPayment, setRedirectingToPayment] = useState(false);
  const [paymentPayload, setPaymentPayload] = useState(null);
  const [showBatchWarning, setShowBatchWarning] = useState(false);
  const [batchMismatch, setBatchMismatch] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("payment_status") === "success") {
      toast.success("Payment completed successfully!");
    }
  }, [location]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoadingCatalog(true);
        const response = await getAtktCatalogAPI(examSessionId);

        // Handle new API response structure with session validation
        if (!response.hasActiveSession) {
          toast.warning(
            "No active ATKT examination session is currently open.",
          );
        } else if (!response.registrationOpen) {
          toast.info(
            `Registration closed. Current session: ${response.session?.title || "N/A"}`,
          );
        }

        setCatalog(response.catalog);
      } catch (error) {
        console.error("Failed to load ATKT catalog", error);

        const errorData = error.response?.data;

        // Handle case where backend returns 404/400 for no active session but includes the data
        if (
          errorData?.hasActiveSession === false ||
          errorData?.message === "No active ATKT exam session available"
        ) {
          toast.warning("No active ATKT examination session is currently open.");
          setCatalog(
            errorData?.catalog || { courses: [], patterns: [], batches: {} },
          );
        } else {
          toast.error(
            errorData?.message ||
              "Unable to load A.T.K.T subjects. Please try again later.",
          );
        }
      } finally {
        setLoadingCatalog(false);
      }
    };

    fetchCatalog();
  }, [examSessionId]);

  // Auto-fill student data for student portal or existing form data
  useEffect(() => {
    if (existingForm) {
      // Pre-populate with existing form data
      setFormData({
        studentName: existingForm.studentName || "",
        rollNumber: existingForm.rollNumber || "",
        contactNumber: existingForm.contactNumber || "",
        course: existingForm.course || "",
        batch: existingForm.batch || "",
        pattern: existingForm.pattern || "",
      });

      // Set selected subjects from existing form
      if (existingForm.subjects && Array.isArray(existingForm.subjects)) {
        const subjectIds = existingForm.subjects
          .filter((subject) => subject.type !== "section")
          .map((subject) => subject.id);
        setSelectedSubjects(new Set(subjectIds));
      }
    } else if (
      portal === "student" &&
      student &&
      student.studentDetails &&
      student.academicDetails
    ) {
      const studentDetails = student.studentDetails;
      const academicDetails = student.academicDetails;

      // Build full name
      const fullName = [
        studentDetails.firstName,
        studentDetails.middleName,
        studentDetails.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      // Parse batch name to remove section suffix
      const batchName = academicDetails.batch?.name || "";
      const parsedBatch = getBatchBase(batchName);

      setFormData((prev) => ({
        ...prev,
        studentName: fullName,
        rollNumber: academicDetails.rollNumber || "",
        contactNumber: studentDetails.studentMobileNumber || "",
        course: academicDetails.program || "",
        batch: parsedBatch,
      }));
    }
  }, [portal, student, existingForm]);

  const courseOptions = useMemo(() => catalog?.courses || [], [catalog]);

  const batchOptions = useMemo(() => {
    if (!catalog) return [];
    return Object.entries(catalog.batches)
      .filter(
        ([batchName, batchDetails]) => batchDetails.course === formData.course,
      )
      .map(([batchName, batchDetails]) => ({
        value: batchName,
        label: batchDetails.label,
      }));
  }, [catalog, formData.course]);

  const patternOptions = useMemo(() => {
    if (!catalog || !formData.batch) return [];
    const batchDetails = catalog.batches[formData.batch];
    if (!batchDetails) return [];
    return Object.entries(batchDetails.patterns).map(([patternKey]) => {
      const patternInfo = catalog.patterns.find((p) => p.value === patternKey);
      return {
        value: patternKey,
        label: patternInfo ? patternInfo.label : patternKey,
      };
    });
  }, [catalog, formData.batch]);

  const subjectOptions = useMemo(() => {
    if (!catalog || !formData.batch || !formData.pattern) return [];
    const batchDetails = catalog.batches[formData.batch];
    if (!batchDetails) return [];
    const patternDetails = batchDetails.patterns[formData.pattern];
    if (!patternDetails) return [];
    return patternDetails.subjects || [];
  }, [catalog, formData.batch, formData.pattern]);

  // Live fee calculation based on number of selected subjects (excluding section headers)
  const selectedSubjectCount = useMemo(
    () => Array.from(selectedSubjects).length,
    [selectedSubjects],
  );

  const payableAmount = useMemo(() => {
    if (selectedSubjectCount === 0) return 0;
    if (selectedSubjectCount === 1) return 320;
    if (selectedSubjectCount === 2) return 585;
    return 1255; // 3 or more
  }, [selectedSubjectCount]);

  const resetSubjectSelection = () => setSelectedSubjects(new Set());

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCourseChange = (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, course: value, batch: "", pattern: "" }));
    resetSubjectSelection();
  };

  const handleBatchChange = (event) => {
    const { value } = event.target;

    // Check for batch mismatch for student portal
    if (portal === "student" && student?.academicDetails?.batch?.name) {
      const studentBatch = getBatchBase(student.academicDetails.batch.name);
      const selectedBatch = getBatchBase(value);

      if (selectedBatch !== studentBatch) {
        setBatchMismatch({
          selectedBatch: value,
          studentBatch,
          studentBatchFull: student.academicDetails.batch.name,
        });
        setShowBatchWarning(true);
      }
    }

    setFormData((prev) => ({ ...prev, batch: value, pattern: "" }));
    resetSubjectSelection();
  };

  const handlePatternChange = (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, pattern: value }));
    resetSubjectSelection();
  };

  const handleSubjectToggle = (subjectId, isChecked) => {
    setSelectedSubjects((prev) => {
      const updated = new Set(prev);
      const subject = subjectOptions.find((s) => s.id === subjectId);
      if (!subject) return updated;
      if (isChecked) {
        // If optional, remove any other optional already selected (only one allowed)
        if (subject.group === "optional") {
          subjectOptions
            .filter((s) => s.group === "optional" && s.id !== subjectId)
            .forEach((s) => updated.delete(s.id));
        }
        updated.add(subjectId);
      } else {
        updated.delete(subjectId);
      }
      return updated;
    });
  };

  const validateForm = () => {
    if (!formData.studentName.trim()) {
      toast.error("Please enter the student name.");
      return false;
    }
    if (!formData.rollNumber.trim()) {
      toast.error("Please enter the roll number.");
      return false;
    }
    if (!formData.contactNumber.trim()) {
      toast.error("Please enter the contact number.");
      return false;
    }
    if (!/^\+?\d{10,15}$/.test(formData.contactNumber.trim())) {
      toast.error("Contact number should be 10-15 digits.");
      return false;
    }
    if (!formData.course) {
      toast.error("Please select a course.");
      return false;
    }
    if (!formData.batch) {
      toast.error("Please select a batch.");
      return false;
    }
    if (!formData.pattern) {
      toast.error("Please select an examination pattern.");
      return false;
    }
    const selectableSubjectCount = subjectOptions.filter(
      (subject) => subject.type !== "section",
    ).length;
    if (selectableSubjectCount > 0 && selectedSubjects.size === 0) {
      toast.error("Select at least one subject.");
      return false;
    }
    // Enforce only one optional subject
    const optionalSelected = Array.from(selectedSubjects).filter((id) => {
      const s = subjectOptions.find((sub) => sub.id === id);
      return s && s.group === "optional";
    });
    if (optionalSelected.length > 1) {
      toast.error("Only one optional subject can be selected.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const resp = await submitAtktFormAPI({
        studentName: formData.studentName.trim(),
        rollNumber: formData.rollNumber.trim(),
        contactNumber: formData.contactNumber.trim(),
        course: formData.course,
        batch: formData.batch,
        pattern: formData.pattern,
        subjects: Array.from(selectedSubjects),
        ...(examSessionId ? { examSessionId } : {}),
      });
      if (resp?.order && resp?.key && resp?.callback_url) {
        // Prepare hosted form payload and submit
        setPaymentPayload({
          order_id: resp.order.id,
          key_id: resp.key,
          callback_url: resp.callback_url,
          user: resp.user || {},
          atktFormId: resp?.data?.formId,
        });
        setRedirectingToPayment(true);
        toast.info("Redirecting to payment gateway...");
      } else {
        toast.success(resp?.message || "A.T.K.T form submitted successfully.");
        setFormData(initialFormState);
        resetSubjectSelection();
      }
    } catch (error) {
      const message =
        error?.response?.data?.message || "Could not submit the ATKT form.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const shouldShowSubjectSection = useMemo(
    () => subjectOptions.some((subject) => subject.type !== "section"),
    [subjectOptions],
  );

  const handleConfirmBatchChange = () => {
    setShowBatchWarning(false);
    setBatchMismatch(null);
  };

  const handleCancelBatchChange = () => {
    setFormData((prev) => ({
      ...prev,
      batch: batchMismatch.studentBatch,
      pattern: "",
    }));
    setShowBatchWarning(false);
    setBatchMismatch(null);
    resetSubjectSelection();
  };

  const accentColor = portal === "examiner" ? "bg-purple-600" : "bg-blue-600";

  return (
    <>
      <div
        className={
          portal === "examiner" ? "max-w-2xl mx-auto" : "max-w-6xl mx-auto"
        }
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">
            {existingForm
              ? "A.T.K.T Examination Form - Complete Payment"
              : "A.T.K.T Examination Form"}
          </h2>
          <p className="text-gray-600">
            {existingForm
              ? "You have an existing ATKT form that needs payment. Review your details and proceed to payment."
              : "Fill in the details to submit your A.T.K.T examination request. Select your course, batch, and pattern to view available subjects."}
          </p>
          {existingForm && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-3">
              <p className="text-sm">
                <strong>Note:</strong> You have an existing ATKT form which is
                not paid yet. Please submit the form to proceed to payment
                again.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Name *
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roll Number *
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter roll number"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>
            </div>
          </div>

          {/* Academic Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Academic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleCourseChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingCatalog}
                  required
                >
                  <option value="">Select Course</option>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.value}>
                      {course.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch *
                </label>
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleBatchChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.course}
                  required
                >
                  <option value="">Select Batch</option>
                  {batchOptions.map((batch) => (
                    <option key={batch.value} value={batch.value}>
                      {batch.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pattern *
                </label>
                <select
                  name="pattern"
                  value={formData.pattern}
                  onChange={handlePatternChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.batch}
                  required
                >
                  <option value="">Select Pattern</option>
                  {patternOptions.map((pattern) => (
                    <option key={pattern.value} value={pattern.value}>
                      {pattern.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Subjects */}
          {loadingCatalog && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading subjects...</span>
              </div>
            </div>
          )}

          {!loadingCatalog && !shouldShowSubjectSection && formData.pattern && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-8">
                <p className="text-gray-600">
                  No subjects are configured for the selected batch and pattern.
                </p>
              </div>
            </div>
          )}

          {!loadingCatalog && shouldShowSubjectSection && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Select Subjects</h3>
              <div className="space-y-4">
                {subjectOptions.map((subject) => {
                  if (subject.type === "section") {
                    return (
                      <div key={subject.id} className="mt-6 mb-2">
                        <h4 className="text-lg font-medium text-gray-800">
                          {subject.label}
                        </h4>
                        {subject.label.toLowerCase().includes("optional") && (
                          <p className="text-xs text-gray-500 mt-1">
                            Select only one optional subject from the list
                            below.
                          </p>
                        )}
                      </div>
                    );
                  }
                  const optionalSelectedId = subjectOptions
                    .filter(
                      (s) =>
                        s.group === "optional" && selectedSubjects.has(s.id),
                    )
                    .map((s) => s.id)[0];
                  const disableOptional =
                    subject.group === "optional" &&
                    optionalSelectedId &&
                    optionalSelectedId !== subject.id;
                  const alreadyPaid = paidSubjectIds.includes(subject.id);
                  const isDisabled = disableOptional || alreadyPaid;
                  return (
                    <label
                      key={subject.id}
                      className={`flex items-center space-x-3 p-3 border rounded-md ${alreadyPaid ? "bg-green-50 border-green-200 opacity-70 cursor-not-allowed" : isDisabled ? "opacity-60 cursor-not-allowed border-gray-200" : "border-gray-200 hover:bg-gray-50 cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={alreadyPaid || selectedSubjects.has(subject.id)}
                        disabled={isDisabled}
                        onChange={(event) =>
                          handleSubjectToggle(subject.id, event.target.checked)
                        }
                      />
                      <span className="text-gray-700">
                        {subject.label}
                        {subject.group === "optional" && (
                          <span className="text-sm text-gray-500 ml-2">
                            (Optional)
                          </span>
                        )}
                        {alreadyPaid && (
                          <span className="text-xs text-green-600 ml-2 font-medium">
                            (Already Paid)
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
              {/* Live amount summary inside subjects card */}
              <div className="mt-6 border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">
                    Selected Subjects:
                  </span>{" "}
                  {selectedSubjectCount}
                  {selectedSubjectCount > 0 && (
                    <>
                      {" "}
                      - Fee Slab Applied: {selectedSubjectCount === 1 && "₹320"}
                      {selectedSubjectCount === 2 && "₹585"}
                      {selectedSubjectCount >= 3 && "₹1255"}
                    </>
                  )}
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  Payable Amount:{" "}
                  {selectedSubjectCount === 0 ? (
                    <span className="text-gray-500">Select subjects</span>
                  ) : (
                    <span className="text-blue-600">₹{payableAmount}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || redirectingToPayment}
                className={`px-6 py-3 ${accentColor} text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {redirectingToPayment && "Redirecting to Payment..."}
                {!redirectingToPayment && submitting && "Submitting..."}
                {!redirectingToPayment && !submitting && (
                  <>
                    <span>Submit & Pay</span>
                    {payableAmount > 0 && (
                      <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-medium">
                        ₹{payableAmount}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {existingForm?.receiptId && (
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              try {
                const blob = await downloadReceiptPDF(existingForm.receiptId);
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.success("Receipt downloaded successfully");
              } catch (error) {
                console.error("Error downloading receipt:", error);
                toast.error("Failed to download receipt");
              }
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:opacity-90"
          >
            Download Receipt PDF
          </button>
        </div>
      )}

      {/* Hidden Razorpay hosted form for ATKT */}
      {paymentPayload && <RazorpayATKTForm {...paymentPayload} />}

      {/* Batch Mismatch Warning Modal */}
      {showBatchWarning && batchMismatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Batch Selection Warning
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                You have selected a batch that doesn't match your assigned
                batch.
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Your assigned batch:</strong>{" "}
                  {batchMismatch.studentBatchFull}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Selected batch:</strong> {batchMismatch.selectedBatch}
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Are you sure you want to continue with the selected batch? This
                may affect your examination eligibility.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelBatchChange}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Change to My Batch
              </button>
              <button
                onClick={handleConfirmBatchChange}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ATKTForm;
