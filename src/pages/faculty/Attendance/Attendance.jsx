/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import FacultyDashboardLayout from "../FacultyDashboardLayout";
import { FacultyContext } from "../FacultyContext";
import {
  fetchAttendanceViaAdmin,
  getAllBatchesViaAdmin,
  getAllStudentsForABatchViaAdmin,
  getAllSubjectsOfBatchViaAdmin,
  markAttendanceViaAdmin,
  // getAttendanceForBatchAndDateViaAdmin, // Assuming API to fetch attendance for a given date
} from "../../../utils/Api";

const Attendance = () => {
  const faculty_data = useContext(FacultyContext).faculty;
  const [allBatches, setAllBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [subject, setSubject] = useState({});
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  ); // Default to today's date

  // Fetch all batches when the component mounts
  useEffect(() => {
    fetchAllBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchStudents(selectedBatch.batchName);
      fetchSubject(selectedBatch._id);
    }
  }, [selectedBatch, selectedDate]);

  useEffect(() => {
    if (selectedBatch && subject._id) {
      fetchAttendance(selectedBatch._id, selectedDate, subject._id); // Fetch attendance for the selected date
    }
  }, [subject]);
  const fetchAllBatches = async () => {
    try {
      const response = await getAllBatchesViaAdmin();
      setAllBatches(response.batches);
    } catch (error) {
      console.log("Error fetching batches: ", error);
    }
  };

  const fetchSubject = async (id) => {
    try {
      const response = await getAllSubjectsOfBatchViaAdmin(id);
      const subj = response.subjects.find(
        (subject) => subject.faculty === faculty_data._id,
      );
      setSubject(subj);
    } catch (error) {
      console.log("Error fetching subject: ", error);
    }
  };

  const fetchStudents = async (batchName) => {
    try {
      const response = await getAllStudentsForABatchViaAdmin(batchName);
      setStudents(response.students);

      // Initialize attendanceData with default values or fetched values for the selected date
      const initialAttendanceData = {};
      response.students.forEach((student) => {
        initialAttendanceData[student._id] = "absent"; // default to absent
      });
      setAttendanceData(initialAttendanceData);
    } catch (error) {
      console.log("Error fetching students: ", error);
    }
  };

  const fetchAttendance = async (batchId, date, subjectId) => {
    try {
      console.log("Fetching attendance for: ", batchId, date, subjectId);
      const response = await fetchAttendanceViaAdmin({
        batchId,
        date,
        subjectId,
      });
      console.log("Attendance response: ", response);
      if (response.attendance && response.attendance.length > 0) {
        const attendanceMap = response.attendance[0].attendance.reduce(
          (acc, record) => {
            acc[record.studentId] = record.status;
            return acc;
          },
          {},
        );
        setAttendanceData(attendanceMap);
      }
    } catch (error) {
      console.log("Error fetching attendance: ", error);
    }
  };
  console.log("Attendance data: ", attendanceData);

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmitAttendance = async () => {
    try {
      const attendancePayload = {
        batch: {
          batchName: selectedBatch.batchName,
          term: selectedBatch.term,
          batchId: selectedBatch._id,
        },
        date: selectedDate,
        subjectId: subject._id,
        attendance: students.map((student) => ({
          studentId: student._id,
          status: attendanceData[student._id], // Now includes 'present', 'absent', or 'OD'
        })),
      };

      console.log("Attendance payload: ", attendancePayload);

      const response = await markAttendanceViaAdmin(attendancePayload);
      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance: ", error);
      alert("Failed to save attendance. Please try again.");
    }
  };

  return (
    <FacultyDashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Attendance</h1>

      {/* Date picker for selecting the date */}
      <div className="mb-4">
        <label className="mr-2">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-md p-2 text-lg shadow-md"
        />
      </div>

      {/* Batch selection */}
      <div className="mb-4">
        <select
          name="batch"
          id="batch"
          onChange={(e) => {
            const selectedBatch = allBatches.find(
              (batch) => batch._id === e.target.value,
            );
            setSelectedBatch(selectedBatch);
          }}
          className="rounded-md p-2 text-lg shadow-md"
        >
          <option value="">Select Batch</option>
          {allBatches.map((batch) => (
            <option key={batch._id} value={batch._id}>
              {batch.batchName}
            </option>
          ))}
        </select>
      </div>

      {/* Display subject */}
      <div>
        <h3 className="font-normal">Subject: {subject.subjectName}</h3>
      </div>

      {/* Attendance table */}
      {students.length > 0 ? (
        <div>
          <table className="w-full border border-gray-300 mt-4 shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Student Name</th>
                <th className="border border-gray-300 p-2">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td className="border border-gray-300 p-2 text-black">
                    {student.studentDetails.firstName}{" "}
                    {student.studentDetails.middleName}{" "}
                    {student.studentDetails.lastName}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <label>
                      <input
                        type="radio"
                        name={`attendance-${student._id}`}
                        value="present"
                        checked={attendanceData[student._id] === "present"}
                        onChange={() =>
                          handleAttendanceChange(student._id, "present")
                        }
                      />{" "}
                      Present
                    </label>
                    <label className="ml-4">
                      <input
                        type="radio"
                        name={`attendance-${student._id}`}
                        value="absent"
                        checked={attendanceData[student._id] === "absent"}
                        onChange={() =>
                          handleAttendanceChange(student._id, "absent")
                        }
                      />{" "}
                      Absent
                    </label>
                    <label className="ml-4">
                      <input
                        type="radio"
                        name={`attendance-${student._id}`}
                        value="OD"
                        checked={attendanceData[student._id] === "OD"}
                        onChange={() =>
                          handleAttendanceChange(student._id, "OD")
                        }
                      />{" "}
                      OD(On duty)
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
            onClick={handleSubmitAttendance}
          >
            Submit Attendance
          </button>
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-3">No students found</div>
      )}
    </FacultyDashboardLayout>
  );
};

export default Attendance;
