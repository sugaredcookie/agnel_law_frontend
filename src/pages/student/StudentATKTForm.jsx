import React, { useEffect, useState, useMemo } from "react";
import StudentDashboardLayout from "./StudentDashboardLayout";
import ATKTForm from "../../components/ATKTForm";
import {
  getAtktStatusAPI,
  getMyAtktFormAPI,
  getAtktCatalogAPI,
  downloadReceiptPDF,
} from "../../utils/Api";
import { toast } from "react-toastify";

const StudentATKTForm = () => {
  const [status, setStatus] = useState(null);
  const [sessions, setSessions] = useState([]); // active sessions
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [paidForms, setPaidForms] = useState([]);
  const [pendingForm, setPendingForm] = useState(null);
  const [paidSubjectIds, setPaidSubjectIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("studentToken")) {
      window.location.href = "/student/login";
    }
  }, []);

  // Initial load: status + active sessions list
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [statusRes, catalogRes] = await Promise.all([
          getAtktStatusAPI(),
          getAtktCatalogAPI().catch((err) => err?.response?.data || null),
        ]);
        setStatus(statusRes);

        const activeSessions = catalogRes?.sessions || [];
        setSessions(activeSessions);

        if (activeSessions.length === 1) {
          setSelectedSessionId(activeSessions[0].id);
        } else {
          setSelectedSessionId(null);
        }
      } catch (error) {
        toast.error("Failed to load ATKT form status");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Whenever the selected session changes, refetch this student's forms for it
  useEffect(() => {
    if (!selectedSessionId) {
      setPaidForms([]);
      setPendingForm(null);
      setPaidSubjectIds([]);
      return;
    }
    const fetchForms = async () => {
      try {
        setRefreshing(true);
        const formRes = await getMyAtktFormAPI(selectedSessionId).catch(
          () => null,
        );
        setPaidForms(formRes?.forms || []);
        setPendingForm(formRes?.pendingForm || null);
        setPaidSubjectIds(formRes?.paidSubjectIds || []);
      } catch (error) {
        toast.error("Failed to load submissions for this exam session");
      } finally {
        setRefreshing(false);
      }
    };
    fetchForms();
  }, [selectedSessionId]);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) || null,
    [sessions, selectedSessionId],
  );

  if (loading) {
    return (
      <StudentDashboardLayout>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StudentDashboardLayout>
    );
  }

  if (!status?.enabled) {
    return (
      <StudentDashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">
              A.T.K.T Examination Form
            </h2>
            <p className="text-gray-600">
              The A.T.K.T examination form is currently not available. Please
              check back later.
            </p>
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  if (!sessions.length) {
    return (
      <StudentDashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">
              A.T.K.T Examination Form
            </h2>
            <p className="text-gray-600">
              No active ATKT examination session is currently open. Please
              check back later.
            </p>
          </div>
        </div>
      </StudentDashboardLayout>
    );
  }

  const handleOpenReceipt = async (form) => {
    if (!form?._id) return;
    try {
      setLoadingReceipt(form._id);
      const blob = await downloadReceiptPDF(form.receiptId || form._id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      toast.success("Receipt opened in new tab");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not download receipt");
    } finally {
      setLoadingReceipt(null);
    }
  };

  const totalPaidAmount = paidForms.reduce(
    (sum, f) => sum + (f.amount || 0),
    0,
  );

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  return (
    <StudentDashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">A.T.K.T Examination Form</h2>
        </div>

        {/* Session picker (always rendered when there are active sessions) */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h3 className="text-lg font-semibold mb-3">
            {sessions.length > 1
              ? "Select Exam Session"
              : "Active Exam Session"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.map((s) => {
              const isSelected = s.id === selectedSessionId;
              const disabled = !s.registrationOpen;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => !disabled && setSelectedSessionId(s.id)}
                  disabled={disabled}
                  className={`text-left p-3 rounded-md border transition-colors ${
                    isSelected
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="font-semibold text-gray-800">{s.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {s.academicYear} · {s.term}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Registration: {formatDate(s.registrationStartDate)} –{" "}
                    {formatDate(s.registrationEndDate)}
                  </div>
                  <div className="mt-2">
                    {disabled ? (
                      <span className="inline-block text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                        Registration closed
                      </span>
                    ) : (
                      <span className="inline-block text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                        Registration open
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {!selectedSessionId && (
            <p className="text-sm text-gray-600 mt-3">
              Please select an exam session to continue.
            </p>
          )}
        </div>

        {refreshing && (
          <div className="mb-4 text-sm text-gray-500">Loading submissions…</div>
        )}

        {/* Show paid submissions history for selected session */}
        {selectedSessionId && paidForms.length > 0 && (
          <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Your Submissions ({paidForms.length})
              </h3>
              <span className="text-sm text-gray-500">
                Total Paid: ₹{totalPaidAmount.toFixed(2)}
              </span>
            </div>

            {paidForms.map((form, idx) => (
              <div
                key={form._id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">
                    Submission #{idx + 1}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Paid — ₹{(form.amount || 0).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleOpenReceipt(form)}
                      disabled={loadingReceipt === form._id}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                    >
                      {loadingReceipt === form._id
                        ? "Loading..."
                        : "Download Receipt"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Course:</span>{" "}
                    <span className="font-medium">{form.course}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Batch:</span>{" "}
                    <span className="font-medium">{form.batch}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Pattern:</span>{" "}
                    <span className="font-medium">{form.pattern}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>{" "}
                    <span className="font-medium">
                      {new Date(form.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-500">Subjects:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {form.subjects
                      .filter((s) => s.type !== "section")
                      .map((subject, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-sm bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          {subject.label}
                          {subject.group === "optional" && (
                            <span className="ml-1 text-xs text-gray-400">
                              (Opt)
                            </span>
                          )}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show form for additional subjects (only after a session is selected) */}
        {status?.enabled &&
          selectedSessionId &&
          selectedSession?.registrationOpen && (
            <>
              {paidForms.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Want to apply for more subjects? Select additional subjects
                    below. Subjects you have already paid for will be shown as
                    disabled.
                  </p>
                </div>
              )}
              <ATKTForm
                key={selectedSessionId}
                portal="student"
                existingForm={pendingForm}
                paidSubjectIds={paidSubjectIds}
                examSessionId={selectedSessionId}
              />
            </>
          )}
      </div>
    </StudentDashboardLayout>
  );
};

export default StudentATKTForm;
