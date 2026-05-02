import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CreateIcon from "@mui/icons-material/Create";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { getAdmissionLeadsForAdmin } from "../../../utils/Api";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import PanelDashboardLayout from "../PanelDashboardLayout";

const AdmissionsLists = () => {
  const [allForms, setAllForms] = useState([]);
  useEffect(() => {
    fetchAllForms();
  }, []);

  function formatDateTime(isoString) {
    const date = new Date(isoString);

    // Extracting individual components
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    // Converting to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = String(hours).padStart(2, "0");

    return `${month}-${day}-${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
  }

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

  const fetchAllForms = async () => {
    try {
      const response = await getAdmissionLeadsForAdmin();
      console.log(response);
      setAllForms(response.leads);
    } catch (error) {}
  };

  const columns = [
    {
      name: "SL. No",
      selector: (row, index) => ++index,
      width: "80px",
    },
    {
      name: "Reffral By",
      selector: (row) => row?.link?.agentName,
    },
    {
      name: "Langinge Page",
      selector: (row) => row?.link?.landingPage,
    },
    {
      name: "Student Name",
      selector: (row) => row?.stuName,
      sortable: true,
    },
    {
      name: "Student Phone",
      selector: (row) => row?.stuPhone,
      sortable: true,
    },
    {
      name: "Student Email",
      selector: (row) => row?.stuEmail,
      sortable: true,
    },
    {
      name: "Compitative Exam",
      selector: (row) => row?.compExam,
      sortable: true,
    },
    {
      name: "Compititative Score",
      selector: (row) => row?.compScore,
      sortable: true,
    },
    {
      name: "Created At",
      selector: (row) => formatDateTime(row?.createdAt),
      sortable: true,
    },
    // {
    //   name: "Actions",
    //   cell: (row) => (
    //     <div style={{ display: "flex", gap: "10px" }}>
    //       <NavLink
    //         className="text-info"
    //         title="View"
    //         to={`/landing-page-${row?.landingPage}?ref=${row?.uniqueId}&rewrite=${row._id}`}
    //       >
    //         <VisibilityIcon />
    //       </NavLink>
    //       <NavLink
    //         className="text-warning"
    //         title="Edit"
    //         to={`/panel-admin/edit-link-form/${row._id}`}
    //       >
    //         <CreateIcon />
    //       </NavLink>
    //       <button
    //         className="text-danger bg-none outline-none border-none"
    //         title="Delete"
    //         onClick={(e) => deleteLink(e,row._id)}
    //       >
    //         <DeleteForeverIcon />
    //       </button>
    //     </div>
    //   ),
    // },
  ];

  //   const deleteLink = async (e,id) => {
  //     e.preventDefault();

  //     if (window.confirm("Are you sure you want to delete this link?")) {
  //       try {
  //         const response = await deleteLinkViaAdmin({id});
  //         console.log(response);
  //         toast.success('Link Deleted...')
  //         fetchAllForms();
  //       } catch (error) {
  //         console.log('Error ' , error)
  //         toast.warning('Some Error happens Link not Deleted...')
  //       }
  //     }
  //     console.log("kyuu " , id);
  //   };

  return (
    <div>
      <PanelDashboardLayout>
        <div>
          {/* <button className="btn btn-success my-3 create-new-button d-flex align-items-center justify-content-end">
          <NavLink
            to="/panel-admin/add-new-link-form"
            className='text-white'
          >
            + Generate New Link
          </NavLink>
        </button> */}

          <div className="col-lg-12 grid-margin stretch-card">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Admission Enquiry</h4>
                <p className="card-description">All Lead Captures</p>
                <div className="table-responsive">
                  <DataTable
                    columns={columns}
                    data={allForms}
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
      </PanelDashboardLayout>
    </div>
  );
};

export default AdmissionsLists;
