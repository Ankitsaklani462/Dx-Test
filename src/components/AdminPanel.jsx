import React, { useState, useMemo } from "react";
import { db } from "../firebase";
import {
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  collection,
} from "firebase/firestore";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"; // Trash2 icon add kiya

function AdminPanel({
  users = [],
  setUsers, // Added setUsers prop
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
  const [tForm, setTForm] = useState({ title: "", subject: "", level: "", duration: "" });

  // PERFORMANCE CALCULATION
  const performance = useMemo(() => {
    if (!selectedUser?.attempts || selectedUser.attempts.length === 0)
      return { overall: 0, Beginner: 0, Mid: 0, Advanced: 0 };

    const attempts = selectedUser.attempts;
    const stats = { Beginner: [], Mid: [], Advanced: [] };

    attempts.forEach(att => {
      const score = Number(att.percentage || att.score) || 0;
      if (att.level && stats[att.level]) {
        stats[att.level].push(score);
      }
    });

    const getAvg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    return {
      overall: getAvg(attempts.map(a => Number(a.percentage || a.score) || 0)),
      Beginner: getAvg(stats.Beginner),
      Mid: getAvg(stats.Mid),
      Advanced: getAvg(stats.Advanced)
    };
  }, [selectedUser]);

  const filteredUsers = users.filter((u) => u.role !== "admin" && ((u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (u.empId || "").toLowerCase().includes(searchTerm.toLowerCase())));

  // FUNCTIONS
  const handleDeleteUser = async (e, userId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(users.filter(u => u.id !== userId));
        if (selectedUser?.id === userId) setSelectedUser(null);
        alert("User deleted successfully");
      } catch (err) { console.log(err); alert("Failed to delete user"); }
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!tForm.subject || !tForm.level) { alert("Please fill Subject & Level first"); return; }
    try {
      setCsvLoading(true);
      const text = await file.text();
      const rows = text.replace(/\r/g, "").split("\n").filter((r) => r.trim() !== "");
      const uploaded = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(",");
        if (cols.length < 6) continue;
        const qObj = { question: cols[0]?.trim(), options: [cols[1]?.trim(), cols[2]?.trim(), cols[3]?.trim(), cols[4]?.trim()], answer: cols[5]?.trim(), subject: tForm.subject, level: tForm.level, createdAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, "questions"), qObj);
        uploaded.push({ id: docRef.id, ...qObj });
      }
      setQuestions((prev) => [...prev, ...uploaded]);
      alert(`${uploaded.length} Questions Uploaded`);
    } catch (err) { console.log(err); alert("CSV Upload Failed"); } finally { setCsvLoading(false); }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    if (!tForm.title || !tForm.subject || !tForm.level || !tForm.duration) { alert("Fill all fields"); return; }
    const qIds = questions.filter((q) => q.subject === tForm.subject && q.level === tForm.level).map((q) => q.id);
    if (qIds.length === 0) { alert("No questions found"); return; }
    try {
      setLoading(true);
      const newTest = { ...tForm, duration: Number(tForm.duration), questionIds: qIds, status: "live", createdAt: serverTimestamp() };
      const docRef = await addDoc(collection(db, "tests"), newTest);
      setTests([...tests, { id: docRef.id, ...newTest }]);
      alert("Test Launched!");
      setTForm({ title: "", subject: "", level: "", duration: "" });
    } catch (err) { console.log(err); } finally { setLoading(false); }
  };

  const handleDeleteTest = async (id) => {
  // 1. User se confirmation lein
  if (!window.confirm("Are you sure you want to delete this test?")) return;

  try {
    // 2. Firebase se delete karein
    await deleteDoc(doc(db, "tests", id));
    
    // 3. UI State ko update karein
    setTests((prevTests) => prevTests.filter((t) => t.id !== id));
    
    alert("Test deleted successfully.");
  } catch (err) {
    console.error("Error deleting test: ", err);
    alert("Failed to delete the test: " + err.message);
  }
};
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-3xl flex justify-between items-center">
        <h2 className="text-3xl font-black">Admin Panel</h2>
        <button onClick={() => setCurrentScreen("dashboard")} className="bg-blue-600 px-5 py-3 rounded-2xl font-black">Dashboard</button>
      </div>

      <div className="bg-white rounded-2xl border p-2 flex gap-2">
        {["users", "launch-test", "live-tests"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 rounded-xl font-bold ${activeTab === tab ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}>{tab.toUpperCase()}</button>
        ))}
      </div>

      {activeTab === "users" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border p-5">
            <input placeholder="Search User" onChange={(e) => setSearchTerm(e.target.value)} className="w-full border rounded-2xl px-4 py-3" />
            <div className="mt-5 space-y-3">{filteredUsers.map(u => (
              <div key={u.id} className={`w-full flex items-center justify-between border rounded-2xl p-4 ${selectedUser?.id === u.id ? "border-blue-600 bg-blue-50" : ""}`}>
                <button className="flex-1 text-left" onClick={() => { setSelectedUser(u); setExpandedAttempt(null); }}>
                  <h3 className="font-black">{u.name}</h3>
                </button>
                <button onClick={(e) => handleDeleteUser(e, u.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}</div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border p-6">
            {!selectedUser ? <div className="text-slate-400">Select User</div> : (
              <div>
                <h2 className="text-3xl font-black mb-6">{selectedUser.name} Analytics</h2>
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {Object.entries(performance).map(([k, v]) => <div key={k} className="bg-slate-100 rounded-2xl p-5"><p className="text-xs font-black uppercase">{k}</p><h3 className="text-3xl font-black">{v}%</h3></div>)}
                </div>
                <h3 className="font-black text-xl mb-4">Test Attempts</h3>
                <div className="space-y-4">{[...selectedUser.attempts || []].reverse().map((a, i) => (
                  <div key={i} className="border rounded-2xl p-5">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedAttempt(expandedAttempt === i ? null : i)}>
                      <div><h4 className="font-black">{a.testTitle}</h4><p className="text-sm text-slate-500">{a.subject} • {a.level}</p></div>
                      <span className="font-black text-blue-600">{a.percentage || a.score}%</span>
                    </div>
                    {expandedAttempt === i && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        {a.answers?.map((ans, qIdx) => (
                          <div key={qIdx} className={`p-3 rounded-xl border ${ans.isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                            <p className="font-bold text-sm">Q{qIdx + 1}. {ans.questionText}</p>
                            <p className="text-sm mt-1">Your Answer: <span className="font-bold">{ans.selectedAnswer}</span></p>
                            {!ans.isCorrect && <p className="text-sm mt-1 text-emerald-700 font-bold">Correct Answer: {ans.correctAnswer}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "launch-test" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900">Launch New Test</h2>
            <p className="text-slate-500 font-medium mt-1">Configure parameters and upload questions CSV</p>
          </div>
          <form onSubmit={handleTestSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">Test Title</label>
              <input value={tForm.title} onChange={(e) => setTForm({ ...tForm, title: e.target.value })} placeholder="e.g. Weekly Aptitude Challenge" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 transition font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">Subject</label>
                <input value={tForm.subject} onChange={(e) => setTForm({ ...tForm, subject: e.target.value.toUpperCase() })} placeholder="HTML" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 transition font-bold" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">Duration (Mins)</label>
                <input type="number" value={tForm.duration} onChange={(e) => setTForm({ ...tForm, duration: e.target.value })} placeholder="30" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 transition font-bold" />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-black text-slate-400 uppercase ml-1 mb-1 block">Questions CSV File</label>
              <div className={`relative border-2 ${csvLoading ? 'border-blue-500 bg-blue-50' : 'border-dashed border-slate-200'} rounded-2xl p-6 transition`}>
                <input type="file" onChange={handleCSVUpload} disabled={csvLoading} className="w-full cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 font-bold" />
                {csvLoading && <div className="mt-3 flex items-center gap-2 text-blue-700 font-black animate-pulse"><div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>Processing CSV... Please wait.</div>}
              </div>
            </div>
            <button type="submit" disabled={loading || csvLoading} className={`w-full py-5 rounded-2xl font-black text-lg transition shadow-lg ${loading || csvLoading ? "bg-slate-300 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>{loading ? "Launching Test..." : csvLoading ? "Wait, Processing File..." : "LAUNCH TEST NOW"}</button>
          </form>
        </div>
      )}

      {activeTab === "live-tests" && (
        <div className="bg-white rounded-3xl border p-6">
          <h2 className="text-3xl font-black mb-8">Live Tests</h2>
          {tests.map(t => (
            <div key={t.id} className="border rounded-3xl p-6 mb-4 flex justify-between items-center">
              <div><h3 className="text-2xl font-black">{t.title}</h3><p>{t.subject} | {t.level}</p></div>
              <button onClick={() => handleDeleteTest(t.id)} className="bg-red-600 text-white px-5 py-3 rounded-2xl font-black">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;