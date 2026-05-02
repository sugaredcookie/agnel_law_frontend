import React, { useState, useEffect, useRef } from "react";
import {
  getAllFacultiesViaAdmin,
  createRubricsSubjectViaAdmin,
  getStudentsForRandomSelectionViaAdmin,
  createGroupViaAdmin,
} from "../../../utils/Api";
import PanelDashboardLayout from "../PanelDashboardLayout";

const RubricsSubjectForm = () => {
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [schemes, setSchemes] = useState([
    { name: "", value: "", topics: [{ topic: "", value: "", faculties: [] }] },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Group-related state
  const [groupType, setGroupType] = useState("Individual");
  const [groupSize, setGroupSize] = useState(1);
  const [groupMembers, setGroupMembers] = useState([
    { rollNumber: "", studentName: "", studentId: "" },
  ]);
  const [allStudents, setAllStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [groupError, setGroupError] = useState("");
  const [groupSuccess, setGroupSuccess] = useState("");

  useEffect(() => {
    const fetchAllFaculties = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getAllFacultiesViaAdmin();
        let faculties = [];
        if (Array.isArray(response)) {
          faculties = response;
        } else if (Array.isArray(response.faculties)) {
          faculties = response.faculties;
        } else if (Array.isArray(response.data)) {
          faculties = response.data;
        }
        if (!faculties.length) {
          // Debug log for developer
          // eslint-disable-next-line no-console
          console.warn("Faculty API response:", response);
        }
        setFacultyList(faculties.filter((f) => f.facultyName));
      } catch (error) {
        setError("Failed to fetch faculties");
      } finally {
        setLoading(false);
      }
    };
    fetchAllFaculties();
  }, []);

  // Fetch all students for group functionality
  useEffect(() => {
    const fetchAllStudents = async () => {
      setLoadingStudents(true);
      try {
        const response = await getStudentsForRandomSelectionViaAdmin();
        console.log("Fetched students:", response.students);
        setAllStudents(response.students || []);
      } catch (error) {
        console.error("Error fetching students:", error);
        setAllStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchAllStudents();
  }, []);

  // Add new scheme
  const handleAddScheme = () => {
    setSchemes([
      ...schemes,
      {
        name: "",
        value: "",
        topics: [{ topic: "", value: "", faculties: [] }],
      },
    ]);
  };

  // Remove scheme
  const handleRemoveScheme = (idx) => {
    setSchemes(schemes.filter((_, i) => i !== idx));
  };

  // Add topic to a scheme
  const handleAddTopic = (schemeIdx) => {
    const updated = [...schemes];
    updated[schemeIdx].topics.push({ topic: "", value: "", faculties: [] });
    setSchemes(updated);
  };

  // Remove topic from a scheme
  const handleRemoveTopic = (schemeIdx, topicIdx) => {
    const updated = [...schemes];
    updated[schemeIdx].topics = updated[schemeIdx].topics.filter(
      (_, i) => i !== topicIdx,
    );
    setSchemes(updated);
  };

  // Handle scheme/topic input changes
  const handleSchemeChange = (idx, field, val) => {
    const updated = [...schemes];
    updated[idx][field] = val;
    setSchemes(updated);
  };
  const handleTopicChange = (schemeIdx, topicIdx, field, val) => {
    const updated = [...schemes];
    updated[schemeIdx].topics[topicIdx][field] = val;
    setSchemes(updated);
  };
  // Handle faculty selection for a topic (multiple single-select dropdowns)
  const handleTopicFacultyChange = (
    schemeIdx,
    topicIdx,
    facultyIdx,
    facultyId,
  ) => {
    const updated = [...schemes];
    updated[schemeIdx].topics[topicIdx].faculties[facultyIdx] = facultyId;
    setSchemes(updated);
  };

  // Add a new faculty dropdown to a topic
  const handleAddFacultyToTopic = (schemeIdx, topicIdx) => {
    const updated = [...schemes];
    updated[schemeIdx].topics[topicIdx].faculties.push("");
    setSchemes(updated);
  };

  // Remove a faculty dropdown from a topic
  const handleRemoveFacultyFromTopic = (schemeIdx, topicIdx, facultyIdx) => {
    const updated = [...schemes];
    updated[schemeIdx].topics[topicIdx].faculties = updated[schemeIdx].topics[
      topicIdx
    ].faculties.filter((_, i) => i !== facultyIdx);
    setSchemes(updated);
  };

  // Validate topic values sum
  const isTopicSumValid = (scheme) => {
    const sum = scheme.topics.reduce((acc, t) => acc + Number(t.value || 0), 0);
    return Number(scheme.value || 0) === sum;
  };

  // Group-related functions
  const handleGroupTypeChange = (type) => {
    setGroupType(type);
    if (type === "Individual") {
      setGroupSize(1);
      setGroupMembers([{ rollNumber: "", studentName: "", studentId: "" }]);
    } else {
      setGroupSize(2);
      setGroupMembers([
        { rollNumber: "", studentName: "", studentId: "" },
        { rollNumber: "", studentName: "", studentId: "" },
      ]);
    }
  };

  const handleGroupSizeChange = (size) => {
    const newSize = Math.max(1, Math.min(10, size));
    setGroupSize(newSize);

    const currentMembers = [...groupMembers];
    if (newSize > currentMembers.length) {
      // Add more members
      const newMembers = Array.from(
        { length: newSize - currentMembers.length },
        () => ({
          rollNumber: "",
          studentName: "",
          studentId: "",
        }),
      );
      setGroupMembers([...currentMembers, ...newMembers]);
    } else if (newSize < currentMembers.length) {
      // Remove excess members
      setGroupMembers(currentMembers.slice(0, newSize));
    }
  };

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...groupMembers];
    updatedMembers[index][field] = value;

    // If roll number is entered, try to find student name
    if (field === "rollNumber" && value) {
      const student = allStudents.find((s) => s.rollNumber === value);
      if (student) {
        updatedMembers[index].studentName = student.studentName;
        updatedMembers[index].studentId = student._id;
      } else {
        updatedMembers[index].studentName = "";
        updatedMembers[index].studentId = "";
      }
    }

    setGroupMembers(updatedMembers);
  };

  const generateRandomMembers = () => {
    if (allStudents.length === 0) {
      setGroupError("No students available for random selection");
      return;
    }

    // Shuffle students and pick random ones
    const shuffled = [...allStudents].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, groupSize);

    const newMembers = selected.map((student, index) => ({
      rollNumber: student.rollNumber,
      studentName: student.studentName,
      studentId: student._id,
    }));

    // If we don't have enough students, fill with empty entries
    while (newMembers.length < groupSize) {
      newMembers.push({ rollNumber: "", studentName: "", studentId: "" });
    }

    setGroupMembers(newMembers);
    setGroupError("");
  };

  const createGroup = async () => {
    // Validate group data
    const validMembers = groupMembers.filter(
      (member) => member.rollNumber && member.studentName && member.studentId,
    );

    if (validMembers.length === 0) {
      setGroupError("Please add at least one valid member");
      return;
    }

    if (validMembers.length !== groupSize) {
      setGroupError(
        `Group size should be ${groupSize}, but only ${validMembers.length} valid members found`,
      );
      return;
    }

    setGroupError("");
    setLoading(true);

    try {
      const groupData = {
        groupName: `Group ${Math.floor(Math.random() * 1000) + 1}`,
        groupType,
        groupSize,
        members: validMembers,
        // No subjectId needed - groups are independent
      };

      console.log("Creating group with data:", groupData);
      const groupResponse = await createGroupViaAdmin(groupData);
      console.log("Group creation response:", groupResponse);

      setGroupSuccess(
        `Group created successfully! Group Name: ${groupData.groupName}`,
      );
      setTimeout(() => setGroupSuccess(""), 3000);

      // Reset form
      setGroupMembers([{ rollNumber: "", studentName: "", studentId: "" }]);
      setGroupSize(1);
      setGroupType("Individual");
    } catch (error) {
      console.error("Error creating group:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create group";
      setGroupError(`Group creation failed: ${errorMessage}`);
      setTimeout(() => setGroupError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all schemes
    for (const scheme of schemes) {
      if (!isTopicSumValid(scheme)) {
        setError(
          `Sum of topic values must equal Scheme Value for scheme "${scheme.name}"`,
        );
        setSuccess("");
        return;
      }
    }
    setError("");
    setLoading(true);
    try {
      // Prepare payload for backend
      const payload = {
        subjectName,
        subjectCode,
        description,
        faculty: selectedFaculty,
        schemes: schemes.map((scheme) => ({
          name: scheme.name,
          value: Number(scheme.value),
          topics: scheme.topics.map((topic) => ({
            topic: topic.topic,
            value: Number(topic.value),
            faculties: topic.faculties.filter(Boolean),
          })),
        })),
      };

      // Create the subject first
      const subjectResponse = await createRubricsSubjectViaAdmin(payload);

      setSuccess("Subject created successfully!");
      setTimeout(() => setSuccess(""), 3000); // Hide after 3 seconds

      // Reset all forms
      setSubjectName("");
      setSubjectCode("");
      setDescription("");
      setSelectedFaculty("");
      setSchemes([
        {
          name: "",
          value: "",
          topics: [{ topic: "", value: "", faculties: [] }],
        },
      ]);
      setGroupMembers([{ rollNumber: "", studentName: "", studentId: "" }]);
      setGroupSize(1);
      setGroupType("Individual");
    } catch (err) {
      console.error("Full error:", err); // Debug log
      const errorMessage =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create subject";
      setError(errorMessage);
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelDashboardLayout>
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-gray-50 py-12 px-2">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-12 border border-gray-100">
          <div className="mb-8">
            <div
              className="bg-yellow-100 text-yellow-800 text-2xl font-bold rounded px-6 py-3 text-center mb-6"
              style={{ letterSpacing: 0.5 }}
            >
              Create Subject
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-gray-700 font-medium">
                  Subject Name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 bg-gray-100 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700 font-medium">
                  Subject Code
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 bg-gray-100 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  pattern="[A-Za-z0-9]+"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                Description
              </label>
              <textarea
                className="w-full border border-gray-300 bg-gray-100 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 min-h-[80px] transition-all"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 font-medium">
                Faculty
              </label>
              <select
                className="w-full border border-gray-300 bg-gray-100 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                required
              >
                <option value="">Select Faculty</option>
                {facultyList.map((faculty) => (
                  <option key={faculty._id} value={faculty._id}>
                    {faculty.facultyName}
                  </option>
                ))}
              </select>
            </div>

            {/* Group Creation Section */}
            <div className="mt-10">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">
                    Create Student Group for Rubrics Marking
                  </h3>

                  {/* Group Type Selection */}
                  <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-3">
                      Participation Type
                    </label>
                    <div className="flex space-x-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="Individual"
                          checked={groupType === "Individual"}
                          onChange={(e) =>
                            handleGroupTypeChange(e.target.value)
                          }
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium">
                          Individual
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="Group"
                          checked={groupType === "Group"}
                          onChange={(e) =>
                            handleGroupTypeChange(e.target.value)
                          }
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium">Group</span>
                      </label>
                    </div>
                  </div>

                  {/* Group Size Selection */}
                  {groupType === "Group" && (
                    <div className="mb-6">
                      <label className="block text-gray-700 font-semibold mb-2">
                        Group Size
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={groupSize}
                        onChange={(e) =>
                          handleGroupSizeChange(parseInt(e.target.value) || 2)
                        }
                        className="w-full max-w-[200px] border border-gray-300 bg-gray-100 text-gray-900 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                      />
                    </div>
                  )}

                  {/* Random Generation Button */}
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={generateRandomMembers}
                      disabled={loadingStudents}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loadingStudents
                        ? "Loading Students..."
                        : "Generate Random Roll Numbers"}
                    </button>
                  </div>

                  {/* Group Members */}
                  <div className="space-y-4">
                    <label className="block text-gray-700 font-semibold">
                      Group Members
                    </label>
                    {groupMembers.map((member, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-xl p-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-gray-600 font-medium mb-2 text-sm">
                              Roll Number
                            </label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 bg-gray-50 text-gray-900 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="Enter roll number"
                              value={member.rollNumber}
                              onChange={(e) =>
                                handleMemberChange(
                                  index,
                                  "rollNumber",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 font-medium mb-2 text-sm">
                              Student Name
                            </label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 bg-gray-50 text-gray-900 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="Student name will auto-fill"
                              value={member.studentName}
                              readOnly
                            />
                          </div>
                          <div className="flex items-end">
                            <span className="text-sm text-gray-500">
                              {index === 0
                                ? "Main Student"
                                : `Group Member ${index}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Group Error/Success Messages */}
                  {groupError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-center font-medium p-4 rounded-lg mt-4">
                      {groupError}
                    </div>
                  )}
                  {groupSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 text-center font-medium p-4 rounded-lg mt-4">
                      {groupSuccess}
                    </div>
                  )}

                  {/* Create Group Button */}
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={createGroup}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    >
                      {loading ? "Creating Group..." : "Create Group"}
                    </button>

                    {/* Test Group Creation Button */}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          console.log("Testing group creation...");
                          const testGroupData = {
                            groupName: "Test Group",
                            groupType: "Individual",
                            groupSize: 1,
                            members: [
                              {
                                studentId:
                                  allStudents[0]?._id ||
                                  "507f1f77bcf86cd799439011",
                                rollNumber:
                                  allStudents[0]?.rollNumber || "TEST001",
                                studentName:
                                  allStudents[0]?.studentName || "Test Student",
                              },
                            ],
                            // No subjectId needed
                          };
                          console.log("Test group data:", testGroupData);
                          const response =
                            await createGroupViaAdmin(testGroupData);
                          console.log(
                            "Test group creation response:",
                            response,
                          );
                          alert("Test group created successfully!");
                        } catch (error) {
                          console.error("Test group creation failed:", error);
                          alert(
                            "Test group creation failed: " +
                              (error.response?.data?.error || error.message),
                          );
                        }
                      }}
                      className="ml-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                    >
                      Test Group Creation
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Schemes Section */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-6">
                <label className="block text-xl font-bold text-gray-800">
                  Schemes
                </label>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
                  onClick={handleAddScheme}
                >
                  + Add Scheme
                </button>
              </div>

              <div className="space-y-8">
                {schemes.map((scheme, sIdx) => (
                  <div
                    key={sIdx}
                    className="border-2 border-blue-200 rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-white shadow-lg transition-all duration-200 hover:shadow-xl"
                  >
                    <div className="flex flex-wrap gap-4 mb-6 items-end">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-gray-700 font-semibold mb-2">
                          Scheme Name
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 bg-gray-100 text-gray-900 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all"
                          value={scheme.name}
                          onChange={(e) =>
                            handleSchemeChange(sIdx, "name", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="flex-1 min-w-[140px] max-w-[200px]">
                        <label className="block text-gray-700 font-semibold mb-2">
                          Scheme Value
                        </label>
                        <input
                          type="number"
                          className="w-full border border-gray-300 bg-gray-100 text-gray-900 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all"
                          value={scheme.value}
                          onChange={(e) =>
                            handleSchemeChange(sIdx, "value", e.target.value)
                          }
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 font-bold text-2xl rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200"
                        onClick={() => handleRemoveScheme(sIdx)}
                        title="Remove Scheme"
                      >
                        ×
                      </button>
                    </div>

                    {/* Topics for this scheme */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-gray-700 font-semibold text-lg">
                          Topics
                        </label>
                        <button
                          type="button"
                          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-3 py-1.5 rounded-md transition-colors duration-200 text-sm"
                          onClick={() => handleAddTopic(sIdx)}
                        >
                          + Add Topic
                        </button>
                      </div>

                      <div className="space-y-4">
                        {scheme.topics.map((topic, tIdx) => (
                          <div
                            key={tIdx}
                            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                              {/* Topic Name */}
                              <div className="lg:col-span-4">
                                <label className="block text-gray-600 font-medium mb-2 text-sm">
                                  Topic Name
                                </label>
                                <input
                                  type="text"
                                  className="w-full border border-gray-300 bg-gray-50 text-gray-900 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all"
                                  placeholder="Enter topic name"
                                  value={topic.topic}
                                  onChange={(e) =>
                                    handleTopicChange(
                                      sIdx,
                                      tIdx,
                                      "topic",
                                      e.target.value,
                                    )
                                  }
                                  required
                                />
                              </div>

                              {/* Topic Value */}
                              <div className="lg:col-span-2">
                                <label className="block text-gray-600 font-medium mb-2 text-sm">
                                  Value
                                </label>
                                <input
                                  type="number"
                                  className="w-full border border-gray-300 bg-gray-50 text-gray-900 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all"
                                  placeholder="0"
                                  value={topic.value}
                                  onChange={(e) =>
                                    handleTopicChange(
                                      sIdx,
                                      tIdx,
                                      "value",
                                      e.target.value,
                                    )
                                  }
                                  required
                                />
                              </div>

                              {/* Faculties Section */}
                              <div className="lg:col-span-5">
                                <label className="block text-gray-600 font-medium mb-2 text-sm">
                                  Assigned Faculties
                                </label>
                                <div className="space-y-3">
                                  {topic.faculties.length === 0 && (
                                    <div className="text-gray-400 text-sm italic bg-gray-50 rounded-lg p-3 border border-dashed border-gray-300">
                                      No faculty assigned yet. Click "Add
                                      Faculty" to assign.
                                    </div>
                                  )}
                                  {topic.faculties.map(
                                    (facultyId, facultyIdx) => (
                                      <div
                                        key={facultyIdx}
                                        className="flex items-center gap-3"
                                      >
                                        <select
                                          className="flex-1 bg-blue-50 border border-blue-200 text-gray-900 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all"
                                          value={facultyId}
                                          onChange={(e) =>
                                            handleTopicFacultyChange(
                                              sIdx,
                                              tIdx,
                                              facultyIdx,
                                              e.target.value,
                                            )
                                          }
                                        >
                                          <option value="">
                                            Select Faculty
                                          </option>
                                          {facultyList.map((faculty) => (
                                            <option
                                              key={faculty._id}
                                              value={faculty._id}
                                            >
                                              {faculty.facultyName}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          type="button"
                                          className="text-red-600 hover:text-red-700 hover:bg-red-100 font-bold text-lg rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 flex-shrink-0"
                                          onClick={() =>
                                            handleRemoveFacultyFromTopic(
                                              sIdx,
                                              tIdx,
                                              facultyIdx,
                                            )
                                          }
                                          title="Remove Faculty"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ),
                                  )}
                                  <button
                                    type="button"
                                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition text-sm flex items-center gap-1"
                                    onClick={() =>
                                      handleAddFacultyToTopic(sIdx, tIdx)
                                    }
                                  >
                                    <span className="text-lg">+</span> Add
                                    Faculty
                                  </button>
                                </div>
                              </div>

                              {/* Remove Topic Button */}
                              <div className="lg:col-span-1 flex justify-center">
                                <button
                                  type="button"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-100 font-bold text-xl rounded-full w-9 h-9 flex items-center justify-center transition-all duration-200 mt-6 lg:mt-0"
                                  onClick={() => handleRemoveTopic(sIdx, tIdx)}
                                  title="Remove Topic"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Topic sum validation */}
                    {!isTopicSumValid(scheme) && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm mt-4 p-3 rounded-lg flex items-center gap-2">
                        <span className="text-red-500 font-bold">⚠</span>
                        Sum of topic values must equal Scheme Value.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-center font-medium p-4 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-center font-medium p-4 rounded-lg">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-lg"
              disabled={loading}
            >
              {loading ? "Creating Subject..." : "Create Subject"}
            </button>
          </form>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default RubricsSubjectForm;
