import React from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

const ProtectedNonTeachingStaffRoute = ({ children }) => {
  const token = localStorage.getItem("nonTeachingStaffToken");
  const staffData = localStorage.getItem("nonTeachingStaffData");

  // Check if token exists
  if (!token) {
    toast.info("Please login to access this page");
    return <Navigate to="/non-teaching-staff/login" replace />;
  }

  // Optional: Check if token is expired (if you have expiry info in token)
  try {
    // You can add JWT expiry check here if needed
    // const decoded = jwt.decode(token);
    // if (decoded.exp < Date.now() / 1000) {
    //   localStorage.removeItem("nonTeachingStaffToken");
    //   localStorage.removeItem("nonTeachingStaffData");
    //   toast.error("Session expired. Please login again");
    //   return <Navigate to="/non-teaching-staff/login" replace />;
    // }
  } catch (error) {
    console.error("Token validation error:", error);
    localStorage.removeItem("nonTeachingStaffToken");
    localStorage.removeItem("nonTeachingStaffData");
    return <Navigate to="/non-teaching-staff/login" replace />;
  }

  // If token exists, render the protected component
  return children;
};

export default ProtectedNonTeachingStaffRoute;