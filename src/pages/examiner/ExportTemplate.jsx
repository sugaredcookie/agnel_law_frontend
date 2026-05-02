/**
 * Export Template page -- subject-aware template generator.
 * Fetches subjects from DB, allows adding custom ones, generates
 * an Excel template with "SubjectName (SubjectCode)" header format.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiDownload,
  FiPlus,
  FiX,
  FiSearch,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";
import ExaminerNavbar from "./ExaminerNavbar";
import ExaminerTopHeader from "./ExaminerTopHeader";
import {
  getAllSubjectsViaExaminer,
  downloadResultTemplateAPI,
} from "../../utils/Api";

// ─── Subject Search Dropdown with custom input fallback ──

const SubjectPicker = ({ subjects, onAdd, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = subjects.filter(
    (s) =>
      s.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
      s.subjectCode?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (subj) => {
    onAdd({
      name: subj.subjectName,
      code: subj.subjectCode,
      credit: subj.credits || 4,
      isElective: subj.isElective || false,
    });
    setSearch("");
    setOpen(false);
  };

  const handleCustomAdd = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, code: "", credit: 4, isElective: false });
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search subjects or type custom name..."
            disabled={disabled}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {open && search.trim() && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex items-center justify-between border-b border-gray-50 last:border-0"
              >
                <span>
                  <span className="font-medium">{s.subjectName}</span>
                  {s.subjectCode && (
                    <span className="text-gray-400 ml-1">({s.subjectCode})</span>
                  )}
                </span>
                {s.isElective && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Elective</span>
                )}
              </button>
            ))
          ) : null}
          {/* Custom add option */}
          <button
            type="button"
            onClick={handleCustomAdd}
            className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm text-green-700 flex items-center gap-2 border-t border-gray-100"
          >
            <FiPlus size={14} />
            Add custom: &quot;{search.trim()}&quot;
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──

