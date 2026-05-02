/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from "react";
import {
  getAllBatchesViaAdmin,
  getAllProgramsViaAdmin,
  getAllSubjectsOfBatchViaAdmin,
} from "../../../utils/Api";
import { StudentContext } from "../StudentContext";
import StudentDashboardLayout from "../StudentDashboardLayout";

const StudentTimetable = () => {
  const student = useContext(StudentContext).student;

  console.log(student);
  const [allPrograms, setAllPrograms] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [allSubjects, setAllSubjects] = useState([]);
  const [timetable, setTimetable] = useState({}); // To store timetable data

  // State for managing time slots (without changeable input fields)
  const [timeSlots, setTimeSlots] = useState({
    "Hour 1": { from: "", to: "" },
    "Hour 2": { from: "", to: "" },
    "Hour 3": { from: "", to: "" },
    "Hour 4": { from: "", to: "" },
    "Hour 5": { from: "", to: "" },
    "Hour 6": { from: "", to: "" },
    "Hour 7": { from: "", to: "" },
  });

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  //   useEffect(() => {
  //     fetchAllPrograms();
  //     fetchAllBatches();
  //     fetchAllSubjects();
  //   }, [selectedBatch]);

  //   const fetchAllPrograms = async () => {
  //     try {
  //       const response = await getAllProgramsViaAdmin();
  //       setAllPrograms(response.programs);
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };

  //   const fetchAllBatches = async () => {
  //     try {
  //       const response = await getAllBatchesViaAdmin();
  //       setAllBatches(response.batches);
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };

  //   const fetchAllSubjects = async () => {
  //     try {
  //       const response = await getAllSubjectsOfBatchViaAdmin(selectedBatch);
  //       setAllSubjects(response.subjects);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  return (
    <StudentDashboardLayout>
      <div className="mb-4 text-2xl font-bold">Timetable</div>
      <div className="flex gap-3 mb-4">
        <select
          name="program"
          id="program"
          className="rounded-md p-2 text-lg shadow-md"
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
        >
          <option value="">Select Program</option>
          {allPrograms.map((program) => (
            <option key={program._id} value={program._id}>
              {program.programName}
            </option>
          ))}
        </select>
        <select
          name="batch"
          id="batch"
          className="rounded-md p-2 text-lg shadow-md"
          value={selectedBatch}
          onChange={(e) => {
            setSelectedBatch(e.target.value);
          }}
        >
          <option value="">Select Batch</option>
          {allBatches.map((batch) => (
            <option key={batch._id} value={batch._id}>
              {batch.batchName}
            </option>
          ))}
        </select>
        <select
          name="term"
          id="term"
          className="rounded-md p-2 text-lg shadow-md"
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
        >
          <option value="">Select Term</option>
          {terms.map((term) => (
            <option key={term._id} value={term._id}>
              {term.termName}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse border">
          <thead>
            <tr>
              <th className="border p-4 text-center bg-gray-100">Day/Hour</th>
              {Object.keys(timeSlots).map((hour, index) => (
                <th key={index} className="border p-4 text-center bg-gray-100">
                  <div>{hour}</div>
                  <div className="flex justify-center items-center gap-1 mt-1">
                    {/* Display only times, no editable fields */}
                    <span>{timeSlots[hour].from}</span>
                    <span className="text-sm">to</span>
                    <span>{timeSlots[hour].to}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                <td className="border p-4 text-center font-semibold">{day}</td>
                {Object.keys(timeSlots).map((hour, colIndex) => (
                  <td
                    key={colIndex}
                    className="border p-6 text-center transition-all duration-200 ease-in-out"
                  >
                    {/* Display subject and faculty without edit options */}
                    {timetable[`${day}-${hour}`]
                      ? `${timetable[`${day}-${hour}`].subjectName} (${
                          timetable[`${day}-${hour}`].subjectCode
                        }) - ${timetable[`${day}-${hour}`].faculty}`
                      : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StudentDashboardLayout>
  );
};

export default StudentTimetable;
