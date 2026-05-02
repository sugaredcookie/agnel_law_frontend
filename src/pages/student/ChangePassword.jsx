import React, { useState } from "react";
import { toast } from "react-toastify";
import { changeStudentPassword } from "../../utils/Api";
import StudentDashboardLayout from "./StudentDashboardLayout";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await changeStudentPassword({ currentPassword, newPassword });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentDashboardLayout>
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-center text-black dark:text-white">
            Change Password
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="currentPassword"
                className="block mb-2 text-sm font-bold text-black dark:text-white"
              >
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                className="w-full px-4 py-3 border-2 border-gray-400 dark:border-gray-400 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-300"
                style={{
                  WebkitTextSecurity: "disc",
                  colorScheme: "light dark",
                }}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter current password"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="newPassword"
                className="block mb-2 text-sm font-bold text-black dark:text-white"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                className="w-full px-4 py-3 border-2 border-gray-400 dark:border-gray-400 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-300"
                style={{
                  WebkitTextSecurity: "disc",
                  colorScheme: "light dark",
                }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Enter new password"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block mb-2 text-sm font-bold text-black dark:text-white"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full px-4 py-3 border-2 border-gray-400 dark:border-gray-400 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-300"
                style={{
                  WebkitTextSecurity: "disc",
                  colorScheme: "light dark",
                }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Confirm new password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </StudentDashboardLayout>
  );
};

export default ChangePassword;
