import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  createBatchGroupViaAdmin,
  updateBatchGroupViaAdmin,
  getBatchGroupByIdViaAdmin,
  getAllBatchesViaAdmin,
  getAllProgramsViaAdmin,
  getAllDepartmentsViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";
import Multiselect from "multiselect-react-dropdown";

const BatchGroupForm = () => {
  const [batchGroupData, setBatchGroupData] = useState({});
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams();

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm();

  useEffect(() => {
    fetchBatches();
    fetchPrograms();
    fetchDepartments();
    if (id) {
      fetchOldData();
    }
  }, []);

  useEffect(() => {
    if (id && batchGroupData.batches && batches.length > 0) {
      const selected = batchGroupData.batches
        .map((batch) => {
          if (typeof batch === "object" && batch._id) {
            return batches.find((b) => b._id === batch._id);
          }
          return batches.find((b) => b._id === batch);
        })
        .filter(Boolean);
      setSelectedBatches(selected);
    }
  }, [batchGroupData, batches]);

  const fetchBatches = async () => {
    try {
      const response = await getAllBatchesViaAdmin();
      setBatches(response?.batches || []);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await getAllProgramsViaAdmin();
      setPrograms(response?.programs || []);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await getAllDepartmentsViaAdmin();
      setDepartments(response?.departments || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchOldData = async () => {
    try {
      const response = await getBatchGroupByIdViaAdmin(id);
      setBatchGroupData(response?.batchGroup || {});
      reset(response?.batchGroup || {});
    } catch (error) {
      console.error("Error fetching batch group:", error);
      toast.error("Error loading batch group data");
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        groupName: data.groupName,
        description: data.description,
        batches: selectedBatches.map((b) => b._id),
      };

      if (data.programId) {
        const selectedProgram = programs.find((p) => p._id === data.programId);
        payload.program = {
          id: data.programId,
          name: selectedProgram?.programName || selectedProgram?.name,
        };
      }

      if (data.departmentId) {
        const selectedDepartment = departments.find(
          (d) => d._id === data.departmentId
        );
        payload.department = {
          id: data.departmentId,
          name: selectedDepartment?.departmentName || selectedDepartment?.name,
        };
      }

      if (id) {
        await updateBatchGroupViaAdmin(id, payload);
        toast.success("Batch Group Updated!");
      } else {
        await createBatchGroupViaAdmin(payload);
        toast.success("Batch Group Created!");
      }
      navigate("/panel-admin/batch-groups");
    } catch (error) {
      toast.error(error?.response?.data?.error || "An error occurred");
    }
  };

  const handleBatchSelect = (selectedList) => {
    setSelectedBatches(selectedList);
  };

  const handleBatchRemove = (selectedList) => {
    setSelectedBatches(selectedList);
  };

  return (
    <PanelDashboardLayout>
      <div className="card col-lg-4 mx-auto">
        <div className="card-body px-5 py-5">
          <div className="mb-3">
            <h3 className="alert alert-warning">
              {id !== undefined ? "Update" : "Create"} Batch Group
            </h3>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label>Group Name</label>
              <input
                className="form-control p_input"
                type="text"
                placeholder="e.g., FY-LLA"
                {...register("groupName", { required: true })}
                aria-invalid={errors.groupName ? "true" : "false"}
              />
              {errors.groupName && (
                <p className="text-danger">Group name is required</p>
              )}
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control p_input"
                rows={3}
                placeholder="Optional description for this group"
                {...register("description")}
              />
            </div>

            <div className="form-group">
              <label>Program (Optional)</label>
              <select
                className="form-control p_input"
                {...register("programId")}
                defaultValue={batchGroupData?.program?.id || ""}
              >
                <option value="">Select Program</option>
                {programs.map((program) => (
                  <option key={program._id} value={program._id}>
                    {program.programName || program.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Department (Optional)</label>
              <select
                className="form-control p_input"
                {...register("departmentId")}
                defaultValue={batchGroupData?.department?.id || ""}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.departmentName || dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Batches</label>
              <Multiselect
                options={batches}
                selectedValues={selectedBatches}
                onSelect={handleBatchSelect}
                onRemove={handleBatchRemove}
                displayValue="batchName"
                placeholder="Select batches to include"
                showCheckbox={true}
                style={{
                  chips: {
                    background: "#28a745",
                  },
                  searchBox: {
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                  },
                }}
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="btn btn-success btn-block enter-btn"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Please wait..."
                  : id !== undefined
                  ? "Update"
                  : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default BatchGroupForm;
