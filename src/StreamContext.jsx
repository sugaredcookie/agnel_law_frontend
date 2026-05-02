// StreamContext.js
import React, { createContext, useState } from "react";

export const StreamContext = createContext();

export const StreamProvider = ({ children }) => {
  const [streams, setStreams] = useState([]);
  const [programData, setProgramData] = useState({});

  const addStream = (stream) => {
    setStreams((prevStreams) => [...prevStreams, stream]);
  };

  const updateProgramData = (data) => {
    setProgramData(data);
  };

  return (
    <StreamContext.Provider
      value={{ streams, addStream, programData, updateProgramData }}
    >
      {children}
    </StreamContext.Provider>
  );
};
