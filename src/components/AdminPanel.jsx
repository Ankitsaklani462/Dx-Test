import { useState, useMemo } from "react";
import { db } from "../firebase";
import { addDoc, serverTimestamp, deleteDoc, doc, collection, updateDoc } from "firebase/firestore";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

function AdminPanel({ users = [], setUsers, questions = [], setQuestions, tests = [], setTests, setCurrentScreen }) {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", empId: "", department: "", password: "" });
  const [tForm, setTForm] = useState({ title: "", subject: "", level: "Beginner", duration: "" });
  const [uploadedQuestions, setUploadedQuestions] = useState([]);
  const [expandedTestId, setExpandedTestId] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [qForm, setQForm] = useState({ question: "", options: [], correctAnswer: "" });

  const parseCSV = (csvText) => {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((item) => item.trim());
      return headers.reduce((row, header, index) => {
        row[header] = values[index] ?? "";
        return row;
      }, {});
    });
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload a CSV file.");
      return;
    }

    if (!tForm.subject || !tForm.level) {
      alert("Please fill Subject & Level first");
      return;
    }

    setCsvLoading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const formatted = rows
        .filter((row) => row.question)
        .map((row) => ({
          question: row.question,
          subject: tForm.subject,
          level: tForm.level,
          options: [
            row.optiona || row.optionA || "",
            row.optionb || row.optionB || "",
            row.optionc || row.optionC || "",
            row.optiond || row.optionD || ""
          ].filter(Boolean),
          correctAnswer: row.correctanswer || row.correctAnswer || row.answer || ""
        }));

      if (!formatted.length) {
        alert("No valid question rows found in CSV.");
        setUploadedQuestions([]);
        return;
      }

      setUploadedQuestions(formatted);
      alert(`${formatted.length} questions ready for test launch.`);
    } catch (err) {
      console.error(err);
      alert("Could not read CSV file.");
    } finally {
      setCsvLoading(false);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    if (!tForm.title || !tForm.subject || !tForm.duration || uploadedQuestions.length === 0) {
      alert("Please fill in all fields and upload a questions CSV file.");
      return;
    }

    setLoading(true);
    try {
      const questionRefs = await Promise.all(
        uploadedQuestions.map((question) =>
          addDoc(collection(db, "questions"), {
            ...question,
            createdAt: serverTimestamp(),
          })
        )
      );

      const questionIds = questionRefs.map((ref) => ref.id);
      const newTest = {
        title: tForm.title,
        subject: tForm.subject,
        level: tForm.level,
        duration: Number(tForm.duration),
        questionIds,
        createdAt: serverTimestamp(),
      };

      const testRef = await addDoc(collection(db, "tests"), newTest);
      setQuestions((prev) => [
        ...prev,
        ...uploadedQuestions.map((question, index) => ({ id: questionIds[index], ...question }))
      ]);
      setTests((prev) => [...prev, { id: testRef.id, ...newTest }]);
      setTForm({ title: "", subject: "", level: "Beginner", duration: "" });
      setUploadedQuestions([]);
      alert("Test launched successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to launch test.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm("Delete this test?")) return;
    try {
      await deleteDoc(doc(db, "tests", testId));
      setTests((prev) => prev.filter((t) => t.id !== testId));
      alert("Test deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete test.");
    }
  };

  const openManageTest = (testId) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
    setEditingQuestionId(null);
  };

  const handleEditQuestionOpen = (q) => {
    setEditingQuestionId(q.id);
    setQForm({ question: q.question || q.questionText || "", options: q.options || [], correctAnswer: q.correctAnswer || q.answer || "" });
  };

  const handleSaveQuestion = async (testId) => {
    if (!editingQuestionId) return;
    try {
      const qRef = doc(db, "questions", editingQuestionId);
      const updated = { question: qForm.question, options: qForm.options.filter(Boolean), correctAnswer: qForm.correctAnswer, answer: qForm.correctAnswer };
      await updateDoc(qRef, updated);
      setQuestions((prev) => prev.map((p) => (p.id === editingQuestionId ? { ...p, ...updated } : p)));
      setEditingQuestionId(null);
      alert("Question updated successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to update question.");
    }
  };

  const handleDeleteQuestion = async (e, testId, questionId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this question?")) return;
    try {
      // remove question doc
      await deleteDoc(doc(db, "questions", questionId));
      // update local questions state
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      // remove from test's questionIds both locally and in firestore
      const testRef = doc(db, "tests", testId);
      const testObj = tests.find((t) => t.id === testId);
      if (testObj) {
        const newIds = (testObj.questionIds || []).filter((id) => id !== questionId);
        await updateDoc(testRef, { questionIds: newIds });
        setTests((prev) => prev.map((t) => (t.id === testId ? { ...t, questionIds: newIds } : t)));
      }
      alert("Question deleted.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete question.");
    }
  };

  const handleAddQuestion = async (testId) => {
    try {
      const newQ = { question: "New question", options: ["Option 1", "Option 2"], correctAnswer: "Option 1", answer: "Option 1", createdAt: serverTimestamp() };
      const qRef = await addDoc(collection(db, "questions"), newQ);
      const newId = qRef.id;
      setQuestions((prev) => [...prev, { id: newId, ...newQ }]);

      const testRef = doc(db, "tests", testId);
      const testObj = tests.find((t) => t.id === testId);
      if (testObj) {
        const newIds = [...(testObj.questionIds || []), newId];
        await updateDoc(testRef, { questionIds: newIds });
        setTests((prev) => prev.map((t) => (t.id === testId ? { ...t, questionIds: newIds } : t)));
      }

      // Open edit for the new question
      openManageTest(testId);
      setEditingQuestionId(newId);
      setQForm({ question: newQ.question, options: newQ.options, correctAnswer: newQ.correctAnswer });
    } catch (err) {
      console.error(err);
      alert("Failed to add question.");
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await updateDoc(doc(db, "users", selectedUser.id), editForm);
      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, ...editForm } : u)));
      setSelectedUser({ ...selectedUser, ...editForm });
      setIsEditing(false);
      alert("User details updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = async (e, userId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter((u) => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      alert("User deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete user.");
    }
  };

  const handleDeleteAttempt = async (e, originalIndex) => {
    e.stopPropagation();
    if (!window.confirm("Delete this test attempt?")) return;
    if (!selectedUser) return;

    try {
      const updatedAttempts = selectedUser.attempts.filter((_, i) => i !== originalIndex);
      await updateDoc(doc(db, "users", selectedUser.id), { attempts: updatedAttempts });
      const updatedUser = { ...selectedUser, attempts: updatedAttempts };
      setSelectedUser(updatedUser);
      setUsers(users.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      alert("Attempt deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete attempt.");
    }
  };

  const performance = useMemo(() => {
    if (!selectedUser?.attempts || selectedUser.attempts.length === 0) {
      return { overall: 0, Beginner: 0, Mid: 0, Advanced: 0 };
    }

    const stats = { Beginner: [], Mid: [], Advanced: [] };
    selectedUser.attempts.forEach((att) => {
      const score = Number(att.percentage || att.score) || 0;
      if (att.level && stats[att.level]) stats[att.level].push(score);
    });

    const getAvg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
    return {
      overall: getAvg(selectedUser.attempts.map((a) => Number(a.percentage || a.score) || 0)),
      Beginner: getAvg(stats.Beginner),
      Mid: getAvg(stats.Mid),
      Advanced: getAvg(stats.Advanced),
    };
  }, [selectedUser]);

  const filteredUsers = users.filter(
    (u) =>
      u.role !== "admin" &&
      ((u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.empId || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full space-y-6 p-4">
      <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-3xl font-black">Admin Panel</h2>
          <p className="text-slate-300 mt-1 text-sm">Manage users, launch tests, and review live tests.</p>
        </div>
        <button onClick={() => setCurrentScreen("dashboard")} className="bg-blue-600 px-5 py-3 rounded-2xl font-black">Dashboard</button>
      </div>

      <div className="bg-slate-950 p-4 rounded-3xl flex flex-wrap gap-3">
        {[
          { key: "users", label: "Users" },
          { key: "launch-test", label: "Launch Test" },
          { key: "live-tests", label: "Live Tests" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 rounded-2xl font-black transition ${
              activeTab === tab.key ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-200 hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
          <div className="bg-white rounded-3xl border p-5">
            <input
              placeholder="Search User"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-2xl p-3"
            />
            <div className="mt-5 space-y-3 max-h-[560px] overflow-y-auto">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className={`p-4 border rounded-2xl flex justify-between items-center cursor-pointer ${
                    selectedUser?.id === u.id ? "bg-blue-50 border-blue-600" : ""
                  }`}
                  onClick={() => {
                    setSelectedUser(u);
                    setIsEditing(false);
                    setExpandedAttempt(null);
                  }}
                >
                  <div>
                    <h3 className="font-black">{u.name}</h3>
                    <p className="text-xs text-slate-500">{u.empId}</p>
                  </div>
                  <button onClick={(e) => handleDeleteUser(e, u.id)} className="text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border p-6">
            {!selectedUser ? (
              <p className="text-slate-400">Select a user</p>
            ) : (
              <div>
                {isEditing ? (
                  <div className="space-y-3 mb-6 p-4 border rounded-2xl">
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full border p-2 rounded-lg" placeholder="Name" />
                    <input value={editForm.empId} onChange={(e) => setEditForm({ ...editForm, empId: e.target.value })} className="w-full border p-2 rounded-lg" placeholder="Emp ID" />
                    <input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="w-full border p-2 rounded-lg" placeholder="Department" />
                    <input value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="w-full border p-2 rounded-lg" placeholder="Password" />
                    <div className="pt-2">
                      <button onClick={handleUpdateUser} className="bg-green-600 text-white px-4 py-2 rounded-lg">Save Changes</button>
                      <button onClick={() => setIsEditing(false)} className="ml-2 bg-slate-200 px-4 py-2 rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-black">{selectedUser.name}</h2>
                      <p className="text-sm text-slate-500">{selectedUser.department || selectedUser.dept || ""} | ID: {selectedUser.empId}</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditForm({
                          name: selectedUser.name,
                          empId: selectedUser.empId,
                          department: selectedUser.department || selectedUser.dept || "",
                          password: selectedUser.password || "",
                        });
                        setIsEditing(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Edit Profile
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-4 mb-6">
                  {Object.entries(performance).map(([k, v]) => (
                    <div key={k} className="bg-slate-100 p-4 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase">{k}</p>
                      <h3 className="font-black text-xl">{v}%</h3>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {[...(selectedUser.attempts || [])]
                    .map((a, idx) => ({ ...a, originalIndex: idx }))
                    .reverse()
                    .map((a, i) => (
                      <div key={i} className="border rounded-2xl p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
                          <div className="flex-1 cursor-pointer min-w-0" onClick={() => setExpandedAttempt(expandedAttempt === i ? null : i)}>
                            <h4 className="font-black break-words">{a.testTitle}</h4>
                            <p className="text-sm text-slate-500 break-words">{a.subject} � {a.level}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-black text-blue-600 text-lg">{a.percentage || a.score}%</span>
                            <button onClick={(e) => handleDeleteAttempt(e, a.originalIndex)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition">
                              <Trash2 size={18} />
                            </button>
                            <div className="cursor-pointer p-1" onClick={() => setExpandedAttempt(expandedAttempt === i ? null : i)}>
                              {expandedAttempt === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          </div>
                        </div>
                        {expandedAttempt === i && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            {a.answers?.map((ans, qIdx) => (
                              <div key={qIdx} className={`p-3 rounded-xl border ${ans.isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                                <p className="font-bold text-sm break-words">Q{qIdx + 1}. {ans.questionText}</p>
                                <p className="text-sm mt-1 break-words">Your Answer: <span className="font-bold ml-1">{ans.selectedAnswer}</span></p>
                                {!ans.isCorrect && <p className="text-sm mt-1 text-emerald-700 font-bold break-words">Correct Answer: {ans.correctAnswer}</p>}
                              </div>
                            ))}
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

      {activeTab === "launch-test" && (
        <div className="bg-white rounded-3xl border shadow-xl p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Launch New Test</h2>
            <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">Configure parameters and upload questions CSV</p>
          </div>

          <form onSubmit={handleTestSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">Test Title</label>
              <input value={tForm.title} onChange={(e) => setTForm({ ...tForm, title: e.target.value })} placeholder="Weekly Aptitude Challenge" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 transition font-bold text-sm sm:text-base" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">Subject</label>
                <input value={tForm.subject} onChange={(e) => setTForm({ ...tForm, subject: e.target.value.toUpperCase() })} placeholder="HTML" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 transition font-bold text-sm sm:text-base" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">Duration</label>
                <input type="number" value={tForm.duration} onChange={(e) => setTForm({ ...tForm, duration: e.target.value })} placeholder="30" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 transition font-bold text-sm sm:text-base" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">Level</label>
                <select value={tForm.level} onChange={(e) => setTForm({ ...tForm, level: e.target.value })} className="w-full border-2 border-slate-100 rounded-2xl p-4 bg-white focus:border-blue-500 transition font-bold text-sm sm:text-base">
                  <option value="Beginner">Beginner</option>
                  <option value="Mid">Mid</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">Questions CSV File</label>
              <div className={`border-2 rounded-2xl p-4 sm:p-6 transition ${csvLoading ? "border-blue-500 bg-blue-50" : "border-dashed border-slate-200"}`}>
                <input type="file" onChange={handleCSVUpload} disabled={csvLoading} className="w-full text-xs sm:text-sm" />
                {csvLoading && <div className="mt-3 text-blue-700 font-black animate-pulse text-sm">Processing CSV...</div>}
                {uploadedQuestions.length > 0 && !csvLoading && <p className="mt-3 text-sm text-slate-500">{uploadedQuestions.length} questions loaded and ready for launch.</p>}
              </div>
            </div>

            <button type="submit" disabled={loading || csvLoading} className={`w-full py-4 sm:py-5 rounded-2xl font-black text-sm sm:text-lg transition shadow-lg ${loading || csvLoading ? "bg-slate-300 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
              {loading ? "Launching Test..." : csvLoading ? "Wait, Processing File..." : "LAUNCH TEST NOW"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "live-tests" && (
        <div className="bg-white rounded-3xl border p-4 sm:p-6">
          <h2 className="text-2xl sm:text-3xl font-black mb-8">Live Tests</h2>
          <div className="space-y-4">
            {tests.map((t) => (
              <div key={t.id} className="border rounded-3xl p-4 sm:p-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl font-black break-words">{t.title}</h3>
                    <p className="text-sm sm:text-base break-words">{t.subject} | {t.level}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openManageTest(t.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl font-black text-sm">{expandedTestId === t.id ? 'Close' : 'Manage'}</button>
                    <button onClick={() => handleDeleteTest(t.id)} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl font-black text-sm sm:text-base">Delete</button>
                  </div>
                </div>

                {expandedTestId === t.id && (
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-end">
                      <button onClick={() => handleAddQuestion(t.id)} className="bg-green-600 text-white px-3 py-1 rounded-2xl font-black text-sm">+ Add Question</button>
                    </div>
                    {(questions.filter((q) => (t.questionIds || []).includes(q.id)) || []).map((q) => (
                      <div key={q.id} className="border rounded-2xl p-3 bg-slate-50">
                        {editingQuestionId === q.id ? (
                          <div className="space-y-2">
                            <input value={qForm.question} onChange={(e) => setQForm({ ...qForm, question: e.target.value })} className="w-full border p-2 rounded-lg" />
                            <div className="space-y-1">
                              {(qForm.options || []).map((opt, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                  <input value={opt} onChange={(e) => setQForm({ ...qForm, options: qForm.options.map((o, i) => (i === idx ? e.target.value : o)) })} className="flex-1 border p-2 rounded-lg" />
                                  <button onClick={() => setQForm({ ...qForm, options: qForm.options.filter((_, i) => i !== idx) })} className="text-red-500 px-2">Delete</button>
                                </div>
                              ))}
                              <button onClick={() => setQForm({ ...qForm, options: [...(qForm.options || []), ""] })} className="text-sm text-blue-600">+ Add Option</button>
                            </div>
                            <div>
                              <label className="text-xs">Correct Answer</label>
                              <input value={qForm.correctAnswer} onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })} className="w-full border p-2 rounded-lg" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleSaveQuestion(t.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg">Save</button>
                              <button onClick={() => setEditingQuestionId(null)} className="bg-slate-200 px-4 py-2 rounded-lg">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-bold">{q.question}</p>
                              <div className="mt-2 space-y-1">
                                {(q.options || []).map((opt, i) => (
                                  <div key={i} className="text-sm">{String.fromCharCode(65 + i)}. {opt}</div>
                                ))}
                              </div>
                              <p className="text-sm mt-2 text-green-700">Answer: {q.correctAnswer || q.answer}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button onClick={() => handleEditQuestionOpen(q)} className="bg-yellow-500 text-white px-3 py-1 rounded-lg">Edit</button>
                              <button onClick={(e) => handleDeleteQuestion(e, t.id, q.id)} className="bg-red-600 text-white px-3 py-1 rounded-lg">Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {((questions.filter((q) => (t.questionIds || []).includes(q.id)) || []).length === 0) && (
                      <p className="text-sm text-slate-500">No questions in this test.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
