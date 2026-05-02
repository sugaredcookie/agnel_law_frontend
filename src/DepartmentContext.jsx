import React from "react";

export const DepartmentContext = React.createContext();

export const DepartmentProvider = ({ children }) => {
  const [department, setDepartment] = React.useState("Department 1");

  return (
    <DepartmentContext.Provider value={{ department, setDepartment }}>
      {children}
    </DepartmentContext.Provider>
  );
};
