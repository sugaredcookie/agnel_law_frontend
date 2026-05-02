import React, { useState, useEffect } from "react";
import { getReportCard } from "../../utils/Api";
import PanelDashboardLayout from "../panel/PanelDashboardLayout.jsx";

const ReportCard = () => {
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(true);
  // const studentId = "66e49a5726db3e35194132db";
  const studentId = "672ba8f3974168d102a24e18";

  useEffect(() => {
    const fetchReportCards = async () => {
      try {
        const response = await getReportCard(studentId);
        setReportCards(response);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching report cards:", error);
        setLoading(false);
      }
    };
    fetchReportCards();
  }, [studentId]);
  console.log(reportCards);

  const getUniqueSchemeNames = (subjects) => {
    const schemes = new Set();
    subjects.forEach((subject) => {
      subject.marks.forEach((mark) => {
        if (mark.schemeName) schemes.add(mark.schemeName);
      });
    });
    return Array.from(schemes);
  };

  const getMarksByScheme = (marks, schemeName) => {
    const mark = marks.find((m) => m.schemeName === schemeName);
    return mark ? `${mark.obtainedMarks}/${mark.maximumMarks}` : "-/-";
  };

  if (loading) return <div>Loading...</div>;
  if (!reportCards.length) return <div>No report cards found</div>;

  return (
    <PanelDashboardLayout>
      <div className="p-6 max-w-4xl mx-auto text-black bg-gray-100 rounded-lg shadow-lg border border-gray-300">
        {reportCards.map((reportCard, index) => {
          const schemeNames = getUniqueSchemeNames(reportCard.subjects);

          return (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-400"
            >
              <h2 className="text-2xl font-bold text-center mb-4 border-b pb-2">
                STUDENT REPORT CARD
              </h2>

              {/* Add student details section */}
              <div className="grid grid-cols-2 gap-4 mb-4 border-b pb-4">
                <p>
                  <strong>Student Name:</strong> {reportCard.student.name}
                </p>
                <p>
                  <strong>Roll Number:</strong> {reportCard.student.rollNumber}
                </p>
                <p>
                  <strong>Batch:</strong> {reportCard.student.batch}
                </p>
                <p>
                  <strong>Semester:</strong> {reportCard.semester}
                </p>
                <p>
                  <strong>Academic Year:</strong> {reportCard.academicYear}
                </p>
                <p>
                  <strong>Generated Date:</strong>{" "}
                  {new Date(reportCard.generatedDate).toLocaleDateString()}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 text-sm text-left">
                  <thead className="bg-gray-200">
                    <tr className="border-b">
                      <th className="border p-2">Subject</th>
                      <th className="border p-2">Subject Code</th>
                      {schemeNames.map((scheme, idx) => (
                        <th key={idx} className="border p-2">
                          {scheme}
                        </th>
                      ))}
                      <th className="border p-2">Total Marks</th>
                      <th className="border p-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCard.subjects.map((subject, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="border p-2">
                          {subject.subjectName || "-"}
                        </td>
                        <td className="border p-2">
                          {subject.subjectCode || "-"}
                        </td>
                        {schemeNames.map((scheme, schemeIdx) => (
                          <td key={schemeIdx} className="border p-2">
                            {getMarksByScheme(subject.marks, scheme)}
                          </td>
                        ))}
                        <td className="border p-2">
                          {subject.totalObtained !== undefined
                            ? `${subject.totalObtained}/${subject.totalMaximum}`
                            : "-/-"}
                        </td>
                        <td className="border p-2">{subject.grade || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-lg">
                  <p>
                    <strong>Total Marks:</strong> {reportCard.totalMarks || "-"}
                  </p>
                  <p>
                    <strong>Percentage:</strong>{" "}
                    {reportCard.percentage ? `${reportCard.percentage}%` : "-"}
                  </p>
                  <p>
                    <strong>CGPA:</strong> {reportCard.cgpa || "-"}
                  </p>
                  <p>
                    <strong>Remarks:</strong> {reportCard.remarks || "-"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PanelDashboardLayout>
  );
};

export default ReportCard;
