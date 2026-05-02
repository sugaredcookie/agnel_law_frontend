import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  uploadStudentDataViaAdmin,
  uploadFacultyDataViaAdmin,
  uploadSubjectDataViaAdmin,
  uploadNonTeachingStaffExcelViaAdmin,
} from "../utils/Api";

const ExcelUploader = ({ onUploadSuccess, uploadType = "student" }) => {
  const [uploading, setUploading] = useState(false);

  const getButtonText = () => {
    if (uploading) return "Uploading...";
    
    switch(uploadType) {
      case "faculty":
        return "Upload Faculty Excel";
      case "subject":
        return "Upload Subject Excel";
      case "non-teaching-staff":
        return "Upload Staff Excel";
      case "student":
      default:
        return "Upload Student Excel";
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      let response;
      switch(uploadType) {
        case "faculty":
          response = await uploadFacultyDataViaAdmin(formData);
          break;
        case "subject":
          response = await uploadSubjectDataViaAdmin(formData);
          break;
        case "non-teaching-staff":
          response = await uploadNonTeachingStaffExcelViaAdmin(formData);
          break;
        case "student":
        default:
          response = await uploadStudentDataViaAdmin(formData);
          break;
      }

      if (response) {
        const message = response.data?.message || response.message;
        const stats = response.data?.stats || response.stats;
        
        toast.success(
          `${message || "Upload successful"}. Created: ${stats?.created || 0}, Updated: ${stats?.updated || 0}, Failed: ${stats?.failed || 0}`,
        );
      
        if (onUploadSuccess) onUploadSuccess();
        event.target.value = '';
      } else {
        toast.error("Upload failed - no response");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
        id="excel-upload"
      />
      <label
        htmlFor="excel-upload"
        className={`cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
          uploading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {getButtonText()}
      </label>
      {uploading && (
        <span className="text-sm text-gray-600">Processing...</span>
      )}
    </div>
  );
};

export default ExcelUploader;
