import React, { useContext } from "react";

import DashboardLayout from "./FacultyDashboardLayout";
import { FacultyContext } from "./FacultyContext";
import { Link } from "react-router-dom";

const FacultyDashboard = () => {
  const faculty_data = useContext(FacultyContext).faculty;
  console.log(faculty_data);

  if (!faculty_data) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div>Faculty Dashboard</div>
      <div>
        <h1>{faculty_data.facultyName}</h1>
        <p>{faculty_data.email}</p>
      </div>
      <div className="grid grid-col-3 mt-7">
        <Link
          className="border col-1 text-center rounded text-black text-decoration-none hover:translate-y-0.5 hover:shadow hover:shadow-4xl hover:shadow-black"
          to={"/faculty/my-subjects"}
        >
          My Subjects
        </Link>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
