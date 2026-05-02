import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import {
  getBatchGroupByIdViaAdmin,
  rearrangeStudentsInGroupViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";
import DataTable from "react-data-table-component";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";

const BatchGroupView = () => {
  const [batchGroup, setBatchGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRearrangeModal, setShowRearrangeModal] = useState(false);
  const [maxPerBatch, setMaxPerBatch] = useState(90);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchBatchGroup();
  }, [id]);

  const fetchBatchGroup = async () => {
    setLoading(true);
    try {
      const response = await getBatchGroupByIdViaAdmin(id);
      setBatchGroup(response?.batchGroup || null);
    } catch (error) {
      console.error("Error fetching batch group:", error);
      toast.error("Error loading batch group");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewRearrange = async () => {
    setPreviewLoading(true);
    try {
      const response = await rearrangeStudentsInGroupViaAdmin(id, {
        maxPerBatch,
        dryRun: true,
      });
      setPreviewData(response);
    } catch (error) {
      console.error("Error previewing rearrangement:", error);
      toast.error(error?.response?.data?.error || "Error previewing rearrangement");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyRearrange = async () => {
    if (!window.confirm("Are you sure you want to rearrange students? This will update their batch assignments.")) {
      return;
    }
    setApplyLoading(true);
    try {
      const response = await rearrangeStudentsInGroupViaAdmin(id, {
        maxPerBatch,
        dryRun: false,
      });
      toast.success(`Successfully rearranged ${response.updatedCount} students!`);
      setShowRearrangeModal(false);
      setPreviewData(null);
    } catch (error) {
      console.error("Error applying rearrangement:", error);
      toast.error(error?.response?.data?.error || "Error applying rearrangement");
    } finally {
      setApplyLoading(false);
    }
  };

  const tableCustomStyles = {
    headRow: {
      style: {
        color: "#fff",
        backgroundColor: "#0F1015",
      },
    },
  };

  const batchColumns = [
    {
      name: "SL. No",
      selector: (row, index) => ++index,
      width: "60px",
    },
    {
      name: "Batch Name",
      selector: (row) => row?.batchName,
      sortable: true,
      width: "180px",
    },
    {
      name: "Term",
      selector: (row) => row?.term,
      sortable: true,
      width: "80px",
    },
    {
      name: "Program",
      selector: (row) => row?.program?.name || "-",
      sortable: true,
    },
    {
      name: "Department",
      selector: (row) => row?.department?.name || "-",
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <NavLink
          className="btn btn-sm btn-outline-primary"
          to={`/panel-admin/edit-batch-form/${row._id}`}
        >
          View Batch
        </NavLink>
      ),
    },
  ];

  if (loading) {
    return (
      <PanelDashboardLayout>
        <div className="text-center p-5">Loading...</div>
      </PanelDashboardLayout>
    );
  }

  if (!batchGroup) {
    return (
      <PanelDashboardLayout>
        <div className="text-center p-5">
          <p>Batch group not found.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/panel-admin/batch-groups")}
          >
            Go Back
          </button>
        </div>
      </PanelDashboardLayout>
    );
  }

  return (
    <PanelDashboardLayout>
      <div>
        <button
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate("/panel-admin/batch-groups")}
        >
          <ArrowBackIcon fontSize="small" /> Back to Batch Groups
        </button>

        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0">{batchGroup.groupName}</h4>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => {
                      setShowRearrangeModal(true);
                      setPreviewData(null);
                    }}
                  >
                    <ShuffleIcon fontSize="small" /> Rearrange Students
                  </button>
                  <NavLink
                    className="btn btn-warning btn-sm"
                    to={`/panel-admin/edit-batch-group/${batchGroup._id}`}
                  >
                    Edit Group
                  </NavLink>
                </div>
              </div>
              <p className="card-description">
                {batchGroup.description || "No description"}
              </p>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Program:</strong>{" "}
                  {batchGroup.program?.name || "Not specified"}
                </div>
                <div className="col-md-6">
                  <strong>Department:</strong>{" "}
                  {batchGroup.department?.name || "Not specified"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">
                Batches in this Group ({batchGroup.batches?.length || 0})
              </h4>
              <p className="card-description">
                All batches belonging to this group are listed here...
              </p>
              <div className="table-responsive">
                <DataTable
                  columns={batchColumns}
                  data={batchGroup.batches || []}
                  customStyles={tableCustomStyles}
                  pagination
                  noDataComponent={
                    <div className="p-4">No batches in this group yet.</div>
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rearrange Students Modal */}
        <Dialog
          open={showRearrangeModal}
          onClose={() => {
            setShowRearrangeModal(false);
            setPreviewData(null);
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <ShuffleIcon color="primary" />
              <span>Rearrange Students</span>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              This will sort all students in this group by Roll Number and
              distribute them across batches (alphabetically ordered). First{" "}
              {maxPerBatch} students go to the first batch, next {maxPerBatch} to
              the second, and so on.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <TextField
                label="Max Students Per Batch"
                type="number"
                value={maxPerBatch}
                onChange={(e) => setMaxPerBatch(parseInt(e.target.value) || 90)}
                inputProps={{ min: 1, max: 200 }}
                size="small"
                fullWidth
                sx={{ maxWidth: 200 }}
              />
            </Box>

            <Button
              variant="contained"
              color="primary"
              onClick={handlePreviewRearrange}
              disabled={previewLoading}
              sx={{ mb: 2 }}
              startIcon={previewLoading && <CircularProgress size={16} color="inherit" />}
            >
              {previewLoading ? "Loading Preview..." : "Preview Changes"}
            </Button>

            {previewData && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Total Students:</strong> {previewData.totalStudents}
                </Alert>

                {previewData.distribution?.map((batch, idx) => (
                  <Box key={idx} sx={{ mb: 2, border: "1px solid #ddd", borderRadius: 1 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor: "#f5f5f5",
                        borderBottom: "1px solid #ddd",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {batch.batchName}
                      </Typography>
                      <Chip
                        label={`${batch.studentCount} students`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ maxHeight: 200, overflowY: "auto", p: 1 }}>
                      <table className="table table-sm table-striped mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: 50 }}>#</th>
                            <th>Roll No</th>
                            <th>Name</th>
                            <th>Current Batch</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batch.students?.map((student, sIdx) => (
                            <tr
                              key={student._id}
                              style={{
                                backgroundColor:
                                  student.currentBatch !== batch.batchName
                                    ? "#fff3cd"
                                    : "inherit",
                              }}
                            >
                              <td>{sIdx + 1}</td>
                              <td>{student.rollNumber}</td>
                              <td>{student.name}</td>
                              <td>
                                {student.currentBatch}
                                {student.currentBatch !== batch.batchName && (
                                  <Chip
                                    label="Moving"
                                    size="small"
                                    color="warning"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setShowRearrangeModal(false);
                setPreviewData(null);
              }}
              color="inherit"
            >
              Cancel
            </Button>
            {previewData && (
              <Button
                variant="contained"
                color="success"
                onClick={handleApplyRearrange}
                disabled={applyLoading}
                startIcon={applyLoading && <CircularProgress size={16} color="inherit" />}
              >
                {applyLoading ? "Applying..." : "Apply Changes"}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </div>
    </PanelDashboardLayout>
  );
};

export default BatchGroupView;
