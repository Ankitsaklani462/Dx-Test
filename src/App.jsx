import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import Login from './components/Login';
import QuizPortal from './components/QuizPortal';
import AdminPanel from './components/AdminPanel';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('login');
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState(['HTML', 'CSS', 'JavaScript', 'Python']);
  const [activeTest, setActiveTest] = useState(null);
  const [selectedReviewAttempt, setSelectedReviewAttempt] = useState(null);

  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [selectedSubject, setSelectedSubject] = useState('HTML');
  const [newSubjectName, setNewSubjectName] = useState('');

  const fetchGlobalData = async () => {
    try {
      const configDoc = await getDoc(doc(db, "system", "config"));
      if (configDoc.exists() && configDoc.data().subjects) {
        setSubjects(configDoc.data().subjects);
      } else {
        await setDoc(doc(db, "system", "config"), { subjects: ['HTML', 'CSS', 'JavaScript', 'Python'] });
      }

      const usersSnap = await getDocs(collection(db, "users"));
      setUsers(usersSnap.docs.map(doc => doc.data()));

      const questionsSnap = await getDocs(collection(db, "questions"));
      setQuestions(questionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const testsSnap = await getDocs(collection(db, "tests"));
      setTests(testsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Firebase Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, [currentScreen]);

  const syncCurrentUserState = async (empId) => {
    if (!empId || empId === 'ADMIN01') return;
    const uDoc = await getDoc(doc(db, "users", empId));
    if (uDoc.exists()) setCurrentUser(uDoc.data());
  };

  const startTest = (testToStart) => {
    setActiveTest(testToStart);
    setCurrentScreen('quiz');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  const handleAddSubject = async () => {
    const cleanSub = newSubjectName.trim().toUpperCase();
    if (!cleanSub) return;
    if (subjects.includes(cleanSub)) {
      alert("Subject already exists!");
      return;
    }
    const updatedSubs = [...subjects, cleanSub];
    await setDoc(doc(db, "system", "config"), { subjects: updatedSubs });
    setSubjects(updatedSubs);
    setNewSubjectName('');
    alert(`Subject "${cleanSub}" added!`);
  };

  const handleDeleteSubject = async (subToDelete) => {
    if (!window.confirm(`Delete "${subToDelete}"?`)) return;
    const updatedSubs = subjects.filter(s => s !== subToDelete);
    await setDoc(doc(db, "system", "config"), { subjects: updatedSubs });
    setSubjects(updatedSubs);
    if (selectedSubject === subToDelete) setSelectedSubject(updatedSubs[0] || '');
  };

  const handleAuth = async (authData) => {
    if (authData.role === 'admin' || authData.empId === 'ADMIN01') {
      setCurrentUser({ name: 'System Admin', empId: 'ADMIN01', role: 'admin' });
      setCurrentScreen('admin');
      return;
    }

    try {
      const userDocRef = doc(db, "users", authData.empId);
      const userDocSnap = await getDoc(userDocRef);

      if (authData.type === 'register') {
        if (userDocSnap.exists()) {
          alert("Employee ID already registered!");
          return;
        }
        const newUserProfile = {
          name: authData.name, empId: authData.empId, dept: authData.dept,
          password: authData.password, role: 'candidate',
          performance: { overall: 0, Beginner: 0, Mid: 0, Advanced: 0 }, attempts: []
        };
        await setDoc(userDocRef, newUserProfile);
        setCurrentUser(newUserProfile);
        setCurrentScreen('dashboard');
      } else {
        if (!userDocSnap.exists()) {
          alert("Employee ID not found! Please register first.");
          return;
        }
        const existingUser = userDocSnap.data();
        if (existingUser.password === authData.password) {
          setCurrentUser(existingUser);
          setCurrentScreen(existingUser.role === 'admin' ? 'admin' : 'dashboard');
        } else {
          alert("Invalid Password!");
        }
      }
    } catch (e) {
      alert("Auth Failure.");
    }
  };

  // --- High-End Executive Analytics Trend Engine ---
  const generateTrendGraphSVG = () => {
    const attempts = currentUser?.attempts || [];
    const width = 600;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 30;

    // Premium Technical Grid Background lines
    const gridLines = [];
    for (let i = 0; i <= 4; i++) {
      const yVal = paddingTop + (i * (height - paddingTop - paddingBottom)) / 4;
      const labelPercent = 100 - i * 25;
      gridLines.push(
        <g key={`grid-${i}`}>
          <line x1={paddingLeft} y1={yVal} x2={width - paddingRight} y2={yVal} stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="3 3" />
          <text x={paddingLeft - 10} y={yVal + 3} textAnchor="end" fill="#94a3b8" className="text-[9px] font-mono font-bold">{labelPercent}%</text>
        </g>
      );
    }

    if (attempts.length === 0) {
      // Professional Clean Dashboard Placeholder state layout
      return (
        <div className="bg-white border border-gray-200 p-5 rounded-2xl h-full flex flex-col justify-between shadow-xs min-h-[210px]">
          <div className="flex justify-between items-center">
            <h4 className="text-[11px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              Performance Trajectory Telemetry
            </h4>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">Awaiting Analytics</span>
          </div>
          <div className="relative flex-1 flex flex-col items-center justify-center my-2 bg-slate-50/50 rounded-xl border border-dashed border-gray-200 p-4">
            <p className="text-xs font-bold text-slate-800 text-center">No Matrix History Detected</p>
            <p className="text-[10px] text-gray-400 text-center mt-0.5 max-w-xs">Complete an initial skill block valuation to initialize standard trend lines.</p>
          </div>
        </div>
      );
    }

    const usableWidth = width - paddingLeft - paddingRight;
    const usableHeight = height - paddingTop - paddingBottom;
    const xInterval = attempts.length > 1 ? usableWidth / (attempts.length - 1) : usableWidth;

    let polylineCoordinates = "";
    let areaCoordinates = `${paddingLeft},${height - paddingBottom} `;

    const coordinateNodes = attempts.map((attempt, index) => {
      const x = paddingLeft + index * xInterval;
      const pctScore = attempt.totalQuestions > 0 ? (attempt.score / attempt.totalQuestions) * 100 : 0;
      const y = height - paddingBottom - (pctScore / 100) * usableHeight;
      
      polylineCoordinates += `${x},${y} `;
      areaCoordinates += `${x},${y} `;
      if (index === attempts.length - 1) {
        areaCoordinates += `${x},${height - paddingBottom}`;
      }
      return { x, y, score: Math.round(pctScore), title: attempt.testTitle };
    });

    return (
      <div className="bg-white border border-gray-200 p-5 rounded-2xl h-full flex flex-col justify-between shadow-xs min-h-[210px]">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-[11px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Performance Trajectory Telemetry
          </h4>
          <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-black uppercase tracking-wider">
            {attempts.length} {attempts.length === 1 ? 'Session' : 'Sessions'} Logged
          </span>
        </div>
        
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible min-w-[500px]">
            <defs>
              <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
              </linearGradient>
            </defs>
            
            {gridLines}

            {/* Base Line border alignment */}
            <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Render Filled Geometric Area and Line Vector Path */}
            {attempts.length > 0 && (
              <>
                <polygon points={areaCoordinates} fill="url(#chartAreaGradient)" />
                <polyline points={polylineCoordinates} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}

            {/* Render Point Target Nodes Indicators */}
            {coordinateNodes.map((node, i) => (
              <g key={i} className="group cursor-pointer">
                <circle cx={node.x} cy={node.y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
                <circle cx={node.x} cy={node.y} r="2" fill="#2563eb" />
                
                {/* Floating dynamic popover micro scores metadata tooltips */}
                <g className="opacity-90">
                  <rect x={node.x - 16} y={node.y - 24} width="32" height="15" rx="4" fill="#0f172a" />
                  <text x={node.x} y={node.y - 14} textAnchor="middle" fill="#ffffff" className="text-[9px] font-mono font-black">{node.score}%</text>
                </g>
                
                {/* Bottom X-Axis Data Log Label nodes markers */}
                <text x={node.x} y={height - paddingBottom + 14} textAnchor="middle" fill="#64748b" className="text-[8px] font-bold uppercase tracking-tight">
                  T-{i + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  if (loading) return <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white text-sm font-bold uppercase tracking-widest">Loading Platform Matrix...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased">
      {/* Premium Dashboard Header component zone */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white font-black px-2.5 py-1.5 rounded-lg text-sm tracking-tighter shadow-sm">TB</div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-slate-900 uppercase">TOYOTA BOSHOKU</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Automotive India Private Limited</p>
          </div>
        </div>
        {currentUser && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-700">{currentUser.name} ({currentUser.empId})</span>
              <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                {currentUser.role === 'admin' ? 'SYSTEM ADMIN' : 'CANDIDATE'}
              </span>
            </div>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition shadow-sm cursor-pointer">
              Logout Portal ⚡
            </button>
          </div>
        )}
      </header>

      <main className="py-8 px-4 max-w-7xl mx-auto">
        {currentScreen === 'login' && <Login onAuth={handleAuth} />}

        {currentScreen === 'dashboard' && (
          <div className="space-y-6">
            {/* User Profile Welcome Badge Row info item */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Welcome Workspace, {currentUser?.name}!</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Mapped Code ID: <span className="font-mono text-slate-900 font-bold">{currentUser?.empId}</span> | Factory Unit Cluster: <span className="text-slate-900 font-bold">{currentUser?.dept}</span>
                </p>
              </div>
              <div>
                <button onClick={() => setCurrentScreen(currentUser?.role === 'admin' ? 'admin' : 'dashboard')} className="border-2 border-slate-900 text-slate-900 font-black text-[10px] px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-slate-900 hover:text-white transition shadow-2xs">
                  Candidate Operations
                </button>
              </div>
            </div>

            {/* Twin Core Grid: Radar Matrix Metrics + SVG Micro Trajectory Line Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Competency Metric Radar</h3>
                <div className="grid grid-cols-2 gap-3 text-xs font-bold flex-1">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between"><p className="text-2xl font-black text-slate-900">{currentUser?.performance?.overall || 0}%</p><p className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold mt-1">Overall Grade</p></div>
                  <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-xl flex flex-col justify-between"><p className="text-2xl font-black text-emerald-600">{currentUser?.performance?.Beginner || 0}%</p><p className="text-[9px] text-emerald-500/80 uppercase tracking-wider font-extrabold mt-1">Beginner Grade</p></div>
                  <div className="p-3.5 bg-amber-50/40 border border-amber-100 rounded-xl flex flex-col justify-between"><p className="text-2xl font-black text-amber-600">{currentUser?.performance?.Mid || 0}%</p><p className="text-[9px] text-amber-500/80 uppercase tracking-wider font-extrabold mt-1">Mid-Tier Grade</p></div>
                  <div className="p-3.5 bg-purple-50/40 border border-purple-100 rounded-xl flex flex-col justify-between"><p className="text-2xl font-black text-purple-600">{currentUser?.performance?.Advanced || 0}%</p><p className="text-[9px] text-purple-500/80 uppercase tracking-wider font-extrabold mt-1">Expert Grade</p></div>
                </div>
              </div>
              
              <div className="lg:col-span-3">
                {generateTrendGraphSVG()}
              </div>
            </div>

            {/* Dynamic Segment Modules Grid Selector Wrapper */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Dynamic Assessment Module Selector</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Select parameters to view live scheduled assessment profiles.</p>
                </div>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {['Beginner', 'Mid', 'Advanced'].map(lvl => (
                    <button key={lvl} onClick={() => setSelectedLevel(lvl)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedLevel === lvl ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>{lvl === 'Mid' ? 'Mid Matrix' : lvl === 'Advanced' ? 'Advanced Matrix' : 'Beginner Matrix'}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pb-2">
                {subjects.map(sub => (
                  <button key={sub} onClick={() => setSelectedSubject(sub)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${selectedSubject === sub ? 'bg-blue-600 border-blue-600 text-white shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>{sub}</button>
                ))}
              </div>

              <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-6">
                {tests.filter(t => t.subject === selectedSubject && t.level === selectedLevel).length === 0 ? (
                  <div className="text-center text-xs text-slate-400 font-bold py-4 uppercase tracking-wide">
                    No assessments currently provisioned for {selectedSubject} ({selectedLevel} Track).
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tests.filter(t => t.subject === selectedSubject && t.level === selectedLevel).map(test => (
                      <div key={test.id} className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center shadow-2xs hover:border-slate-300 transition">
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-wide">{test.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">⏳ {test.duration} Mins | {test.questionIds?.length || 0} Target Items</p>
                        </div>
                        <button onClick={() => startTest(test)} className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black px-4 py-2.5 rounded-xl uppercase tracking-wider transition shadow-sm cursor-pointer">
                          Initialize
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Historical Score Matrix Logs Node Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Evaluation Log Matrix & Answer Verification</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase border-b border-slate-900"><th className="p-3.5 tracking-wider">Index</th><th className="p-3.5 tracking-wider">Title</th><th className="p-3.5 tracking-wider">Timeline</th><th className="p-3.5 tracking-wider">Raw Score</th><th className="p-3.5 tracking-wider">Percentage</th><th className="p-3.5 tracking-wider text-center">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-semibold text-slate-700">
                    {currentUser?.attempts?.length === 0 ? (
                      <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic font-medium">No submission logs recorded in this slot profile yet.</td></tr>
                    ) : (
                      currentUser?.attempts?.map((attempt, index) => {
                        const pct = attempt.totalQuestions > 0 ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;
                        return (
                          <tr key={index} className="hover:bg-slate-50/80 transition">
                            <td className="p-3.5 text-slate-400 font-mono">#0{index + 1}</td>
                            <td className="p-3.5 font-bold text-slate-900 uppercase text-[11px]">{attempt.testTitle}</td>
                            <td className="p-3.5 text-slate-500 font-mono">{attempt.timestamp || 'N/A'}</td>
                            <td className="p-3.5 font-mono">{attempt.score} / {attempt.totalQuestions}</td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${pct >= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{pct}%</span>
                            </td>
                            <td className="p-3.5 text-center">
                              <button onClick={() => setSelectedReviewAttempt(attempt)} className="bg-slate-800 hover:bg-black text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wide transition shadow-2xs cursor-pointer">
                                Verify Answers 👁️
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Popup Audit Inspection Data Review Container */}
            {selectedReviewAttempt && (
              <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl animate-fadeIn">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">{selectedReviewAttempt.testTitle} Verification Sheet</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Granular response metrics configuration breakdown logs.</p>
                  </div>
                  <button onClick={() => setSelectedReviewAttempt(null)} className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase cursor-pointer transition">
                    Close ✕
                  </button>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 text-xs">
                  {selectedReviewAttempt.responses?.map((resp, idx) => (
                    <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 space-y-2">
                      <p className="font-bold text-slate-200">Q{idx + 1}: {resp.questionText}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className={`p-2 rounded-lg border font-semibold ${resp.selectedOption === resp.correctOption ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' : 'border-rose-500/30 bg-rose-950/20 text-rose-400'}`}>
                          Selected: {resp.selectedOption || '[TIMEOUT VALUE ENCOUNTERED]'}
                        </div>
                        <div className="p-2 border border-emerald-500/20 bg-emerald-950/10 text-emerald-400 rounded-lg font-semibold">
                          Correct: {resp.correctOption}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentScreen === 'quiz' && activeTest && (
          <QuizPortal currentUser={currentUser} activeTest={activeTest} questions={questions} setUsers={setUsers} setCurrentScreen={setCurrentScreen} onForceSync={() => syncCurrentUserState(currentUser?.empId)} />
        )}

        {currentScreen === 'admin' && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Dynamic Categorization Framework Engine</h2>
                <button onClick={() => setCurrentScreen('dashboard')} className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl uppercase tracking-wide cursor-pointer transition">
                  📂 Return Dashboard
                </button>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-end max-w-xl text-xs">
                <div className="flex-1 w-full">
                  <label className="block font-bold text-slate-600 mb-1">New Subject / Category Title Identifier *</label>
                  <input type="text" placeholder="e.g. REACT, CNC" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2.5 font-bold uppercase focus:border-slate-800 focus:outline-none" />
                </div>
                <button onClick={handleAddSubject} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider cursor-pointer transition">
                  ⚡ Provision Track
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {subjects.map(sub => (
                    <div key={sub} className="bg-slate-950 text-white pl-3 pr-1 py-1 rounded-xl flex items-center gap-2 text-xs font-bold border border-slate-800">
                      <span>{sub}</span>
                      <button onClick={() => handleDeleteSubject(sub)} className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-[9px] p-1 rounded-md transition cursor-pointer">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <AdminPanel users={users} questions={questions} setQuestions={setQuestions} tests={tests} setTests={setTests} setCurrentScreen={setCurrentScreen} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;