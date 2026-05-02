import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getSingleFormDataForAdmin,
  updateCertificateStatus,
} from "../../../utils/Api";
import { toast } from "react-toastify";

import InfoIcon from "@mui/icons-material/Info";
import PersonIcon from "@mui/icons-material/Person";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import TopicIcon from "@mui/icons-material/Topic";
import SchoolIcon from "@mui/icons-material/School";
import PanelDashboardLayout from "../PanelDashboardLayout";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

const PanelPreview = () => {
  const { id } = useParams();
  const [data, setData] = useState({});
  const [tabIndex, setTabIndex] = useState("formDetails");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [rejectionRemark, setRejectionRemark] = useState("");
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState(null);

  useEffect(() => {
    if (id) {
      fetchSingleFormDataFromAPI();
    }
  }, [id]);

  const fetchSingleFormDataFromAPI = async () => {
    try {
      const response = await getSingleFormDataForAdmin(id);
      console.log(response);
      setData(response);
    } catch (error) {
      console.log(error);
      toast.error(`Try Again, ${error?.response?.data?.error}`);
    }
  };

  const handleVerify = async (certificateId) => {
    try {
      await updateCertificateStatus(id, certificateId, {
        status: "verified",
        remark: "",
      });
      toast.success("Document verified successfully");
      fetchSingleFormDataFromAPI();
    } catch (error) {
      toast.error("Failed to verify document");
    }
  };

  const handleReject = (certificate) => {
    setSelectedCertificate(certificate);
    setRejectionRemark("");
    setOpenDialog(true);
  };

  const handleRejectSubmit = async () => {
    try {
      if (!rejectionRemark.trim()) {
        toast.error("Please provide a rejection remark");
        return;
      }

      await updateCertificateStatus(id, selectedCertificate._id, {
        status: "rejected",
        remark: rejectionRemark,
      });

      setOpenDialog(false);
      toast.success("Document rejected successfully");
      fetchSingleFormDataFromAPI();
    } catch (error) {
      toast.error("Failed to reject document");
    }
  };

  const renderFormDetails = () => (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">Form Details</h5>
        <p className="card-text">
          Application Number: {data.applicationNumber}
        </p>
        <p className="card-text">Form Mode: {data.formMode}</p>
        <p className="card-text">Course Name: {data.course}</p>
        <p className="card-text">Form Status: {data.formStatusFromAdmin}</p>
        <p className="card-text">
          Payment Status:{" "}
          {data.paymentStatus === "paid"
            ? "Completed"
            : data.paymentStatus === "partial"
              ? "Partially Paid"
              : "Pending"}
        </p>
        <p className="card-text">
          Last Updated: {new Date(data.updatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );

  const renderStudentDetails = () => (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row">
          <div className="col-sm-4">
            <img
              alt={data.studentDetails?.firstName}
              src={data.studentDetails?.studentImage}
              className="img-fluid rounded-circle mb-3"
              style={{ width: "150px", height: "150px" }}
            />
          </div>
          <div className="col-sm-8">
            <h5 className="card-title">Student Information</h5>
            <p className="card-text">
              Name:{" "}
              {`${data.studentDetails?.firstName} ${data.studentDetails?.middleName} ${data.studentDetails?.lastName}`}
            </p>
            <p className="card-text">
              Date of Birth: {data.studentDetails?.dateOfBirth}
            </p>
            <p className="card-text">
              Blood Group: {data.studentDetails?.bloodGroup}
            </p>
            <p className="card-text">
              Birth Place: {data.studentDetails?.birthPlace}
            </p>
            <p className="card-text">
              Caste Category: {data.studentDetails?.casteCategory}
            </p>
            <p className="card-text">Caste : {data.studentDetails?.caste}</p>
            <p className="card-text">
              Aadhar Card Number: {data.studentDetails?.aadharCardNumber}
            </p>
            <p className="card-text">
              Religion: {data.studentDetails?.religion}
            </p>
            <p className="card-text">
              Student Mobile Number: {data.studentDetails?.studentMobileNumber}
            </p>
            <p className="card-text">
              Student Email ID: {data.studentDetails?.emailAddress}
            </p>
            <p className="card-text">
              PRN Number: {data.studentDetails?.prnNumber}
            </p>
            <p className="card-text">
              ABC Number: {data.studentDetails?.abcNumber}
            </p>
            <p className="card-text">
              CAP Application ID: {data.studentDetails?.capApplicationId}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAcademicQualifications = () => (
    <div>
      {/* Render 10th and 12th details */}
      {["tenth", "twelfth"].map((key) => (
        <div className="card mb-3" key={key}>
          <div className="card-body">
            <h5 className="card-title">
              {key === "tenth" ? "10th Standard" : "12th Standard"}
            </h5>
            <p className="card-text">
              Institution: {data.academicQualifications?.[key]?.institution}
            </p>
            <p className="card-text">
              Percentage: {data.academicQualifications?.[key]?.percentage}%
            </p>
            <p className="card-text">
              Year of Passing:{" "}
              {data.academicQualifications?.[key]?.yearOfPassing}
            </p>
          </div>
        </div>
      ))}

      {/* Render CET exam details */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">CET Exam Details</h5>
          <p className="card-text">
            Exam Year: {data.academicQualifications?.cetExam?.examYear}
          </p>
          <p className="card-text">
            Obtained Marks:{" "}
            {data.academicQualifications?.cetExam?.obtainedMarks}
          </p>
          <p className="card-text">
            Maximum Marks: {data.academicQualifications?.cetExam?.maximumMarks}
          </p>
          {data.academicQualifications?.cetExam?.obtainedMarks &&
            data.academicQualifications?.cetExam?.maximumMarks && (
              <p className="card-text">
                Percentage:{" "}
                {(
                  (data.academicQualifications.cetExam.obtainedMarks /
                    data.academicQualifications.cetExam.maximumMarks) *
                  100
                ).toFixed(2)}
                %
              </p>
            )}
        </div>
      </div>
    </div>
  );

  const renderFamilyBackground = () => (
    <div>
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Father's Information</h5>
          <p className="card-text">Name: {data.familyBackground?.fatherName}</p>
          <p className="card-text">
            Email: {data.familyBackground?.fatherEmail}
          </p>
          <p className="card-text">
            Mobile No: {data.familyBackground?.fatherMobileNo}
          </p>
          <p className="card-text">
            Occupation: {data.familyBackground?.fatherOccupation}
          </p>
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Mother's Information</h5>
          <p className="card-text">Name: {data.familyBackground?.motherName}</p>
          <p className="card-text">
            Email: {data.familyBackground?.motherEmail}
          </p>
          <p className="card-text">
            Mobile No: {data.familyBackground?.motherMobileNo}
          </p>
          <p className="card-text">
            Occupation: {data.familyBackground?.motherOccupation}
          </p>
        </div>
      </div>
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">Family Background</h5>
          <p className="card-text">
            Family Annual Income: {data.familyBackground?.familyAnnualIncome}
          </p>
          <p className="card-text">
            Is there any Lawyer or Judge in the family?{" "}
            {data.familyBackground?.isLawyerOrJudge ? "Yes" : "No"}
          </p>
        </div>
      </div>
    </div>
  );

  const renderCertificates = () => (
    <div className="row">
      <div className="col-md-4">
        {data.certificates?.map((certificate, index) => (
          <div className="card mb-2" key={index}>
            <div className="card-body py-2">
              <div className="d-flex justify-content-between align-items-center">
                <button
                  className="btn btn-link text-start text-decoration-none"
                  onClick={() => setSelectedPreviewDoc(certificate)}
                >
                  {certificate.type}
                </button>
                <div>
                  {certificate.status === "verified" && (
                    <CheckCircleIcon className="text-success" />
                  )}
                  {certificate.status === "rejected" && (
                    <CancelIcon className="text-danger" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="col-md-8">
        {selectedPreviewDoc && (
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between mb-3">
                <h5 className="card-title">{selectedPreviewDoc.type}</h5>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleVerify(selectedPreviewDoc._id)}
                    disabled={selectedPreviewDoc.status === "verified"}
                  >
                    <CheckCircleIcon /> Verify
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReject(selectedPreviewDoc)}
                    disabled={selectedPreviewDoc.status === "rejected"}
                  >
                    <CancelIcon /> Reject
                  </button>
                </div>
              </div>

              {selectedPreviewDoc.fileUrl.includes("/documents") ? (
                <div
                  className="pdf-container"
                  style={{ height: "600px", width: "100%" }}
                >
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                      selectedPreviewDoc.fileUrl,
                    )}&embedded=true`}
                    width="100%"
                    height="100%"
                    title={selectedPreviewDoc.type}
                    frameBorder="0"
                  />
                </div>
              ) : (
                <img
                  src={selectedPreviewDoc.fileUrl}
                  alt={selectedPreviewDoc.type}
                  style={{ maxWidth: "100%", height: "auto" }}
                  className="img-fluid"
                />
              )}

              {selectedPreviewDoc.status && (
                <div
                  className={`mt-3 ${
                    selectedPreviewDoc.status === "verified"
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  <div>Status: {selectedPreviewDoc.status}</div>
                  {selectedPreviewDoc.remark && (
                    <div>Remark: {selectedPreviewDoc.remark}</div>
                  )}
                  {selectedPreviewDoc.verifiedAt && (
                    <div>
                      Verified At:{" "}
                      {new Date(selectedPreviewDoc.verifiedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Reject Document</DialogTitle>
        <DialogContent>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRejectSubmit}
            variant="contained"
            color="error"
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );

  return (
    <PanelDashboardLayout>
      <div className="container-fluid">
        <h3 className="text-center my-4">{data.course}</h3>
        <div className="row">
          <div className="col-sm-3">
            <ul className="nav flex-column nav-pills">
              <li className="nav-item text-white">
                <a
                  className={`nav-link ${
                    tabIndex === "formDetails" ? "active" : ""
                  }`}
                  href="#formDetails"
                  onClick={() => setTabIndex("formDetails")}
                >
                  <InfoIcon /> Form Details
                </a>
              </li>
              <li className="nav-item ">
                <a
                  className={`nav-link text-white ${
                    tabIndex === "studentDetails" ? "active" : ""
                  }`}
                  href="#studentDetails"
                  onClick={() => setTabIndex("studentDetails")}
                >
                  <PersonIcon /> Student Details
                </a>
              </li>

              <li className="nav-item ">
                <a
                  className={`nav-link text-white ${
                    tabIndex === "academicQualifications" ? "active" : ""
                  }`}
                  href="#academicQualifications"
                  onClick={() => setTabIndex("academicQualifications")}
                >
                  <SchoolIcon /> Academic Qualifications
                </a>
              </li>
              <li className="nav-item ">
                <a
                  className={`nav-link text-white ${
                    tabIndex === "familyBackground" ? "active" : ""
                  }`}
                  href="#familyBackground"
                  onClick={() => setTabIndex("familyBackground")}
                >
                  <PeopleAltIcon /> Family Background
                </a>
              </li>

              <li className="nav-item ">
                <a
                  className={`nav-link text-white ${
                    tabIndex === "certificates" ? "active" : ""
                  }`}
                  href="#certificates"
                  onClick={() => setTabIndex("certificates")}
                >
                  <TopicIcon /> Certificates
                </a>
              </li>
            </ul>
          </div>
          <div className="col-sm-9">
            <div className="tab-content">
              {tabIndex === "formDetails" && renderFormDetails()}
              {tabIndex === "studentDetails" && renderStudentDetails()}
              {tabIndex === "academicQualifications" &&
                renderAcademicQualifications()}
              {tabIndex === "familyBackground" && renderFamilyBackground()}

              {tabIndex === "certificates" && renderCertificates()}
            </div>
          </div>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default PanelPreview;
