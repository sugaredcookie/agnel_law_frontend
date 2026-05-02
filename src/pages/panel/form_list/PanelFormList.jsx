/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  startBulkAdmissionJob,
  admitStudentViaAdmin,
  getFormListsForAdminFilters,
  rejectApplicationViaAdmin,
  downloadApplicationsExcel,
  getAllBatchesViaAdmin,
} from "../../../utils/Api";
import { NavLink, useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import CreateIcon from "@mui/icons-material/Create";
import DataTable from "react-data-table-component";
import PanelFormListFilters from "./PanelFormListFilters";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import {
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

const PanelFormList = () => {
  const [applications, setApplications] = useState([]);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectionRemark, setRejectionRemark] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [openAdmitDialog, setOpenAdmitDialog] = useState(false);
  const [baseBatches, setBaseBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const [matchingApplicationIds, setMatchingApplicationIds] = useState([]);
  const navigate = useNavigate();

  function formatDateTime(isoString) {
    const date = new Date(isoString);

    // Extracting individual components
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    // Converting to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = String(hours).padStart(2, "0");

    return `${month}-${day}-${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
  }

  const fetchAllBatches = async () => {
    try {
      const { batches } = await getAllBatchesViaAdmin();
      const baseNames = new Set();

      const getBaseName = (name) => {
        if (!name) return "";
        const trimmedName = name.trim();
        const parts = trimmedName.split("-");
        // Check if the last part is a single letter (a section identifier)
        if (
          parts.length > 1 &&
          parts[parts.length - 1].length === 1 &&
          /^[A-Z]$/i.test(parts[parts.length - 1])
        ) {
          return parts.slice(0, -1).join("-");
        }
        return trimmedName;
      };

      batches.forEach((batch) => {
        const baseName = getBaseName(batch.batchName);
        if (baseName) {
          baseNames.add(baseName);
        }
      });
      setBaseBatches(Array.from(baseNames));
    } catch (error) {
      toast.error("Error fetching batches");
    }
  };

  const fetchAllForms = useCallback(
    async (page = 1, { includeIds = false } = {}) => {
      setLoading(true);
      try {
        const response = await getFormListsForAdminFilters(
          { ...filters },
          { page, includeIds },
        );
        setApplications(response.applications);
        setTotalPages(response.totalPages);
        setCurrentPage(response.currentPage);
        setTotalApplications(
          response.totalApplications || response.applications.length,
        );
        if (includeIds && response.matchingApplicationIds) {
          setMatchingApplicationIds(response.matchingApplicationIds);
        }
      } catch (error) {
        toast.warn("Error fetching applications");
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    fetchAllForms(currentPage);
    fetchAllBatches();
  }, [currentPage, fetchAllForms]);

  const tableCustomStyles = {
    headRow: {
      style: {
        color: "#fff",
        backgroundColor: "#0F1015",
      },
    },
    striped: {
      default: "black",
    },
  };

  const handleAdmitClick = (id) => {
    setSelectedApplicationId(id);
    setOpenAdmitDialog(true);
  };

  const admitStudent = async () => {
    if (!selectedBatch) {
      toast.error("Please select a batch.");
      return;
    }

    const hasBulkSelection = selectAllAcrossPages
      ? matchingApplicationIds.length > 0
      : selectedRows.length > 0;

    if (hasBulkSelection) {
      // Bulk admission
      const applicationIds = selectAllAcrossPages
        ? matchingApplicationIds
        : selectedRows.map((row) => row._id);
      try {
        const res = await startBulkAdmissionJob({
          applicationIds,
          baseBatchName: selectedBatch,
        });
        toast.success(res.message, {
          onClick: () => navigate(`/panel-admin/admission-jobs/${res.jobId}`),
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setOpenAdmitDialog(false);
        setSelectedBatch("");
        clearSelections();
        fetchAllForms(currentPage);
      } catch (error) {
        toast.warn(
          error?.response?.data?.message ||
            "Failed to start bulk admission job",
        );
      }
    } else if (selectedApplicationId) {
      // Single admission
      try {
        await admitStudentViaAdmin(selectedApplicationId, {
          batchId: selectedBatch,
          batchName: selectedBatch,
        });
        toast.success("Student Admitted Successfully...");
        setOpenAdmitDialog(false);
        setSelectedBatch("");
        fetchAllForms(currentPage);
      } catch (error) {
        toast.warn(error?.response?.data?.message || "Failed to admit student");
      }
    } else {
      toast.info(
        "Select applications via checkboxes or use the Admit action button to continue.",
      );
    }
  };

  const handleReject = (id) => {
    setSelectedApplicationId(id);
    setRejectionRemark("");
    setOpenRejectDialog(true);
  };

  const handleRejectSubmit = async () => {
    try {
      if (!rejectionRemark.trim()) {
        toast.error("Please provide a rejection remark");
        return;
      }

      await rejectApplicationViaAdmin(selectedApplicationId, {
        remark: rejectionRemark,
      });

      setOpenRejectDialog(false);
      toast.success("Application rejected successfully");
      fetchAllForms(); // Refresh the list
    } catch (error) {
      toast.error("Failed to reject application");
    }
  };

  const handleRowSelected = (state) => {
    if (selectAllAcrossPages) {
      return;
    }
    setSelectedRows(state.selectedRows);
  };

  const handleSelectAllAcrossPages = async () => {
    try {
      const response = await getFormListsForAdminFilters(
        { ...filters },
        {
          page: currentPage,
          limit: totalApplications || undefined,
          includeIds: true,
        },
      );
      if (response.matchingApplicationIds) {
        setMatchingApplicationIds(response.matchingApplicationIds);
        setSelectAllAcrossPages(true);
        setSelectedRows([]);
        setSelectedApplicationId(null);
        setToggleCleared((prev) => !prev);
        toast.success(
          `Selected all ${response.matchingApplicationIds.length} eligible applications matching filters`,
        );
      } else {
        toast.info("No eligible applications found to select.");
      }
    } catch (error) {
      toast.error("Failed to select all applications.");
    }
  };

  const clearSelections = () => {
    setSelectedRows([]);
    setMatchingApplicationIds([]);
    setSelectAllAcrossPages(false);
    setSelectedApplicationId(null);
    setToggleCleared((prev) => !prev);
  };

  const columns = [
    {
      name: "SL. No",
      selector: (row, index) => ++index,
      width: "70px",
    },
    {
      name: "Student Name",
      selector: (row) =>
        `${row?.studentDetails?.firstName || ""} ${
          row?.studentDetails?.lastName || ""
        }`.trim(),
      sortable: true,
    },
    {
      name: "Course Name",
      selector: (row) => row?.course,
      sortable: true,
    },
    {
      name: "Application Number",
      selector: (row) => row?.applicationNumber,
      sortable: true,
      width: "100px",
    },
    {
      name: "Status",
      selector: (row) => row?.formStatusFromAdmin,
      sortable: true,
    },
    {
      name: "Stage",
      selector: (row) => row?.stage,
      sortable: true,
      width: "120px",
    },
    {
      name: "Applied Date",
      selector: (row) => formatDateTime(row?.updatedAt),
      sortable: true,
    },
    {
      name: "Payment Status",
      selector: (row) => {
        const status = row?.paymentStatus;
        if (status === "paid") {
          return <span className="badge badge-success">Completed</span>;
        } else if (status === "partial") {
          return <span className="badge badge-warning">Partially Paid</span>;
        } else {
          return <span className="badge badge-danger">Unpaid</span>;
        }
      },
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => {
        const isAdmitted = row.formStatusFromAdmin === "Student Admitted";
        let title = "Admit Student";
        if (isAdmitted) {
          title = "Already Admitted";
        }

        return (
          <div className="flex gap-3 items-center align-middle">
            <NavLink
              className="text-info"
              title="Preview"
              to={`/panel-admin/preview-application-form/${row._id}`}
            >
              <VisibilityIcon />
            </NavLink>
            <NavLink
              className="text-warning"
              title="dark"
              to={`/panel-admin/edit-application-form/${row._id}`}
            >
              <CreateIcon />
            </NavLink>
            <NavLink
              className="text-success"
              title="info"
              to={`/panel-admin/print-form/${row._id}`}
            >
              <LocalPrintshopIcon htmlColor="gray" />
            </NavLink>
            <button
              className={`focus:outline-none text-white ${
                isAdmitted
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-800"
              } focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-3 py-2 me-2`}
              title={title}
              onClick={() => handleAdmitClick(row._id)}
              disabled={isAdmitted}
            >
              Admit
            </button>
            <button
              className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-3 py-2 me-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
              title="Reject Application"
              onClick={() => handleReject(row._id)}
            >
              Deny
            </button>
          </div>
        );
      },
      width: "350px",
    },
  ];

  const handleFilterChange = (newFilters) => {
    clearSelections();
    setCurrentPage(1);
    setFilters(newFilters);
  };
  const resetFilter = (newFilters) => {
    clearSelections();
    setFilters(newFilters);
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadApplicationsExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "applications.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Excel downloaded successfully");
    } catch (error) {
      toast.error(error.message || "Failed to download Excel");
    }
  };

  return (
    <div>
      <div className="mb-5">
        <PanelFormListFilters
          onFilterChange={handleFilterChange}
          resetFilter={resetFilter}
        />
      </div>
      <div className="col-lg-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="card-title">
                  Application Forms (Students Applications)
                </h4>
                <p className="card-description">
                  All Students forms are listed here...
                </p>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <p className="text-sm text-gray-600">
                  Total matching applications: {totalApplications}
                </p>
                {selectAllAcrossPages ? (
                  <span className="text-sm text-green-700 font-medium">
                    All {matchingApplicationIds.length} matching applications
                    selected.
                  </span>
                ) : (
                  <span className="text-sm text-gray-600">
                    Selected on this page: {selectedRows.length}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-end">
                <button
                  className="focus:outline-none text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-2 me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  onClick={handleDownload}
                >
                  <FileDownloadIcon className="mr-2" />
                  Download Excel
                </button>
                <button
                  className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-3 py-2 me-2 disabled:opacity-50"
                  onClick={handleSelectAllAcrossPages}
                  disabled={
                    loading || selectAllAcrossPages || totalApplications === 0
                  }
                >
                  Select All Matching
                </button>
                {(selectAllAcrossPages || selectedRows.length > 0) && (
                  <button
                    className="focus:outline-none text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-3 py-2 me-2"
                    onClick={clearSelections}
                  >
                    Clear Selection
                  </button>
                )}
              </div>
              {(selectAllAcrossPages
                ? matchingApplicationIds.length > 0
                : selectedRows.length > 0) && (
                <button
                  className="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-3 py-2 me-2"
                  onClick={() => setOpenAdmitDialog(true)}
                >
                  {`Admit Selected (${
                    selectAllAcrossPages
                      ? matchingApplicationIds.length
                      : selectedRows.length
                  })`}
                </button>
              )}
            </div>
            <div className="table-responsive">
              <DataTable
                columns={columns}
                data={applications}
                pagination
                paginationServer
                paginationTotalRows={applications.length * totalPages} // A way to estimate total rows
                onChangePage={(page) => setCurrentPage(page)}
                progressPending={loading}
                selectableRows
                onSelectedRowsChange={handleRowSelected}
                clearSelectedRows={toggleCleared}
                selectableRowDisabled={(row) =>
                  row.formStatusFromAdmin === "Student Admitted"
                }
                // highlightOnHover
                // striped
                customStyles={tableCustomStyles}
              />
            </div>
          </div>
        </div>
      </div>
      <Dialog
        open={openRejectDialog}
        onClose={() => setOpenRejectDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: "8px",
            minWidth: "400px",
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid #e2e8f0" }}>
          Reject Application
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "20px !important" }}>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Remark"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectionRemark}
            onChange={(e) => setRejectionRemark(e.target.value)}
            placeholder="Please provide a reason for rejection..."
          />
        </DialogContent>
        <DialogActions
          sx={{
            padding: "16px 24px",
            backgroundColor: "#f7fafc",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <Button onClick={() => setOpenRejectDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleRejectSubmit}
            variant="contained"
            color="error"
            sx={{
              backgroundColor: "#b91c1c",
              "&:hover": {
                backgroundColor: "#991b1b",
              },
            }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openAdmitDialog}
        onClose={() => setOpenAdmitDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: "8px",
            minWidth: "400px",
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid #e2e8f0" }}>
          Admit Student
        </DialogTitle>
        <DialogContent sx={{ paddingTop: "20px !important" }}>
          <FormControl fullWidth margin="dense">
            <InputLabel id="batch-select-label">Batch</InputLabel>
            <Select
              labelId="batch-select-label"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              label="Batch"
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: "8px",
                  },
                },
              }}
            >
              {baseBatches.map((batchName) => (
                <MenuItem key={batchName} value={batchName}>
                  {batchName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions
          sx={{
            padding: "16px 24px",
            backgroundColor: "#f7fafc",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <Button onClick={() => setOpenAdmitDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={admitStudent}
            variant="contained"
            sx={{
              backgroundColor: "#15803d",
              "&:hover": {
                backgroundColor: "#166534",
              },
            }}
          >
            Admit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PanelFormList;
