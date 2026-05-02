import React from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import StudentList from "./StudentList";

const Students = () => {
  return (
    <PanelDashboardLayout>
      <div>
        <h1>Students</h1>
        <StudentList />
      </div>
    </PanelDashboardLayout>
  );
};

export default Students;
