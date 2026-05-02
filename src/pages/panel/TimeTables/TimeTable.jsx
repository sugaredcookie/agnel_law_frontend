import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import {
  addTimetableToBatchViaAdmin,
  getAllBatchesViaAdmin,
  getAllProgramsViaAdmin,
  getAllSubjectsOfBatchViaAdmin,
  getAllSubjectsViaAdmin,
  getSingleFacultyViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const TimeTable = () => {
  const [allPrograms, setAllPrograms] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [allSubjects, setAllSubjects] = useState([]);
  const [timetable, setTimetable] = useState({}); // To store timetable data
  const [faculty, setFaculty] = useState({});

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");

  // State for managing start and end times for each hour
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

  useEffect(() => {
    fetchAllPrograms();
    fetchAllBatches();
    fetchAllSubjects();
  }, [selectedBatch]);

  const fetchAllPrograms = async () => {
    try {
      const response = await getAllProgramsViaAdmin();
      setAllPrograms(response.programs);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllBatches = async () => {
    try {
      const response = await getAllBatchesViaAdmin();
      setAllBatches(response.batches);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllSubjects = async () => {
    try {
      console.log(selectedBatch);
      const response = await getAllSubjectsOfBatchViaAdmin(selectedBatch);
      setAllSubjects(response.subjects);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCellClick = (day, hour) => {
    setSelectedCell({ day, hour });
    setShowModal(true); // Show modal on cell click
  };

  const handleSubjectSelect = async (subject) => {
    const facultyResponse = await getSingleFacultyViaAdmin({
      id: subject.faculty.facultyName,
    });
    console.log(facultyResponse);
    setFaculty(facultyResponse.faculty);
  };

  const handleSubjectSave = async (subject) => {
    const updatedTimetable = { ...timetable };
    updatedTimetable[`${selectedCell.day}-${selectedCell.hour}`] = {
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      faculty: faculty.facultyName, // Assuming subject.faculty contains the faculty name
      from: timeSlots[selectedCell.hour].from,
      to: timeSlots[selectedCell.hour].to,
    };
    setTimetable(updatedTimetable);
    setShowModal(false); // Hide modal after selection
  };
  console.log(faculty);

  // Function to handle time change for each hour
  const handleTimeChange = (hour, key, value) => {
    setTimeSlots((prevTimeSlots) => ({
      ...prevTimeSlots,
      [hour]: { ...prevTimeSlots[hour], [key]: value },
    }));
  };

  const addTimetable = async (selectedBatch, timetable) => {
    try {
      console.log(timetable);
      const response = await addTimetableToBatchViaAdmin(
        selectedBatch,
        timetable,
      );
      toast.success(response.message);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };

  console.log(timetable);
  console.log(selectedSubject);
  // console.log(selectedBatch);
  return (
    <PanelDashboardLayout>
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
            console.log(e.target.value);
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
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          onClick={() => {
            addTimetable(selectedBatch, timetable);
          }}
        >
          {" "}
          Save{" "}
        </button>
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
                    <input
                      type="time"
                      value={timeSlots[hour].from}
                      onChange={(e) =>
                        handleTimeChange(hour, "from", e.target.value)
                      }
                      className="border p-0.5 rounded-md text-sm"
                    />
                    <span className="text-sm">to</span>
                    <input
                      type="time"
                      value={timeSlots[hour].to}
                      onChange={(e) =>
                        handleTimeChange(hour, "to", e.target.value)
                      }
                      className="border p-0.5 rounded-md text-sm"
                    />
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
                    className="border p-6 text-center cursor-pointer hover:bg-blue-50 transition-all duration-200 ease-in-out"
                    onClick={() => handleCellClick(day, hour)}
                  >
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Select Subject</h2>
            <select
              className="w-full mb-3 p-2 border"
              onChange={async (e) => {
                const selected = allSubjects.find(
                  (subject) => subject._id === e.target.value,
                );
                setSelectedSubject(selected);
                await handleSubjectSelect(selected);
              }}
            >
              <option value="">Select Subject</option>
              {allSubjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
            {selectedSubject && (
              <>
                <div className="p-2 border mb-3">
                  {selectedSubject.subjectCode}
                </div>
                <div className="p-2 border mb-3">{faculty.facultyName}</div>
              </>
            )}
            <div className="flex justify-end">
              <button
                className="mr-2 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-md"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                onClick={() => handleSubjectSave(selectedSubject)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelDashboardLayout>
  );
};

export default TimeTable;
