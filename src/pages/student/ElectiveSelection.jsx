import React, { useEffect, useState } from "react";
import StudentDashboardLayout from "./StudentDashboardLayout";
import {
  getMyElectivesAPI,
  submitElectiveSelectionAPI,
} from "../../utils/Api";
import { toast } from "react-toastify";

const ElectiveSelection = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [batch, setBatch] = useState(null);
  const [electives, setElectives] = useState([]);
  const [selected, setSelected] = useState([]);
  const [alreadySelected, setAlreadySelected] = useState([]);
  const [maxElectives, setMaxElectives] = useState(0);
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const fetchElectives = async () => {
      try {
        const res = await getMyElectivesAPI();
        const data = res.data;
        setBatch(data.batch);
        setElectives(data.electives);
        setMaxElectives(data.maxElectives || 0);
        setSelected(data.selectedElectives || []);
        setAlreadySelected(data.selectedElectives || []);
        setSession(data.session || null);
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to load electives"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchElectives();
  }, []);

  useEffect(() => {
    if (!session?.closeAt) return;
    const tick = () => {
      const diff = new Date(session.closeAt) - new Date();
      if (diff <= 0) { setTimeLeft(null); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    tick();
    const iv = setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, [session?.closeAt]);

  const canSelect = !session || session.selectionOpen;
  const canReselect = !session || session.allowReselection || alreadySelected.length === 0;
  const selectionDisabled = !canSelect || !canReselect;

  const toggleElective = (id) => {
    if (selectionDisabled) return;
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (maxElectives > 0 && prev.length >= maxElectives) {
        toast.warn(`You can select at most ${maxElectives} elective(s)`);
        return prev;
      }
      const el = electives.find((e) => e._id === id);
      if (el?.capacity && el.selectionCount >= el.capacity) {
        toast.warn("This elective is at full capacity");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error("Please select at least one elective");
      return;
    }
    if (maxElectives > 0 && selected.length !== maxElectives) {
      toast.error(`Please select exactly ${maxElectives} elective(s)`);
      return;
    }

    setSubmitting(true);
    try {
      await submitElectiveSelectionAPI(selected);
      toast.success("Elective selection saved successfully!");
      setAlreadySelected(selected);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to save selection"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentDashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StudentDashboardLayout>
    );
  }

  if (!batch || electives.length === 0) {
    return (
      <StudentDashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <i className="mdi mdi-book-open-variant text-5xl text-gray-300 mb-4 block"></i>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            No Electives Available
          </h2>
          <p className="text-gray-400">
            Your current batch does not have any elective subjects to choose
            from.
          </p>
        </div>
      </StudentDashboardLayout>
    );
  }

  const hasChanged =
    JSON.stringify([...selected].sort()) !==
    JSON.stringify([...alreadySelected].sort());

  return (
    <StudentDashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Elective Selection</h1>
        <p className="text-gray-500 mb-1">
          Batch: <span className="font-medium text-gray-700">{batch.batchName}</span>
          {" | "}Program: <span className="font-medium text-gray-700">{batch.program?.name}</span>
        </p>

        {session && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Session: <span className="font-medium">{session.name}</span>
            </p>
            {timeLeft && (
              <p className="text-sm text-orange-600 font-medium">
                Deadline in: {timeLeft}
              </p>
            )}
          </div>
        )}

        {session && !session.selectionOpen && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm text-red-700">
            <i className="mdi mdi-lock mr-1"></i>
            {session.isStudentLocked
              ? "Your selection has been locked by the administrator."
              : session.status === "closed"
              ? "The elective selection window has closed."
              : session.status === "locked"
              ? "This elective session has been locked."
              : "Elective selection is currently not open."}
          </div>
        )}

        {session && !session.allowReselection && alreadySelected.length > 0 && session.selectionOpen && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-700">
            <i className="mdi mdi-information mr-1"></i>
            Reselection is not allowed for this session. Your selection is final.
          </div>
        )}

        {maxElectives > 0 && (
          <p className="text-sm text-blue-600 font-medium mb-6">
            Select exactly {maxElectives} elective{maxElectives > 1 ? "s" : ""}
          </p>
        )}

        {alreadySelected.length > 0 && canSelect && canReselect && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-6 text-sm text-green-700">
            <i className="mdi mdi-check-circle mr-1"></i>
            You have already submitted your elective selection. You can update it below.
          </div>
        )}

        <div className="space-y-3 mb-8">
          {electives.map((elective) => {
            const isSelected = selected.includes(elective._id);
            const atCapacity = elective.capacity && elective.selectionCount >= elective.capacity && !isSelected;
            return (
              <label
                key={elective._id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                  selectionDisabled || atCapacity ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                } ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleElective(elective._id)}
                  disabled={selectionDisabled || atCapacity}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium">{elective.subjectName}</p>
                  <p className="text-sm text-gray-500">
                    Code: {elective.subjectCode}
                  </p>
                  {elective.selectionCount > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {elective.selectionCount} student{elective.selectionCount !== 1 ? "s" : ""} selected
                      {elective.capacity ? ` / ${elective.capacity} capacity` : ""}
                    </p>
                  )}
                  {atCapacity && (
                    <p className="text-xs text-red-500 font-medium mt-0.5">Full capacity</p>
                  )}
                </div>
                {isSelected && (
                  <span className="text-blue-600">
                    <i className="mdi mdi-check-bold text-xl"></i>
                  </span>
                )}
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {selected.length}{maxElectives > 0 ? ` / ${maxElectives}` : ` of ${electives.length}`} selected
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectionDisabled || selected.length === 0 || !hasChanged || (maxElectives > 0 && selected.length !== maxElectives)}
            className={`px-6 py-2.5 rounded-lg font-medium text-white transition-colors ${
              submitting || selectionDisabled || selected.length === 0 || !hasChanged || (maxElectives > 0 && selected.length !== maxElectives)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {submitting
              ? "Saving..."
              : alreadySelected.length > 0
              ? "Update Selection"
              : "Submit Selection"}
          </button>
        </div>
      </div>
    </StudentDashboardLayout>
  );
};

export default ElectiveSelection;
