import React, { useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import FacultyFeedback from "./FacultyFeedback";
import SubjectFeedback from "./SubjectFeedback";

const Feedback = () => {
  const [feedbackType, setFeedbackType] = useState("faculty");
  return (
    <PanelDashboardLayout>
      <div className="mb-4 text-2xl font-bold">Feedback</div>
      <div>
        <button
          onClick={() => setFeedbackType("faculty")}
          className={`${
            feedbackType === "faculty" ? "bg-blue-500 rounded-lg" : ""
          } p-2 cursor-pointer`}
        >
          Faculty
        </button>
        <button
          onClick={() => setFeedbackType("subject")}
          className={`${
            feedbackType === "subject" ? "bg-blue-500 rounded-lg" : ""
          } p-2 cursor-pointer`}
        >
          Subject
        </button>
      </div>
      <div>
        {feedbackType === "faculty" ? <FacultyFeedback /> : <SubjectFeedback />}
      </div>
    </PanelDashboardLayout>
  );
};

export default Feedback;
