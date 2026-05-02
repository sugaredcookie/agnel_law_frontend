import React, { useEffect, useState } from "react";
import StudentDashboardLayout from "./StudentDashboardLayout";
import { getMyRegularExamEnrollmentAPI, downloadRegularExamHallTicketAPI } from "../../utils/Api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const StudentRegularExam = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasEnrollment, setHasEnrollment] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("studentToken")) {
      window.location.href = "/student/login";
    }
  }, []);

  useEffect(() => {
    fetchEnrollment();
  }, []);

  const fetchEnrollment = async () => {
    try {
      setLoading(true);
      const response = await getMyRegularExamEnrollmentAPI();
      if (response.hasEnrollment) {
        // Support both old (single enrollment) and new (multiple enrollments) response
        const enrollmentList = response.enrollments || [response.enrollment];
        setEnrollments(enrollmentList);
        setHasEnrollment(true);
      } else {
        setHasEnrollment(false);
      }
    } catch (error) {
      console.error("Failed to fetch enrollment:", error);
      setHasEnrollment(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHallTicket = async (enrollment) => {
    try {
      toast.info("Generating your hall ticket...");
      const blob = await downloadRegularExamHallTicketAPI(enrollment._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `HallTicket_${enrollment.hallTicketNumber}_${enrollment.studentName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Hall ticket downloaded successfully!");
    } catch (error) {
      console.error("Failed to download hall ticket:", error);
      toast.error("Failed to download hall ticket. Please try again.");
    }
  };

  if (loading) {
    return (
      <StudentDashboardLayout>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StudentDashboardLayout>
    );
  }

  if (!hasEnrollment) {
    return (
      <StudentDashboardLayout>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Regular Examinations</h2>
          <p className="text-gray-600">
            No active examination session found. You will be automatically
            enrolled when a new exam session is activated.
          </p>
        </div>
      </StudentDashboardLayout>
    );
  }

  return (
    <StudentDashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">My Regular Examinations</h2>
        <p className="text-gray-600">
          {enrollments.length > 1 
            ? `You are enrolled in ${enrollments.length} active examination sessions.`
            : "You have been enrolled in the active examination session. Below are your exam details."
          }
        </p>
      </div>

      {enrollments.map((enrollment, enrollmentIndex) => {
        const session = enrollment.examSessionId;
        return (
          <div key={enrollment._id} className={enrollments.length > 1 ? "mb-10 pb-8 border-b-4 border-blue-200" : ""}>
            {enrollments.length > 1 && (
              <div className="mb-4">
                <span className="px-4 py-2 bg-blue-600 text-white font-bold rounded-t-lg">
                  Session {enrollmentIndex + 1}: {session.title}
                </span>
              </div>
            )}

            {/* Exam Session Information */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Examination Session</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Title
                  </label>
                  <p className="text-gray-900 font-semibold">{session.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <p className="text-gray-900">{session.academicYear}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Type
                  </label>
                  <p className="text-gray-900">{session.term} - {session.examType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Period
                  </label>
                  <p className="text-gray-900">
                    {new Date(session.examStartDate).toLocaleDateString()} to{" "}
                    {new Date(session.examEndDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Hall Ticket Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Hall Ticket Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hall Ticket Number
                  </label>
                  <p className="text-gray-900 font-mono font-bold text-lg">
                    {enrollment.hallTicketNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roll Number
                  </label>
                  <p className="text-gray-900">{enrollment.rollNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course & Pattern
                  </label>
                  <p className="text-gray-900">
                    {enrollment.course} ({enrollment.pattern})
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => handleDownloadHallTicket(enrollment)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Download Hall Ticket
                </button>
              </div>
            </div>

            {/* Enrolled Subjects */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">
                Enrolled Subjects ({enrollment.subjects.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Subject
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Exam Date
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Time
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollment.subjects.map((subject, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">
                          {subject.label}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          {subject.examDate
                            ? new Date(subject.examDate).toLocaleDateString()
                            : "TBA"}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          {subject.examTime || "TBA"}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {subject.examType || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Important Information */}
            {session.description && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Important Information
                </h3>
                <p className="text-gray-700">{session.description}</p>
              </div>
            )}
          </div>
        );
      })}
    </StudentDashboardLayout>
  );
};

export default StudentRegularExam;
