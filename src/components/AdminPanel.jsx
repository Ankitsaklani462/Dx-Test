import { useState, useMemo } from "react";
import { db } from "../firebase";

import {
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  collection,
} from "firebase/firestore";

import {
  ChevronDown,
  ChevronUp,
  Trash2
} from "lucide-react";

function AdminPanel({
  users = [],
  setUsers,
  questions = [],
  tests = [],
  setTests,
  setCurrentScreen,
  setQuestions,
}) {

  const [activeTab, setActiveTab] = useState("users");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);

  const [expandedAttempt, setExpandedAttempt] = useState(null);

  const [loading, setLoading] = useState(false);

  const [csvLoading, setCsvLoading] = useState(false);

  const [tForm, setTForm] = useState({
    title: "",
    subject: "",
    level: "Beginner",
    duration: ""
  });

  // ================= PERFORMANCE =================

  const performance = useMemo(() => {

    if (
      !selectedUser?.attempts ||
      selectedUser.attempts.length === 0
    ) {

      return {
        overall: 0,
        Beginner: 0,
        Mid: 0,
        Advanced: 0
      };

    }

    const attempts = selectedUser.attempts;

    const stats = {
      Beginner: [],
      Mid: [],
      Advanced: []
    };

    attempts.forEach((att) => {

      const score =
        Number(att.percentage || att.score) || 0;

      if (
        att.level &&
        stats[att.level]
      ) {

        stats[att.level].push(score);

      }

    });

    const getAvg = (arr) =>
      arr.length
        ? Math.round(
            arr.reduce((a, b) => a + b, 0) /
            arr.length
          )
        : 0;

    return {

      overall: getAvg(
        attempts.map(
          (a) =>
            Number(a.percentage || a.score) || 0
        )
      ),

      Beginner: getAvg(stats.Beginner),

      Mid: getAvg(stats.Mid),

      Advanced: getAvg(stats.Advanced),

    };

  }, [selectedUser]);

  // ================= FILTER USERS =================

  const filteredUsers = users.filter(
    (u) =>
      u.role !== "admin" &&
      (
        (u.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||

        (u.empId || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
  );

  // ================= DELETE USER =================

  const handleDeleteUser = async (
    e,
    userId
  ) => {

    e.stopPropagation();

    if (
      window.confirm(
        "Are you sure you want to delete this user?"
      )
    ) {

      try {

        await deleteDoc(
          doc(db, "users", userId)
        );

        setUsers(
          users.filter((u) => u.id !== userId)
        );

        if (selectedUser?.id === userId) {

          setSelectedUser(null);

        }

        alert("User deleted successfully");

      } catch (err) {

        console.log(err);

        alert("Failed to delete user");

      }
    }
  };

  // ================= CSV UPLOAD =================

  const handleCSVUpload = async (e) => {

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

      const text = await file.text();

      const rows = text
        .replace(/\r/g, "")
        .split("\n")
        .filter((r) => r.trim() !== "");

      const uploaded = [];

      for (let i = 1; i < rows.length; i++) {

        const cols = rows[i].split(",");

        if (cols.length < 6) continue;

        const qObj = {

          question: cols[0]?.trim(),

          options: [
            cols[1]?.trim(),
            cols[2]?.trim(),
            cols[3]?.trim(),
            cols[4]?.trim(),
          ],

          answer: cols[5]?.trim(),

          subject: tForm.subject,

          level: tForm.level,

          createdAt: serverTimestamp(),

        };

        const docRef = await addDoc(
          collection(db, "questions"),
          qObj
        );

        uploaded.push({
          id: docRef.id,
          ...qObj
        });

      }

      setQuestions((prev) => [
        ...prev,
        ...uploaded
      ]);

      alert(
        `${uploaded.length} Questions Uploaded`
      );

    } catch (err) {

      console.log(err);

      alert("CSV Upload Failed");

    } finally {

      setCsvLoading(false);

    }
  };

  // ================= TEST SUBMIT =================

  const handleTestSubmit = async (e) => {

    e.preventDefault();

    if (
      !tForm.title ||
      !tForm.subject ||
      !tForm.level ||
      !tForm.duration
    ) {

      alert("Please fill all fields");

      return;

    }

    const qIds = questions
      .filter(
        (q) =>
          q.subject?.toUpperCase() ===
            tForm.subject.toUpperCase() &&
          q.level === tForm.level
      )
      .map((q) => q.id);

    if (qIds.length === 0) {

      alert(
        "No questions found for this Subject & Level"
      );

      return;

    }

    try {

      setLoading(true);

      const newTest = {

        ...tForm,

        duration: Number(
          tForm.duration
        ),

        questionIds: qIds,

        status: "live",

        createdAt: serverTimestamp(),

      };

      const docRef = await addDoc(
        collection(db, "tests"),
        newTest
      );

      setTests([
        ...tests,
        {
          id: docRef.id,
          ...newTest
        }
      ]);

      alert("Test Launched Successfully!");

      setTForm({
        title: "",
        subject: "",
        level: "Beginner",
        duration: ""
      });

    } catch (err) {

      console.error(err);

      alert("Error launching test");

    } finally {

      setLoading(false);

    }
  };

  // ================= DELETE TEST =================

  const handleDeleteTest = async (id) => {

    if (
      !window.confirm(
        "Are you sure you want to delete this test?"
      )
    ) return;

    try {

      await deleteDoc(
        doc(db, "tests", id)
      );

      setTests((prev) =>
        prev.filter((t) => t.id !== id)
      );

      alert("Test deleted successfully");

    } catch (err) {

      console.error(err);

      alert("Failed to delete test");

    }
  };

  // ================= UI =================

  return (

    <div className="w-full space-y-5 sm:space-y-6 overflow-x-hidden">

      {/* HEADER */}

      <div className="bg-slate-900 text-white p-4 sm:p-6 rounded-3xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">

        <h2 className="text-2xl sm:text-3xl font-black break-words">

          Admin Panel

        </h2>

        <button
          onClick={() =>
            setCurrentScreen("dashboard")
          }
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-4 sm:px-5 py-3 rounded-2xl font-black text-sm sm:text-base"
        >

          Dashboard

        </button>

      </div>

      {/* TABS */}

      <div className="bg-white rounded-2xl border p-2 grid grid-cols-1 sm:grid-cols-3 gap-2">

        {[
          "users",
          "launch-test",
          "live-tests"
        ].map((tab) => (

          <button
            key={tab}
            onClick={() =>
              setActiveTab(tab)
            }
            className={`w-full px-4 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition ${
              activeTab === tab
                ? "bg-slate-900 text-white"
                : "hover:bg-slate-100"
            }`}
          >

            {tab.toUpperCase()}

          </button>

        ))}

      </div>

      {/* USERS */}

      {activeTab === "users" && (

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] gap-5 sm:gap-6">

          {/* LEFT */}

          <div className="bg-white rounded-3xl border p-4 sm:p-5 min-w-0">

            <input
              placeholder="Search User"
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="w-full border rounded-2xl px-4 py-3 text-sm sm:text-base"
            />

            <div className="mt-5 space-y-3 max-h-[420px] sm:max-h-[600px] overflow-y-auto">

              {filteredUsers.map((u) => (

                <div
                  key={u.id}
                  className={`w-full flex items-center justify-between border rounded-2xl p-4 gap-3 ${
                    selectedUser?.id === u.id
                      ? "border-blue-600 bg-blue-50"
                      : ""
                  }`}
                >

                  <button
                    className="flex-1 text-left min-w-0"
                    onClick={() => {

                      setSelectedUser(u);

                      setExpandedAttempt(null);

                    }}
                  >

                    <h3 className="font-black text-sm sm:text-base break-words">

                      {u.name}

                    </h3>

                    <p className="text-xs text-slate-500 break-words">

                      {u.empId}

                    </p>

                  </button>

                  <button
                    onClick={(e) =>
                      handleDeleteUser(
                        e,
                        u.id
                      )
                    }
                    className="text-red-500 p-2 hover:bg-red-50 rounded-lg flex-shrink-0"
                  >

                    <Trash2 size={18} />

                  </button>

                </div>

              ))}

            </div>

          </div>

          {/* RIGHT */}

          <div className="bg-white rounded-3xl border p-4 sm:p-6 min-w-0">

            {!selectedUser ? (

              <div className="text-slate-400 text-center py-20">

                Select User

              </div>

            ) : (

              <div>

                <h2 className="text-2xl sm:text-3xl font-black mb-6 break-words">

                  {selectedUser.name} Analytics

                </h2>

                {/* STATS */}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

                  {Object.entries(performance).map(
                    ([k, v]) => (

                      <div
                        key={k}
                        className="bg-slate-100 rounded-2xl p-4 sm:p-5"
                      >

                        <p className="text-[10px] sm:text-xs font-black uppercase">

                          {k}

                        </p>

                        <h3 className="text-2xl sm:text-3xl font-black mt-2">

                          {v}%

                        </h3>

                      </div>

                    )
                  )}

                </div>

                {/* ATTEMPTS */}

                <div className="space-y-4">

                  {[...(selectedUser.attempts || [])]
                    .reverse()
                    .map((a, i) => (

                      <div
                        key={i}
                        className="border rounded-2xl p-4 sm:p-5"
                      >

                        <div
                          className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center cursor-pointer"
                          onClick={() =>
                            setExpandedAttempt(
                              expandedAttempt === i
                                ? null
                                : i
                            )
                          }
                        >

                          <div className="min-w-0">

                            <h4 className="font-black break-words">

                              {a.testTitle}

                            </h4>

                            <p className="text-sm text-slate-500 break-words">

                              {a.subject} • {a.level}

                            </p>

                          </div>

                          <div className="flex items-center gap-3">

                            <span className="font-black text-blue-600 text-lg">

                              {a.percentage || a.score}%

                            </span>

                            {expandedAttempt === i
                              ? <ChevronUp size={18} />
                              : <ChevronDown size={18} />
                            }

                          </div>

                        </div>

                        {expandedAttempt === i && (

                          <div className="mt-4 pt-4 border-t space-y-3">

                            {a.answers?.map(
                              (ans, qIdx) => (

                                <div
                                  key={qIdx}
                                  className={`p-3 rounded-xl border ${
                                    ans.isCorrect
                                      ? "bg-emerald-50 border-emerald-200"
                                      : "bg-red-50 border-red-200"
                                  }`}
                                >

                                  <p className="font-bold text-sm break-words">

                                    Q{qIdx + 1}.{" "}
                                    {ans.questionText}

                                  </p>

                                  <p className="text-sm mt-1 break-words">

                                    Your Answer:
                                    <span className="font-bold ml-1">
                                      {ans.selectedAnswer}
                                    </span>

                                  </p>

                                  {!ans.isCorrect && (

                                    <p className="text-sm mt-1 text-emerald-700 font-bold break-words">

                                      Correct Answer:
                                      {" "}
                                      {ans.correctAnswer}

                                    </p>

                                  )}

                                </div>

                              )
                            )}

                          </div>

                        )}

                      </div>

                    ))}

                </div>

              </div>

            )}

          </div>

        </div>

      )}

      {/* LAUNCH TEST */}

      {activeTab === "launch-test" && (

        <div className="bg-white rounded-3xl border shadow-xl p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">

          <div className="mb-8">

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">

              Launch New Test

            </h2>

            <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">

              Configure parameters and upload questions CSV

            </p>

          </div>

          <form
            onSubmit={handleTestSubmit}
            className="space-y-5"
          >

            {/* TITLE */}

            <div>

              <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">

                Test Title

              </label>

              <input
                value={tForm.title}
                onChange={(e) =>
                  setTForm({
                    ...tForm,
                    title: e.target.value
                  })
                }
                placeholder="Weekly Aptitude Challenge"
                className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 transition font-bold text-sm sm:text-base"
              />

            </div>

            {/* GRID */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              <div>

                <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">

                  Subject

                </label>

                <input
                  value={tForm.subject}
                  onChange={(e) =>
                    setTForm({
                      ...tForm,
                      subject:
                        e.target.value.toUpperCase()
                    })
                  }
                  placeholder="HTML"
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 transition font-bold text-sm sm:text-base"
                />

              </div>

              <div>

                <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">

                  Duration

                </label>

                <input
                  type="number"
                  value={tForm.duration}
                  onChange={(e) =>
                    setTForm({
                      ...tForm,
                      duration: e.target.value
                    })
                  }
                  placeholder="30"
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 transition font-bold text-sm sm:text-base"
                />

              </div>

              <div>

                <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">

                  Level

                </label>

                <select
                  value={tForm.level}
                  onChange={(e) =>
                    setTForm({
                      ...tForm,
                      level: e.target.value
                    })
                  }
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 bg-white focus:border-blue-500 transition font-bold text-sm sm:text-base"
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

            {/* CSV */}

            <div>

              <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">

                Questions CSV File

              </label>

              <div
                className={`border-2 rounded-2xl p-4 sm:p-6 transition ${
                  csvLoading
                    ? "border-blue-500 bg-blue-50"
                    : "border-dashed border-slate-200"
                }`}
              >

                <input
                  type="file"
                  onChange={handleCSVUpload}
                  disabled={csvLoading}
                  className="w-full text-xs sm:text-sm"
                />

                {csvLoading && (

                  <div className="mt-3 text-blue-700 font-black animate-pulse text-sm">

                    Processing CSV...

                  </div>

                )}

              </div>

            </div>

            {/* BUTTON */}

            <button
              type="submit"
              disabled={loading || csvLoading}
              className={`w-full py-4 sm:py-5 rounded-2xl font-black text-sm sm:text-lg transition shadow-lg ${
                loading || csvLoading
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >

              {loading
                ? "Launching Test..."
                : csvLoading
                ? "Wait, Processing File..."
                : "LAUNCH TEST NOW"
              }

            </button>

          </form>

        </div>

      )}

      {/* LIVE TESTS */}

      {activeTab === "live-tests" && (

        <div className="bg-white rounded-3xl border p-4 sm:p-6">

          <h2 className="text-2xl sm:text-3xl font-black mb-8">

            Live Tests

          </h2>

          <div className="space-y-4">

            {tests.map((t) => (

              <div
                key={t.id}
                className="border rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-4 sm:items-center"
              >

                <div className="min-w-0">

                  <h3 className="text-xl sm:text-2xl font-black break-words">

                    {t.title}

                  </h3>

                  <p className="text-sm sm:text-base break-words">

                    {t.subject} | {t.level}

                  </p>

                </div>

                <button
                  onClick={() =>
                    handleDeleteTest(t.id)
                  }
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl font-black text-sm sm:text-base"
                >

                  Delete

                </button>

              </div>

            ))}

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminPanel;
