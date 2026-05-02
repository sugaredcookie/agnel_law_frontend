import React, { useEffect, useState } from "react";
import StudentDashboardLayout from "./StudentDashboardLayout";
import { getMyProfileAPI, getMyProfileRequestsAPI, submitProfileRequestAPI } from "../../utils/Api";
import { toast } from "react-toastify";

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, requestsRes] = await Promise.all([
          getMyProfileAPI(),
          getMyProfileRequestsAPI(),
        ]);
        setProfile(profileRes.data);
        const reqs = requestsRes.data.pendingRequests || [];
        setPendingRequests(reqs);
        const initial = {};
        reqs.forEach((r) => {
          initial[r._id] = r.currentValue || "";
        });
        setFormValues(initial);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmitRequest = async (requestId) => {
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
      const res = await getMyProfileAPI();
      setProfile(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  if (loading) {
    return (
      <StudentDashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StudentDashboardLayout>
    );
  }

  if (!profile) {
    return (
      <StudentDashboardLayout>
        <div className="text-center py-10 text-gray-500">
          Unable to load profile.
        </div>
      </StudentDashboardLayout>
    );
  }

  const { studentDetails: s, academicDetails: a, familyBackground: f } = profile;
  const fullName = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");

  return (
    <StudentDashboardLayout>
      <div className="max-w-4xl mx-auto">

        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-5">
            {s.studentImage ? (
              <img
                src={s.studentImage}
                alt="Student"
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                {(s.firstName || "S").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-sm text-gray-500">{a.program} &mdash; {a.batch?.name}</p>
              <p className="text-sm text-gray-500">Roll No: {a.rollNumber}</p>
              <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                profile.status === "active"
                  ? "bg-green-100 text-green-700"
                  : profile.status === "graduated"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-red-100 text-red-700"
              }`}>
                {profile.status?.charAt(0).toUpperCase() + profile.status?.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Required Section */}
        {pendingRequests.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center gap-2">
              <i className="mdi mdi-alert-circle text-amber-600 text-lg" />
              <h2 className="text-sm font-semibold text-amber-800">
                Action Required
              </h2>
              <span className="ml-auto text-xs font-medium bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                {pendingRequests.length} pending
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingRequests.map((req, idx) => {
                const daysLeft = req.deadline
                  ? Math.ceil((new Date(req.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                  : null;
                const isUrgent = daysLeft !== null && daysLeft <= 3;

                return (
                  <div key={req._id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900">{req.title}</h3>
                          {isUrgent && (
                            <span className="text-xs font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                              {daysLeft <= 0 ? "Overdue" : `${daysLeft}d left`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <span>{req.fieldLabel}</span>
                          {req.deadline && (
                            <span className={isUrgent ? "text-red-600" : ""}>
                              Due {new Date(req.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="flex items-end gap-3 mt-3">
                          <div className="flex-1">
                            {req.fieldType === "select" ? (
                              <select
                                value={formValues[req._id] || ""}
                                onChange={(e) =>
                                  setFormValues((prev) => ({ ...prev, [req._id]: e.target.value }))
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
                                  setFormValues((prev) => ({ ...prev, [req._id]: e.target.value }))
                                }
                                placeholder={req.placeholder || `Enter ${req.fieldLabel}`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                          </div>
                          <button
                            onClick={() => handleSubmitRequest(req._id)}
                            disabled={submitting[req._id]}
                            className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                          >
                            {submitting[req._id] ? "Saving..." : "Submit"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Personal Details */}
        <Section title="Personal Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="First Name" value={s.firstName} />
            <InfoRow label="Middle Name" value={s.middleName} />
            <InfoRow label="Last Name" value={s.lastName} />
            <InfoRow label="Gender" value={s.gender} />
            <InfoRow label="Date of Birth" value={s.dateOfBirth} />
            <InfoRow label="Blood Group" value={s.bloodGroup} />
            <InfoRow label="Birth Place" value={s.birthPlace} />
            <InfoRow label="Religion" value={s.religion} />
            <InfoRow label="Caste Category" value={s.casteCategory} />
            <InfoRow label="Caste" value={s.caste} />
            <InfoRow label="Mother Tongue" value={s.motherTongue} />
            <InfoRow label="Aadhar Number" value={s.aadharCardNumber} />
            <InfoRow label="Email" value={s.emailAddress} />
            <InfoRow label="Mobile" value={s.studentMobileNumber} />
            <InfoRow label="Address" value={s.address} className="md:col-span-2" />
          </div>
        </Section>

        {/* Academic Details */}
        <Section title="Academic Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Program" value={a.program} />
            <InfoRow label="Batch" value={a.batch?.name} />
            <InfoRow label="Roll Number" value={a.rollNumber} />
            <InfoRow label="Register Number" value={a.registerNumber} />
            <InfoRow label="PRN Number" value={s.prnNumber} />
            <InfoRow label="ABC ID" value={s.abcNumber} />
            <InfoRow label="GR Number" value={s.grNumber} />
            <InfoRow label="CAP Application ID" value={s.capApplicationId} />
            <InfoRow label="Enrollment Date" value={a.enrollmentDate} />
            <InfoRow label="Year of Joining" value={a.yearOfJoining} />
          </div>
        </Section>

        {/* Family Background */}
        {f && (
          <Section title="Family Background">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Father's Name" value={f.fatherName} />
              <InfoRow label="Father's Email" value={f.fatherEmail} />
              <InfoRow label="Father's Occupation" value={f.fatherOccupation} />
              <InfoRow label="Father's Mobile" value={f.fatherMobileNo} />
              <InfoRow label="Mother's Name" value={f.motherName} />
              <InfoRow label="Mother's Email" value={f.motherEmail} />
              <InfoRow label="Mother's Occupation" value={f.motherOccupation} />
              <InfoRow label="Mother's Mobile" value={f.motherMobileNo} />
              <InfoRow label="Family Annual Income" value={f.familyAnnualIncome} />
            </div>
          </Section>
        )}

        {/* Selected Electives */}
        {profile.selectedElectives?.length > 0 && (
          <Section title="Selected Electives">
            <div className="space-y-2">
              {profile.selectedElectives.map((e) => (
                <div
                  key={e.subject?._id || e._id}
                  className="flex items-center justify-between bg-white rounded px-4 py-2 border border-gray-100"
                >
                  <span className="font-medium text-sm">
                    {e.subject?.subjectName || "N/A"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {e.subject?.subjectCode}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Documents */}
        {profile.certificates?.length > 0 && (
          <Section title="Documents">
            <div className="space-y-2">
              {profile.certificates.map((cert) => (
                <div
                  key={cert._id}
                  className="flex items-center justify-between bg-white rounded px-4 py-3 border border-gray-100"
                >
                  <div>
                    <span className="font-medium text-sm capitalize">
                      {cert.type?.replace(/([A-Z])/g, " $1").trim() || "Document"}
                    </span>
                    {cert.remark && (
                      <p className="text-xs text-gray-400 mt-0.5">{cert.remark}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      cert.status === "verified"
                        ? "bg-green-100 text-green-700"
                        : cert.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {cert.status}
                    </span>
                    {cert.fileUrl && (
                      <a
                        href={cert.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </StudentDashboardLayout>
  );
};

const Section = ({ title, children }) => (
  <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
    <h2 className="text-lg font-semibold mb-4 border-b border-gray-100 pb-2 text-gray-800">
      {title}
    </h2>
    {children}
  </section>
);

const InfoRow = ({ label, value, className = "" }) => (
  <div className={className}>
    <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
    <p className="font-medium text-sm text-gray-800 mt-0.5">{value || "-"}</p>
  </div>
);

export default StudentProfile;
