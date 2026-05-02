import React, { useEffect, useState } from "react";
import FacultyDashboardLayout from "../FacultyDashboardLayout";
import { toast } from "react-toastify";
import {
  getFacultyDetails,
  getFacultySubjectsByBatch,
  getStudentsBySubject,
  downloadMarksTemplate,
  uploadMarks,
  updateStudentMarksAPI,
} from "../../../utils/Api";
import MarkChangeRequestModal from "./MarkChangeRequestModal";

const MySubjects = () => {
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [changeRequestStudent, setChangeRequestStudent] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await getFacultyDetails();
        setBatches(res.batches);
      } catch (error) {
        console.error("Error fetching faculty details:", error);
        toast.error("Failed to load batches", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    };
    fetchDetails();
  }, []);

  const handleBatchChange = async (batchId) => {
    const batch = batches.find((b) => b._id === batchId);
    setSelectedBatch(batch);
    setSelectedSubject(null);
    setSubjects([]);
    setStudents([]);

    if (batchId) {
      try {
        setLoading(true);
        const res = await getFacultySubjectsByBatch(batchId);
        setSubjects(res.subjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast.error("Failed to load subjects for this batch", {
          position: "top-right",
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubjectChange = async (subjectId) => {
    const subject = subjects.find((s) => s._id === subjectId);
    setSelectedSubject(subject);
    setStudents([]);

    if (subject && selectedBatch) {
      try {
        setLoading(true);
        const res = await getStudentsBySubject(subjectId, selectedBatch._id);

        const studentsWithMarks = res.data.students.map((student) => {
          const subjectData = student.academicDetails.subjects.find(
            (s) => s.subject._id === subjectId,
          );

          const hasExistingMarks = subjectData?.marks?.some(
            (m) => m.obtainedMarks != null && m.obtainedMarks !== "",
          );

          const marks = {};

          const internalScheme = subject.markingScheme?.find(
            (scheme) => scheme.name.toLowerCase() === "internal",
          );

          if (internalScheme) {
            // Check if breakdown has valid values
            const hasValidBreakdown = internalScheme.breakdown?.length > 0 && 
              internalScheme.breakdown.some((item) => item.value != null && item.value > 0);

            if (hasValidBreakdown) {
              internalScheme.breakdown.forEach((item) => {
                if (item.value != null && item.value > 0) {
                  marks[item.name] =
                    subjectData?.marks.find((m) => m.schemeName === item.name)
                      ?.obtainedMarks || "";
                }
              });
            } else if (internalScheme.value) {
              // No valid breakdown - use single Internal field
              marks["Internal"] =
                subjectData?.marks.find((m) => m.schemeName === "Internal")
                  ?.obtainedMarks || "";
            }
          }

          const externalScheme = subject.markingScheme?.find(
            (scheme) => scheme.name.toLowerCase() === "external",
          );
          if (externalScheme) {
            marks["External"] =
              subjectData?.marks.find((m) => m.schemeName === "External")
                ?.obtainedMarks || "";
          }

          return { ...student, marks, hasExistingMarks: !!hasExistingMarks };
        });

        // Sort students by roll number
        studentsWithMarks.sort((a, b) => {
          const rollA = a.academicDetails?.rollNumber || '';
          const rollB = b.academicDetails?.rollNumber || '';
          return rollA.localeCompare(rollB, undefined, { numeric: true });
        });

        setStudents(studentsWithMarks);
      } catch (error) {
        console.error("Error fetching students:", error);
        setError("Failed to fetch students");

        if (
          error.response?.data?.message === "No batches found for this subject."
        ) {
          toast.error(
            "No batches found for this subject. Please contact admin to assign batches to this subject.",
            {
              position: "top-right",
              autoClose: 7000,
            },
          );
        } else {
          toast.error(
            "Failed to load students for this subject. Please try again.",
            {
              position: "top-right",
              autoClose: 5000,
            },
          );
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkChange = (studentId, schemeName, value) => {
    setStudents(
      students.map((student) =>
        student._id === studentId
          ? { ...student, marks: { ...student.marks, [schemeName]: value } }
          : student,
      ),
    );
  };

  const handleSaveMarks = async (studentId) => {
    const student = students.find((s) => s._id === studentId);

    const internalScheme = getInternalMarkScheme();
    const marks = internalScheme
      ? Object.keys(internalScheme).map((schemeName) => ({
          schemeName,
          obtainedMarks: student.marks[schemeName] || 0,
        }))
      : [];

    const filteredMarks = marks.filter((m) => m.obtainedMarks !== "");

    try {
      await updateStudentMarksAPI({
        studentId,
        subjectId: selectedSubject._id,
        marks: filteredMarks,
      });

      toast.success("Marks saved successfully!", {
        position: "top-right",
        autoClose: 3000,
      });

      // Refresh the student list
      handleSubjectChange(selectedSubject._id);
    } catch (error) {
      console.error("Error saving marks:", error);
      toast.error("Failed to save marks. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedSubject || !selectedBatch) {
      toast.error("Please select a batch and subject first.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      await downloadMarksTemplate(selectedSubject._id, selectedBatch._id);
      toast.success("Template downloaded successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleFileUpload = async () => {
    if (!file || !selectedSubject || !selectedBatch) {
      toast.error("Please select a batch, subject and file.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const formData = new FormData();
    formData.append("marksSheet", file);

    try {
      await uploadMarks(selectedSubject._id, formData, selectedBatch._id);
      toast.success("Marks uploaded successfully!", {
        position: "top-right",
        autoClose: 3000,
      });

      // Refresh student list
      handleSubjectChange(selectedSubject._id);
      setFile(null);
    } catch (error) {
      console.error("Error uploading marks:", error);
      toast.error(
        "Error uploading marks. Please check the file format and try again.",
        {
          position: "top-right",
          autoClose: 5000,
        },
      );
    }
  };

  const toggleRowExpansion = (studentId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const calculateInternalTotal = (student, internalScheme) => {
    if (!internalScheme) return 0;
    return Object.keys(internalScheme).reduce((sum, name) => {
      return sum + (parseFloat(student.marks[name]) || 0);
    }, 0);
  };

  // Determine internal marking scheme based on subject
  const getInternalMarkScheme = () => {
    if (!selectedSubject || !selectedSubject.markingScheme) return null;

    const internalScheme = selectedSubject.markingScheme.find(
      (scheme) => scheme.name.toLowerCase() === "internal",
    );

    if (!internalScheme) return null;

    // Check if breakdown exists with valid values (not null/undefined)
    const hasValidBreakdown = internalScheme.breakdown?.length > 0 && 
      internalScheme.breakdown.some((item) => item.value != null && item.value > 0);

    if (hasValidBreakdown) {
      const breakdown = {};
      internalScheme.breakdown.forEach((item) => {
        if (item.value != null && item.value > 0) {
          breakdown[item.name] = item.value;
        }
      });
      if (Object.keys(breakdown).length > 0) {
        return breakdown;
      }
    }

    // No valid breakdown - use internal value as single field
    if (internalScheme.value) {
      return { Internal: internalScheme.value };
    }

    return null;
  };

  const internalScheme = getInternalMarkScheme();

  return (
    <FacultyDashboardLayout>
      <h1 className="text-2xl font-bold mb-4">
        My Subjects - Internal Marks Entry
      </h1>

      <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Batch
            </label>
            <select
              value={selectedBatch?._id || ""}
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
            <label className="block text-sm font-medium mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubject?._id || ""}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full p-2 border-2 border-blue-500 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={!selectedBatch}
            >
              <option value="">-- Select a Subject --</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.subjectName} ({subject.subjectCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading && <p>Loading students...</p>}

      {selectedSubject && !loading && (
        <div className="my-3 flex gap-3 items-center">
          <button
            onClick={handleDownloadTemplate}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Download Excel Template
          </button>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-sm"
          />
          <button
            onClick={handleFileUpload}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Upload Excel
          </button>
        </div>
      )}

      {students.length > 0 && selectedSubject && internalScheme && (
        <div>
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2 text-blue-800">
              Internal Marking Scheme:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(internalScheme).map(([name, value]) => (
                <div key={name}>
                  {name}: {value} marks
                </div>
              ))}
            </div>
            <div className="mt-2 font-semibold">
              Total Internal:{" "}
              {Object.values(internalScheme).reduce((a, b) => a + b, 0)} marks
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 mt-4 shadow-md rounded-lg">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Roll No
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Student Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Internal (
                    {Object.values(internalScheme).reduce((a, b) => a + b, 0)})
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    External (Read-only)
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Status
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const isExpanded = expandedRows[student._id];
                  const isLocked = student.hasExistingMarks;
                  const internalTotal = calculateInternalTotal(
                    student,
                    internalScheme,
                  );
                  const totalInternal = Object.values(internalScheme).reduce(
                    (a, b) => a + b,
                    0,
                  );

                  return (
                    <React.Fragment key={student._id}>
                      <tr className={isLocked ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-50"}>
                        <td className="border border-gray-300 px-4 py-2">
                          {student.academicDetails.rollNumber}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {`${student.studentDetails.firstName} ${student.studentDetails.lastName}`}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleRowExpansion(student._id)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium text-sm"
                            >
                              {isExpanded ? "▼ Hide" : "▶ Show"} Breakdown
                            </button>
                            <span className="font-semibold text-gray-700">
                              Total: {internalTotal} / {totalInternal}
                            </span>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 bg-gray-100">
                          <input
                            type="number"
                            value={student.marks["External"]}
                            className="w-full p-2 bg-gray-200 border border-gray-400 rounded cursor-not-allowed"
                            readOnly
                            disabled
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {isLocked ? (
                            <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">
                              Locked
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                              Editable
                            </span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {isLocked ? (
                            <button
                              onClick={() => setChangeRequestStudent(student)}
                              className="bg-amber-500 text-white py-2 px-4 rounded hover:bg-amber-600 font-medium text-sm"
                            >
                              Request Change
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSaveMarks(student._id)}
                              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 font-medium"
                            >
                              Save
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-blue-50">
                          <td
                            colSpan="6"
                            className="border border-gray-300 px-4 py-3"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {Object.entries(internalScheme).map(
                                ([name, maxValue]) => (
                                  <div key={name} className="flex flex-col">
                                    <label className="text-sm font-semibold text-gray-700 mb-1">
                                      {name} (Max: {maxValue})
                                    </label>
                                    <input
                                      type="number"
                                      value={student.marks[name]}
                                      onChange={(e) =>
                                        handleMarkChange(
                                          student._id,
                                          name,
                                          e.target.value,
                                        )
                                      }
                                      className={`p-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                        isLocked
                                          ? "border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
                                          : "border-blue-500 bg-white text-black"
                                      }`}
                                      min="0"
                                      max={maxValue}
                                      disabled={isLocked}
                                    />
                                  </div>
                                ),
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedSubject && students.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No students found for this subject.
        </div>
      )}

      {changeRequestStudent && internalScheme && (
        <MarkChangeRequestModal
          student={changeRequestStudent}
          subjectId={selectedSubject._id}
          internalScheme={internalScheme}
          onClose={() => setChangeRequestStudent(null)}
          onSubmitted={() => {
            setChangeRequestStudent(null);
            handleSubjectChange(selectedSubject._id);
          }}
        />
      )}
    </FacultyDashboardLayout>
  );
};

export default MySubjects;
