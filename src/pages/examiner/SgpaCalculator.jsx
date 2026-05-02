import React, { useState, useEffect } from "react";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import {
  getAllBatchesAPI,
  getStudentsByBatchAPI,
  calculateSgpaAPI,
} from "../../utils/Api";
import SearchableDropdown from "../../components/SearchableDropdown";

const SgpaCalculator = () => {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [sgpaData, setSgpaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const response = await getAllBatchesAPI();
        setBatches(response.data.batches);
      } catch (err) {
        setError("Failed to fetch batches");
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  const handleBatchChange = async (batchId) => {
    setSelectedBatch(batchId);
    setSelectedStudent("");
    setStudents([]);
    setSgpaData(null);
    if (batchId) {
      try {
        setLoading(true);
        const response = await getStudentsByBatchAPI(batchId);
        setStudents(response.data.students);
      } catch (err) {
        setError("Failed to fetch students");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStudentChange = async (studentId) => {
    setSelectedStudent(studentId);
    setSgpaData(null);
    if (studentId) {
      try {
        setLoading(true);
        const response = await calculateSgpaAPI(studentId);
        setSgpaData(response.data);
      } catch (err) {
        setError("Failed to calculate SGPA");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen text-black dark:text-white">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 max-w-6xl mx-auto mt-10">
            <h1 className="text-3xl font-bold mb-6">SGPA Calculator</h1>

            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Select Batch
                  </label>
                  <select
                    value={selectedBatch}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    className="w-full p-2 border-2 border-blue-500 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">-- Select a Batch --</option>
                    {batches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.batchName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Select Student
                  </label>
                  <SearchableDropdown
                    options={students.map((student) => ({
                      value: student._id,
                      label: `${student.studentDetails.firstName} ${student.studentDetails.lastName} (${student.academicDetails.rollNumber})`,
                    }))}
                    value={selectedStudent}
                    onChange={handleStudentChange}
                    placeholder="-- Select a Student --"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {loading && <p>Loading...</p>}

            {sgpaData && (
              <div className="mt-6">
                <div
                  className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4"
                  role="alert"
                >
                  <p className="font-bold text-lg">SGPA: {sgpaData.sgpa}</p>
                  <p>Total Credits: {sgpaData.totalCredits}</p>
                  <p>
                    Student: {sgpaData.studentDetails.name} (
                    {sgpaData.studentDetails.rollNumber})
                  </p>
                </div>

                <h2 className="text-2xl font-bold mt-6 mb-4">
                  Subject Breakdown
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                      <tr className="bg-white dark:bg-gray-800">
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                          Subject
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                          Credits
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                          Percentage
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                          Grade Point
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sgpaData.subjectBreakdown.map((subject) => (
                        <tr
                          key={subject.subjectCode}
                          className="bg-white dark:bg-gray-800"
                        >
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                            {subject.subjectName}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                            {subject.credits}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                            {subject.percentage}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                            {subject.gradePoint}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SgpaCalculator;
