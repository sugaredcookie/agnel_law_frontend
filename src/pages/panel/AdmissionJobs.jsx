import React, { useState, useEffect, useCallback } from "react";
import { getAllAdmissionJobs, getAdmissionJobStatus } from "../../utils/Api";
import { useParams } from "react-router-dom";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import PanelDashboardLayout from "./PanelDashboardLayout";

const AdmissionJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const { jobId } = useParams();

  const fetchJobs = useCallback(async () => {
    try {
      const allJobs = await getAllAdmissionJobs();
      setJobs(allJobs);

      if (jobId) {
        const job = allJobs.find((j) => j.id === jobId);
        if (job) {
          setSelectedJob(job);
        } else {
          // If the job is not in the active list (maybe it's old), fetch it directly
          const fetchedJob = await getAdmissionJobStatus(jobId);
          setSelectedJob(fetchedJob);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch admission jobs.");
    }
  }, [jobId]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const tableCustomStyles = {
    headRow: {
      style: {
        color: "#212529",
        backgroundColor: "#f8f9fa",
      },
    },
  };

  const columns = [
    { name: "Job ID", selector: (row) => row.id.slice(-12), sortable: true },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            row.status === "completed"
              ? "bg-green-100 text-green-800"
              : row.status === "failed"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Progress",
      selector: (row) => `${row.progress.toFixed(2)}%`,
      sortable: true,
    },
    {
      name: "Batch",
      selector: (row) => row.metadata?.batchName || "N/A",
      sortable: true,
    },
    {
      name: "Requested By",
      selector: (row) => row.metadata?.requestedBy || "System",
      sortable: true,
    },
    {
      name: "Details",
      cell: (row) => (
        <button
          className="text-indigo-600 hover:text-indigo-900"
          onClick={() => setSelectedJob(row)}
        >
          View
        </button>
      ),
    },
  ];

  const resultColumns = [
    {
      name: "Application ID",
      selector: (row) => row.applicationId,
      sortable: true,
    },
    { name: "Status", selector: (row) => row.status, sortable: true },
    { name: "Reason", selector: (row) => row.reason || "N/A" },
  ];

  return (
    <PanelDashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-4">
            <h4 className="text-xl font-bold text-gray-800">Admission Jobs</h4>
            <p className="text-sm text-gray-500 mb-4">
              List of all bulk admission tasks.
            </p>
            <DataTable
              columns={columns}
              data={jobs}
              pagination
              customStyles={tableCustomStyles}
            />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-4">
            {selectedJob ? (
              <>
                <h4 className="text-xl font-bold text-gray-800">Job Details</h4>
                <div className="mt-4 space-y-2">
                  <p>
                    <strong>Job ID:</strong> {selectedJob.id}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedJob.status}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${selectedJob.progress}%` }}
                    ></div>
                  </div>
                  {selectedJob.metadata && (
                    <div className="text-sm text-gray-600 mt-2">
                      <p>
                        <strong>Total:</strong>{" "}
                        {selectedJob.metadata.totalStudents}
                      </p>
                      <p>
                        <strong>Processed:</strong>{" "}
                        {selectedJob.metadata.processedStudents}
                      </p>
                      <p>
                        <strong>Success:</strong>{" "}
                        {selectedJob.metadata.successCount}
                      </p>
                      <p>
                        <strong>Failed:</strong>{" "}
                        {selectedJob.metadata.failureCount}
                      </p>
                    </div>
                  )}
                  {selectedJob.status === "completed" && selectedJob.result && (
                    <div className="mt-4">
                      <h5 className="font-semibold">Results:</h5>
                      <DataTable
                        columns={resultColumns}
                        data={selectedJob.result}
                        pagination
                        customStyles={tableCustomStyles}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                <h4 className="text-xl font-bold text-gray-800">Job Details</h4>
                <p className="text-gray-500 mt-4">
                  Select a job from the list to see its details here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default AdmissionJobs;
