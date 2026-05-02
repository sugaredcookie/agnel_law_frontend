import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const AdminPrivateRoute = () => {
  const isAdmin = localStorage.getItem("isAdmin");
  const adminToken = localStorage.getItem("adminToken");

  if (isAdmin && adminToken) {
    return <Outlet />;
  } else {
    return <Navigate to="/panel-admin/login" />;
  }
};

export default AdminPrivateRoute;
