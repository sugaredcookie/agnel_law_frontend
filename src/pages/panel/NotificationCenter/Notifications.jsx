import React, { useEffect, useState } from "react";
import PanelDashboardLayout from "../PanelDashboardLayout";
import {
  getAllFacultiesViaAdmin,
  getAllStudentsViaAdmin,
  sendMailViaAdmin,
} from "../../../utils/Api";
import { toast } from "react-toastify";

const Notifications = () => {
  const [allFaculties, setAllFaculties] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [recipientGroup, setRecipientGroup] = useState("students"); // Default is students
  const [individualEmails, setIndividualEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAllFaculties();
    fetchAllStudents();
  }, []);

  const fetchAllFaculties = async () => {
    try {
      const response = await getAllFacultiesViaAdmin();
      setAllFaculties(response.faculties);
    } catch (error) {
      console.error("Error fetching faculties", error);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await getAllStudentsViaAdmin();
      setAllStudents(response.students);
    } catch (error) {
      console.error("Error fetching students", error);
    }
  };

  const handleSendEmail = async () => {
    try {
      const recipientEmails = [];

      // Determine the recipients based on the selection
      if (recipientGroup === "students") {
        recipientEmails.push(
          ...allStudents.map((student) => student.studentDetails.emailAddress),
        );
      } else if (recipientGroup === "faculties") {
        recipientEmails.push(...allFaculties.map((faculty) => faculty.email));
      } else if (recipientGroup === "everyone") {
        recipientEmails.push(
          ...allStudents.map((student) => student.studentDetails.emailAddress),
          ...allFaculties.map((faculty) => faculty.email),
        );
      } else if (recipientGroup === "individual") {
        if (individualEmails.trim()) {
          recipientEmails.push(
            ...individualEmails.split(",").map((email) => email.trim()),
          );
        } else {
          toast.error("Please enter at least one email address.");
          return;
        }
      }

      console.log("Sending email to:", recipientEmails);

      // Send the email using the API
      const response = await sendMailViaAdmin({
        subject,
        message,
        recipientEmails,
      });
      toast.success("Emails sent successfully!");
    } catch (error) {
      toast.error("Failed to send emails.");
      console.error("Error sending emails:", error);
    }
  };

  return (
    <PanelDashboardLayout>
      <div className="mb-4 text-2xl font-bold">Notifications</div>

      {/* Form for composing the email */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h3 className="text-lg font-bold mb-4">Compose Email</h3>

        {/* Subject Input */}
        <div className="mb-4">
          <label className="block mb-2">Subject:</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject"
          />
        </div>

        {/* Message Input */}
        <div className="mb-4">
          <label className="block mb-2">Message:</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here"
            rows={5}
          />
        </div>

        {/* Recipient Selection with Radio Buttons */}
        <div className="mb-4">
          <label className="block mb-2">Send to:</label>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="recipientGroup"
                value="faculties"
                checked={recipientGroup === "faculties"}
                onChange={() => setRecipientGroup("faculties")}
                className="mr-2"
              />
              All Faculties
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="recipientGroup"
                value="students"
                checked={recipientGroup === "students"}
                onChange={() => setRecipientGroup("students")}
                className="mr-2"
              />
              All Students
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="recipientGroup"
                value="everyone"
                checked={recipientGroup === "everyone"}
                onChange={() => setRecipientGroup("everyone")}
                className="mr-2"
              />
              Everyone
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="recipientGroup"
                value="individual"
                checked={recipientGroup === "individual"}
                onChange={() => setRecipientGroup("individual")}
                className="mr-2"
              />
              Individual
            </label>
          </div>
        </div>

        {/* Individual Email Input (only visible when "Individual" is selected) */}
        {recipientGroup === "individual" && (
          <div className="mb-4">
            <label className="block mb-2">Individual Email Addresses:</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={individualEmails}
              onChange={(e) => setIndividualEmails(e.target.value)}
              placeholder="Enter email addresses, separated by commas"
            />
          </div>
        )}

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSendEmail}
          >
            Send Email
          </button>
        </div>
      </div>
    </PanelDashboardLayout>
  );
};

export default Notifications;
