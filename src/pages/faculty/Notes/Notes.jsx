import React, { useState, useEffect, useMemo } from "react";
import FacultyDashboardLayout from "../FacultyDashboardLayout";
import {
  getFacultyNotes,
  deleteNote,
  uploadNote,
  getFacultyDetails,
  getFacultySubjectsByBatch,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modalSubjects, setModalSubjects] = useState([]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [newNote, setNewNote] = useState({
    title: "",
    description: "",
    selectedBatchIds: [],
    subjectId: "",
    file: null,
  });

  useEffect(() => {
    fetchNotes();
    fetchBatchesAndSubjects();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await getFacultyNotes();
      setNotes(res.notes);
    } catch (error) {
      toast.error("Failed to fetch notes");
    }
  };

  const fetchBatchesAndSubjects = async () => {
    try {
      const res = await getFacultyDetails();
      setBatches([...(res.batches || [])].sort((a, b) => a.batchName.localeCompare(b.batchName)));
      setSubjects(res.subjects);
    } catch (error) {
      toast.error("Failed to fetch batches or subjects");
    }
  };

  const handleBatchToggleInModal = async (batchId) => {
    const current = newNote.selectedBatchIds;
    const updated = current.includes(batchId)
      ? current.filter((id) => id !== batchId)
      : [...current, batchId];

    setNewNote({ ...newNote, selectedBatchIds: updated, subjectId: "" });
    setModalSubjects([]);

    if (updated.length > 0) {
      try {
        // Load subjects for first selected batch (all sibling batches share the same subjects)
        const res = await getFacultySubjectsByBatch(updated[0]);
        setModalSubjects(res.subjects);
      } catch (error) {
        toast.error("Failed to fetch subjects for this batch");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote(id);
      fetchNotes();
      toast.success("Note deleted successfully");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewNote({ ...newNote, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB");
      e.target.value = null;
      return;
    }
    setNewNote({ ...newNote, file });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const selectedBatches = batches.filter((b) => newNote.selectedBatchIds.includes(b._id));
    const selectedSubject = modalSubjects.find((s) => s._id === newNote.subjectId);

    if (selectedBatches.length === 0 || !selectedSubject) {
      toast.error("Please select at least one batch and a subject");
      return;
    }

    formData.append("title", newNote.title);
    formData.append("description", newNote.description);
    formData.append(
      "batches",
      JSON.stringify(selectedBatches.map((b) => ({ id: b._id, name: b.batchName }))),
    );
    formData.append("subject[id]", newNote.subjectId);
    formData.append("subject[name]", selectedSubject.subjectName);
    formData.append("file", newNote.file);

    try {
      await uploadNote(formData);
      fetchNotes();
      setShowModal(false);
      setNewNote({
        title: "",
        description: "",
        selectedBatchIds: [],
        subjectId: "",
        file: null,
      });
      setModalSubjects([]);
      toast.success(
        selectedBatches.length > 1
          ? `Note uploaded to ${selectedBatches.length} batches`
          : "Note uploaded successfully",
      );
    } catch (error) {
      toast.error("Failed to upload note");
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName?.split(".").pop().toLowerCase() || "";
    const icons = {
      pdf: { icon: "mdi-file-pdf-box", color: "text-red-500", bg: "bg-red-50" },
      doc: { icon: "mdi-file-word-box", color: "text-blue-600", bg: "bg-blue-50" },
      docx: { icon: "mdi-file-word-box", color: "text-blue-600", bg: "bg-blue-50" },
      ppt: { icon: "mdi-file-powerpoint-box", color: "text-orange-500", bg: "bg-orange-50" },
      pptx: { icon: "mdi-file-powerpoint-box", color: "text-orange-500", bg: "bg-orange-50" },
      xls: { icon: "mdi-file-excel-box", color: "text-green-600", bg: "bg-green-50" },
      xlsx: { icon: "mdi-file-excel-box", color: "text-green-600", bg: "bg-green-50" },
      jpg: { icon: "mdi-file-image", color: "text-purple-500", bg: "bg-purple-50" },
      jpeg: { icon: "mdi-file-image", color: "text-purple-500", bg: "bg-purple-50" },
      png: { icon: "mdi-file-image", color: "text-purple-500", bg: "bg-purple-50" },
      mp4: { icon: "mdi-file-video", color: "text-pink-500", bg: "bg-pink-50" },
      mp3: { icon: "mdi-file-music", color: "text-indigo-500", bg: "bg-indigo-50" },
    };
    return icons[extension] || { icon: "mdi-file-document", color: "text-gray-500", bg: "bg-gray-100" };
  };

  const filteredAndSortedNotes = useMemo(() => {
    let filtered = [...notes];

    // Filter by subject
    if (selectedSubjectFilter !== "all") {
      filtered = filtered.filter((note) => note.subject?.name === selectedSubjectFilter);
    }

    // Filter by batch
    if (selectedBatchFilter !== "all") {
      filtered = filtered.filter((note) => note.batch?.name === selectedBatchFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title?.toLowerCase().includes(query) ||
          note.description?.toLowerCase().includes(query) ||
          note.subject?.name?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });

    return filtered;
  }, [notes, selectedSubjectFilter, selectedBatchFilter, searchQuery, sortBy]);

  // Get unique batches from notes for filter
  const uniqueBatches = useMemo(() => {
    const batchSet = new Set(notes.map((n) => n.batch?.name).filter(Boolean));
    return Array.from(batchSet);
  }, [notes]);

  return (
    <FacultyDashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredAndSortedNotes.length} note{filteredAndSortedNotes.length !== 1 ? "s" : ""} 
                  {selectedSubjectFilter !== "all" || selectedBatchFilter !== "all" ? " (filtered)" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Note
              </button>
            </div>

            {/* Filters */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Subject Filter */}
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject.subjectName}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>

              {/* Batch Filter */}
              <select
                value={selectedBatchFilter}
                onChange={(e) => setSelectedBatchFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Batches</option>
                {uniqueBatches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">By Title</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {filteredAndSortedNotes.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {filteredAndSortedNotes.map((note) => {
                  const fileStyle = getFileIcon(note.fileName);
                  return (
                    <div
                      key={note._id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                    >
                      {/* File Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 ${fileStyle.bg} rounded-lg flex items-center justify-center`}>
                        <i className={`mdi ${fileStyle.icon} text-2xl ${fileStyle.color}`}></i>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{note.title}</h3>
                            {note.description && (
                              <p className="text-sm text-gray-500 truncate mt-0.5">{note.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                            {note.subject?.name || "No Subject"}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                            {note.batch?.name || "No Batch"}
                          </span>
                          <span className="hidden sm:inline">
                            {new Date(note.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={note.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>
                        <a
                          href={note.fileUrl}
                          download
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                        <button
                          onClick={() => handleDelete(note._id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Mobile Actions (always visible) */}
                      <div className="flex sm:hidden items-center gap-1">
                        <a
                          href={note.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No notes found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedSubjectFilter !== "all" || selectedBatchFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Upload your first note to get started"}
              </p>
              {!searchQuery && selectedSubjectFilter === "all" && selectedBatchFilter === "all" && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Upload Note
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Upload New Note</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNewNote({ title: "", description: "", selectedBatchIds: [], subjectId: "", file: null });
                    setModalSubjects([]);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={newNote.title}
                  onChange={handleInputChange}
                  placeholder="Enter note title"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newNote.description}
                  onChange={handleInputChange}
                  placeholder="Add a brief description (optional)"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Batch(es) <span className="text-red-500">*</span>
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                    {batches.map((batch) => (
                      <label
                        key={batch._id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                          newNote.selectedBatchIds.includes(batch._id)
                            ? "bg-blue-50 text-blue-700"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={newNote.selectedBatchIds.includes(batch._id)}
                          onChange={() => handleBatchToggleInModal(batch._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{batch.batchName}</span>
                      </label>
                    ))}
                  </div>
                  {newNote.selectedBatchIds.length > 1 && (
                    <p className="text-xs text-blue-600 mt-1">
                      Uploading to {newNote.selectedBatchIds.length} batches
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subjectId"
                    value={newNote.subjectId}
                    onChange={handleInputChange}
                    disabled={newNote.selectedBatchIds.length === 0}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    required
                  >
                    <option value="">{newNote.selectedBatchIds.length > 0 ? "Select Subject" : "Select batch first"}</option>
                    {modalSubjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.subjectName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  File <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.ppt,.pptx,.odp,.xls,.xlsx,.ods,.csv,.jpeg,.jpg,.png,.gif,.webp,.svg,.bmp,.zip,.rar,.7z,.mp4,.mp3,.wav,.avi,.mkv,.mov"
                    className="hidden"
                    id="file-upload"
                    required
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {newNote.file ? (
                      <p className="text-sm font-medium text-blue-600">{newNote.file.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, Word, PowerPoint, Excel, Images (Max 10MB)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewNote({ title: "", description: "", selectedBatchIds: [], subjectId: "", file: null });
                    setModalSubjects([]);
                  }}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FacultyDashboardLayout>
  );
};

export default Notes;
