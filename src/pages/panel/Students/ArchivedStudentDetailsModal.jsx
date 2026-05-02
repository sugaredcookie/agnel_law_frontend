import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { restoreArchivedStudentViaAdmin, updateArchivedPermissionsViaAdmin } from "../../../utils/Api";
import { toast } from "react-toastify";

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} className="py-4">
    {value === index && children}
  </div>
);

const getReasonBadgeColor = (reason) => {
  switch (reason) {
    case "cancelled":
      return "error";
    case "graduated":
      return "success";
    case "transferred":
      return "info";
    case "inactive":
      return "warning";
    default:
      return "default";
  }
};

const ArchivedStudentDetailsModal = ({ open, onClose, student, onRestore }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const [permissions, setPermissions] = useState({
    canLogin: student.permissions?.canLogin || false,
    canResetPassword: student.permissions?.canResetPassword || false,
    canViewResults: student.permissions?.canViewResults || false,
    canViewNotes: student.permissions?.canViewNotes || false,
    canSelectElectives: student.permissions?.canSelectElectives || false,
  });
  const [savingPerm, setSavingPerm] = useState(false);

  if (!student) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRestore = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to restore ${student.studentDetails?.firstName} ${student.studentDetails?.lastName}?\n\n` +
      "This will move the student back to the active students list."
    );

    if (confirmed) {
      setRestoring(true);
      try {
        await restoreArchivedStudentViaAdmin(student._id);
        toast.success("Student restored successfully");
        onRestore();
        onClose();
      } catch (error) {
        console.error("Error restoring student:", error);
        toast.error(error.response?.data?.message || "Failed to restore student");
      } finally {
        setRestoring(false);
      }
    }
  };

  const togglePermission = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const savePermissions = async () => {
    setSavingPerm(true);
    try {
      await updateArchivedPermissionsViaAdmin(student._id, permissions);
      toast.success("Permissions updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update permissions");
    } finally {
      setSavingPerm(false);
    }
  };

  const renderField = (label, value) => (
    <tr>
      <td className="p-2 font-semibold text-gray-600">{label}</td>
      <td className="p-2">: {value || "-"}</td>
    </tr>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span>Archived Student Details</span>
          <Chip
            label={student.archiveReason?.charAt(0).toUpperCase() + student.archiveReason?.slice(1)}
            color={getReasonBadgeColor(student.archiveReason)}
            size="small"
          />
        </div>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Archive Info" />
            <Tab label="Permissions" />
            <Tab label="Student Details" />
            <Tab label="Academic Details" />
            <Tab label="Family Details" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-orange-800 mb-2">Archive Information</h4>
            <table className="w-full text-left">
              <tbody>
                {renderField("Archive Reason", student.archiveReason?.charAt(0).toUpperCase() + student.archiveReason?.slice(1))}
                {renderField("Archive Note", student.archiveNote)}
                {renderField("Archived At", formatDate(student.archivedAt))}
                {renderField("Original Status", student.originalStatus?.charAt(0).toUpperCase() + student.originalStatus?.slice(1))}
                {renderField("Original Created", formatDate(student.originalCreatedAt))}
                {renderField("Original Updated", formatDate(student.originalUpdatedAt))}
              </tbody>
            </table>
          </div>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-800 mb-3">Access Permissions</h4>
            <p className="text-sm text-blue-600 mb-4">Control what this archived student can access when logged in.</p>
            <div className="space-y-3">
              {[
                { key: "canLogin", label: "Can Login", desc: "Allow the student to login to the portal" },
                { key: "canResetPassword", label: "Can Reset Password", desc: "Allow password reset via forgot password" },
                { key: "canViewResults", label: "Can View Results", desc: "Allow viewing marks and results" },
                { key: "canViewNotes", label: "Can View Notes", desc: "Allow viewing class notes" },
                { key: "canSelectElectives", label: "Can Select Electives", desc: "Allow elective subject selection" },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <div
                    onClick={() => togglePermission(key)}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                      permissions[key] ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        permissions[key] ? "translate-x-5" : ""
                      }`}
                    />
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={savePermissions}
                disabled={savingPerm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
              >
                {savingPerm ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </div>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <div className="flex flex-col items-center mb-4">
            <div className="flex justify-between w-full mb-4">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full mb-2 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                  {student.studentDetails?.studentImage ? (
                    <img
                      src={student.studentDetails.studentImage}
                      alt="Student"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>
                  )}
                </div>
                <span className="text-gray-500 text-sm">Photo</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full mb-2 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                  {student.studentDetails?.studentSign ? (
                    <img
                      src={student.studentDetails.studentSign}
                      alt="Signature"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No Sign</span>
                    </div>
                  )}
                </div>
                <span className="text-gray-500 text-sm">Signature</span>
              </div>
            </div>
            <table className="w-full text-left">
              <tbody>
                {renderField("First Name", student.studentDetails?.firstName)}
                {renderField("Middle Name", student.studentDetails?.middleName)}
                {renderField("Last Name", student.studentDetails?.lastName)}
                {renderField("Gender", student.studentDetails?.gender)}
                {renderField("Date of Birth", student.studentDetails?.dateOfBirth)}
                {renderField("Email", student.studentDetails?.emailAddress)}
                {renderField("Mobile", student.studentDetails?.studentMobileNumber)}
                {renderField("Blood Group", student.studentDetails?.bloodGroup)}
                {renderField("Aadhar Number", student.studentDetails?.aadharCardNumber)}
                {renderField("Address", student.studentDetails?.address)}
              </tbody>
            </table>
          </div>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <table className="w-full text-left">
            <tbody>
              {renderField("Program", student.academicDetails?.program)}
              {renderField("Batch", student.academicDetails?.batch?.name)}
              {renderField("Roll Number", student.academicDetails?.rollNumber)}
              {renderField("Register Number", student.academicDetails?.registerNumber)}
              {renderField("Year of Joining", student.academicDetails?.yearOfJoining)}
              {renderField("PRN Number", student.studentDetails?.prnNumber)}
              {renderField("ABC Number", student.studentDetails?.abcNumber)}
              {renderField("GR Number", student.studentDetails?.grNumber)}
              {renderField("CAP Application ID", student.studentDetails?.capApplicationId)}
            </tbody>
          </table>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <table className="w-full text-left">
            <tbody>
              {renderField("Father's Name", student.familyBackground?.fatherName)}
              {renderField("Father's Email", student.familyBackground?.fatherEmail)}
              {renderField("Father's Occupation", student.familyBackground?.fatherOccupation)}
              {renderField("Father's Mobile", student.familyBackground?.fatherMobileNo)}
              {renderField("Mother's Name", student.familyBackground?.motherName)}
              {renderField("Mother's Email", student.familyBackground?.motherEmail)}
              {renderField("Mother's Occupation", student.familyBackground?.motherOccupation)}
              {renderField("Mother's Mobile", student.familyBackground?.motherMobileNo)}
              {renderField("Annual Income", student.familyBackground?.familyAnnualIncome)}
            </tbody>
          </table>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleRestore}
          color="success"
          variant="contained"
          disabled={restoring}
        >
          {restoring ? "Restoring..." : "Restore Student"}
        </Button>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArchivedStudentDetailsModal;
