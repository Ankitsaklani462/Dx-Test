import React, { useMemo, useState } from "react";
import { db } from "../firebase";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

function AdminPanel({
  users = [],
  questions = [],
  tests = [],
  setTests,
  setCurrentScreen,
  setQuestions,
}) {

  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);

  // Dynamic Subjects
  const dynamicSubjects = useMemo(() => {

    if (!questions || questions.length === 0) {
      return ["HTML"];
    }

    const subjects = [
      ...new Set(
        questions
          .map((q) => q.subject)
          .filter(Boolean)
      ),
    ];

    return subjects.length ? subjects : ["HTML"];

  }, [questions]);

  const [tForm, setTForm] = useState({
    title: "",
    subject: "HTML",
    level: "Beginner",
    duration: 30,
  });

  // Filter Users
  const filteredUsers = users.filter((user) => {

    if (user.role === "admin") return false;

    const name = user.name || "";
    const empId = user.empId || "";

    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Launch Test
  const handleTestSubmit = async (e) => {

    e.preventDefault();

    if (!tForm.title) {
      alert("Please enter test title");
      return;
    }

    // Match Questions
    const matchingQIds = questions
      .filter(
        (q) =>
          q.subject === tForm.subject &&
          q.level === tForm.level
      )
      .map((q) => q.id);

    console.log("MATCHING QUESTIONS:", matchingQIds);

    if (matchingQIds.length === 0) {

      alert(
        `No questions found for ${tForm.subject} (${tForm.level})`
      );

      return;
    }

    const newTest = {
      title: tForm.title,
      subject: tForm.subject,
      level: tForm.level,
      duration: Number(tForm.duration),
      questionIds: matchingQIds,
      createdAt: serverTimestamp(),
      status: "live",
    };

    try {

      setLoading(true);

      const docRef = await addDoc(
        collection(db, "tests"),
        newTest
      );

      setTests([
        ...tests,
        {
          id: docRef.id,
          ...newTest,
        },
      ]);

      alert("Test launched successfully!");

      setTForm({
        title: "",
        subject: dynamicSubjects[0] || "HTML",
        level: "Beginner",
        duration: 30,
      });

    } catch (err) {

      console.error("TEST ERROR:", err);

      alert("Failed to launch test");

    } finally {

      setLoading(false);
    }
  };

  // CSV Upload function
const handleCSVUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    setCsvLoading(true);
    
    // Read the file as text
    const text = await file.text();
    
    // 1. Remove carriage returns (\r) and split into rows by new line
    // Filter out any empty rows
    const rows = text.replace(/\r/g, "").split("\n").filter(row => row.trim() !== "");

    const uploadedQuestions = [];

    // 2. Start from index 1 to skip the header row
    for (let i = 1; i < rows.length; i++) {
      // Split each row by comma to get individual columns
      const cols = rows[i].split(",");
      
      // 3. Validation: ensure the row has at least 6 parts (Question + 4 Options + Answer)
      if (cols.length < 6) {
        console.warn(`Skipping invalid row ${i}:`, cols);
        continue;
      }

      // Create the question object
      const questionObj = {
        question: cols[0]?.trim(),
        options: [
          cols[1]?.trim(), 
          cols[2]?.trim(), 
          cols[3]?.trim(), 
          cols[4]?.trim()
        ],
        answer: cols[5]?.trim(),
        subject: tForm.subject,
        level: tForm.level,
        createdAt: serverTimestamp(),
      };

      // Add the document to Firestore
      const docRef = await addDoc(collection(db, "questions"), questionObj);
      uploadedQuestions.push({ id: docRef.id, ...questionObj });
    }

    // 4. Update the state with new questions if setQuestions function exists
    if (uploadedQuestions.length > 0) {
      setQuestions((prev) => [...prev, ...uploadedQuestions]);
      alert(`${uploadedQuestions.length} Questions Uploaded Successfully!`);
    } else {
      alert("No valid questions found to upload. Please check your CSV format.");
    }
  } catch (err) {
    console.error("CSV Upload Error:", err);
    alert("CSV Upload Failed: " + err.message);
  } finally {
    setCsvLoading(false);
  }
};

  return (

    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 text-white p-5 rounded-2xl shadow-lg gap-4">

        <div>
          <h2 className="text-2xl font-extrabold tracking-wide">
            ⚙️ Admin Control Panel
          </h2>

          <p className="text-sm text-slate-300 mt-1">
            Manage Tests, Candidates & Analytics
          </p>
        </div>

        <button
          onClick={() => setCurrentScreen("dashboard")}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-semibold transition"
        >
          View as Candidate
        </button>

      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-xl shadow flex gap-3 border">

        <button
          onClick={() => {
            setActiveTab("users");
            setSelectedUser(null);
          }}
          className={`flex-1 py-3 rounded-lg text-sm font-bold transition ${
            activeTab === "users"
              ? "bg-slate-800 text-white"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          👤 User Analytics
        </button>

        <button
          onClick={() => setActiveTab("launch-test")}
          className={`flex-1 py-3 rounded-lg text-sm font-bold transition ${
            activeTab === "launch-test"
              ? "bg-slate-800 text-white"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          🚀 Launch Test
        </button>

      </div>

      {/* USER TAB */}
      {activeTab === "users" && (

        <div className="grid md:grid-cols-3 gap-6">

          <div className="bg-white rounded-xl shadow border p-4">

            <h3 className="font-bold text-slate-700 mb-4">
              Employee Search
            </h3>

            <input
              type="text"
              placeholder="Search employee"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />

            <div className="mt-4 space-y-2 max-h-[500px] overflow-y-auto">

              {filteredUsers.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-5">
                  No employee found
                </p>
              )}

              {filteredUsers.map((user) => (

                <button
                  key={user.empId}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left p-4 rounded-xl border transition ${
                    selectedUser?.empId === user.empId
                      ? "border-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >

                  <div className="flex justify-between items-center">

                    <div>

                      <h4 className="font-bold text-sm">
                        {user.name}
                      </h4>

                      <p className="text-xs text-gray-500 mt-1">
                        {user.empId} | {user.dept}
                      </p>

                    </div>

                    <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold">
                      {user.performance?.overall || 0}%
                    </div>

                  </div>

                </button>
              ))}

            </div>

          </div>

          <div className="md:col-span-2 bg-white rounded-xl shadow border p-6 min-h-[500px]">

            {selectedUser ? (

              <div>

                <div className="border-b pb-4 mb-6">

                  <h3 className="text-2xl font-bold text-slate-800">
                    {selectedUser.name}
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    {selectedUser.empId} | {selectedUser.dept}
                  </p>

                </div>

              </div>

            ) : (

              <div className="flex items-center justify-center h-full text-gray-400 text-lg font-medium">
                Select Employee to View Analytics
              </div>

            )}

          </div>

        </div>
      )}

      {/* LAUNCH TEST TAB */}
      {activeTab === "launch-test" && (

        <div className="max-w-3xl mx-auto bg-white rounded-2xl border shadow-lg p-8">

          <div className="flex justify-between items-center border-b pb-4 mb-6">

            <h3 className="text-xl font-bold text-slate-800">
              🚀 Launch Live Examination
            </h3>

          </div>

          {/* CSV Upload */}
          <div className="mb-8 bg-slate-50 border rounded-xl p-5">

            <h4 className="font-bold text-slate-700 mb-3">
              Upload Questions CSV
            </h4>

            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="w-full border rounded-lg px-3 py-2 bg-white"
            />

            <p className="text-xs text-gray-500 mt-3 leading-6">
              CSV Format:
              <br />
              question,option1,option2,option3,option4,answer
            </p>

            {csvLoading && (
              <p className="text-blue-600 text-sm mt-3 font-semibold">
                Uploading Questions...
              </p>
            )}

          </div>

          {/* Launch Form */}
          <form
            onSubmit={handleTestSubmit}
            className="space-y-5"
          >

            <div>

              <label className="block text-sm font-bold text-gray-700 mb-2">
                Assessment Title
              </label>

              <input
                type="text"
                placeholder="JavaScript Mid-Level Test"
                value={tForm.title}
                onChange={(e) =>
                  setTForm({
                    ...tForm,
                    title: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-3"
              />

            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <div>

                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Subject Filter
                </label>

                <select
                  value={tForm.subject}
                  onChange={(e) =>
                    setTForm({
                      ...tForm,
                      subject: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl px-4 py-3 bg-white"
                >

                  {dynamicSubjects.map((subject, index) => (

                    <option
                      key={index}
                      value={subject}
                    >
                      {subject}
                    </option>

                  ))}

                </select>

              </div>

              <div>

                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Assessment Level
                </label>

                <select
                  value={tForm.level}
                  onChange={(e) =>
                    setTForm({
                      ...tForm,
                      level: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl px-4 py-3 bg-white"
                >

                  <option value="Beginner">
                    Beginner
                  </option>

                  <option value="Mid">
                    Mid
                  </option>

                  <option value="Advanced">
                    Advanced
                  </option>

                </select>

              </div>

            </div>

            <div>

              <label className="block text-sm font-bold text-gray-700 mb-2">
                Timer Duration (Minutes)
              </label>

              <input
                type="number"
                value={tForm.duration}
                onChange={(e) =>
                  setTForm({
                    ...tForm,
                    duration: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-3"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition uppercase"
            >

              {loading
                ? "Launching Test..."
                : "Deploy & Launch Test Live"}

            </button>

          </form>

        </div>
      )}

    </div>
  );
}

export default AdminPanel;