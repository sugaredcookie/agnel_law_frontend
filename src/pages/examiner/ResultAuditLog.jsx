/**
 * Audit trail page for ParsedResult edits.
 * Shows a timeline of all add/update/delete actions with revert capability.
 * Route: /examiner/result-cards/:configId/audit
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiArrowLeft, FiRotateCcw, FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { getAuditLogAPI, revertAuditAPI } from "../../utils/Api";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";

const PAGE_SIZE = 25;

const ACTION_STYLES = {
  ADD: { bg: "bg-green-100", text: "text-green-800", icon: FiPlus, label: "Added" },
  UPDATE: { bg: "bg-blue-100", text: "text-blue-800", icon: FiEdit2, label: "Updated" },
  DELETE: { bg: "bg-red-100", text: "text-red-800", icon: FiTrash2, label: "Deleted" },
};

const ResultAuditLog = () => {
  const { configId } = useParams();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [reverting, setReverting] = useState(null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAuditLogAPI(configId, { limit: PAGE_SIZE, skip: page * PAGE_SIZE });
      setEntries(res.entries || []);
      setTotal(res.total || 0);
    } catch {
      toast.error("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [configId, page]);

  useEffect(() => {
    if (configId) fetchEntries();
  }, [configId, fetchEntries]);

  const handleRevert = async (auditId) => {
    if (reverting) return;
    setReverting(auditId);
    try {
      const res = await revertAuditAPI(configId, auditId);
      toast.success(res.message || "Reverted successfully");
      fetchEntries();
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to revert";
      toast.error(msg);
    } finally {
      setReverting(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen text-black">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 max-w-7xl mx-auto mt-4">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <button
                onClick={() => navigate("/examiner/result-cards")}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                <FiArrowLeft size={14} />
                Result Cards
              </button>
              <span className="text-gray-400">/</span>
              <button
                onClick={() => navigate(`/examiner/result-cards/${configId}`)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Config
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Edit History</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold">Edit History</h1>
                <p className="text-gray-600 mt-1">
                  {total} change{total !== 1 ? "s" : ""} recorded
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading audit log...</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No edits have been recorded yet.</div>
            ) : (
              <>
                <div className="space-y-3">
                  {entries.map((entry) => {
                    const style = ACTION_STYLES[entry.action] || ACTION_STYLES.UPDATE;
                    const Icon = style.icon;
                    const isExpanded = expandedId === entry._id;

                    return (
                      <div key={entry._id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                          onClick={() => setExpandedId(isExpanded ? null : entry._id)}
                        >
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${style.bg} ${style.text}`}>
                            <Icon size={12} />
                            {style.label}
                          </span>

                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm">{entry.studentName || entry.rollNo}</span>
                            {entry.studentName && (
                              <span className="text-gray-400 text-xs ml-2">({entry.rollNo})</span>
                            )}
                            {entry.action === "UPDATE" && entry.changes?.length > 0 && (
                              <span className="text-gray-500 text-xs ml-2">
                                -- {entry.changes.map((c) => c.field).join(", ")}
                              </span>
                            )}
                          </div>

                          <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(entry.createdAt)}</span>

                          {entry.performedBy?.email && (
                            <span className="text-xs text-gray-400 truncate max-w-[120px]" title={entry.performedBy.email}>
                              {entry.performedBy.email}
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Revert this ${entry.action.toLowerCase()} for ${entry.rollNo}?`)) {
                                handleRevert(entry._id);
                              }
                            }}
                            disabled={reverting === entry._id}
                            className="flex items-center gap-1 px-2 py-1 text-xs border border-orange-300 text-orange-700 bg-orange-50 rounded hover:bg-orange-100 disabled:opacity-50 whitespace-nowrap"
                            title="Revert this change"
                          >
                            <FiRotateCcw size={12} />
                            {reverting === entry._id ? "Reverting..." : "Revert"}
                          </button>

                          {isExpanded ? <FiChevronUp size={16} className="text-gray-400" /> : <FiChevronDown size={16} className="text-gray-400" />}
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                            {entry.action === "UPDATE" && entry.changes?.length > 0 ? (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-gray-500">
                                    <th className="pb-1 pr-4">Field</th>
                                    <th className="pb-1 pr-4">Before</th>
                                    <th className="pb-1">After</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {entry.changes.map((c, i) => (
                                    <tr key={i}>
                                      <td className="py-0.5 pr-4 font-medium text-gray-700">{c.field}</td>
                                      <td className="py-0.5 pr-4 text-red-600">{String(c.from ?? "-")}</td>
                                      <td className="py-0.5 text-green-600">{String(c.to ?? "-")}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : entry.action === "ADD" ? (
                              <p className="text-sm text-gray-600">Student <strong>{entry.rollNo}</strong> was added to this config.</p>
                            ) : entry.action === "DELETE" ? (
                              <p className="text-sm text-gray-600">Student <strong>{entry.rollNo}</strong> was removed from this config.</p>
                            ) : (
                              <p className="text-sm text-gray-400">No detailed change info available.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">
                      Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultAuditLog;
