import React, { useState, useEffect, useCallback } from "react";
import { Dialog } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import {
  startIdCardJob,
  getIdCardJobStatus,
  downloadIdCardZip,
} from "../../../utils/Api";
import IdCardTemplate from "../../../IdCardTemplate.js";

const IdCardModal = ({ open, onClose, student }) => {
  const [cardHtml, setCardHtml] = useState("");

  const getStartYear = useCallback(() => {
    const yearOfJoining = student?.academicDetails?.yearOfJoining;
    if (yearOfJoining) {
      return String(yearOfJoining);
    }

    const rollNumber = student?.academicDetails?.rollNumber;
    if (rollNumber) {
      const numericPart = rollNumber.replace(/^[A-Za-z]+/, "");
      if (numericPart.length >= 2) {
        return `20${numericPart.substring(0, 2)}`;
      }
    }
    return "";
  }, [student]);

  const getProgramDuration = (programName) => {
    const durationMap = {
      LLB: 3,
      LLM: 2,
      BALLB: 5,
    };
    const normalizedProgram = programName?.toUpperCase().replace(/\s+/g, "");
    return durationMap[normalizedProgram] || 1; // Default to 1 year if not found
  };

  const getAcademicYear = useCallback(() => {
    const startYear = getStartYear();
    let academicYear = "";
    if (startYear) {
      const duration = getProgramDuration(student.academicDetails.program);
      const endYear = parseInt(startYear) + duration;
      academicYear = `AY ${startYear}-${endYear.toString().slice(2)}`;
    }
    return academicYear;
  }, [getStartYear, student]);

  useEffect(() => {
    if (student) {
      const academicYear = getAcademicYear();
      const studentData = {
        ...student,
        academicDetails: {
          ...student.academicDetails,
          yearOfJoining: getStartYear(),
        },
        academicYear,
        studentPhotoUrl:
          student.studentDetails?.studentImage || "/fallback-image.png",
        studentSignUrl: student.studentDetails?.studentSign,
        agnelLogoBase64: "/agnel-logo.png",
        naacLogoBase64: "/b_plus_nac.png",
        principalSignBase64: "/principal_sign.png",
        collegeSealBase64: "/clg_seal.png",
      };

      const generatedHtml = IdCardTemplate(studentData);
      setCardHtml(generatedHtml);
    }
  }, [student, getStartYear, getAcademicYear]);

  const handleDownload = async () => {
    try {
      const { jobId } = await startIdCardJob([student._id]);
      if (jobId) {
        const poll = setInterval(async () => {
          const status = await getIdCardJobStatus(jobId);
          if (status.status === "completed") {
            clearInterval(poll);
            await downloadIdCardZip(jobId);
          } else if (status.status === "failed") {
            clearInterval(poll);
            console.error("ID card generation failed.");
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error downloading ID card:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <div className="relative p-4">
        <button
          onClick={handleDownload}
          className="absolute top-0 right-0 m-2 px-2 py-1 rounded-full z-10"
        >
          <DownloadIcon />
        </button>
        <iframe
          srcDoc={cardHtml}
          title="ID Card Preview"
          style={{ width: "100%", height: "780px", border: "none" }}
        />
      </div>
    </Dialog>
  );
};

export default IdCardModal;
