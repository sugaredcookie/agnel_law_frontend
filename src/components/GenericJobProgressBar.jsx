import React, { useState, useEffect } from "react";
import {
  FiDownload,
  FiLoader,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";

const GenericJobProgressBar = ({ 
  jobId, 
  getStatusAPI, 
  cancelJobAPI, 
  onComplete, 
  onCancel,
  title = "Job Progress",
  downloadUrl = null
}) => {
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!jobId || !getStatusAPI) return;

    const poll = setInterval(async () => {
      try {
        const status = await getStatusAPI(jobId);
        setJob(status);

        if (
          status.status === "completed" ||
          status.status === "failed" ||
          status.status === "cancelled"
        ) {
          clearInterval(poll);
          if (status.status === "completed" && onComplete) {
            onComplete(jobId, status);
          }
        }
      } catch (err) {
        setError(
          "Could not get job status. The job may have expired or been deleted.",
        );
        clearInterval(poll);
      }
    }, 2500); // Poll every 2.5 seconds

    return () => clearInterval(poll);
  }, [jobId, getStatusAPI, onComplete]);

  const handleCancel = async () => {
    if (!jobId || isCancelling || !cancelJobAPI) return;
    setIsCancelling(true);
    try {
      await cancelJobAPI(jobId);
      if (onCancel) onCancel(jobId);
    } catch (err) {
      setError("Failed to cancel job. It may have already completed.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!jobId) return null;

  const getStatusColor = () => {
    if (!job) return "bg-gray-400";
    switch (job.status) {
      case "in_progress":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-400";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const formatTime = (ms) => {
    if (!ms || ms < 1000) return "a few seconds";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const statusText = () => {
    if (!job) return "Initializing...";
    switch (job.status) {
      case "in_progress":
        return `Processing... ${job.progress}%`;
      case "completed":
        return "Completed!";
      case "failed":
        return "Failed";
      case "pending":
        return "Queued...";
      case "cancelled":
        return "Cancelled";
      default:
        return "Starting...";
    }
  };

  const eta = job?.metadata?.estimatedTimeRemaining;

  return (
    <div className="my-4 p-4 border rounded-lg shadow-md bg-white">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">{title}</h3>
        <span className="text-xs text-gray-500">
          Job ID: {jobId.slice(0, 8)}
        </span>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-2">
          <FiAlertCircle className="inline mr-1" />
          {error}
        </p>
      )}

      <div className="w-full bg-gray-200 rounded-full h-4 mb-2 relative">
        <div
          className={`h-4 rounded-full transition-all duration-500 ${getStatusColor()} flex items-center justify-center text-white text-xs font-semibold`}
          style={{ width: `${job?.progress || 0}%` }}
        >
          {job?.progress > 10 && `${job.progress}%`}
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-700">
        <div className="flex items-center">
          {job?.status === "in_progress" && (
            <FiLoader className="animate-spin mr-2" />
          )}
          {job?.status === "completed" && (
            <FiCheckCircle className="text-green-500 mr-2" />
          )}
          {job?.status === "failed" && (
            <FiXCircle className="text-red-500 mr-2" />
          )}
          <p>{statusText()}</p>
        </div>
        {eta > 0 && job.status === "in_progress" && (
          <div className="flex items-center">
            <FiClock className="mr-1" />
            <span>ETA: {formatTime(eta)}</span>
          </div>
        )}
      </div>
      
      {job?.metadata?.message && (
        <p className="text-sm text-gray-600 mt-1 italic">{job.metadata.message}</p>
      )}

      {job?.metadata && (
        <div className="text-xs text-gray-500 mt-2 flex justify-between">
          {job.metadata.totalStudents !== undefined && <span>Total: {job.metadata.totalStudents}</span>}
          {job.metadata.processedStudents !== undefined && <span>Processed: {job.metadata.processedStudents}</span>}
        </div>
      )}

      {job?.status === "failed" && (
        <p className="text-red-600 text-sm mt-2">
          <strong>Reason:</strong> {job.error || "An unknown error occurred"}
        </p>
      )}

      {(job?.status === "in_progress" || job?.status === "pending") && cancelJobAPI && (
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="mt-4 inline-flex items-center bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
        >
          {isCancelling ? (
            <FiLoader className="animate-spin mr-2" />
          ) : (
            <FiXCircle className="mr-2" />
          )}
          {isCancelling ? "Cancelling..." : "Cancel Job"}
        </button>
      )}
    </div>
  );
};

export default GenericJobProgressBar;
