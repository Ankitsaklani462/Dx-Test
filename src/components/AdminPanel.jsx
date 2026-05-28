// src/components/AdminPanel.jsx

import React, { useMemo, useState } from "react";

import { db } from "../firebase";

import {
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

function AdminPanel({
  users = [],
  questions = [],
  tests = [],
  setTests,
  setCurrentScreen,
  setQuestions,
}) {

  // ================= STATES =================

  const [activeTab, setActiveTab] =
    useState("users");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [selectedAttempt, setSelectedAttempt] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [csvLoading, setCsvLoading] =
    useState(false);

  const [uploadedCount, setUploadedCount] =
    useState(0);

  // ================= SUBJECTS =================

  const dynamicSubjects = useMemo(() => {

    const subs = [
      ...new Set(
        questions
          .map((q) => q.subject)
          .filter(Boolean)
      ),
    ];

    return subs;

  }, [questions]);

  // ================= FORM =================

  const [tForm, setTForm] = useState({
    title: "",
    subject: "",
    level: "",
    duration: "",
  });

  // ================= FILTER USERS =================

  const filteredUsers = users.filter(
    (user) => {

      if (user.role === "admin") {
        return false;
      }

      return (
        (user.name || "")
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          ) ||

        (user.empId || "")
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          )
      );
    }
  );

  // ================= CSV UPLOAD =================

  const handleCSVUpload = async (
    e
  ) => {

    const file = e.target.files[0];

    if (!file) return;

    if (
      !tForm.subject ||
      !tForm.level
    ) {
      alert(
        "Please fill Subject & Level first"
      );
      return;
    }

    try {

      setCsvLoading(true);

      const text =
        await file.text();

      const rows = text
        .replace(/\r/g, "")
        .split("\n")
        .filter(
          (r) => r.trim() !== ""
        );

      const uploaded = [];

      for (
        let i = 1;
        i < rows.length;
        i++
      ) {

        const cols =
          rows[i].split(",");

        if (cols.length < 6) {
          continue;
        }

        const questionObj = {
          question:
            cols[0]?.trim(),

          options: [
            cols[1]?.trim(),
            cols[2]?.trim(),
            cols[3]?.trim(),
            cols[4]?.trim(),
          ],

          answer:
            cols[5]?.trim(),

          subject:
            tForm.subject,

          level:
            tForm.level,

          createdAt:
            serverTimestamp(),
        };

        const docRef =
          await addDoc(
            collection(
              db,
              "questions"
            ),
            questionObj
          );

        uploaded.push({
          id: docRef.id,
          ...questionObj,
        });
      }

      if (uploaded.length > 0) {

        setQuestions((prev) => [
          ...prev,
          ...uploaded,
        ]);

        setUploadedCount(
          uploaded.length
        );

        alert(
          `${uploaded.length} Questions Uploaded`
        );

      } else {

        alert(
          "No valid questions found"
        );
      }

    } catch (err) {

      console.log(err);

      alert(
        "CSV Upload Failed"
      );

    } finally {

      setCsvLoading(false);
    }
  };

  // ================= CREATE TEST =================

  const handleTestSubmit =
    async (e) => {

      e.preventDefault();

      if (
        !tForm.title ||
        !tForm.subject ||
        !tForm.level ||
        !tForm.duration
      ) {

        alert(
          "Please fill all fields"
        );

        return;
      }

      if (uploadedCount === 0) {

        alert(
          "Upload Questions CSV First"
        );

        return;
      }

      // CHECK DUPLICATE TEST

      const duplicate = tests.find(
        (t) =>
          t.title
            .trim()
            .toLowerCase() ===
            tForm.title
              .trim()
              .toLowerCase() &&

          t.subject ===
            tForm.subject &&

          t.level ===
            tForm.level
      );

      if (duplicate) {

        alert(
          "Same Test Already Exists"
        );

        return;
      }

      const matchingQIds =
        questions
          .filter(
            (q) =>
              q.subject ===
                tForm.subject &&
              q.level ===
                tForm.level
          )
          .map((q) => q.id);

      if (
        matchingQIds.length === 0
      ) {

        alert(
          "No questions available"
        );

        return;
      }

      try {

        setLoading(true);

        const newTest = {
          title:
            tForm.title,
          subject:
            tForm.subject,
          level:
            tForm.level,
          duration:
            Number(
              tForm.duration
            ),
          questionIds:
            matchingQIds,
          status: "live",
          createdAt:
            serverTimestamp(),
        };

        const docRef =
          await addDoc(
            collection(
              db,
              "tests"
            ),
            newTest
          );

        setTests([
          ...tests,
          {
            id: docRef.id,
            ...newTest,
          },
        ]);

        alert(
          "Test Launched Successfully"
        );

        setTForm({
          title: "",
          subject: "",
          level: "",
          duration: "",
        });

        setUploadedCount(0);

      } catch (err) {

        console.log(err);

        alert(
          "Failed To Launch Test"
        );

      } finally {

        setLoading(false);
      }
    };

  // ================= DELETE TEST =================

  const handleDeleteTest =
    async (id) => {

      const confirmDelete =
        window.confirm(
          "Delete this test?"
        );

      if (!confirmDelete) return;

      try {

        await deleteDoc(
          doc(
            db,
            "tests",
            id
          )
        );

        setTests(
          tests.filter(
            (t) => t.id !== id
          )
        );

        alert(
          "Test Deleted"
        );

      } catch (err) {

        console.log(err);

        alert(
          "Delete Failed"
        );
      }
    };

  // ================= DELETE USER =================

  const handleDeleteUser =
    async (empId) => {

      const confirmDelete =
        window.confirm(
          "Delete User?"
        );

      if (!confirmDelete) return;

      try {

        await deleteDoc(
          doc(
            db,
            "users",
            empId
          )
        );

        alert(
          "User Deleted"
        );

        window.location.reload();

      } catch (err) {

        console.log(err);

        alert(
          "Delete Failed"
        );
      }
    };

  // ================= UI =================

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col lg:flex-row justify-between gap-5">

        <div>

          <h2 className="text-3xl font-black">
            Admin Panel
          </h2>

          <p className="text-slate-300 mt-2 text-sm">
            Manage Users, Tests & Analytics
          </p>

        </div>

        <button
          onClick={() =>
            setCurrentScreen(
              "dashboard"
            )
          }
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl font-black"
        >
          View Dashboard
        </button>

      </div>

      {/* TABS */}

      <div className="bg-white rounded-2xl border p-2 flex flex-wrap gap-2">

        {[
          "users",
          "launch-test",
          "live-tests",
        ].map((tab) => (

          <button
            key={tab}
            onClick={() =>
              setActiveTab(tab)
            }
            className={`px-5 py-3 rounded-xl font-bold transition ${
              activeTab === tab
                ? "bg-slate-900 text-white"
                : "hover:bg-slate-100"
            }`}
          >
            {tab}
          </button>

        ))}

      </div>

      {/* ================= USERS ================= */}

      {activeTab === "users" && (

        <div className="grid lg:grid-cols-3 gap-6">

          {/* LEFT */}

          <div className="bg-white rounded-3xl border p-5">

            <input
              type="text"
              placeholder="Search User"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              className="w-full border rounded-2xl px-4 py-3 font-semibold"
            />

            <div className="mt-5 space-y-3 max-h-[700px] overflow-y-auto">

              {filteredUsers.map(
                (user) => (

                  <button
                    key={user.empId}
                    onClick={() => {
                      setSelectedUser(
                        user
                      );

                      setSelectedAttempt(
                        null
                      );
                    }}
                    className={`w-full border rounded-2xl p-4 text-left transition ${
                      selectedUser?.empId ===
                      user.empId
                        ? "border-blue-600 bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >

                    <div className="flex justify-between items-center">

                      <div>

                        <h3 className="font-black">
                          {user.name}
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">
                          {
                            user.empId
                          }{" "}
                          |{" "}
                          {
                            user.dept
                          }
                        </p>

                      </div>

                      <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-black">
                        {user
                          ?.performance
                          ?.overall ||
                          0}
                        %
                      </div>

                    </div>

                  </button>
                )
              )}

            </div>

          </div>

          {/* RIGHT */}

          <div className="lg:col-span-2 bg-white rounded-3xl border p-6">

            {!selectedUser ? (

              <div className="h-full flex items-center justify-center text-slate-400 font-bold">
                Select User
              </div>

            ) : (

              <div>

                {/* TOP */}

                <div className="flex flex-col lg:flex-row justify-between gap-5 border-b pb-5">

                  <div>

                    <h2 className="text-3xl font-black">
                      {
                        selectedUser.name
                      }
                    </h2>

                    <p className="text-slate-500 mt-2">
                      {
                        selectedUser.empId
                      }{" "}
                      |{" "}
                      {
                        selectedUser.dept
                      }
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      handleDeleteUser(
                        selectedUser.empId
                      )
                    }
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl font-black"
                  >
                    Delete User
                  </button>

                </div>

                {/* PERFORMANCE */}

                <div className="grid md:grid-cols-4 gap-4 mt-6">

                  <div className="bg-slate-100 rounded-2xl p-5">
                    <p className="text-xs font-black text-slate-500 uppercase">
                      Overall
                    </p>

                    <h3 className="text-3xl font-black mt-2">
                      {selectedUser
                        ?.performance
                        ?.overall ||
                        0}
                      %
                    </h3>
                  </div>

                  <div className="bg-blue-100 rounded-2xl p-5">
                    <p className="text-xs font-black uppercase">
                      Beginner
                    </p>

                    <h3 className="text-3xl font-black mt-2">
                      {selectedUser
                        ?.performance
                        ?.Beginner ||
                        0}
                      %
                    </h3>
                  </div>

                  <div className="bg-orange-100 rounded-2xl p-5">
                    <p className="text-xs font-black uppercase">
                      Mid
                    </p>

                    <h3 className="text-3xl font-black mt-2">
                      {selectedUser
                        ?.performance
                        ?.Mid ||
                        0}
                      %
                    </h3>
                  </div>

                  <div className="bg-emerald-100 rounded-2xl p-5">
                    <p className="text-xs font-black uppercase">
                      Advanced
                    </p>

                    <h3 className="text-3xl font-black mt-2">
                      {selectedUser
                        ?.performance
                        ?.Advanced ||
                        0}
                      %
                    </h3>
                  </div>

                </div>

                {/* ATTEMPTS */}

                <div className="mt-8">

                  <h3 className="text-xl font-black mb-5">
                    Test Attempts
                  </h3>

                  <div className="space-y-4">

                    {selectedUser
                      ?.attempts
                      ?.length > 0 ? (

                      selectedUser.attempts
                        .slice()
                        .reverse()
                        .map(
                          (
                            attempt,
                            index
                          ) => (

                            <div
                              key={
                                index
                              }
                              className="border rounded-2xl p-5"
                            >

                              <div className="flex flex-col lg:flex-row justify-between gap-5">

                                <div>

                                  <h4 className="font-black text-lg">
                                    {
                                      attempt.testTitle
                                    }
                                  </h4>

                                  <p className="text-sm text-slate-500 mt-1">
                                    {
                                      attempt.subject
                                    }{" "}
                                    |{" "}
                                    {
                                      attempt.level
                                    }
                                  </p>

                                  <p className="text-xs text-slate-400 mt-2">
                                    {
                                      attempt.submittedAt
                                    }
                                  </p>

                                </div>

                                <div className="text-right">

                                  <div className="text-4xl font-black text-blue-600">
                                    {
                                      attempt.score
                                    }
                                    %
                                  </div>

                                  <p className="text-xs text-slate-500 mt-1">
                                    {
                                      attempt.correctAnswers
                                    }
                                    /
                                    {
                                      attempt.totalQuestions
                                    }{" "}
                                    Correct
                                  </p>

                                </div>

                              </div>

                              {/* ANSWER SHEET */}

                              {attempt.answerSheet &&
                                (
                                  <div className="mt-6 space-y-4">

                                    <h4 className="font-black text-slate-800">
                                      Submitted Answers
                                    </h4>

                                    {attempt.answerSheet.map(
                                      (
                                        ans,
                                        idx
                                      ) => (

                                        <div
                                          key={
                                            idx
                                          }
                                          className={`border rounded-2xl p-5 ${
                                            ans.isCorrect
                                              ? "border-emerald-300 bg-emerald-50"
                                              : "border-red-300 bg-red-50"
                                          }`}
                                        >

                                          <h5 className="font-black text-slate-900">
                                            Q
                                            {idx +
                                              1}
                                            .{" "}
                                            {
                                              ans.question
                                            }
                                          </h5>

                                          <div className="mt-4 space-y-2 text-sm">

                                            <p>
                                              <span className="font-black">
                                                User
                                                Answer:
                                              </span>{" "}
                                              {
                                                ans.userAnswer
                                              }
                                            </p>

                                            <p>
                                              <span className="font-black">
                                                Correct
                                                Answer:
                                              </span>{" "}
                                              {
                                                ans.correctAnswer
                                              }
                                            </p>

                                            <p
                                              className={`font-black ${
                                                ans.isCorrect
                                                  ? "text-emerald-700"
                                                  : "text-red-700"
                                              }`}
                                            >
                                              {ans.isCorrect
                                                ? "Correct"
                                                : "Wrong"}
                                            </p>

                                          </div>

                                        </div>
                                      )
                                    )}

                                  </div>
                                )}

                            </div>
                          )
                        )

                    ) : (

                      <p className="text-slate-400">
                        No Attempts
                      </p>

                    )}

                  </div>

                </div>

              </div>

            )}

          </div>

        </div>
      )}

      {/* ================= LAUNCH TEST ================= */}

      {activeTab ===
        "launch-test" && (

        <div className="bg-white rounded-3xl border p-8 max-w-4xl mx-auto">

          <h2 className="text-3xl font-black">
            Launch Test
          </h2>

          {/* CSV */}

          <div className="mt-8 bg-slate-50 border rounded-3xl p-6">

            <h3 className="font-black text-lg">
              Upload Questions CSV
            </h3>

            <input
              type="file"
              accept=".csv"
              onChange={
                handleCSVUpload
              }
              className="mt-5 w-full border rounded-2xl px-4 py-4 bg-white"
            />

            <p className="text-sm text-slate-500 mt-4 leading-7">
              CSV Format:
              <br />
              question,option1,option2,option3,option4,answer
            </p>

            {csvLoading && (
              <p className="mt-4 text-blue-600 font-black">
                Uploading...
              </p>
            )}

            {uploadedCount >
              0 && (
              <p className="mt-4 text-emerald-600 font-black">
                {
                  uploadedCount
                }{" "}
                Questions Uploaded
              </p>
            )}

          </div>

          {/* FORM */}

          <form
            onSubmit={
              handleTestSubmit
            }
            className="mt-8 space-y-6"
          >

            <div>

              <label className="font-black text-sm block mb-2">
                Test Title
              </label>

              <input
                type="text"
                value={
                  tForm.title
                }
                onChange={(e) =>
                  setTForm({
                    ...tForm,
                    title:
                      e.target.value,
                  })
                }
                className="w-full border rounded-2xl px-5 py-4 font-bold"
                placeholder="Enter Test Name"
              />

            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <div>

                <label className="font-black text-sm block mb-2">
                  Subject
                </label>

                <input
                  type="text"
                  value={
                    tForm.subject
                  }
                  onChange={(e) =>
                    setTForm({
                      ...tForm,
                      subject:
                        e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="ENTER SUBJECT"
                  className="w-full border rounded-2xl px-5 py-4 font-black uppercase"
                />

              </div>

              <div>

                <label className="font-black text-sm block mb-2">
                  Level
                </label>

                <select
                  value={
                    tForm.level
                  }
                  onChange={(e) =>
                    setTForm({
                      ...tForm,
                      level:
                        e.target.value,
                    })
                  }
                  className="w-full border rounded-2xl px-5 py-4 bg-white font-bold"
                >

                  <option value="">
                    Select Level
                  </option>

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

              <label className="font-black text-sm block mb-2">
                Duration
                (Minutes)
              </label>

              <input
                type="number"
                value={
                  tForm.duration
                }
                onChange={(e) =>
                  setTForm({
                    ...tForm,
                    duration:
                      e.target.value,
                  })
                }
                placeholder="Enter Minutes"
                className="w-full border rounded-2xl px-5 py-4 font-bold"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black uppercase"
            >

              {loading
                ? "Launching..."
                : "Launch Test"}

            </button>

          </form>

        </div>
      )}

      {/* ================= LIVE TESTS ================= */}

      {activeTab ===
        "live-tests" && (

        <div className="bg-white rounded-3xl border p-6">

          <h2 className="text-3xl font-black mb-8">
            Live Tests
          </h2>

          <div className="space-y-5">

            {tests.length ===
            0 ? (

              <p className="text-slate-400">
                No Tests Available
              </p>

            ) : (

              tests.map((test) => (

                <div
                  key={test.id}
                  className="border rounded-3xl p-6 flex flex-col lg:flex-row justify-between gap-5"
                >

                  <div>

                    <h3 className="text-2xl font-black">
                      {
                        test.title
                      }
                    </h3>

                    <div className="flex flex-wrap gap-3 mt-4">

                      <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-xs font-black uppercase">
                        {
                          test.subject
                        }
                      </span>

                      <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-xs font-black uppercase">
                        {
                          test.level
                        }
                      </span>

                      <span className="bg-slate-100 px-4 py-2 rounded-full text-xs font-black uppercase">
                        {
                          test.duration
                        }{" "}
                        Minutes
                      </span>

                    </div>

                  </div>

                  <button
                    onClick={() =>
                      handleDeleteTest(
                        test.id
                      )
                    }
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl font-black h-fit"
                  >
                    Delete
                  </button>

                </div>
              ))
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminPanel;