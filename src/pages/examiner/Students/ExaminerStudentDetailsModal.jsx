import React, { useState, useEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { getStudentByIdViaExaminer } from "../../../utils/Api";

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} className="py-4">
    {value === index && children}
  </div>
);

const ExaminerStudentDetailsModal = ({ open, onClose, student }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [fullStudentData, setFullStudentData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchFullStudentDetails = useCallback(async () => {
    if (!student?._id) return;
    setLoadingDetails(true);
    try {
      const response = await getStudentByIdViaExaminer(student._id);
      setFullStudentData(response.student);
    } catch (error) {
      console.error("Failed to fetch full student details:", error);
    } finally {
      setLoadingDetails(false);
    }
  }, [student?._id]);

  useEffect(() => {
    setActiveTab(0);
    if (open && student?._id) {
      fetchFullStudentDetails();
    }
  }, [student, open, fetchFullStudentDetails]);

  const data = fullStudentData || student;

  const renderField = (section, field, label) => (
    <tr key={`${section}-${field}`}>
      <td className="p-2 font-semibold">{label}</td>
      <td className="p-2">: {data[section]?.[field] || "-"}</td>
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
      <DialogTitle>Student Details (View Only)</DialogTitle>
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
                  {student.studentDetails?.studentImage ? (
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
                <span className="text-gray-500">Image</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full mb-2 flex items-center justify-center overflow-hidden">
                  {student.studentDetails?.studentSign ? (
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
                <span className="text-gray-500">Signature</span>
              </div>
            </div>
            <table className="w-full text-left">
              <tbody>
                {renderField("studentDetails", "firstName", "First Name")}
                {renderField("studentDetails", "middleName", "Middle Name")}
                {renderField("studentDetails", "lastName", "Last Name")}
                {renderField("studentDetails", "emailAddress", "Email")}
                {renderField("studentDetails", "studentMobileNumber", "Student Phone")}
                <tr>
                  <td className="p-2 font-semibold">Program</td>
                  <td className="p-2">: {data.academicDetails?.program || "-"}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold">Batch</td>
                  <td className="p-2">: {data.academicDetails?.batch?.name || "-"}</td>
                </tr>
                {renderField("academicDetails", "registerNumber", "Register Number")}
                {renderField("academicDetails", "rollNumber", "Roll Number")}
                <tr>
                  <td className="p-2 font-semibold">Status</td>
                  <td className="p-2">
                    : {data.status?.charAt(0).toUpperCase() + data.status?.slice(1)}
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
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExaminerStudentDetailsModal;
