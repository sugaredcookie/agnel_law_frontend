import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { NavLink } from "react-router-dom";
import CreateIcon from "@mui/icons-material/Create";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import {
  deleteProgramViaAdmin,
  getAllProgramsViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const ProgramsList = () => {
  const [allPrograms, setAllPrograms] = useState([]);
  useEffect(() => {
    fetchAllPrograms();
  }, []);
  const tableCustomStyles = {
    headRow: {
      style: {
        color: "#fff",
        backgroundColor: "#0F1015",
      },
    },
    striped: {
      default: "black",
    },
  };
  const columns = [
    {
      name: "SL. No",
      selector: (row, index) => ++index,
      width: "80px",
    },
    {
      name: "Degree Name",
      selector: (row) => row?.programName,
      sortable: true,
      width: "160px",
    },
    {
      name: "Description",
      selector: (row) => row?.description,
      sortable: true,
      width: "300px",
    },
    {
      name: "Application Fee",
      selector: (row) => `₹${row?.applicationFee}`,
      sortable: true,
      width: "150px",
    },
    {
      name: "Development Fee",
      selector: (row) => `₹${row?.developmentFee || 0}`,
      sortable: true,
      width: "150px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div style={{ display: "flex", gap: "10px" }}>
          {/* <NavLink
            className="text-info"
            title="View"
            to={`/landing-page-${row?.landingPage}?ref=${row?.uniqueId}&rewrite=${row._id}`}
          >
            <VisibilityIcon />
          </NavLink> */}
          <NavLink
            className="text-warning"
            title="Edit"
            to={`/panel-admin/edit-program-form/${row._id}`}
          >
            <CreateIcon />
          </NavLink>
          <button
            className="text-danger bg-none outline-none border-none"
            title="Delete"
            onClick={(e) => deleteProgram(e, row._id)}
          >
            <DeleteForeverIcon />
          </button>
        </div>
      ),
    },
  ];

  const fetchAllPrograms = async () => {
    try {
      const response = await getAllProgramsViaAdmin();
      console.log(response.programs);
      setAllPrograms(response.programs);
    } catch (error) {}
  };

  const deleteProgram = async (e, id) => {
    e.preventDefault();

    if (window.confirm("Are you sure you want to delete this program?")) {
      try {
        const response = await deleteProgramViaAdmin({ id });
        console.log(`response:${response}`);
        toast.success("Program Deleted...");
        fetchAllPrograms();
      } catch (error) {
        console.log("Error ", error);
        toast.warning("Some Error happens Program not Deleted...");
      }
    }
    console.log("kyuu ", id);
  };

  return (
    <div>
      <div className="col-lg-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Programs</h4>
            <p className="card-description">All programs are listed here...</p>
            <div className="table-responsive">
              <DataTable
                columns={columns}
                data={allPrograms}
                pagination={true}
                // highlightOnHover
                // striped
                customStyles={tableCustomStyles}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramsList;
