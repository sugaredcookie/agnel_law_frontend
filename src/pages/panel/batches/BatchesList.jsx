import React, { useEffect, useState } from "react";
import CreateIcon from "@mui/icons-material/Create";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { NavLink } from "react-router-dom";
import {
  deleteBatchViaAdmin,
  demoteBatchById,
  getAllBatchesViaAdmin,
  promoteBatchById,
} from "../../../utils/Api";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";

const BatchesList = () => {
  const [allBatches, setAllBatches] = useState([]);

  useEffect(() => {
    fetchAllBatches();
  }, [0]);
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
      name: "Batch Name",
      selector: (row) => row?.batchName,
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
      width: "300px",
    },
    {
      name: "Term",
      selector: (row) => row?.term,
      sortable: true,
      width: "200px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex align-middle items-center gap-5">
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
            to={`/panel-admin/edit-batch-form/${row._id}`}
          >
            <CreateIcon />
          </NavLink>
          <button
            className="text-danger bg-none outline-none border-none"
            title="Delete"
            onClick={(e) => deleteBatch(e, row._id)}
          >
            <DeleteForeverIcon />
          </button>
          <button
            className="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-3 py-2 me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            title="Increment Term"
            onClick={() => {
              incrementTerm(row._id);
              promoteBatchById({ id: row._id });
            }}
          >
            Promote
          </button>
          <button
            className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-3 py-2 me-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
            title="Decrement Term"
            onClick={() => {
              decrementTerm(row._id);
              demoteBatchById({ id: row._id });
            }}
          >
            Demote
          </button>
        </div>
      ),
    },
  ];

  const deleteBatch = async (e, id) => {
    e.preventDefault();

    if (window.confirm("Are you sure you want to delete this batch?")) {
      try {
        const response = await deleteBatchViaAdmin({ id });
        console.log(`response:${response}`);
        toast.success("Batch Deleted...");
        fetchAllBatches();
      } catch (error) {
        console.log("Error ", error);
        toast.warning("Some Error happens Batch not Deleted...");
      }
    }
    console.log("kyuu ", id);
  };
  const incrementTerm = (id) => {
    setAllBatches(
      allBatches.map((batch) => {
        if (batch._id === id) {
          return { ...batch, term: batch.term + 1 };
        }
        return batch;
      }),
    );
  };
  const decrementTerm = (id) => {
    setAllBatches(
      allBatches.map((batch) => {
        if (batch._id === id) {
          return { ...batch, term: batch.term - 1 };
        }
        return batch;
      }),
    );
  };
  const fetchAllBatches = async () => {
    try {
      const response = await getAllBatchesViaAdmin();
      setAllBatches(response.batches);
    } catch (error) {}
  };
  return (
    <>
      <div>
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Batches</h4>
              <p className="card-description">All Batches are listed here...</p>
              <div className="table-responsive">
                <DataTable
                  columns={columns}
                  data={allBatches}
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

export default BatchesList;
