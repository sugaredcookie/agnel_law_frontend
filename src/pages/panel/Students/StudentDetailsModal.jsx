import React, { useState, useEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  cancelStudentAdmissionViaAdmin,
  updateStudentDetailsViaAdmin,
  getAllProgramsViaAdmin,
  getAllBatchesViaAdmin,
  resetStudentPasswordViaAdmin,
  updateStudentPhotoAndSignViaAdmin,
  getStudentByIdViaAdmin,
  updateStudentCertificateStatusViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} className="py-4">
    {value === index && children}
  </div>
);

const StudentDetailsModal = ({ open, onClose, student, onUpdate }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [studentSign, setStudentSign] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [fullStudentData, setFullStudentData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const getInitialValue = (section, field) => {
    const sourceData = fullStudentData || student;
    return editedFields[`${section}.${field}`] ?? sourceData[section]?.[field];
  };

  const fetchFullStudentDetails = useCallback(async () => {
    if (!student?._id) return;
    setLoadingDetails(true);
    try {
      const response = await getStudentByIdViaAdmin(student._id);
      setFullStudentData(response.student);
    } catch (error) {
      console.error("Failed to fetch full student details:", error);
    } finally {
      setLoadingDetails(false);
    }
  }, [student?._id]);

  const fetchProgramsAndBatches = useCallback(async () => {
    try {
      const [programsRes, batchesRes] = await Promise.all([
        getAllProgramsViaAdmin(),
        getAllBatchesViaAdmin(),
      ]);
      setPrograms(programsRes.programs);
      setBatches(batchesRes.batches);
      const initialFiltered = batchesRes.batches.filter(
        (b) => b.program?.name === student.academicDetails?.program,
      );
      setFilteredBatches(initialFiltered);
    } catch (error) {
      toast.error("Failed to load programs or batches");
    }
  }, [student]);

  useEffect(() => {
    setEditedFields({});
    setActiveTab(0);
    if (open && student?._id) {
      fetchFullStudentDetails();
    }
    if (isEditMode) {
      fetchProgramsAndBatches();
    }
  }, [student, isEditMode, fetchProgramsAndBatches, open, fetchFullStudentDetails]);

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (fileType === "photo") {
      setStudentPhoto(file);
    } else if (fileType === "sign") {
      setStudentSign(file);
    }
  };

  const handleInputChange = (e, section, field) => {
    setEditedFields({
      ...editedFields,
      [`${section}.${field}`]: e.target.value,
    });
  };

  const handleProgramChange = (e) => {
    const programName = e.target.value;
    const newFilteredBatches = batches.filter(
      (b) => b.program?.name === programName,
    );
    setFilteredBatches(newFilteredBatches);
    setEditedFields({
      ...editedFields,
      "academicDetails.program": programName,
      "academicDetails.batch": {}, // Reset batch
    });
  };

  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    const selectedBatch = batches.find((b) => b._id === batchId);
    setEditedFields({
      ...editedFields,
      "academicDetails.batch": {
        id: selectedBatch._id,
        name: selectedBatch.batchName,
      },
    });
  };

  const handleSaveChanges = async () => {
    try {
      if (studentPhoto || studentSign) {
        const formData = new FormData();
        if (studentPhoto) {
          formData.append("photo", studentPhoto);
        }
        if (studentSign) {
          formData.append("sign", studentSign);
        }
        await updateStudentPhotoAndSignViaAdmin(student._id, formData);
      }

      if (Object.keys(editedFields).length > 0) {
        await updateStudentDetailsViaAdmin(student._id, editedFields);
      }

      toast.success("Student details updated successfully");
      setIsEditMode(false);
      onUpdate();
      onClose();
    } catch (error) {
      toast.error("Failed to update student details");
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditedFields({});
  };

  const handlePasswordAction = async (type) => {
    const confirmAction = window.confirm(
      `Are you sure you want to ${
        type === "register"
          ? "send registration details"
          : "reset this student's password"
      }? A new password will be sent to their email address.`,
    );

    if (confirmAction) {
      try {
        const response = await resetStudentPasswordViaAdmin(
          student._id,
          null,
          type,
        );
        toast.success(response.message);
      } catch (error) {
        if (error.response && error.response.status === 400) {
          const manualEmail = prompt(
            "No email found. Please enter an email address to send the details to:",
          );
          if (manualEmail) {
            try {
              const response = await resetStudentPasswordViaAdmin(
                student._id,
                manualEmail,
                type,
              );
              toast.success(response.message);
            } catch (finalError) {
              toast.error("Failed to complete the action.");
            }
          }
        } else {
          toast.error("Failed to complete the action.");
        }
      }
    }
  };

  const handleCancelAdmission = async () => {
    const note = prompt(
      "Please enter a reason for cancelling this admission (optional):",
      "Admission cancelled"
    );
    
    if (note === null) {
      // User clicked Cancel on the prompt
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this student's admission?\n\n" +
      "This will archive the student record and they will no longer appear in the active students list.\n\n" +
      "You can restore the student later from the Archived Students section if needed."
    );

    if (confirmed) {
      try {
        await cancelStudentAdmissionViaAdmin(student._id, note);
        toast.success("Student admission cancelled and archived successfully");
        onUpdate();
        onClose();
      } catch (error) {
        console.error("Error cancelling admission:", error);
        toast.error("Failed to cancel student admission");
      }
    }
  };

  const handleCertificateStatusUpdate = async (certificateId, status) => {
    const remark = status === "rejected" ? prompt("Enter rejection reason:") : "";
    if (status === "rejected" && !remark) return;

    try {
      await updateStudentCertificateStatusViaAdmin(student._id, certificateId, {
        status,
        remark,
      });
      toast.success("Certificate status updated");
      fetchFullStudentDetails();
    } catch (error) {
      toast.error("Failed to update certificate status");
    }
  };

  const data = fullStudentData || student;

  const renderField = (section, field, label) => (
    <tr key={`${section}-${field}`}>
      <td className="p-2 font-semibold">{label}</td>
      <td className="p-2">
        {isEditMode ? (
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={getInitialValue(section, field) || ""}
            onChange={(e) => handleInputChange(e, section, field)}
          />
        ) : (
          `: ${data[section]?.[field] || "-"}`
        )}
      </td>
    </tr>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "verified": return "success";
      case "rejected": return "error";
      default: return "warning";
    }
  };

  const getCertificateTypeLabel = (type) => {
    const labels = {
      candidatePhoto: "Photo",
      candidateSignature: "Signature",
      sscMarksheet: "SSC Marksheet",
      hscMarksheet: "HSC Marksheet",
      birthCertificate: "Birth Certificate",
      casteCertificate: "Caste Certificate",
      incomeCertificate: "Income Certificate",
      domicileCertificate: "Domicile Certificate",
      aadharCard: "Aadhar Card",
      migrationCertificate: "Migration Certificate",
      leavingCertificate: "Leaving Certificate",
      gapCertificate: "Gap Certificate",
      transferCertificate: "Transfer Certificate",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Student Details</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Basic Info" />
            <Tab label="Personal Details" />
            <Tab label="Family Details" />
            <Tab label="Certificates" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
        <div className="flex flex-col items-center mb-4">
          <div className="flex justify-between w-full mb-4">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                {studentPhoto ? (
                  <img
                    src={URL.createObjectURL(studentPhoto)}
                    alt="Student"
                    className="w-full h-full object-cover"
                  />
                ) : student.studentDetails?.studentImage ? (
                  <img
                    src={student.studentDetails.studentImage}
                    alt="Student"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
              </div>
              {isEditMode && (
                <>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    className="mt-2"
                  >
                    Change Photo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "photo")}
                    />
                  </Button>
                </>
              )}
              <span className="text-gray-500">Image</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                {studentSign ? (
                  <img
                    src={URL.createObjectURL(studentSign)}
                    alt="Signature"
                    className="w-full h-full object-contain"
                  />
                ) : student.studentDetails?.studentSign ? (
                  <img
                    src={student.studentDetails.studentSign}
                    alt="Signature"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No Signature</span>
                  </div>
                )}
              </div>
              {isEditMode && (
                <>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    className="mt-2"
                  >
                    Change Signature
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "sign")}
                    />
                  </Button>
                </>
              )}
              <span className="text-gray-500">Signature</span>
            </div>
          </div>
          <table className="w-full text-left">
            <tbody>
              {renderField("studentDetails", "firstName", "First Name")}
              {renderField("studentDetails", "middleName", "Middle Name")}
              {renderField("studentDetails", "lastName", "Last Name")}
              {renderField("studentDetails", "emailAddress", "Email")}
              {renderField(
                "studentDetails",
                "studentMobileNumber",
                "Student Phone",
              )}
              <tr>
                <td className="p-2 font-semibold">Program</td>
                <td className="p-2">
                  {isEditMode ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Program</InputLabel>
                      <Select
                        value={
                          getInitialValue("academicDetails", "program") || ""
                        }
                        onChange={handleProgramChange}
                        label="Program"
                      >
                        {programs.map((p) => (
                          <MenuItem key={p._id} value={p.programName}>
                            {p.programName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    `: ${student.academicDetails?.program || "-"}`
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-semibold">Batch</td>
                <td className="p-2">
                  {isEditMode ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Batch</InputLabel>
                      <Select
                        value={
                          getInitialValue("academicDetails", "batch")?.id || ""
                        }
                        onChange={handleBatchChange}
                        label="Batch"
                        disabled={
                          !getInitialValue("academicDetails", "program")
                        }
                      >
                        {filteredBatches.map((b) => (
                          <MenuItem key={b._id} value={b._id}>
                            {b.batchName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    `: ${student.academicDetails?.batch?.name || "-"}`
                  )}
                </td>
              </tr>
              {renderField(
                "academicDetails",
                "registerNumber",
                "Register Number",
              )}
              {renderField("academicDetails", "rollNumber", "Roll Number")}
              <tr>
                <td className="p-2 font-semibold">Status</td>
                <td className="p-2">
                  : {student.status?.charAt(0).toUpperCase() + student.status?.slice(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <table className="w-full text-left">
            <tbody>
              {renderField("studentDetails", "gender", "Gender")}
              {renderField("studentDetails", "dateOfBirth", "Date of Birth")}
              {renderField("studentDetails", "bloodGroup", "Blood Group")}
              {renderField("studentDetails", "birthPlace", "Birth Place")}
              {renderField("studentDetails", "motherTongue", "Mother Tongue")}
              {renderField("studentDetails", "religion", "Religion")}
              {renderField("studentDetails", "casteCategory", "Caste Category")}
              {renderField("studentDetails", "caste", "Caste")}
              {renderField("studentDetails", "aadharCardNumber", "Aadhar Number")}
              {renderField("studentDetails", "prnNumber", "PRN Number")}
              {renderField("studentDetails", "abcNumber", "ABC Number")}
              {renderField("studentDetails", "grNumber", "GR Number")}
              {renderField("studentDetails", "capApplicationId", "CAP Application ID")}
              {renderField("studentDetails", "address", "Address")}
            </tbody>
          </table>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <table className="w-full text-left">
            <tbody>
              {renderField("familyBackground", "fatherName", "Father's Name")}
              {renderField("familyBackground", "fatherEmail", "Father's Email")}
              {renderField("familyBackground", "fatherOccupation", "Father's Occupation")}
              {renderField("familyBackground", "fatherMobileNo", "Father's Mobile")}
              {renderField("familyBackground", "motherName", "Mother's Name")}
              {renderField("familyBackground", "motherEmail", "Mother's Email")}
              {renderField("familyBackground", "motherOccupation", "Mother's Occupation")}
              {renderField("familyBackground", "motherMobileNo", "Mother's Mobile")}
              {renderField("familyBackground", "familyAnnualIncome", "Annual Income")}
            </tbody>
          </table>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {loadingDetails ? (
            <div className="text-center py-8">Loading certificates...</div>
          ) : data?.certificates?.length > 0 ? (
            <div className="space-y-3">
              {data.certificates.map((cert, index) => (
                <div
                  key={cert._id || index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {getCertificateTypeLabel(cert.type)}
                    </span>
                    <Chip
                      label={cert.status}
                      color={getStatusColor(cert.status)}
                      size="small"
                    />
                    {cert.remark && (
                      <span className="text-sm text-gray-500">({cert.remark})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {cert.fileUrl && (
                      <IconButton
                        size="small"
                        onClick={() => window.open(cert.fileUrl, "_blank")}
                        title="View Certificate"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    )}
                    {cert.status === "pending" && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleCertificateStatusUpdate(cert._id, "verified")}
                          title="Verify"
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCertificateStatusUpdate(cert._id, "rejected")}
                          title="Reject"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No certificates uploaded
            </div>
          )}
        </TabPanel>
      </DialogContent>
      <DialogActions>
        {isEditMode ? (
          <>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              onClick={handleSaveChanges}
              color="primary"
              variant="contained"
            >
              Save Changes
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setIsEditMode(true)}>Edit</Button>
            <Button
              onClick={() => handlePasswordAction("register")}
              color="info"
            >
              Send Registration
            </Button>
            <Button
              onClick={() => handlePasswordAction("reset")}
              color="warning"
            >
              Reset Password
            </Button>
            {student.status === "active" && (
              <Button
                onClick={handleCancelAdmission}
                color="error"
                variant="contained"
              >
                Cancel Admission
              </Button>
            )}
            <Button onClick={onClose} color="primary">
              Close
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default StudentDetailsModal;
