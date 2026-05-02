import { useState } from "react";
import { createMarkChangeRequestAPI } from "../../../utils/Api";
import { toast } from "react-toastify";

const MarkChangeRequestModal = ({
  student,
  subjectId,
  internalScheme,
  onClose,
  onSubmitted,
}) => {
  const [proposedMarks, setProposedMarks] = useState(() => {
    const initial = {};
    Object.keys(internalScheme).forEach((name) => {
      initial[name] = student.marks[name] || "";
    });
    return initial;
  });
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!remark.trim()) {
      setError("Please provide a reason for the change request.");
      return;
    }

    const proposed = Object.entries(internalScheme).map(([name, maxMarks]) => ({
      schemeName: name,
      obtainedMarks: Number(proposedMarks[name]) || 0,
      maxMarks,
    }));

    const hasChange = proposed.some((p) => {
      const current = Number(student.marks[p.schemeName]) || 0;
      return current !== p.obtainedMarks;
    });

    if (!hasChange) {
      setError("No marks have been changed. Modify at least one mark.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createMarkChangeRequestAPI({
        studentId: student._id,
        subjectId,
        proposedMarks: proposed,
        remark: remark.trim(),
      });
      toast.success("Change request submitted successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      onSubmitted();
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to submit change request.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
        <h3 className="text-lg font-semibold mb-1">Request Mark Change</h3>
        <p className="text-sm text-gray-500 mb-4">
          {student.studentDetails.firstName} {student.studentDetails.lastName} (
          {student.academicDetails.rollNumber})
        </p>

        <table className="w-full border border-gray-200 mb-4 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2 text-left">Component</th>
              <th className="border p-2 text-center">Current</th>
              <th className="border p-2 text-center">Proposed</th>
              <th className="border p-2 text-center">Max</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(internalScheme).map(([name, maxMarks]) => (
              <tr key={name}>
                <td className="border p-2">{name}</td>
                <td className="border p-2 text-center text-gray-500">
                  {student.marks[name] || "-"}
                </td>
                <td className="border p-2 text-center">
                  <input
                    type="number"
                    className="w-20 p-1 border rounded text-center"
                    min="0"
                    max={maxMarks}
                    value={proposedMarks[name] ?? ""}
                    onChange={(e) =>
                      setProposedMarks((prev) => ({
                        ...prev,
                        [name]: e.target.value,
                      }))
                    }
                  />
                </td>
                <td className="border p-2 text-center text-gray-500">
                  {maxMarks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for change <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={3}
            placeholder="Explain why these marks need to be changed..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkChangeRequestModal;