const ExportTemplate = () => {
  const navigate = useNavigate();

  // All subjects from DB
  const [allSubjects, setAllSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Selected subjects for the template
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  // Template settings
  const [hasPractical, setHasPractical] = useState(true);
  const [maxI, setMaxI] = useState(25);
  const [maxE, setMaxE] = useState(75);
  const [minI, setMinI] = useState(10);
  const [minE, setMinE] = useState(30);
  const [pracMax, setPracMax] = useState(100);
  const [pracMin, setPracMin] = useState(40);
  const [downloading, setDownloading] = useState(false);

  // Fetch subjects from API
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await getAllSubjectsViaExaminer();
      setAllSubjects(res.subjects || []);
    } catch (err) {
      console.error("Failed to load subjects:", err);
      toast.error("Failed to load subjects.");
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Add subject to the selected list
  const handleAddSubject = (subj) => {
    // Prevent duplicates by name+code combo
    const exists = selectedSubjects.some(
      (s) => s.name === subj.name && s.code === subj.code,
    );
    if (exists) return toast.warn("Subject already added.");
    setSelectedSubjects((prev) => [...prev, subj]);
  };

  // Remove subject from selected list
  const handleRemoveSubject = (idx) => {
    setSelectedSubjects((prev) => prev.filter((_, i) => i !== idx));
  };

  // Move subject up/down in list
  const moveSubject = (idx, dir) => {
    setSelectedSubjects((prev) => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  // Update subject fields inline
  const updateSubject = (idx, field, value) => {
    setSelectedSubjects((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
  };

  // Download template
  const handleDownload = async () => {
    if (selectedSubjects.length === 0) {
      return toast.warn("Add at least one subject.");
    }

    setDownloading(true);
    try {
      const payload = {
        subjects: selectedSubjects.map((s) => ({
          name: s.name,
          code: s.code,
          credit: Number(s.credit) || 4,
          isElective: s.isElective,
        })),
        practical: hasPractical ? 1 : 0,
        maxI,
        maxE,
        maxT: maxI + maxE,
        minI,
        minE,
        minT: minI + minE,
        pracMax,
        pracMin,
      };

      const blob = await downloadResultTemplateAPI(payload);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Result_Template_${selectedSubjects.length}subj.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded.");
    } catch (err) {
      toast.error("Failed to download template.");
    } finally {
      setDownloading(false);
    }
  };

  // Computed totals
  const maxT = maxI + maxE;
  const totalMax =
    selectedSubjects.length * maxT + (hasPractical ? pracMax : 0);
  const totalCols =
    4 + selectedSubjects.length * 3 + (hasPractical ? 1 : 0) + 6;

  return (
    <div className="min-h-screen bg-gray-100">
      <ExaminerNavbar />
      <ExaminerTopHeader />
      <div className="lg:ml-64 transition-all duration-300 flex flex-col">
        <div className="pt-20 min-h-screen text-black">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 max-w-5xl mx-auto mt-4">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => navigate("/examiner/result-cards")}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                title="Back"
              >
                <FiArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Export Template</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Configure subjects and marks settings, then download the Excel template for data entry.
                </p>
              </div>
            </div>

            {/* Subject Picker */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                Add Subjects
              </h2>
              <p className="text-xs text-gray-500 mb-2">
                Search from existing subjects or type a custom name. Subject will appear in Excel as &quot;Name (Code)&quot;.
              </p>
              <SubjectPicker
                subjects={allSubjects}
                onAdd={handleAddSubject}
                disabled={loadingSubjects}
              />
            </div>

            {/* Selected Subjects List */}
            {selectedSubjects.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">
                  Selected Subjects ({selectedSubjects.length})
                </h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_120px_80px_80px_100px] gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                    <span>Subject Name</span>
                    <span>Code</span>
                    <span>Credit</span>
                    <span>Elective</span>
                    <span className="text-right">Actions</span>
                  </div>
                  {selectedSubjects.map((subj, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-[1fr_120px_80px_80px_100px] gap-2 px-3 py-2 items-center border-b border-gray-100 last:border-0 ${
                        subj.isElective ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <input
                        type="text"
                        value={subj.name}
                        onChange={(e) => updateSubject(idx, "name", e.target.value)}
                        className="text-sm px-2 py-1 border border-gray-200 rounded bg-white w-full"
                      />
                      <input
                        type="text"
                        value={subj.code}
                        onChange={(e) => updateSubject(idx, "code", e.target.value)}
                        placeholder="Code"
                        className="text-sm px-2 py-1 border border-gray-200 rounded bg-white w-full"
                      />
                      <input
                        type="number"
                        min={1}
                        value={subj.credit}
                        onChange={(e) => updateSubject(idx, "credit", Number(e.target.value) || 4)}
                        className="text-sm px-2 py-1 border border-gray-200 rounded bg-white w-full text-center"
                      />
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subj.isElective}
                          onChange={() => updateSubject(idx, "isElective", !subj.isElective)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => moveSubject(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                          title="Move up"
                        >
                          <FiChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSubject(idx, 1)}
                          disabled={idx === selectedSubjects.length - 1}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                          title="Move down"
                        >
                          <FiChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(idx)}
                          className="p-1 rounded hover:bg-red-50 text-red-500"
                          title="Remove"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Marks Configuration */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Marks Configuration
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Practical</label>
                  <select
                    value={hasPractical ? 1 : 0}
                    onChange={(e) => setHasPractical(Number(e.target.value) === 1)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                  >
                    <option value={1}>Yes</option>
                    <option value={0}>No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Internal</label>
                  <input
                    type="number"
                    min={1}
                    value={maxI}
                    onChange={(e) => setMaxI(Number(e.target.value) || 25)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max External</label>
                  <input
                    type="number"
                    min={1}
                    value={maxE}
                    onChange={(e) => setMaxE(Number(e.target.value) || 75)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Internal</label>
                  <input
                    type="number"
                    min={0}
                    value={minI}
                    onChange={(e) => setMinI(Number(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min External</label>
                  <input
                    type="number"
                    min={0}
                    value={minE}
                    onChange={(e) => setMinE(Number(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                  />
                </div>
                {hasPractical && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Prac Max</label>
                      <input
                        type="number"
                        min={1}
                        value={pracMax}
                        onChange={(e) => setPracMax(Number(e.target.value) || 100)}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Prac Min</label>
                      <input
                        type="number"
                        min={0}
                        value={pracMin}
                        onChange={(e) => setPracMin(Number(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Summary & Download */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {selectedSubjects.length > 0 ? (
                  <>
                    <span className="font-medium text-gray-700">{selectedSubjects.length}</span> subject{selectedSubjects.length !== 1 ? "s" : ""}
                    {" | "}Total Max: <span className="font-medium text-gray-700">{totalMax}</span> marks
                    {" | "}{totalCols} columns
                  </>
                ) : (
                  "Add subjects above to generate a template."
                )}
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading || selectedSubjects.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                <FiDownload size={16} />
                {downloading ? "Generating..." : "Download Template"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportTemplate;
