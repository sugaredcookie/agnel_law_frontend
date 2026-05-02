import React, { useState, useEffect } from "react";
import {
  getAllRubricsSubjectsViaAdmin,
  getAllSubjectsViaAdmin,
  getGroupsBySubjectViaAdmin,
  getAllGroupsViaAdmin,
} from "../../utils/Api";

// AddTopic component for local state management
function AddTopic({ markingScheme, setMarkingScheme }) {
  const [topicName, setTopicName] = useState("");
  const [topicMarks, setTopicMarks] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const name = topicName.trim();
    const value = parseInt(topicMarks, 10);
    if (!name) {
      setError("Topic name required");
      return;
    }
    if (isNaN(value) || value <= 0) {
      setError("Assigned marks must be a positive integer");
      return;
    }
    setMarkingScheme([...markingScheme, { name, value }]);
    setTopicName("");
    setTopicMarks("");
    setError("");
  };

  return (
    <div className="flex items-center mb-4 gap-2">
      <input
        type="text"
        placeholder="Topic Name"
        className="px-2 py-1 border border-gray-300 rounded"
        value={topicName}
        onChange={(e) => setTopicName(e.target.value)}
      />
      <input
        type="number"
        placeholder="Total Marks"
        className="px-2 py-1 border border-gray-300 rounded"
        value={topicMarks}
        onChange={(e) => setTopicMarks(e.target.value.replace(/[^0-9]/g, ""))}
        min={1}
      />
      <button
        type="button"
        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
        onClick={handleAdd}
      >
        Add Topic
      </button>
      {error && <span className="text-red-500 text-sm ml-2">{error}</span>}
    </div>
  );
}

