/*
 * SubjectLinking.jsx
 * Manual linking UI to connect exam session subjects to admin panel Subject model.
 * This bridges the gap between exam-based slugs and the master Subject database.
 * Supports both Regular Exam and ATKT sessions.
 */
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getRegularExamSessionsAPI,
  getSubjectsForLinkingAPI,
  getSubjectConfigsForLinkingAPI,
  linkSubjectAPI,
  bulkLinkSubjectsAPI,
  getAtktSessionsAPI,
  getAtktSubjectConfigsForLinkingAPI,
  linkAtktSubjectAPI,
  bulkLinkAtktSubjectsAPI,
} from "../../utils/Api";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import SearchableDropdown from "../../components/SearchableDropdown";

const SubjectLinking = () => {
  const [sessionType, setSessionType] = useState("regular"); // "regular" or "atkt"
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [adminSubjects, setAdminSubjects] = useState([]);
  const [subjectConfigs, setSubjectConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [pendingLinks, setPendingLinks] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, [sessionType]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setSelectedSessionId("");
      setSubjectConfigs([]);
      setPendingLinks({});

      const sessionsPromise = sessionType === "regular"
        ? getRegularExamSessionsAPI()
        : getAtktSessionsAPI();

      const [sessionsRes, subjectsRes] = await Promise.all([
        sessionsPromise,
        getSubjectsForLinkingAPI(),
      ]);

      setSessions(sessionsRes.sessions || []);
      setAdminSubjects(subjectsRes || []);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectConfigs = useCallback(async (sessionId) => {
    if (!sessionId) {
      setSubjectConfigs([]);
      return;
    }
    try {
      setLoading(true);
      const configsPromise = sessionType === "regular"
        ? getSubjectConfigsForLinkingAPI(sessionId)
        : getAtktSubjectConfigsForLinkingAPI(sessionId);
      const configs = await configsPromise;
      setSubjectConfigs(configs || []);
      setPendingLinks({});
    } catch (error) {
      console.error("Failed to fetch subject configs:", error);
      toast.error("Failed to load subject configurations");
    } finally {
      setLoading(false);
    }
  }, [sessionType]);

  const handleSessionChange = (e) => {
    const sessionId = e.target.value;
    setSelectedSessionId(sessionId);
    fetchSubjectConfigs(sessionId);
  };

  const handleLinkChange = (configId, examSubjectId, subjectId) => {
    const key = `${configId}:${examSubjectId}`;
    setPendingLinks((prev) => ({
      ...prev,
      [key]: subjectId || null,
    }));
  };

  const handleSaveLink = async (configId, examSubjectId) => {
    const key = `${configId}:${examSubjectId}`;
    const subjectId = pendingLinks[key];

    if (subjectId === undefined) {
      toast.info("No changes to save");
      return;
    }

    try {
      setLinking(true);
      const linkApi = sessionType === "regular" ? linkSubjectAPI : linkAtktSubjectAPI;
      await linkApi(configId, examSubjectId, subjectId);
      toast.success(subjectId ? "Subject linked successfully" : "Subject unlinked");
      
      setPendingLinks((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      
      fetchSubjectConfigs(selectedSessionId);
    } catch (error) {
      console.error("Failed to link subject:", error);
      toast.error("Failed to save link");
    } finally {
      setLinking(false);
    }
  };

  const handleBulkSave = async (configId) => {
    const configLinks = Object.entries(pendingLinks)
      .filter(([key]) => key.startsWith(`${configId}:`))
      .map(([key, subjectId]) => ({
        examSubjectId: key.split(":")[1],
        subjectId,
      }));

    if (configLinks.length === 0) {
      toast.info("No pending changes to save");
      return;
    }

    try {
      setLinking(true);
      const bulkLinkApi = sessionType === "regular" ? bulkLinkSubjectsAPI : bulkLinkAtktSubjectsAPI;
      await bulkLinkApi(configId, configLinks);
      toast.success(`Saved ${configLinks.length} link(s) successfully`);
      
      setPendingLinks((prev) => {
        const updated = { ...prev };
        configLinks.forEach(({ examSubjectId }) => {
          delete updated[`${configId}:${examSubjectId}`];
        });
        return updated;
      });
      
      fetchSubjectConfigs(selectedSessionId);
    } catch (error) {
      console.error("Failed to bulk save:", error);
      toast.error("Failed to save links");
    } finally {
      setLinking(false);
    }
  };

  const getCurrentLinkedSubjectId = (configId, subject) => {
    const key = `${configId}:${subject.id}`;
    if (pendingLinks.hasOwnProperty(key)) {
      return pendingLinks[key] || "";
    }
    return subject.subjectId?._id || subject.subjectId || "";
  };

  const hasPendingChanges = (configId) => {
    return Object.keys(pendingLinks).some((key) =>
      key.startsWith(`${configId}:`)
    );
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <ExaminerNavbar />
        <ExaminerTopHeader />
        <div className="lg:ml-64 pt-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen text-black">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 max-w-7xl mx-auto mt-10">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Subject Linking</h1>
              <p className="text-gray-600 mt-1">
                Connect exam session subjects to the admin Subject database to
                enable faculty mark integration
              </p>
            </div>

            {/* Warning/Info Banner */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-amber-800 font-medium">Important Notice</p>
                  <p className="text-amber-700 text-sm mt-1">
                    If you notice any discrepancies in subject codes, subject names, or encounter any issues during linking, 
                    please contact the <span className="font-semibold">Admin / IT Department</span> to make the necessary corrections 
                    in the master Subject database.
                  </p>
                </div>
              </div>
            </div>

            {/* Session Type Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Type
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setSessionType("regular")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    sessionType === "regular"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Regular Exam
                </button>
                <button
                  onClick={() => setSessionType("atkt")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    sessionType === "atkt"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  ATKT Exam
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select {sessionType === "regular" ? "Regular" : "ATKT"} Exam Session
              </label>
              <select
                value={selectedSessionId}
                onChange={handleSessionChange}
                className="w-full md:w-1/2 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Session --</option>
                {sessions.map((session) => (
                  <option key={session._id} value={session._id}>
                    {session.title} {sessionType === "regular" && `(${session.sessionType})`} - {session.status}
                  </option>
                ))}
              </select>
            </div>

            {loading && selectedSessionId && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!loading && selectedSessionId && subjectConfigs.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  No subject configurations found for this session.
                </p>
              </div>
            )}

            {!loading && subjectConfigs.length > 0 && (
              <div className="space-y-6">
                {subjectConfigs.map((config) => (
                  <div
                    key={config._id}
                    className="border border-gray-300 rounded-lg p-4 bg-white"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {config.course} - {config.batchLabel} ({config.pattern})
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {config.subjects.filter((s) => s.isLinked).length} of{" "}
                          {config.subjects.length} subject(s) linked
                        </p>
                      </div>
                      {hasPendingChanges(config._id) && (
                        <button
                          onClick={() => handleBulkSave(config._id)}
                          disabled={linking}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                        >
                          {linking ? "Saving..." : "Save All Changes"}
                        </button>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-3 font-medium">
                              Exam Subject (Slug)
                            </th>
                            <th className="text-left p-3 font-medium">
                              Admin Subject
                            </th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-center p-3 font-medium">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {config.subjects.map((subject, idx) => {
                            const key = `${config._id}:${subject.id}`;
                            const hasChange = pendingLinks.hasOwnProperty(key);
                            const currentValue = getCurrentLinkedSubjectId(
                              config._id,
                              subject
                            );

                            return (
                              <tr
                                key={idx}
                                className={`border-b ${
                                  hasChange ? "bg-yellow-50" : ""
                                }`}
                              >
                                <td className="p-3">
                                  <div className="font-medium">{subject.label}</div>
                                  <div className="text-xs text-gray-500 truncate max-w-xs">
                                    ID: {subject.id}
                                  </div>
                                </td>
                                <td className="p-3 min-w-[300px]">
                                  <SearchableDropdown
                                    options={[
                                      { value: "", label: "-- Not Linked --" },
                                      ...adminSubjects.map((adminSub) => ({
                                        value: adminSub._id,
                                        label: `${adminSub.subjectName}${adminSub.subjectCode ? ` (${adminSub.subjectCode})` : ""}`,
                                      })),
                                    ]}
                                    value={currentValue}
                                    onChange={(value) =>
                                      handleLinkChange(
                                        config._id,
                                        subject.id,
                                        value
                                      )
                                    }
                                    placeholder="Search subjects..."
                                  />
                                  {hasChange && (
                                    <div className="text-xs text-yellow-600 mt-1">
                                      Pending change
                                    </div>
                                  )}
                                </td>
                                <td className="p-3">
                                  {subject.isLinked ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Linked
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      Not Linked
                                    </span>
                                  )}
                                  {hasChange && (
                                    <span className="ml-2 text-xs text-yellow-600">
                                      (unsaved)
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  {hasChange && (
                                    <button
                                      onClick={() =>
                                        handleSaveLink(config._id, subject.id)
                                      }
                                      disabled={linking}
                                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
                                    >
                                      Save
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {config.subjects.some((s) => s.linkedSubject) && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">
                          Linked Subjects Details:
                        </h4>
                        <div className="space-y-1">
                          {config.subjects
                            .filter((s) => s.linkedSubject)
                            .map((subject, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-gray-700 flex justify-between"
                              >
                                <span>{subject.label}</span>
                                <span className="text-gray-500">
                                  → {subject.linkedSubject.subjectName}
                                  {subject.linkedSubject.markingScheme && (
                                    <span className="ml-2">
                                      (
                                      {Object.entries(
                                        subject.linkedSubject.markingScheme
                                      )
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(", ")}
                                      )
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectLinking;
