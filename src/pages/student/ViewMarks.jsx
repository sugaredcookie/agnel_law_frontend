import React, { useState, useEffect } from "react";
import StudentDashboardLayout from "./StudentDashboardLayout";
import { getMyExamSessionsAPI, getMyPublishedResultsAPI } from "../../utils/Api";

const ViewMarks = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await getMyExamSessionsAPI();
        setSessions(response.sessions || []);
        
        const sessionWithResults = response.sessions?.find((s) => s.hasPublishedResults);
        if (sessionWithResults) {
          setSelectedSession(sessionWithResults);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch exam sessions");
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedSession) {
        setResults(null);
        return;
      }
      
      try {
        setLoadingResults(true);
        const response = await getMyPublishedResultsAPI(selectedSession._id, selectedSession.sessionType);
        setResults(response);
      } catch (err) {
        setResults(null);
        if (err.response?.status !== 403) {
          setError(err.response?.data?.message || "Failed to fetch results");
        }
      } finally {
        setLoadingResults(false);
      }
    };
    fetchResults();
  }, [selectedSession]);

  const handleSessionChange = (sessionId) => {
    const session = sessions.find((s) => s._id === sessionId);
    setSelectedSession(session || null);
    setError(null);
  };

  return (
    <StudentDashboardLayout>
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-5 text-gray-800">Exam Results</h1>
        
        {/* Session Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700">Exam Session</label>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No exam sessions found.</p>
          ) : (
            <select
              value={selectedSession?._id || ""}
              onChange={(e) => handleSessionChange(e.target.value)}
              className="w-full md:w-96 p-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Session</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.title} ({session.academicYear} - {session.term})
                  {session.sessionType === "atkt" ? " [ATKT]" : ""}
                  {session.hasPublishedResults ? " - Available" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {loadingResults && (
          <p className="text-gray-500 py-8 text-center">Loading results...</p>
        )}

        {!loading && !loadingResults && !selectedSession && sessions.length > 0 && (
          <p className="text-gray-500 py-8 text-center">Select an exam session to view results.</p>
        )}

        {!loading && !loadingResults && selectedSession && !selectedSession.hasPublishedResults && (
          <p className="text-gray-500 py-8 text-center">Results not yet published for this session.</p>
        )}

        {!loading && !loadingResults && results && results.hasResults && (
          <div>
            {/* Student Info */}
            {results.studentInfo && (
              <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                <span><strong>Roll No:</strong> {results.studentInfo.rollNumber || "-"}</span>
                <span><strong>Name:</strong> {results.studentInfo.name || "-"}</span>
                <span><strong>Batch:</strong> {results.studentInfo.batch || "-"}</span>
              </div>
            )}

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="px-4 py-3 text-left font-semibold">Subject</th>
                    <th className="px-4 py-3 text-center font-semibold">Internal</th>
                    <th className="px-4 py-3 text-center font-semibold">External</th>
                    <th className="px-4 py-3 text-center font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((result, idx) => (
                    <tr key={result.subjectId || idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">
                        {result.subjectName}
                        {result.subjectCode && (
                          <span className="text-gray-400 text-xs ml-2">({result.subjectCode})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {result.internalObtained ?? "-"}/{result.internalMaximum ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {result.externalObtained ?? "-"}/{result.externalMaximum ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-800">
                        {result.totalObtained ?? "-"}/{result.totalMaximum ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            {results.summary && (
              <div className="mt-5 pt-4 border-t border-gray-200 flex flex-wrap gap-6 text-sm">
                <span className="text-gray-600">
                  <strong className="text-gray-800">{results.summary.totalSubjects}</strong> Subjects
                </span>
                <span className="text-gray-600">
                  Total: <strong className="text-gray-800">{results.summary.grandTotalObtained}/{results.summary.grandTotalMaximum}</strong>
                </span>
                <span className="text-gray-600">
                  Percentage: <strong className="text-blue-600">{results.summary.overallPercentage}%</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {!loading && !loadingResults && results && !results.hasResults && selectedSession?.hasPublishedResults && (
          <p className="text-gray-500 py-8 text-center">No results available for this session.</p>
        )}
      </div>
    </StudentDashboardLayout>
  );
};

export default ViewMarks;
