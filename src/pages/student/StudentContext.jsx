import React, { createContext, useEffect, useState } from "react";

export const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const [student, setStudent] = useState(() => {
    const savedStudent = localStorage.getItem("student");
    return savedStudent ? JSON.parse(savedStudent) : null;
  });

  useEffect(() => {
    if (student) {
      localStorage.setItem("student", JSON.stringify(student));
    } else {
      localStorage.removeItem("student");
    }
  }, [student]);

  return (
    <StudentContext.Provider value={{ student, setStudent }}>
      {children}
    </StudentContext.Provider>
  );
};
