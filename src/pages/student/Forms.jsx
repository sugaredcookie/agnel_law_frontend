import React, { useState } from "react";
import DashboardLayout from "../user/DashboardLayout";
import { useNavigate } from "react-router-dom";
import FormList from "./form_list/FormList";

const Forms = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const navigate = useNavigate();

  const handleNewApplication = (e) => {
    e.preventDefault();
    setShowInstructions(true);
  };

  const proceedToForm = () => {
    setShowInstructions(false);
    navigate("/add-new-application-form");
  };

  return (
    <DashboardLayout>
      <div>
        <button
          className="px-4 py-2 mt-3 mb-3 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-end transition duration-200"
          onClick={handleNewApplication}
        >
          + Add New Application
        </button>

        {/* Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-xl font-semibold">
                  Important Instructions
                </h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="text-center space-y-4">
                  <h5 className="text-lg font-medium">
                    Before proceeding, please complete the University Form first
                  </h5>
                  <p className="text-gray-600">Follow these steps:</p>
                  <ol className="text-left list-decimal list-inside space-y-2">
                    <li>Click the link below to access the University Form</li>
                    <li>Submit and download the University Form</li>
                    <li>
                      After submission, return here to continue with your
                      application
                    </li>
                  </ol>

                  <div className="space-y-4 pt-4">
                    <a
                      href="https://mumoa.digitaluniversity.ac/Login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200"
                    >
                      Go to University Form →
                    </a>

                    <button
                      className="block w-full px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition duration-200"
                      onClick={proceedToForm}
                    >
                      I've completed the University Form, Continue →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <FormList />
      </div>
    </DashboardLayout>
  );
};

export default Forms;
