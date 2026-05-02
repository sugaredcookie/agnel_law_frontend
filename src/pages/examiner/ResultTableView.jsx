/**
 * Inline-editable table view for parsed results.
 * Shows: Seat | Name | Roll | GR | PRN | [I|E per subject] | Practical | Total | Remark | SGPA | Grade
 * Click a cell to edit, Tab/Enter to save, Escape to cancel.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2, FiSave, FiX, FiEdit2, FiEye, FiEyeOff, FiSearch } from "react-icons/fi";
import {
  getParsedResultsAPI,
  updateParsedResultAPI,
  addParsedResultAPI,
  deleteParsedResultAPI,
  lookupStudentByRollAPI,
} from "../../utils/Api";

const ResultTableView = ({ configId }) => {
  const [config, setConfig] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editing state: { resultId, field } where field = "subj-<code>-i" | "subj-<code>-e" | "prac-i" | "prac-e" | "prac-m"
  const [editCell, setEditCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  // Add student modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addRollNo, setAddRollNo] = useState("");
  const [addMarks, setAddMarks] = useState({});
  const [addPractical, setAddPractical] = useState({});
  const [addSaving, setAddSaving] = useState(false);
  const [rollLookup, setRollLookup] = useState(null); // { found, student } | null
  const [rollLooking, setRollLooking] = useState(false);
  const lookupTimer = useRef(null);

  // Edit student modal
  const [editTarget, setEditTarget] = useState(null);
  const [editMarks, setEditMarks] = useState({});
  const [editPractical, setEditPractical] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Column visibility -- GR, PRN, SGPA, Grade hidden by default
  const [hiddenCols, setHiddenCols] = useState(new Set(["gr", "prn", "sgpa", "grade"]));
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef(null);

  const toggleCol = (col) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  };

  useEffect(() => {
    if (!showColMenu) return;
    const handler = (e) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target)) setShowColMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColMenu]);

  const TOGGLEABLE_COLS = [
    { key: "gr", label: "GR" },
    { key: "prn", label: "PRN" },
    { key: "sgpa", label: "SGPA" },
    { key: "grade", label: "Grade" },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getParsedResultsAPI(configId);
      setConfig(res.config);
      setResults(res.results);
    } catch (error) {
      console.error("Failed to fetch parsed results:", error);
      toast.error("Failed to load table data");
    } finally {
      setLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    if (configId) fetchData();
  }, [configId, fetchData]);

  useEffect(() => {
    if (editCell && inputRef.current) inputRef.current.focus();
  }, [editCell]);

  const subjects = config?.subjects || [];
  const hasPractical = !!config?.practical;
  const practicalType = config?.practical?.type || "single";

  const isAB = (val) => typeof val === "string" && ["ab", "absent"].includes(val.trim().toLowerCase());

  // ── Cell editing helpers ─────────────────────────────────────────────────

  const startEdit = (resultId, field, currentValue) => {
    if (saving) return;
    setEditCell({ resultId, field });
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : "");
  };

  const cancelEdit = () => {
    setEditCell(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editCell || saving) return;
    setSaving(true);

    const { resultId, field } = editCell;
    const result = results.find((r) => r._id === resultId);
    if (!result) { setSaving(false); cancelEdit(); return; }

    // Parse the field to build the patch payload
    let payload = {};
    if (field.startsWith("subj-")) {
      const parts = field.split("-"); // subj-<code>-i or subj-<code>-e
      const code = Number(parts[1]);
      const ie = parts[2]; // "i" or "e"
      const subj = result.subjects.find((s) => Number(s.code) === code);
      if (!subj) { setSaving(false); cancelEdit(); return; }
      const abEntered = isAB(editValue);
      if (abEntered) {
        payload = {
          subjects: [{
            code,
            internal: ie === "i" ? 0 : subj.internal,
            external: ie === "e" ? 0 : extractOriginal(subj.external, subj.eDisplay),
            internalAbsent: ie === "i" ? true : !!subj.internalAbsent,
            externalAbsent: ie === "e" ? true : !!subj.externalAbsent,
          }],
        };
      } else {
        payload = {
          subjects: [{
            code,
            internal: ie === "i" ? (Number(editValue) || 0) : subj.internal,
            external: ie === "e" ? (Number(editValue) || 0) : extractOriginal(subj.external, subj.eDisplay),
            internalAbsent: ie === "i" ? false : !!subj.internalAbsent,
            externalAbsent: ie === "e" ? false : !!subj.externalAbsent,
          }],
        };
      }
    } else if (field.startsWith("prac-")) {
      const ie = field.split("-")[1]; // "i", "e", or "m"
      if (ie === "m") {
        payload = { practical: { marks: Number(editValue) || 0 } };
      } else {
        payload = {
          practical: {
            [ie === "i" ? "internal" : "external"]: Number(editValue) || 0,
          },
        };
      }
    }

    try {
      const res = await updateParsedResultAPI(configId, resultId, payload);
      // Replace the updated record in state
      setResults((prev) => prev.map((r) => r._id === resultId ? res.result : r));
      cancelEdit();
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") cancelEdit();
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      saveEdit();
    }
  };

  // ── Add student ──────────────────────────────────────────────────────────

  const openAddModal = () => {
    setAddRollNo("");
    setRollLookup(null);
    setRollLooking(false);
    const marks = {};
    for (const s of subjects) marks[s.code] = { internal: "", external: "", internalAbsent: false, externalAbsent: false };
    setAddMarks(marks);
    if (hasPractical) {
      if (practicalType === "split") setAddPractical({ internal: "", external: "" });
      else setAddPractical({ marks: "" });
    } else {
      setAddPractical({});
    }
    setShowAddModal(true);
  };

  const handleRollNoChange = (e) => {
    const val = e.target.value;
    setAddRollNo(val);
    setRollLookup(null);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    const trimmed = val.trim();
    if (!trimmed) { setRollLooking(false); return; }
    setRollLooking(true);
    lookupTimer.current = setTimeout(async () => {
      try {
        const res = await lookupStudentByRollAPI(trimmed);
        setRollLookup(res);
      } catch {
        setRollLookup(null);
      } finally {
        setRollLooking(false);
      }
    }, 400);
  };

  const handleAddStudent = async () => {
    if (!addRollNo.trim()) { toast.error("Roll No is required"); return; }
    setAddSaving(true);
    try {
      const subjectsPayload = subjects.map((s) => ({
        code: s.code,
        internal: addMarks[s.code]?.internalAbsent ? 0 : (Number(addMarks[s.code]?.internal) || 0),
        external: addMarks[s.code]?.externalAbsent ? 0 : (Number(addMarks[s.code]?.external) || 0),
        internalAbsent: !!addMarks[s.code]?.internalAbsent,
        externalAbsent: !!addMarks[s.code]?.externalAbsent,
      }));

      let practicalPayload = undefined;
      if (hasPractical) {
        if (practicalType === "split") {
          practicalPayload = {
            internal: Number(addPractical.internal) || 0,
            external: Number(addPractical.external) || 0,
          };
        } else {
          practicalPayload = { marks: Number(addPractical.marks) || 0 };
        }
      }

      const res = await addParsedResultAPI(configId, {
        rollNo: addRollNo.trim(),
        subjects: subjectsPayload,
        practical: practicalPayload,
      });

      setResults((prev) => [...prev, res.result].sort((a, b) => String(a.rollNo).localeCompare(String(b.rollNo))));
      setShowAddModal(false);
      toast.success(`Student ${addRollNo.trim()} added`);
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to add student";
      toast.error(msg);
    } finally {
      setAddSaving(false);
    }
  };

  // ── Edit student ──────────────────────────────────────────────────────────

  const openEditModal = (result) => {
    setEditTarget(result);
    const marks = {};
    for (const s of subjects) {
      const existing = result.subjects?.find((rs) => Number(rs.code) === Number(s.code));
      const origExt = existing ? extractOriginal(existing.external, existing.eDisplay) : "";
      marks[s.code] = {
        internal: existing ? String(typeof existing.internal === "number" ? existing.internal : "") : "",
        external: existing ? String(typeof origExt === "number" ? origExt : "") : "",
        isAbsent: existing?.isAbsent || false,
        internalAbsent: existing?.internalAbsent || false,
        externalAbsent: existing?.externalAbsent || false,
      };
    }
    setEditMarks(marks);
    if (hasPractical && result.practical) {
      if (practicalType === "split") {
        setEditPractical({
          internal: String(typeof result.practical.internal === "number" ? result.practical.internal : ""),
          external: String(typeof result.practical.external === "number" ? result.practical.external : ""),
        });
      } else {
        setEditPractical({ marks: String(typeof result.practical.marks === "number" ? result.practical.marks : "") });
      }
    } else {
      setEditPractical({});
    }
  };

  const handleEditStudent = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const subjectsPayload = subjects.map((s) => ({
        code: s.code,
        internal: editMarks[s.code]?.internalAbsent ? 0 : (Number(editMarks[s.code]?.internal) || 0),
        external: editMarks[s.code]?.externalAbsent ? 0 : (Number(editMarks[s.code]?.external) || 0),
        internalAbsent: !!editMarks[s.code]?.internalAbsent,
        externalAbsent: !!editMarks[s.code]?.externalAbsent,
      }));

      let practicalPayload = undefined;
      if (hasPractical) {
        if (practicalType === "split") {
          practicalPayload = {
            internal: Number(editPractical.internal) || 0,
            external: Number(editPractical.external) || 0,
          };
        } else {
          practicalPayload = { marks: Number(editPractical.marks) || 0 };
        }
      }

      const res = await updateParsedResultAPI(configId, editTarget._id, {
        subjects: subjectsPayload,
        practical: practicalPayload,
      });
      setResults((prev) => prev.map((r) => r._id === editTarget._id ? res.result : r));
      setEditTarget(null);
      toast.success(`Student ${editTarget.rollNo} updated`);
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to update student";
      toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete student ───────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteParsedResultAPI(configId, deleteTarget._id);
      setResults((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      toast.success(`Student ${deleteTarget.rollNo} removed`);
    } catch (error) {
      toast.error("Failed to delete student");
    }
    setDeleteTarget(null);
  };

  // ── Display helpers ──────────────────────────────────────────────────────

  const safe = (v) => (v == null || typeof v === "object" ? null : v);

  const displayMark = (value, display) => {
    const d = safe(display);
    const v = safe(value);
    if (d != null && d !== v) return String(d);
    return v != null ? String(v) : "-";
  };

  /** Extract original mark before grace. e.g. eDisplay "26+4" → 26 */
  const extractOriginal = (rawValue, display) => {
    const d = safe(display);
    if (typeof d === "string" && d.includes("+")) {
      const original = Number(d.split("+")[0]);
      if (!isNaN(original)) return original;
    }
    return rawValue;
  };

  const getRemarkClass = (remark) => {
    switch (remark) {
      case "SUCCESSFUL": return "bg-green-100 text-green-800";
      case "UNSUCCESSFUL": return "bg-red-100 text-red-800";
      case "ABSENT": return "bg-yellow-100 text-yellow-800";
      case "RESULT RESTRICTED": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) return <div className="text-center py-8">Loading table data...</div>;
  if (!config) return <div className="text-center py-8 text-red-500">Failed to load config.</div>;

  const renderEditableCell = (result, field, rawValue, displayValue) => {
    const isEditing = editCell?.resultId === result._id && editCell?.field === field;
    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          className="w-16 px-1 py-0.5 border border-blue-500 rounded text-center text-sm focus:outline-none"
          disabled={saving}
          placeholder="0 or AB"
        />
      );
    }
    return (
      <span
        onClick={() => startEdit(result._id, field, rawValue)}
        className="cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded min-w-[2rem] inline-block text-center"
        title="Click to edit"
      >
        {displayValue}
      </span>
    );
  };

  const filteredResults = searchTerm.trim()
    ? results.filter((r) => {
        const q = searchTerm.toLowerCase();
        return (
          String(r.rollNo).toLowerCase().includes(q) ||
          String(r.name || "").toLowerCase().includes(q)
        );
      })
    : results;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">{filteredResults.length}{searchTerm ? ` / ${results.length}` : ""} student{filteredResults.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <FiSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search roll no or name..."
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm w-56 focus:border-blue-500 focus:outline-none"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FiX size={14} />
              </button>
            )}
          </div>
          <div className="relative" ref={colMenuRef}>
            <button
              onClick={() => setShowColMenu((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 text-sm font-medium"
              title="Toggle columns"
            >
              <FiEye size={14} /> Columns
            </button>
            {showColMenu && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[140px]">
                {TOGGLEABLE_COLS.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={!hiddenCols.has(c.key)}
                      onChange={() => toggleCol(c.key)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <FiPlus size={14} /> Add Student
          </button>
        </div>
      </div>

      {/* Spreadsheet table */}
      <div className="overflow-x-auto border border-gray-300 rounded">
        <table className="border-collapse text-sm" style={{ minWidth: "100%" }}>
          <thead>
            {/* Row 1: subject name headers spanning I & E */}
            <tr className="bg-blue-600 text-white">
              <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center sticky left-0 bg-blue-600 z-10" style={{ minWidth: 36 }}>#</th>
              <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-left sticky z-10 bg-blue-600" style={{ left: 36, minWidth: 140 }}>Name</th>
              <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center sticky z-10 bg-blue-600" style={{ left: 176, minWidth: 80, boxShadow: "2px 0 4px rgba(0,0,0,0.1)" }}>Roll No</th>
              {!hiddenCols.has("gr") && <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center min-w-[60px]">GR</th>}
              {!hiddenCols.has("prn") && <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center min-w-[80px]">PRN</th>}
              {subjects.map((s) => (
                <th key={s.code} colSpan={3} className="border border-gray-300 px-1 py-1 text-center">
                  {s.name}
                </th>
              ))}
              {hasPractical && (
                <th colSpan={practicalType === "split" ? 3 : 1} className="border border-gray-300 px-1 py-1 text-center">
                  Practical
                </th>
              )}
              <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center min-w-[50px]">Total</th>
              <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center min-w-[90px]">Remark</th>
              {!hiddenCols.has("sgpa") && <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center min-w-[50px]">SGPA</th>}
              {!hiddenCols.has("grade") && <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center min-w-[50px]">Grade</th>}
              <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center min-w-[40px]">Action</th>
            </tr>
            {/* Row 2: I / E / T sub-headers */}
            <tr className="bg-blue-500 text-white text-xs">
              {subjects.map((s) => (
                <React.Fragment key={`sub-${s.code}`}>
                  <th className="border border-gray-300 px-1 py-0.5 text-center w-12">I</th>
                  <th className="border border-gray-300 px-1 py-0.5 text-center w-12">E</th>
                  <th className="border border-gray-300 px-1 py-0.5 text-center w-12">T</th>
                </React.Fragment>
              ))}
              {hasPractical && practicalType === "split" && (
                <>
                  <th className="border border-gray-300 px-1 py-0.5 text-center w-12">I</th>
                  <th className="border border-gray-300 px-1 py-0.5 text-center w-12">E</th>
                  <th className="border border-gray-300 px-1 py-0.5 text-center w-12">T</th>
                </>
              )}
              {hasPractical && practicalType === "single" && (
                <th className="border border-gray-300 px-1 py-0.5 text-center w-12">M</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={999} className="text-center py-6 text-gray-500">
                  {searchTerm ? "No students match your search." : "No students yet. Click \"Add Student\" to begin."}
                </td>
              </tr>
            ) : (
              filteredResults.map((r, idx) => (
                <tr key={r._id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}>
                  <td className={`border border-gray-300 px-2 py-1 text-center text-xs text-gray-400 sticky left-0 z-[1] ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`} style={{ minWidth: 36 }}>{idx + 1}</td>
                  <td className={`border border-gray-300 px-2 py-1 text-left font-medium text-xs whitespace-nowrap sticky z-[1] ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`} style={{ left: 36, minWidth: 140 }}>{safe(r.name) || "-"}</td>
                  <td className={`border border-gray-300 px-2 py-1 text-center font-mono text-xs sticky z-[1] ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`} style={{ left: 176, minWidth: 80, boxShadow: "2px 0 4px rgba(0,0,0,0.06)" }}>{r.rollNo}</td>
                  {!hiddenCols.has("gr") && <td className="border border-gray-300 px-2 py-1 text-center text-xs">{safe(r.grNo) ?? "-"}</td>}
                  {!hiddenCols.has("prn") && <td className="border border-gray-300 px-2 py-1 text-center text-xs">{safe(r.prn) ?? "-"}</td>}

                  {/* Subject columns */}
                  {subjects.map((cfgSubj) => {
                    const subj = r.subjects?.find((s) => Number(s.code) === Number(cfgSubj.code));
                    if (!subj) {
                      return (
                        <React.Fragment key={`${r._id}-${cfgSubj.code}`}>
                          <td className="border border-gray-300 px-1 py-1 text-center text-xs">-</td>
                          <td className="border border-gray-300 px-1 py-1 text-center text-xs">-</td>
                          <td className="border border-gray-300 px-1 py-1 text-center text-xs">-</td>
                        </React.Fragment>
                      );
                    }
                    return (
                      <React.Fragment key={`${r._id}-${cfgSubj.code}`}>
                        <td className="border border-gray-300 px-1 py-1 text-center text-xs">
                          {subj.internalAbsent
                            ? <span onClick={() => startEdit(r._id, `subj-${subj.code}-i`, "AB")} className="cursor-pointer text-yellow-600 font-medium" title="Click to edit">AB</span>
                            : renderEditableCell(r, `subj-${subj.code}-i`, subj.internal, displayMark(subj.internal, subj.iDisplay))}
                        </td>
                        <td className="border border-gray-300 px-1 py-1 text-center text-xs">
                          {subj.externalAbsent
                            ? <span onClick={() => startEdit(r._id, `subj-${subj.code}-e`, "AB")} className="cursor-pointer text-yellow-600 font-medium" title="Click to edit">AB</span>
                            : renderEditableCell(r, `subj-${subj.code}-e`, extractOriginal(subj.external, subj.eDisplay), displayMark(subj.external, subj.eDisplay))}
                        </td>
                        <td className="border border-gray-300 px-1 py-1 text-center text-xs font-medium">{safe(subj.total) ?? 0}</td>
                      </React.Fragment>
                    );
                  })}

                  {/* Practical columns */}
                  {hasPractical && practicalType === "split" && (
                    <>
                      <td className="border border-gray-300 px-1 py-1 text-center text-xs">
                        {renderEditableCell(r, "prac-i", r.practical?.internal, displayMark(r.practical?.internal, r.practical?.iDisplay))}
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-xs">
                        {renderEditableCell(r, "prac-e", r.practical?.external, displayMark(r.practical?.external, r.practical?.eDisplay))}
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-xs font-medium">{safe(r.practical?.total) ?? "-"}</td>
                    </>
                  )}
                  {hasPractical && practicalType === "single" && (
                    <td className="border border-gray-300 px-1 py-1 text-center text-xs">
                      {renderEditableCell(r, "prac-m", r.practical?.marks, displayMark(r.practical?.marks, r.practical?.display))}
                    </td>
                  )}

                  {/* Computed columns */}
                  <td className="border border-gray-300 px-2 py-1 text-center text-xs font-bold">{safe(r.totalMarksObt) ?? 0}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getRemarkClass(r.remark)}`}>
                      {safe(r.remark) || "-"}
                    </span>
                  </td>
                  {!hiddenCols.has("sgpa") && (
                    <td className="border border-gray-300 px-2 py-1 text-center text-xs font-medium">
                      {r.sgpa !== null && r.sgpa !== undefined ? Number(r.sgpa).toFixed(2) : "NA"}
                    </td>
                  )}
                  {!hiddenCols.has("grade") && <td className="border border-gray-300 px-2 py-1 text-center text-xs font-medium">{safe(r.finalGrade) || "-"}</td>}
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(r)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit student marks"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete student"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add Student Modal ───────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Roll No *</label>
              <input
                type="text"
                value={addRollNo}
                onChange={handleRollNoChange}
                className={`w-full p-2 border-2 rounded-md ${
                  rollLookup ? (rollLookup.found ? "border-green-500" : "border-red-400") : "border-blue-500"
                }`}
                placeholder="e.g. A23301"
                autoFocus
              />
              {rollLooking && (
                <p className="text-xs text-blue-500 mt-1">Checking...</p>
              )}
              {!rollLooking && rollLookup && rollLookup.found && (
                <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-xs">
                  <span className="font-medium text-green-800">Found: </span>
                  <span className="text-green-700">{rollLookup.student.name}</span>
                  {rollLookup.student.grNo && <span className="text-gray-500 ml-2">GR: {rollLookup.student.grNo}</span>}
                  {rollLookup.student.prn && <span className="text-gray-500 ml-2">PRN: {rollLookup.student.prn}</span>}
                </div>
              )}
              {!rollLooking && rollLookup && !rollLookup.found && (
                <p className="text-xs text-red-500 mt-1">No student found with this roll number. Record will be created without name/GR/PRN.</p>
              )}
              {!rollLooking && !rollLookup && addRollNo.trim() === "" && (
                <p className="text-xs text-gray-500 mt-1">Name, GR, PRN will be pulled from Student database automatically.</p>
              )}
            </div>

            {/* Subject marks */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Subject Marks</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subjects.map((s) => {
                  const iAb = !!addMarks[s.code]?.internalAbsent;
                  const eAb = !!addMarks[s.code]?.externalAbsent;
                  return (
                  <div key={s.code} className={`border rounded p-2 ${(iAb || eAb) ? "bg-yellow-50 border-yellow-300" : ""}`}>
                    <p className="text-xs font-medium mb-1 truncate" title={s.name}>{s.name}</p>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-gray-500">Internal</label>
                          <label className="flex items-center gap-1 text-[10px] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={iAb}
                              onChange={(e) => setAddMarks((prev) => ({
                                ...prev,
                                [s.code]: { ...prev[s.code], internalAbsent: e.target.checked },
                              }))}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            AB
                          </label>
                        </div>
                        <input
                          type="number"
                          value={iAb ? "" : (addMarks[s.code]?.internal || "")}
                          onChange={(e) => setAddMarks((prev) => ({
                            ...prev,
                            [s.code]: { ...prev[s.code], internal: e.target.value },
                          }))}
                          className={`w-full p-1 border rounded text-sm ${iAb ? "bg-gray-100 text-gray-400" : ""}`}
                          min="0"
                          disabled={iAb}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-gray-500">External</label>
                          <label className="flex items-center gap-1 text-[10px] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={eAb}
                              onChange={(e) => setAddMarks((prev) => ({
                                ...prev,
                                [s.code]: { ...prev[s.code], externalAbsent: e.target.checked },
                              }))}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            AB
                          </label>
                        </div>
                        <input
                          type="number"
                          value={eAb ? "" : (addMarks[s.code]?.external || "")}
                          onChange={(e) => setAddMarks((prev) => ({
                            ...prev,
                            [s.code]: { ...prev[s.code], external: e.target.value },
                          }))}
                          className={`w-full p-1 border rounded text-sm ${eAb ? "bg-gray-100 text-gray-400" : ""}`}
                          min="0"
                          disabled={eAb}
                        />
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Practical marks */}
            {hasPractical && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Practical</h4>
                {practicalType === "split" ? (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Internal</label>
                      <input
                        type="number"
                        value={addPractical.internal || ""}
                        onChange={(e) => setAddPractical((p) => ({ ...p, internal: e.target.value }))}
                        className="w-full p-1 border rounded text-sm"
                        min="0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">External</label>
                      <input
                        type="number"
                        value={addPractical.external || ""}
                        onChange={(e) => setAddPractical((p) => ({ ...p, external: e.target.value }))}
                        className="w-full p-1 border rounded text-sm"
                        min="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-gray-500">Marks</label>
                    <input
                      type="number"
                      value={addPractical.marks || ""}
                      onChange={(e) => setAddPractical((p) => ({ ...p, marks: e.target.value }))}
                      className="w-full p-1 border rounded text-sm"
                      min="0"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                disabled={addSaving || !addRollNo.trim()}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <FiSave size={14} />
                {addSaving ? "Adding..." : "Add Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Student Modal ──────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Edit Student - {editTarget.name || editTarget.rollNo}</h3>
              <button onClick={() => setEditTarget(null)} className="text-gray-500 hover:text-gray-700">
                <FiX size={20} />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
              <div><span className="text-gray-500">Roll No:</span> <strong>{editTarget.rollNo}</strong></div>
              <div><span className="text-gray-500">GR:</span> <strong>{safe(editTarget.grNo) ?? "-"}</strong></div>
              <div><span className="text-gray-500">PRN:</span> <strong>{safe(editTarget.prn) ?? "-"}</strong></div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Subject Marks</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subjects.map((s) => {
                  const iAb = !!editMarks[s.code]?.internalAbsent;
                  const eAb = !!editMarks[s.code]?.externalAbsent;
                  return (
                  <div key={s.code} className={`border rounded p-2 ${(iAb || eAb) ? "bg-yellow-50 border-yellow-300" : ""}`}>
                    <p className="text-xs font-medium mb-1 truncate" title={s.name}>{s.name}</p>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-gray-500">Internal</label>
                          <label className="flex items-center gap-1 text-[10px] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={iAb}
                              onChange={(e) => setEditMarks((prev) => ({
                                ...prev,
                                [s.code]: { ...prev[s.code], internalAbsent: e.target.checked },
                              }))}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            AB
                          </label>
                        </div>
                        <input
                          type="number"
                          value={iAb ? "" : (editMarks[s.code]?.internal || "")}
                          onChange={(e) => setEditMarks((prev) => ({
                            ...prev,
                            [s.code]: { ...prev[s.code], internal: e.target.value },
                          }))}
                          className={`w-full p-1 border rounded text-sm ${iAb ? "bg-gray-100 text-gray-400" : ""}`}
                          min="0"
                          disabled={iAb}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-gray-500">External</label>
                          <label className="flex items-center gap-1 text-[10px] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={eAb}
                              onChange={(e) => setEditMarks((prev) => ({
                                ...prev,
                                [s.code]: { ...prev[s.code], externalAbsent: e.target.checked },
                              }))}
                              className="accent-yellow-500 w-3 h-3"
                            />
                            AB
                          </label>
                        </div>
                        <input
                          type="number"
                          value={eAb ? "" : (editMarks[s.code]?.external || "")}
                          onChange={(e) => setEditMarks((prev) => ({
                            ...prev,
                            [s.code]: { ...prev[s.code], external: e.target.value },
                          }))}
                          className={`w-full p-1 border rounded text-sm ${eAb ? "bg-gray-100 text-gray-400" : ""}`}
                          min="0"
                          disabled={eAb}
                        />
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {hasPractical && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Practical</h4>
                {practicalType === "split" ? (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Internal</label>
                      <input
                        type="number"
                        value={editPractical.internal || ""}
                        onChange={(e) => setEditPractical((p) => ({ ...p, internal: e.target.value }))}
                        className="w-full p-1 border rounded text-sm"
                        min="0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">External</label>
                      <input
                        type="number"
                        value={editPractical.external || ""}
                        onChange={(e) => setEditPractical((p) => ({ ...p, external: e.target.value }))}
                        className="w-full p-1 border rounded text-sm"
                        min="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-gray-500">Marks</label>
                    <input
                      type="number"
                      value={editPractical.marks || ""}
                      onChange={(e) => setEditPractical((p) => ({ ...p, marks: e.target.value }))}
                      className="w-full p-1 border rounded text-sm"
                      min="0"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditStudent}
                disabled={editSaving}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <FiSave size={14} />
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-2">Delete Student?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Remove <strong>{deleteTarget.name || deleteTarget.rollNo}</strong> (Roll: {deleteTarget.rollNo}) from this config? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultTableView;
