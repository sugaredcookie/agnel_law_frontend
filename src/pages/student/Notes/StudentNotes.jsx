import React, { useState, useEffect, useMemo } from "react";
import StudentDashboardLayout from "../StudentDashboardLayout";
import { getStudentNotes } from "../../../utils/Api";
import { toast } from "react-toastify";

const StudentNotes = () => {
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    fetchNotesData();
  }, []);

  const fetchNotesData = async () => {
    setLoading(true);
    try {
      const res = await getStudentNotes();
      setSubjects(res.subjects);
      setNotes(res.notes);
      if (res.subjects.length > 0) {
        setSelectedSubject(res.subjects[0].subjectName);
      }
    } catch (error) {
      toast.error("Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return "mdi-file-pdf-box";
      case "doc":
      case "docx":
        return "mdi-file-word-box";
      case "ppt":
      case "pptx":
        return "mdi-file-powerpoint-box";
      case "xls":
      case "xlsx":
        return "mdi-file-excel-box";
      default:
        return "mdi-file";
    }
  };

  const sortedNotes = useMemo(() => {
    const notesForSelectedSubject = notes[selectedSubject] || [];
    return [...notesForSelectedSubject].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [notes, selectedSubject, sortOrder]);

  return (
    <StudentDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">My Notes</h1>
          <div className="flex items-center space-x-4">
            <select
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjects.map((subject) => (
                <option key={subject._id} value={subject.subjectName}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Sort by Newest</option>
              <option value="oldest">Sort by Oldest</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading notes...</p>
        ) : sortedNotes.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg">
            <ul className="divide-y divide-gray-200">
              {sortedNotes.map((note) => (
                <li
                  key={note._id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <i
                      className={`mdi ${getFileIcon(note.fileName)} text-3xl text-blue-500 mr-4`}
                    ></i>
                    <div>
                      <h3 className="text-md font-semibold text-gray-800">
                        {note.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {note.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-400">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="text-blue-500 hover:text-blue-700"
                      title="Download Note"
                    >
                      <i className="mdi mdi-download text-2xl"></i>
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-16">
            <i className="mdi mdi-note-off-outline text-6xl text-gray-300"></i>
            <p className="text-gray-500 mt-4">
              No notes available for this subject yet.
            </p>
          </div>
        )}
      </div>
    </StudentDashboardLayout>
  );
};

export default StudentNotes;
