import React, { useEffect, useState } from "react";
import CreateIcon from "@mui/icons-material/Create";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { NavLink } from "react-router-dom";
import {
  getAllBatchGroupsViaAdmin,
  deleteBatchGroupViaAdmin,
} from "../../../utils/Api";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";

const BatchGroupsList = () => {
  const [batchGroups, setBatchGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllBatchGroups();
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
      width: "60px",
    },
    {
      name: "Group Name",
      selector: (row) => row?.groupName,
      sortable: true,
      width: "180px",
    },
    {
      name: "Description",
      selector: (row) => (
        <div style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
          {row?.description || "-"}
        </div>
      ),
      sortable: true,
      width: "200px",
    },
    {
      name: "Batches",
      selector: (row) => (
        <div style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
          {row?.batches?.length > 0
            ? row.batches.map((b) => b.batchName).join(", ")
            : "No batches"}
        </div>
      ),
      width: "250px",
    },
    {
      name: "Program",
      selector: (row) => row?.program?.name || "-",
      sortable: true,
      width: "120px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex align-middle items-center gap-5">
          <NavLink
            className="text-info"
            title="View"
            to={`/panel-admin/batch-group/${row._id}`}
          >
            <VisibilityIcon />
          </NavLink>
          <NavLink
            className="text-warning"
            title="Edit"
            to={`/panel-admin/edit-batch-group/${row._id}`}
          >
            <CreateIcon />
          </NavLink>
          <button
            className="text-danger bg-none outline-none border-none"
            title="Delete"
            onClick={(e) => deleteBatchGroup(e, row._id)}
          >
            <DeleteForeverIcon />
          </button>
        </div>
      ),
    },
  ];

  const deleteBatchGroup = async (e, id) => {
    e.preventDefault();

    if (window.confirm("Are you sure you want to delete this batch group?")) {
      try {
        await deleteBatchGroupViaAdmin(id);
        toast.success("Batch Group Deleted...");
        fetchAllBatchGroups();
      } catch (error) {
        console.log("Error ", error);
        toast.warning("Error deleting batch group...");
      }
    }
  };

  const fetchAllBatchGroups = async () => {
    setLoading(true);
    try {
      const response = await getAllBatchGroupsViaAdmin();
      setBatchGroups(response?.batchGroups || []);
    } catch (error) {
      console.error("Error fetching batch groups:", error);
      toast.error("Error fetching batch groups");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Batch Groups</h4>
              <p className="card-description">
                All Batch Groups are listed here...
              </p>
              <div className="table-responsive">
                <DataTable
                  columns={columns}
                  data={batchGroups}
                  customStyles={tableCustomStyles}
                  pagination
                  progressPending={loading}
                  noDataComponent={
                    <div className="p-4">
                      No batch groups found. Create one to get started!
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BatchGroupsList;
