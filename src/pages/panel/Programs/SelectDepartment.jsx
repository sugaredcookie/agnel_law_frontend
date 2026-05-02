import React, { useContext, useEffect, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import { NavLink } from "react-router-dom";
import { DepartmentContext } from "../../../DepartmentContext";
import { getAllDepartmentsViaAdmin } from "../../../utils/Api";

const SelectDepartment = () => {
  const { setDepartment } = useContext(DepartmentContext);

  const [allDepartments, setAllDepartments] = useState([]);
  useEffect(() => {
    fetchAllDepartments();
  }, []);

  const fetchAllDepartments = async () => {
    try {
      const response = await getAllDepartmentsViaAdmin();
      console.log(response.departments);
      setAllDepartments(response.departments);
    } catch (error) {}
  };

  const handleDepartmentChange = (e) => {
    setDepartment(e.target.value);
    console.log(e.target.value);
  };

  return (
    <PanelDashboardLayout>
      <div className="card col-lg-4 mx-auto">
        <div className="card-body px-5 py-5">
          <h3 className=" mb-5 alert alert-warning">Select Department</h3>
          <div className="form-group">
            <label htmlFor="exampleFormControlSelect1">Select Department</label>
            <select
              className="form-control"
              onChange={handleDepartmentChange}
              id="exampleFormControlSelect1"
            >
              <option value="">Select Department</option>
              {allDepartments.map((department) => (
                <option key={department._id} value={department.departmentName}>
                  {department.departmentName}
                </option>
              ))}
            </select>
          </div>
          <NavLink
            className="btn btn-primary mt-3"
            onClick={() => {
              localStorage.removeItem("programForm");
            }}
            to="/panel-admin/add-new-program-form"
          >
            Select
          </NavLink>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default SelectDepartment;
