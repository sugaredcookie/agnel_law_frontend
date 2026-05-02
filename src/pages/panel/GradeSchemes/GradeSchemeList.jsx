import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import {
  deleteGradeSchemeViaAdmin,
  getAllGradeSchemesViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const GradeSchemeList = () => {
  const navigate = useNavigate();

  const [gradeSchemes, setGradeSchemes] = useState([]);
  const [visibleSchemeId, setVisibleSchemeId] = useState(null);

  useEffect(() => {
    fetchAllGradeSchemes();
  }, []);

  const fetchAllGradeSchemes = async () => {
    try {
      const response = await getAllGradeSchemesViaAdmin();
      setGradeSchemes(response.gradeSchemes);
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = (scheme) => {
    navigate(`/panel-admin/edit-grades/${scheme._id}`, { state: scheme });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        const response = await deleteGradeSchemeViaAdmin(id);
        toast.success("Subject Deleted...");
        fetchAllGradeSchemes();
      } catch (error) {
        console.log("Error ", error);
        toast.warning("Some Error happens GradeScheme not Deleted...");
      }
    }
  };

  const toggleVisibility = (id) => {
    setVisibleSchemeId(visibleSchemeId === id ? null : id);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Grade Scheme List</h1>
      <div className="flex flex-wrap wrap gap-6">
        {gradeSchemes.map((scheme) => (
          <div className="outline" key={scheme._id}>
            <div className="flex gap-10">
              <div className="pl-2">
                <div className="text-base font-medium">
                  {scheme.program}
                  <span className="m-0 text-sm font-normal">
                    {" "}
                    - {scheme.subject}
                  </span>
                </div>
                <div className="text-sm">
                  {scheme.grades.length} grades assigned
                </div>
              </div>
              <div className="flex gap-3 pr-2">
                <button
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => handleEdit(scheme)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => handleDelete(scheme._id)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => toggleVisibility(scheme._id)}
                >
                  <FontAwesomeIcon
                    icon={
                      visibleSchemeId === scheme._id
                        ? faChevronUp
                        : faChevronDown
                    }
                  />
                </button>
              </div>
            </div>
            {visibleSchemeId === scheme._id && (
              <div className="m-2">
                <table className="table-auto w-full">
                  <thead>
                    <tr>
                      <th className="border px-4 py-2">Grade</th>
                      <th className="border px-4 py-2">Range</th>
                      <th className="border px-4 py-2">Grade Point</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheme.grades.map((grade) => (
                      <tr key={grade.grade}>
                        <td className="border px-4 py-2">{grade.grade}</td>
                        <td className="border px-4 py-2">
                          {grade.rangeFrom} - {grade.rangeTo}
                        </td>
                        <td className="border px-4 py-2">{grade.gradePoint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradeSchemeList;
