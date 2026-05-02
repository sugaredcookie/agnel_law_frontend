import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { NavLink } from "react-router-dom";
import { getAllProgramsViaAdmin } from "../../../utils/Api";

const SelectProgram = () => {
  const [allPrograms, setAllPrograms] = useState([]);
  // const [programData, setProgramData] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");

  useEffect(() => {
    fetchAllPrograms();
  }, []);
  const fetchAllPrograms = async () => {
    try {
      const response = await getAllProgramsViaAdmin();
      setAllPrograms(response.programs);
    } catch (error) {}
  };
  // const currentProgram = async (id) => {
  //   try {
  //     const response = await getSingleProgramViaAdmin({ id });
  //     // setProgramData(response.program.streams);
  //   } catch (error) {}
  // };

  const handleProgramChange = (event) => {
    const programId = event.target.value;
    setSelectedProgramId(programId);
    // currentProgram(programId);
  };
  return (
    <PanelDashboardLayout>
      <div className="card col-lg-4 mx-auto">
        <div className="card-body px-5 py-5">
          <h3 className=" mb-5 alert alert-warning">Select Program</h3>
          <div className="form-group">
            <label htmlFor="exampleFormControlSelect1">Select Program</label>
            <select
              className="form-control"
              id="programSelect"
              value={selectedProgramId}
              onChange={handleProgramChange}
            >
              <option value="" disabled>
                Select a program
              </option>
              {allPrograms.map((program) => (
                <option key={program._id} value={program._id}>
                  {program.programName}
                </option>
              ))}
            </select>
          </div>
          {/* Select stream */}
          {/* <div className="form-group">
            <label htmlFor="exampleFormControlSelect1">Select Stream</label>
            <select className="form-control" id="streamSelect">
              <option value="" disabled>
                Select a stream
              </option>
              {programData.map((stream) => {
                return (
                  <option value={stream._id} key={stream._id}>
                    {stream.streamName}
                  </option>
                );
              })}
            </select>
          </div> */}
          <NavLink
            className="btn btn-primary mt-3"
            to="/panel-admin/add-new-subject-form"
          >
            Select
          </NavLink>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default SelectProgram;
