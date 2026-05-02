/*
 * AddStudentModal - Modal for admin to add a new student directly
 * Minimum required fields shown by default, additional fields hidden under "More Details"
 */
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
import Collapse from "@mui/material/Collapse";
import {
  createStudentByAdmin,
  getAllProgramsViaAdmin,
  getAllBatchesViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const initialFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  studentMobileNumber: "",
  emailAddress: "",
  program: "",
  batchId: "",
  batchName: "",
  rollNumber: "",
  registerNumber: "",
  enrollmentDate: "",
  bloodGroup: "",
  birthPlace: "",
  motherTongue: "",
  casteCategory: "",
  caste: "",
  aadharCardNumber: "",
  religion: "",
  prnNumber: "",
  abcNumber: "",
  grNumber: "",
  capApplicationId: "",
  address: "",
  fatherName: "",
  fatherEmail: "",
  fatherOccupation: "",
  fatherMobileNo: "",
  motherName: "",
  motherEmail: "",
  motherOccupation: "",
  motherMobileNo: "",
  familyAnnualIncome: "",
};

const AddStudentModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdStudent, setCreatedStudent] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [signFile, setSignFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [signPreview, setSignPreview] = useState(null);

  const fetchProgramsAndBatches = useCallback(async () => {
    try {
      const [programsRes, batchesRes] = await Promise.all([
        getAllProgramsViaAdmin(),
        getAllBatchesViaAdmin(),
      ]);
      setPrograms(programsRes.programs || []);
      setBatches(batchesRes.batches || []);
    } catch (error) {
      toast.error("Failed to load programs or batches");
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchProgramsAndBatches();
      setFormData(initialFormData);
      setShowMoreDetails(false);
      setCreatedStudent(null);
      setPhotoFile(null);
      setSignFile(null);
      setPhotoPreview(null);
      setSignPreview(null);
    }
  }, [open, fetchProgramsAndBatches]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "photo") {
          setPhotoFile(file);
          setPhotoPreview(reader.result);
        } else {
          setSignFile(file);
          setSignPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = (type) => {
    if (type === "photo") {
      setPhotoFile(null);
      setPhotoPreview(null);
    } else {
      setSignFile(null);
      setSignPreview(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProgramChange = (e) => {
    const programName = e.target.value;
    const newFilteredBatches = batches.filter(
      (b) => b.program?.name === programName
    );
    setFilteredBatches(newFilteredBatches);
    setFormData((prev) => ({
      ...prev,
      program: programName,
      batchId: "",
      batchName: "",
    }));
  };

  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    const selectedBatch = batches.find((b) => b._id === batchId);
    setFormData((prev) => ({
      ...prev,
      batchId: selectedBatch._id,
      batchName: selectedBatch.batchName,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.program || !formData.batchId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await createStudentByAdmin(formData, photoFile, signFile);
      toast.success("Student created successfully!");
      setCreatedStudent(response);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create student";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setShowMoreDetails(false);
    setCreatedStudent(null);
    setPhotoFile(null);
    setSignFile(null);
    setPhotoPreview(null);
    setSignPreview(null);
    onClose();
  };

  const renderRequiredField = (name, label, type = "text") => (
    <TextField
      fullWidth
      required
      variant="outlined"
      size="small"
      label={label}
      name={name}
      type={type}
      value={formData[name]}
      onChange={handleInputChange}
      className="mb-3"
    />
  );

  const renderOptionalField = (name, label, type = "text") => (
    <TextField
      fullWidth
      variant="outlined"
      size="small"
      label={label}
      name={name}
      type={type}
      value={formData[name]}
      onChange={handleInputChange}
      className="mb-3"
    />
  );

  if (createdStudent) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Student Created Successfully</DialogTitle>
        <DialogContent>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-green-800">Login Details</h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 font-medium">Name:</td>
                  <td className="py-2">
                    {createdStudent.student?.studentDetails?.firstName}{" "}
                    {createdStudent.student?.studentDetails?.lastName}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Roll Number:</td>
                  <td className="py-2 font-mono bg-gray-100 px-2 rounded">
                    {createdStudent.loginDetails?.rollNumber}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Temporary Password:</td>
                  <td className="py-2 font-mono bg-gray-100 px-2 rounded">
                    {createdStudent.loginDetails?.temporaryPassword}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Email:</td>
                  <td className="py-2">{createdStudent.loginDetails?.email}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-sm text-gray-600">
              {formData.emailAddress
                ? "Login details have been sent to the student's email."
                : "No email provided. Please share these details with the student manually."}
            </p>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Student</DialogTitle>
      <DialogContent>
        <div className="pt-2">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">
            Required Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {renderRequiredField("firstName", "First Name")}
            {renderOptionalField("middleName", "Middle Name")}
            {renderRequiredField("lastName", "Last Name")}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <FormControl fullWidth size="small">
              <InputLabel>Gender</InputLabel>
              <Select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                label="Gender"
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            {renderOptionalField("emailAddress", "Email Address", "email")}
            {renderOptionalField("studentMobileNumber", "Mobile Number")}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <FormControl fullWidth size="small" required>
              <InputLabel>Program</InputLabel>
              <Select
                value={formData.program}
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

            <FormControl fullWidth size="small" required>
              <InputLabel>Batch</InputLabel>
              <Select
                value={formData.batchId}
                onChange={handleBatchChange}
                label="Batch"
                disabled={!formData.program}
              >
                {filteredBatches.map((b) => (
                  <MenuItem key={b._id} value={b._id}>
                    {b.batchName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="Roll Number"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleInputChange}
              placeholder="Auto-generated if empty"
              helperText="Leave empty to auto-generate"
            />
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
            {renderOptionalField("aadharCardNumber", "Aadhar Number")}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="border rounded-lg p-3">
              <p className="text-sm font-medium text-gray-600 mb-2">Student Photo (Optional)</p>
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Photo preview"
                    className="w-24 h-28 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => clearFile("photo")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    x
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-24 h-28 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-purple-400">
                  <span className="text-gray-400 text-xs text-center">Click to upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "photo")}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="border rounded-lg p-3">
              <p className="text-sm font-medium text-gray-600 mb-2">Student Signature (Optional)</p>
              {signPreview ? (
                <div className="relative">
                  <img
                    src={signPreview}
                    alt="Signature preview"
                    className="w-24 h-16 object-contain rounded border bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => clearFile("sign")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    x
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-24 h-16 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-purple-400">
                  <span className="text-gray-400 text-xs text-center">Click to upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "sign")}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              color="primary"
              size="small"
              className="mb-2"
            >
              {showMoreDetails ? "Hide Additional Details" : "Show Additional Details"}
            </Button>
          </div>

          <Collapse in={showMoreDetails}>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">
                Personal Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {renderOptionalField("bloodGroup", "Blood Group")}
                {renderOptionalField("birthPlace", "Birth Place")}
                {renderOptionalField("motherTongue", "Mother Tongue")}
                {renderOptionalField("religion", "Religion")}
                {renderOptionalField("casteCategory", "Caste Category")}
                {renderOptionalField("caste", "Caste")}
              </div>

              <div className="mt-3">
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </div>

              <h4 className="text-sm font-semibold text-gray-600 mt-4 mb-3">
                Academic IDs
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderOptionalField("registerNumber", "Register Number")}
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  label="Enrollment Date"
                  name="enrollmentDate"
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={handleInputChange}
                  className="mb-3"
                  InputLabelProps={{ shrink: true }}
                />
                {renderOptionalField("prnNumber", "PRN Number")}
                {renderOptionalField("abcNumber", "ABC Number")}
                {renderOptionalField("grNumber", "GR Number")}
                {renderOptionalField("capApplicationId", "CAP Application ID")}
              </div>

              <h4 className="text-sm font-semibold text-gray-600 mt-4 mb-3">
                Family Background
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderOptionalField("fatherName", "Father's Name")}
                {renderOptionalField("fatherMobileNo", "Father's Mobile")}
                {renderOptionalField("fatherEmail", "Father's Email", "email")}
                {renderOptionalField("fatherOccupation", "Father's Occupation")}
                {renderOptionalField("motherName", "Mother's Name")}
                {renderOptionalField("motherMobileNo", "Mother's Mobile")}
                {renderOptionalField("motherEmail", "Mother's Email", "email")}
                {renderOptionalField("motherOccupation", "Mother's Occupation")}
                {renderOptionalField("familyAnnualIncome", "Family Annual Income")}
              </div>
            </div>
          </Collapse>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? "Creating..." : "Add Student"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStudentModal;