function RubricEntryForm() {
  // RubricsSubject data
  const [rubricsSubjects, setRubricsSubjects] = useState([]);
  const [selectedRubricsSubject, setSelectedRubricsSubject] = useState("");
  const [selectedScheme, setSelectedScheme] = useState("");
  const [selectedSchemeData, setSelectedSchemeData] = useState(null);
  const [topics, setTopics] = useState([]);

  // Marking scheme for selected subject, per marking stage
  const [markingScheme, setMarkingScheme] = useState([]);
  const [markingStages, setMarkingStages] = useState([]);
  const [rubricTopics, setRubricTopics] = useState({});
  const [markingStage, setMarkingStage] = useState("");
  // Grade to percentage mapping
  const gradeMap = {
    "N/A": 0,
    Unsatisfactory: 20,
    Poor: 40,
    Adequate: 55,
    Good: 65,
    Accomplished: 75,
    Excellent: 95,
  };

  // State management
  const [subject, setSubject] = useState("");
  const [allSubjects, setAllSubjects] = useState([]);
  const [currentStageGrades, setCurrentStageGrades] = useState({});
  const [overallData, setOverallData] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [loadingRubrics, setLoadingRubrics] = useState(false);

  // Group-related state
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupError, setGroupError] = useState("");

  // Fetch all RubricsSubjects on mount
  useEffect(() => {
    const fetchRubricsSubjects = async () => {
      setLoadingRubrics(true);
      try {
        const response = await getAllRubricsSubjectsViaAdmin();
        setRubricsSubjects(response.rubricsSubjects || []);
        // Set default subject if available
        if ((response.rubricsSubjects || []).length > 0) {
          setSelectedRubricsSubject(response.rubricsSubjects[0]._id);
        }
      } catch (error) {
        console.error("Error fetching rubrics subjects:", error);
        setRubricsSubjects([]);
      } finally {
        setLoadingRubrics(false);
      }
    };
    fetchRubricsSubjects();
  }, []);

  // Update schemes when RubricsSubject changes
  useEffect(() => {
    if (selectedRubricsSubject) {
      const subject = rubricsSubjects.find(
        (sub) => sub._id === selectedRubricsSubject,
      );
      if (subject && subject.schemes) {
        setMarkingScheme(subject.schemes);
        setMarkingStages(subject.schemes.map((scheme) => scheme.name));
        setSelectedScheme("");
        setSelectedSchemeData(null);
        setTopics([]);
      }
    }
  }, [selectedRubricsSubject, rubricsSubjects]);

  // Update topics when scheme changes
  useEffect(() => {
    if (selectedScheme && selectedRubricsSubject) {
      const subject = rubricsSubjects.find(
        (sub) => sub._id === selectedRubricsSubject,
      );
      if (subject) {
        const scheme = subject.schemes.find((s) => s.name === selectedScheme);
        if (scheme) {
          setSelectedSchemeData(scheme);
          setTopics(scheme.topics || []);
          setMarkingStage(selectedScheme);
          // Initialize rubricTopics for this scheme
          setRubricTopics({
            [selectedScheme]: scheme.topics.map((topic) => ({
              name: topic.topic,
              value: topic.value,
              faculties: topic.faculties || [],
            })),
          });
        }
      }
    }
  }, [selectedScheme, selectedRubricsSubject, rubricsSubjects]);

  // Fetch all groups on mount
  const fetchAllGroups = async () => {
    setLoadingGroups(true);
    setGroupError("");
    try {
      // Try faculty token first, then admin token
      const facultyToken = localStorage.getItem("facultyToken");
      const adminToken = localStorage.getItem("adminToken");
      const token = facultyToken || adminToken;
      if (!token) {
        setAvailableGroups([]);
        setGroupError(
          "No faculty or admin token found. Please login as faculty or admin.",
        );
        return;
      }
      // Patch: temporarily override getAllGroupsViaAdmin to accept token
      const response = await getAllGroupsViaAdmin(token);
      // Handle different response structures
      let groups = [];
      if (response && response.groups) {
        groups = response.groups;
      } else if (response && response.data && response.data.groups) {
        groups = response.data.groups;
      } else if (Array.isArray(response)) {
        groups = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        groups = response.data;
      } else {
        groups = [];
      }
      setAvailableGroups(groups || []);
      if ((groups || []).length > 0) {
        setSelectedGroup(groups[0]._id);
      } else {
        setSelectedGroup("");
        setGroupError("No groups found. Please create groups first.");
      }
    } catch (error) {
      setAvailableGroups([]);
      setGroupError("Failed to fetch groups. Please try again.");
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchAllGroups();
  }, []);

  // Fetch all subjects on mount (keeping for backward compatibility)
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await getAllSubjectsViaAdmin();
        setAllSubjects(response.subjects || []);
        // Set default subject if available
        if ((response.subjects || []).length > 0) {
          setSubject(response.subjects[0]._id);
        }
      } catch (error) {
        setAllSubjects([]);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch markingScheme for selected subject and set markingStages
  useEffect(() => {
    const fetchMarkingScheme = async () => {
      if (!subject) {
        setMarkingScheme([]);
        setMarkingStages([]);
        setRubricTopics({});
        setMarkingStage("");
        return;
      }
      try {
        const selected = allSubjects.find((subj) => subj._id === subject);
        if (
          selected &&
          selected.markingScheme &&
          Array.isArray(selected.markingScheme)
        ) {
          setMarkingScheme(selected.markingScheme);
          const stages = selected.markingScheme.map(
            (scheme) => scheme.name || scheme,
          );
          setMarkingStages(stages);
          setMarkingStage("");
          // Always start rubricTopics as empty for each stage
          const emptyTopics = {};
          stages.forEach((stage) => {
            emptyTopics[stage] = [];
          });
          setRubricTopics(emptyTopics);
        } else {
          setMarkingScheme([]);
          setMarkingStages([]);
          setRubricTopics({});
          setMarkingStage("");
        }
      } catch (error) {
        setMarkingScheme([]);
        setMarkingStages([]);
        setRubricTopics({});
        setMarkingStage("");
      }
    };
    fetchMarkingScheme();
  }, [subject, allSubjects]);

  // Handle group selection
  const handleGroupSelection = (groupId) => {
    setSelectedGroup(groupId);
    // Group selection is now just for reference, no need to set other fields
  };

  // Reset current grades when topics changes
  useEffect(() => {
    const savedGrades = overallData[markingStage] || {};
    const newGrades = {};
    topics.forEach((item) => {
      newGrades[item.topic] = savedGrades[item.topic]?.grade || "";
    });
    setCurrentStageGrades(newGrades);
  }, [topics, markingStage, overallData]);

  // Handle grade change for a specific topic
  const handleGradeChange = (topic, grade) => {
    const newGrades = { ...currentStageGrades, [topic]: grade };
    setCurrentStageGrades(newGrades);

    // Update overall data
    const newOverallData = { ...overallData };
    if (!newOverallData[markingStage]) {
      newOverallData[markingStage] = {};
    }

    const item = topics.find((r) => r.topic === topic);
    if (item) {
      const percentage = gradeMap[grade];
      const obtained = Math.round((item.value * percentage) / 100);
      newOverallData[markingStage][topic] = {
        grade,
        percentage,
        obtained,
      };
    }

    setOverallData(newOverallData);
  };

  // Calculate stage totals
  const calculateStageTotal = (stage) => {
    const stageItems = topics || [];
    const stageData = overallData[stage] || {};
    let totalObtained = 0;
    let totalAssigned = 0;
    stageItems.forEach((item) => {
      totalAssigned += item.value;
      if (stageData[item.topic]) {
        totalObtained += stageData[item.topic].obtained;
      }
    });
    const percentage =
      totalAssigned > 0
        ? ((totalObtained / totalAssigned) * 100).toFixed(1)
        : "0.0";
    return { totalObtained, totalAssigned, percentage };
  };

  // Calculate overall totals
  const calculateOverallTotal = () => {
    let totalObtained = 0;
    let totalAssigned = 0;
    Object.keys(overallData).forEach((stage) => {
      const stageTotal = calculateStageTotal(stage);
      totalObtained += stageTotal.totalObtained;
      totalAssigned += stageTotal.totalAssigned;
    });
    const percentage =
      totalAssigned > 0
        ? ((totalObtained / totalAssigned) * 100).toFixed(1)
        : "0.0";
    return { totalObtained, totalAssigned, percentage };
  };

  // Validation
  const checkFormValidity = () => {
    // Check if all current stage grades are selected
    const currentStageItems = topics || [];
    const hasIncompleteGrades = currentStageItems.some(
      (item) => !currentStageGrades[item.topic],
    );
    return !hasIncompleteGrades;
  };

  const validateForm = () => {
    const newErrors = {};
    // Check if all current stage grades are selected
    const currentStageItems = topics || [];
    const hasIncompleteGrades = currentStageItems.some(
      (item) => !currentStageGrades[item.topic],
    );
    if (hasIncompleteGrades) {
      newErrors.grades = "All grades must be selected";
    }
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  // Validate form whenever dependencies change
  useEffect(() => {
    const isValid = checkFormValidity();
    setIsFormValid(isValid);
  }, [Object.keys(currentStageGrades).length, markingStage, topics]);

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      const payload = {
        subject: selectedRubricsSubject,
        selectedGroup: selectedGroup,
        markingStage: selectedScheme,
        grades: currentStageGrades,
        overallData,
        stageTotals: calculateStageTotal(selectedScheme),
        overallTotals: calculateOverallTotal(),
      };
      console.log("Form Submission:", JSON.stringify(payload, null, 2));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const currentStageTotal = calculateStageTotal(selectedScheme);
  const overallTotal = calculateOverallTotal();
  const hasOverallData = Object.keys(overallData).length > 0;

  // Get selected subject data
  const selectedSubjectData = rubricsSubjects.find(
    (sub) => sub._id === selectedRubricsSubject,
  );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-semibold mb-4">Rubric Entry</h1>
      <div className="space-y-6">
        {/* Subject Selection from RubricsSubject */}
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Subject
          </label>
          <select
            id="subject"
            value={selectedRubricsSubject}
            onChange={(e) => setSelectedRubricsSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={loadingRubrics}
          >
            <option value="">Select Subject</option>
            {rubricsSubjects.map((subj) => (
              <option key={subj._id} value={subj._id}>
                {subj.subjectName}
              </option>
            ))}
          </select>
          {selectedSubjectData && (
            <div className="mt-2 text-sm text-gray-600">
              <p>
                <strong>Subject Code:</strong> {selectedSubjectData.subjectCode}
              </p>
              <p>
                <strong>Subject Faculty:</strong>{" "}
                {selectedSubjectData.faculty?.facultyName || "Not assigned"}
              </p>
            </div>
          )}
        </div>

        {/* Group Selection */}
        {selectedRubricsSubject && (
          <div>
            <label
              htmlFor="group"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Group
            </label>
            <div className="flex gap-2 items-center mb-1">
              <select
                id="group"
                value={selectedGroup}
                onChange={(e) => handleGroupSelection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                disabled={loadingGroups}
              >
                <option value="">Select Group</option>
                {availableGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.groupName} -{" "}
                    {group.members
                      .map((m) => `${m.studentName} (${m.rollNumber})`)
                      .join(", ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={fetchAllGroups}
                disabled={loadingGroups}
                title="Reload Groups"
              >
                {loadingGroups ? "..." : "Reload"}
              </button>
            </div>
            {groupError && (
              <p className="text-sm text-red-500 mt-1">{groupError}</p>
            )}
            {selectedGroup && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Selected Group:</strong>{" "}
                  {
                    availableGroups.find((g) => g._id === selectedGroup)
                      ?.groupName
                  }
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Members:</strong>{" "}
                  {availableGroups
                    .find((g) => g._id === selectedGroup)
                    ?.members.map((m) => `${m.studentName} (${m.rollNumber})`)
                    .join(", ")}
                </p>
                <p className="text-sm text-blue-600">
                  <strong>Type:</strong>{" "}
                  {
                    availableGroups.find((g) => g._id === selectedGroup)
                      ?.groupType
                  }{" "}
                  (
                  {
                    availableGroups.find((g) => g._id === selectedGroup)
                      ?.groupSize
                  }{" "}
                  members)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Marking No. Dropdown from RubricsSubject schemes */}
        <div>
          <label
            htmlFor="markingStage"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Select Marking No
          </label>
          <select
            id="markingStage"
            value={selectedScheme}
            onChange={(e) => setSelectedScheme(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={!selectedRubricsSubject}
          >
            <option value="">Select Marking No</option>
            {Array.isArray(markingScheme) &&
              markingScheme.map((scheme, idx) => (
                <option key={scheme.name || idx} value={scheme.name}>
                  {scheme.name}
                </option>
              ))}
          </select>
          {selectedSchemeData && (
            <div className="mt-2 text-indigo-700 font-semibold">
              Total Marks: {selectedSchemeData.value}
            </div>
          )}
        </div>

        {/* Topics Table from RubricsSubject */}
        <div className="overflow-x-auto mb-4">
          <table className="table-auto w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left border border-gray-300">
                  Topic
                </th>
                <th className="px-4 py-2 text-left border border-gray-300">
                  Grade
                </th>
                <th className="px-4 py-2 text-left border border-gray-300">
                  Total Marks
                </th>
                <th className="px-4 py-2 text-left border border-gray-300">
                  Percentage
                </th>
                <th className="px-4 py-2 text-left border border-gray-300">
                  Obtained Marks
                </th>
                <th className="px-4 py-2 text-left border border-gray-300">
                  Assigned Faculty
                </th>
              </tr>
            </thead>
            <tbody>
              {topics.map((item, index) => {
                const grade = currentStageGrades[item.topic] || "";
                const percentage = grade ? gradeMap[grade] : 0;
                const obtained = grade
                  ? Math.round((item.value * gradeMap[grade]) / 100)
                  : 0;
                return (
                  <tr key={index}>
                    <td className="px-4 py-2 border border-gray-300">
                      {item.topic}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      <select
                        value={grade}
                        onChange={(e) =>
                          handleGradeChange(item.topic, e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="">Select Grade</option>
                        {Object.keys(gradeMap).map((gradeOption) => (
                          <option key={gradeOption} value={gradeOption}>
                            {gradeOption}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {item.value}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {percentage}%
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {obtained}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {item.faculties && item.faculties.length > 0 ? (
                        <div className="text-sm">
                          {item.faculties.map((faculty, idx) => (
                            <div key={idx} className="text-blue-600">
                              {faculty.facultyName || "Unknown Faculty"}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          No faculty assigned
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {errors.grades && (
          <p className="text-red-500 text-sm">{errors.grades}</p>
        )}

        {/* Stage & Overall Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Stage Total</h3>
            <p className="text-blue-800">
              Obtained {currentStageTotal.totalObtained} of{" "}
              {currentStageTotal.totalAssigned} ({currentStageTotal.percentage}
              %)
            </p>
          </div>
          {hasOverallData && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Overall Total</h3>
              <p className="text-green-800">
                Overall Obtained {overallTotal.totalObtained} of{" "}
                {overallTotal.totalAssigned} ({overallTotal.percentage}%)
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Submit
        </button>
      </div>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          Form submitted successfully!
        </div>
      )}
    </div>
  );
}

export default RubricEntryForm;
