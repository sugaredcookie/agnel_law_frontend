import React, { createContext, useState } from "react";

export const ExaminerContext = createContext();

export const ExaminerProvider = ({ children }) => {
  const [examiner, setExaminer] = useState(null);

  return (
    <ExaminerContext.Provider value={{ examiner, setExaminer }}>
      {children}
    </ExaminerContext.Provider>
  );
};
