import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { NavLink } from "react-router-dom";
import CreateIcon from "@mui/icons-material/Create";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import {
  deleteDepartmentViaAdmin,
  getAllDepartmentsViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const DepartmentsList = () => {
  const [allDepartments, setAllDepartments] = useState([]);
  useEffect(() => {
    fetchAllDepartments();
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
      width: "40px",
    },
    {
      name: "Department Name",
      selector: (row) => row?.departmentName,
      sortable: true,
      width: "180px",
    },

    {
      name: "Description",
      selector: (row) => (
        <div style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
          {row?.description}
        </div>
      ),
      sortable: true,
      width: "500px",
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
            to={`/panel-admin/edit-department-form/${row._id}`}
          >
            <CreateIcon />
          </NavLink>
          <button
            className="text-danger bg-none outline-none border-none"
            title="Delete"
            onClick={(e) => deleteDepartment(e, row._id)}
          >
            <DeleteForeverIcon />
          </button>
        </div>
      ),
    },
  ];

  const fetchAllDepartments = async () => {
    try {
      const response = await getAllDepartmentsViaAdmin();
      console.log(response.departments);
      setAllDepartments(response.departments);
    } catch (error) {}
  };

  const deleteDepartment = async (e, id) => {
    e.preventDefault();

    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        const response = await deleteDepartmentViaAdmin({ id });
        console.log(`response:${response}`);
        toast.success("Department Deleted...");
        fetchAllDepartments();
      } catch (error) {
        console.log("Error ", error);
        toast.warning("Some Error happens Department not Deleted...");
      }
    }
    console.log("kyuu ", id);
  };

  return (
    <div>
      <div className="col-lg-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <h4 className="card-title">Departments</h4>
            <p className="card-description">
              All departments are listed here...
            </p>
            <div className="table-responsive">
              <DataTable
                columns={columns}
                data={allDepartments}
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

export default DepartmentsList;
