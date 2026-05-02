import React, { createContext, useEffect, useState } from "react";
import { getFacultyDetails } from "../../utils/Api";

export const FacultyContext = createContext();

export const FacultyProvider = ({ children }) => {
  const [faculty, setFaculty] = useState(() => {
    const savedFaculty = localStorage.getItem("faculty");
    return savedFaculty ? JSON.parse(savedFaculty) : null;
  });

  const refetchFacultyDetails = async () => {
    try {
      const res = await getFacultyDetails();
      setFaculty(res);
      return res;
    } catch (error) {
      console.error("Error fetching faculty details:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (faculty) {
      localStorage.setItem("faculty", JSON.stringify(faculty));
    } else {
      localStorage.removeItem("faculty");
    }
  }, [faculty]);

  return (
    <FacultyContext.Provider
      value={{ faculty, setFaculty, refetchFacultyDetails }}
    >
      {children}
    </FacultyContext.Provider>
  );
};
