import React from "react";
import ExaminerNavbar from "../ExaminerNavbar";
import ExaminerTopHeader from "../ExaminerTopHeader";
import ExaminerStudentList from "./ExaminerStudentList";

const ExaminerStudents = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen text-black dark:text-white">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-4">Students (View Only)</h1>
            <ExaminerStudentList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExaminerStudents;
