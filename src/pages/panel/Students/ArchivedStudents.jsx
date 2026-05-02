import React from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import ArchivedStudentList from "./ArchivedStudentList";

const ArchivedStudents = () => {
  return (
    <PanelDashboardLayout>
      <div>
        <h1>Archived Students</h1>
        <ArchivedStudentList />
      </div>
    </PanelDashboardLayout>
  );
};

export default ArchivedStudents;
