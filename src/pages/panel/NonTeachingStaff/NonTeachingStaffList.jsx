import React, { useEffect, useState } from "react";
import CreateIcon from "@mui/icons-material/Create";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { NavLink } from "react-router-dom";
import {
  deleteNonTeachingStaffViaAdmin,
  getAllNonTeachingStaffViaAdmin,
  mailNonTeachingStaffLoginDetailsViaAdmin,
  downloadNonTeachingStaffExcelViaAdmin,
} from "../../../utils/Api";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import ExcelUploader from "../../../components/ExcelUploader";

const NonTeachingStaffList = () => {
  const [allStaff, setAllStaff] = useState([]);

  useEffect(() => {
    fetchAllStaff();
  }, []);

  const tableCustomStyles = {
    headRow: {
      style: {
        color: "#fff",
        backgroundColor: "#0F1015",
      },
    },
    headCells: {
      style: {
        fontSize: '14px',
        fontWeight: '600',
      },
    },
    cells: {
      style: {
        fontSize: '13px',
      },
    },
    striped: {
      default: "black",
    },
  };

  const generateMail = async (id) => {
    console.log("id", id);
    const response = await mailNonTeachingStaffLoginDetailsViaAdmin(id);
    toast.success("Login details sent to email...");
    console.log(response);
  };

  const handleDownloadExcel = async () => {
    try {
      const blob = await downloadNonTeachingStaffExcelViaAdmin();
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "non_teaching_staff_data.xlsx");
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
      width: "70px",
    },
    {
      name: "Name",
      selector: (row) => row?.name,
      sortable: true,
      width: "180px",
    },
    {
      name: "Designation",
      selector: (row) => row?.designation,
      sortable: true,
      width: "180px",
    },
    {
      name: "Email",
      selector: (row) => row?.email,
      sortable: true,
      width: "220px",
    },
    {
      name: "Salary",
      selector: (row) => `₹${row?.salary?.toLocaleString()}`,
      sortable: true,
      width: "120px",
    },
    {
      name: "Salary Date",
      selector: (row) => row?.salaryDisbursementDate,
      sortable: true,
      width: "100px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          flexWrap: 'nowrap',
          minWidth: '180px'
        }}>
          <NavLink
            to={`/panel-admin/edit-non-teaching-staff-form/${row._id}`}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffc107',
              textDecoration: 'none'
            }}
            title="Edit"
          >
            <CreateIcon fontSize="small" />
          </NavLink>
          
          <button
            onClick={() => generateMail(row._id)}
            style={{
              backgroundColor: '#15803d',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '4px 12px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1.5',
              minWidth: '95px'
            }}
            title="Send Login Details"
          >
            Send Email
          </button>
          
          <button
            onClick={(e) => deleteStaff(e, row._id)}
            style={{
              backgroundColor: 'transparent',
              color: '#dc2626',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Delete"
          >
            <DeleteForeverIcon fontSize="small" />
          </button>
        </div>
      ),
      width: "200px",
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
      },
    },
  ];

  const deleteStaff = async (e, id) => {
    e.preventDefault();

    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        const response = await deleteNonTeachingStaffViaAdmin({ id });
        console.log(`response:${response}`);
        toast.success("Staff member deleted successfully...");
        fetchAllStaff();
      } catch (error) {
        console.log("Error ", error);
        toast.warning("Some error occurred. Staff member not deleted...");
      }
    }
  };

  const fetchAllStaff = async () => {
    try {
      const response = await getAllNonTeachingStaffViaAdmin();
      setAllStaff(response.staff || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Error fetching staff data");
    }
  };

  return (
    <div>
      <div className="col-lg-12 grid-margin stretch-card">
        <div className="card">
          <div className="card-body">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h4 className="card-title" style={{ margin: 0 }}>Non-Teaching Staff</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <ExcelUploader
                  onUploadSuccess={fetchAllStaff}
                  uploadType="non-teaching-staff"
                />
                <button
                  onClick={handleDownloadExcel}
                  style={{
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#16a34a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#22c55e'}
                >
                  Download Excel
                </button>
              </div>
            </div>
            
            <p className="card-description">
              All non-teaching staff members are listed here...
            </p>
            
            <div className="table-responsive" style={{ marginTop: '1rem' }}>
              <DataTable
                columns={columns}
                data={allStaff}
                pagination={true}
                customStyles={tableCustomStyles}
                striped={true}
                highlightOnHover={true}
                pointerOnHover={true}
                responsive={true}
                noDataComponent={
                  <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                    No staff members found
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonTeachingStaffList;