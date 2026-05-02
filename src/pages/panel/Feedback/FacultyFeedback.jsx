import React, { useEffect, useState } from "react";
import {
  addQuestionViaAdmin,
  getAllFacultyFeedbackQuestionsViaAdmin,
  removeQuestionViaAdmin,
} from "../../../utils/Api";

const FacultyFeedback = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");

  // Fetch all feedback questions on component mount
  useEffect(() => {
    fetchAllQuestions();
  }, []);

  // Function to fetch all feedback questions
  const fetchAllQuestions = async () => {
    try {
      const response = await getAllFacultyFeedbackQuestionsViaAdmin();
      console.log(response);
      setQuestions(response.feedback.questions);
    } catch (error) {
      console.error("Error fetching feedback questions:", error);
    }
  };

  // Function to handle adding a new question
  const handleAddQuestion = async () => {
    if (newQuestion.trim() === "") {
      return; // Prevent adding empty questions
    }

    try {
      await addQuestionViaAdmin({
        question: newQuestion,
        feedbackType: "faculty",
      });

      // Re-fetch the questions from backend after successful addition
      await fetchAllQuestions();
      setNewQuestion(""); // Clear input field after adding
      console.log("Question added successfully");
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  // Function to handle removing a question
  const handleRemoveQuestion = async (question) => {
    try {
      await removeQuestionViaAdmin({
        question,
        feedbackType: "faculty",
      });

      // Re-fetch the questions from backend after successful removal
      await fetchAllQuestions();
      console.log("Question removed successfully");
    } catch (error) {
      console.error("Error removing question:", error);
    }
  };

  return (
    <div className="faculty-feedback">
      <h2 className="text-2xl font-bold mb-4">Faculty Feedback</h2>

      {/* Form to add new questions */}
      <div className="mb-4">
        <label className="block mb-2">Add Feedback Question:</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Enter a feedback question"
        />
        <button
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleAddQuestion}
        >
          Add Question
        </button>
      </div>

      {/* Display the list of added questions */}
      {questions.length > 0 ? (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-3">Feedback Questions:</h3>
          <ul className="list-disc ml-6">
            {questions.map((questionObj, index) => (
              // Assuming the questions array contains strings
              <li key={index} className="mb-2 flex justify-between">
                <span>{questionObj}</span>{" "}
                <button
                  className="ml-2"
                  onClick={() => handleRemoveQuestion(questionObj)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="24"
                    height="24"
                    viewBox="0 0 30 30"
                    style={{ fill: "#D32F2F" }}
                  >
                    <path d="M 14.984375 2.4863281 A 1.0001 1.0001 0 0 0 14 3.5 L 14 4 L 8.5 4 A 1.0001 1.0001 0 0 0 7.4863281 5 L 6 5 A 1.0001 1.0001 0 1 0 6 7 L 24 7 A 1.0001 1.0001 0 1 0 24 5 L 22.513672 5 A 1.0001 1.0001 0 0 0 21.5 4 L 16 4 L 16 3.5 A 1.0001 1.0001 0 0 0 14.984375 2.4863281 z M 6 9 L 7.7929688 24.234375 C 7.9109687 25.241375 8.7633438 26 9.7773438 26 L 20.222656 26 C 21.236656 26 22.088031 25.241375 22.207031 24.234375 L 24 9 L 6 9 z"></path>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No feedback questions added yet.</p>
      )}
    </div>
  );
};

export default FacultyFeedback;
