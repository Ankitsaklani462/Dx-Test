// src/components/Dashboard.jsx
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  Trophy,
  BookOpen,
  Clock3,
  PlayCircle,
  Target,
  Award,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  History,
} from "lucide-react";

function Dashboard({
  currentUser,
  tests = [],
  subjects = [],
  questions = [],
  selectedLevel,
  setSelectedLevel,
  selectedSubject,
  setSelectedSubject,
  startTest,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedAttempt, setExpandedAttempt] = useState(null);

  // Pure logic ko yahan calculate kiya hai taaki window object ki zaroorat na pade
  const attempts = useMemo(() => {
    if (!currentUser?.attempts || !questions?.length) return currentUser?.attempts || [];

    return currentUser.attempts.map((attempt) => {
      let correct = 0;
      const answers = (attempt.answers || []).map((ans) => {
        const question = questions.find(
          (q) => q.id === ans.questionId || q._id === ans.questionId
        );
        const isCorrect = question && ans.selectedAnswer === question.correctAnswer;
        if (isCorrect) correct++;
        return {
          ...ans,
          questionText: question?.question,
          correctAnswer: question?.correctAnswer,
          isCorrect,
        };
      });

      return {
        ...attempt,
        answers,
        correct,
        totalQuestions: answers.length,
        percentage: answers.length ? Math.round((correct / answers.length) * 100) : 0,
      };
    });
  }, [currentUser?.attempts, questions]);

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchSubject = selectedSubject === "ALL" ? true : test.subject === selectedSubject;
      const matchLevel = selectedLevel === "ALL" ? true : test.level === selectedLevel;
      const matchSearch = test.title?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSubject && matchLevel && matchSearch;
    });
  }, [tests, selectedLevel, selectedSubject, searchTerm]);

  const totalAttempts = attempts.length;
  const overallScore = currentUser?.performance?.overall || 0;
  const levels = ["Beginner", "Mid", "Advanced"];

  const getTestById = (testId) => tests.find((t) => t.id === testId);
  const getQuestionById = (questionId) => questions.find((q) => q.id === questionId);

  const toggleAnswerSheet = (attemptIndex) => {
    setExpandedAttempt(expandedAttempt === attemptIndex ? null : attemptIndex);
  };

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 md:p-10 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_35%)]"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8">
          <div className="max-w-3xl">
            <p className="uppercase tracking-[0.3em] text-xs text-slate-400 font-black">DX TEST PORTAL</p>
            <h1 className="text-4xl md:text-5xl font-black mt-5 leading-tight">Welcome,<br />{currentUser?.name}</h1>
            <p className="text-slate-300 mt-6 text-lg leading-8">Enterprise assessment platform for technical skill evaluation, analytics and candidate benchmarking.</p>
            <div className="flex flex-wrap gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 px-5 py-4 rounded-2xl">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-black">Employee ID</p>
                <h3 className="font-black text-lg mt-1">{currentUser?.empId}</h3>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 px-5 py-4 rounded-2xl">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-black">Department</p>
                <h3 className="font-black text-lg mt-1">{currentUser?.dept}</h3>
              </div>
            </div>
          </div>
          <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-black">Overall Score</p>
                <h2 className="text-5xl font-black mt-2">{overallScore}%</h2>
              </div>
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Trophy size={36} />
              </div>
            </div>
            <div className="mt-8 space-y-4">
              {levels.map((level) => (
                <div key={level} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{level}</span>
                    <span>{currentUser?.performance?.[level] || 0}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${currentUser?.performance?.[level] || 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs uppercase tracking-widest font-black text-slate-400">Total Attempts</p>
              <h2 className="text-4xl font-black mt-3">{totalAttempts}</h2>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center"><Target size={30} className="text-blue-700" /></div>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs uppercase tracking-widest font-black text-slate-400">Subjects</p>
              <h2 className="text-4xl font-black mt-3">{subjects.length}</h2>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center"><BookOpen size={30} className="text-orange-700" /></div>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs uppercase tracking-widest font-black text-slate-400">Available Tests</p>
              <h2 className="text-4xl font-black mt-3">{tests.length}</h2>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center"><Award size={30} className="text-emerald-700" /></div>
          </div>
        </div>
      </div>

      {/* ATTEMPT HISTORY */}
      {attempts.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white">
            <div className="flex items-center gap-3"><History size={24} /> <h2 className="text-2xl font-black">Attempt History</h2></div>
          </div>
          <div className="divide-y divide-slate-100">
            {attempts.map((attempt, index) => {
              const test = getTestById(attempt.testId);
              const isExpanded = expandedAttempt === index;
              return (
                <div key={index}>
                  <div className="p-6 flex flex-col lg:flex-row justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{test?.title || "Unknown Test"}</h3>
                      <p className="text-sm text-slate-500">Attempted on: {new Date(attempt.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-3xl font-black ${attempt.percentage >= 70 ? "text-emerald-600" : "text-red-500"}`}>{attempt.percentage}%</span>
                      <button onClick={() => toggleAnswerSheet(index)} className="bg-slate-100 px-5 py-3 rounded-xl font-bold">
                        {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="bg-slate-50 p-6 space-y-4">
                      {attempt.answers.map((ans, qIdx) => (
                        <div key={qIdx} className={`p-4 rounded-2xl border-2 ${ans.isCorrect ? "border-emerald-200 bg-white" : "border-red-200 bg-white"}`}>
                          <p className="font-bold">Q{qIdx + 1}. {ans.questionText}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm">Your Answer: <span className="font-bold">{ans.selectedAnswer}</span></p>
                            {!ans.isCorrect && <p className="text-sm text-emerald-700">Correct: <span className="font-bold">{ans.correctAnswer}</span></p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER AND TESTS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col lg:flex-row gap-5">
          <input type="text" placeholder="Search assessment" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-slate-200 rounded-2xl p-4" />
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="border border-slate-200 rounded-2xl px-5 p-4 bg-white font-bold">
            <option value="ALL">All Subjects</option>
            {subjects.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
          </select>
          <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="border border-slate-200 rounded-2xl px-5 p-4 bg-white font-bold">
            <option value="ALL">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Mid">Mid</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTests.map((test) => (
          <div key={test.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-2xl font-black">{test.title}</h3>
            <p className="text-slate-500 mt-2">{test.subject} • {test.level}</p>
            <button onClick={() => startTest(test)} className="w-full mt-6 bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest">
              Start Assessment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;