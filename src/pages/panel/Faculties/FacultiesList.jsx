import React, { useEffect, useState } from "react";
import CreateIcon from "@mui/icons-material/Create";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { NavLink } from "react-router-dom";
import {
  deleteFacultyViaAdmin,
  getAllFacultiesViaAdmin,
  mailFacultyLoginDetailsViaAdmin,
  downloadFacultiesExcelViaAdmin,
} from "../../../utils/Api";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import ExcelUploader from "../../../components/ExcelUploader";

const FacultiesList = () => {
  const [allFaculties, setAllFaculties] = useState([]);

  useEffect(() => {
    fetchAllFaculties();
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

  const generateMail = async (id) => {
    console.log("id", id);
    const response = await mailFacultyLoginDetailsViaAdmin(id);
    toast.success("Email Sent...");
    console.log(response);
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await downloadFacultiesExcelViaAdmin();
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "faculties_data.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Error downloading Excel");
    }
  };

  const columns = [
    {
      name: "SL. No",
      selector: (row, index) => ++index,
      width: "80px",
    },
    {
      name: "Faculty Name",
      selector: (row) => row?.facultyName,
      sortable: true,
      width: "200px",
    },
    {
      name: "Department",
      selector: (row) => row?.department,
      sortable: true,
      width: "200px",
    },
    {
      name: "Email",
      selector: (row) => row?.email,
      sortable: true,
      width: "200px",
    },
    {
      name: "Phone",
      selector: (row) => row?.phone,
      sortable: true,
      width: "150px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center align-middle gap-3">
          <NavLink
            className="text-warning"
            title="Edit"
            to={`/panel-admin/edit-faculty-form/${row._id}`}
          >
            <CreateIcon />
          </NavLink>
          <div>
            <button
              className="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-3 py-0.5 me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
              title="Increment Term"
              onClick={() => {
                generateMail(row._id);
              }}
            >
              Generate email
            </button>
          </div>
          <button
            className="text-danger bg-none outline-none border-none"
            title="Delete"
            onClick={(e) => deleteFaculty(e, row._id)}
          >
            <DeleteForeverIcon />
          </button>
        </div>
      ),
    },
  ];

  const deleteFaculty = async (e, id) => {
    e.preventDefault();

    if (window.confirm("Are you sure you want to delete this batch?")) {
      try {
        const response = await deleteFacultyViaAdmin({ id });
        console.log(`response:${response}`);
        toast.success("Faculty Deleted...");
        fetchAllFaculties();
      } catch (error) {
        console.log("Error ", error);
        toast.warning("Some Error happens Faculty not Deleted...");
      }
    }
    console.log("kyuu ", id);
  };

  const fetchAllFaculties = async () => {
    try {
      const response = await getAllFacultiesViaAdmin();
      setAllFaculties(response.faculties);
    } catch (error) {}
  };
  return (
    <>
      <div>
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h4 className="card-title">Faculties</h4>
                <div className="flex gap-4">
                  <ExcelUploader
                    onUploadSuccess={fetchAllFaculties}
                    uploadType="faculty"
                  />
                  <button
                    onClick={handleDownloadExcel}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Download Excel
                  </button>
                </div>
              </div>
              <p className="card-description">
                All Faculties are listed here...
              </p>
              <div className="table-responsive">
                <DataTable
                  columns={columns}
                  data={allFaculties}
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
    </>
  );
};

export default FacultiesList;
