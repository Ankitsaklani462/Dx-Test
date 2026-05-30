// src/components/Dashboard.jsx

import { useEffect, useState, useMemo } from "react";

import {
  Trophy,
  BookOpen,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
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

  const [dynamicPerformance, setDynamicPerformance] = useState({
    Beginner: 0,
    Mid: 0,
    Advanced: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [expandedAttempt, setExpandedAttempt] = useState(null);

  // ================= ATTEMPTS =================

  const attempts = useMemo(() => {

    if (!currentUser?.attempts || !questions?.length) {
      return currentUser?.attempts || [];
    }

    return currentUser.attempts.map((attempt) => {

      let correct = 0;

      const answers = (attempt.answers || []).map((ans) => {

        const question = questions.find(
          (q) =>
            q.id === ans.questionId ||
            q._id === ans.questionId
        );

        const isCorrect =
          question &&
          ans.selectedAnswer === question.correctAnswer;

        if (isCorrect) correct++;

        return {
          ...ans,
          questionText: question?.question,
          correctAnswer: question?.correctAnswer,
          isCorrect:
            ans.isCorrect !== undefined
              ? ans.isCorrect
              : ans.selectedAnswer === question?.answer,
        };
      });

      return {
        ...attempt,
        answers,
        correct,
        totalQuestions: answers.length,
        percentage: answers.length
          ? Math.round((correct / answers.length) * 100)
          : 0,
      };
    });

  }, [currentUser?.attempts, questions]);

  // ================= PERFORMANCE =================

  useEffect(() => {

    if (
      currentUser?.attempts &&
      Array.isArray(currentUser.attempts)
    ) {

      const levelStats = {
        Beginner: [],
        Mid: [],
        Advanced: [],
      };

      currentUser.attempts.forEach((attempt) => {

        const level = attempt.level;

        const percentage = attempt.percentage || 0;

        if (
          level &&
          levelStats.hasOwnProperty(level)
        ) {

          levelStats[level].push(percentage);
        }
      });

      const newPerformance = {

        Beginner: levelStats.Beginner.length
          ? Math.round(
              levelStats.Beginner.reduce((a, b) => a + b, 0) /
              levelStats.Beginner.length
            )
          : 0,

        Mid: levelStats.Mid.length
          ? Math.round(
              levelStats.Mid.reduce((a, b) => a + b, 0) /
              levelStats.Mid.length
            )
          : 0,

        Advanced: levelStats.Advanced.length
          ? Math.round(
              levelStats.Advanced.reduce((a, b) => a + b, 0) /
              levelStats.Advanced.length
            )
          : 0,
      };

      setDynamicPerformance(newPerformance);
    }

  }, [currentUser?.attempts]);

  // ================= FILTER =================

  const filteredTests = useMemo(() => {

    return tests.filter((test) => {

      const matchSubject =
        selectedSubject === "ALL"
          ? true
          : test.subject === selectedSubject;

      const matchLevel =
        selectedLevel === "ALL"
          ? true
          : test.level === selectedLevel;

      const matchSearch =
        test.title
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      return (
        matchSubject &&
        matchLevel &&
        matchSearch
      );
    });

  }, [
    tests,
    selectedLevel,
    selectedSubject,
    searchTerm,
  ]);

  // ================= STATS =================

  const totalAttempts = attempts.length;

  const overallScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce(
            (acc, curr) => acc + curr.percentage,
            0
          ) / attempts.length
        )
      : 0;

  const levels = ["Beginner", "Mid", "Advanced"];

  // ================= TOGGLE =================

  const toggleAnswerSheet = (attemptIndex) => {

    setExpandedAttempt(
      expandedAttempt === attemptIndex
        ? null
        : attemptIndex
    );
  };

  // ================= UI =================

  return (

    <div className="w-full max-w-[1700px] mx-auto space-y-5 sm:space-y-6 overflow-x-hidden">

      {/* ================= HERO ================= */}

      <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 sm:p-6 lg:p-8 xl:p-10 text-white shadow-2xl">

        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_35%)]"></div>

        <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-10">

          {/* LEFT */}

          <div className="flex-1 min-w-0">

            <p className="uppercase tracking-[0.2em] text-[10px] sm:text-xs text-slate-400 font-black">

              DX TEST PORTAL

            </p>

            <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-black mt-4 leading-tight break-words">

              Welcome,
              <br />
              {currentUser?.name}

            </h1>

            <p className="text-slate-300 mt-4 sm:mt-6 text-sm sm:text-base leading-7 max-w-2xl">

              Enterprise assessment platform for technical skill evaluation,
              analytics and candidate benchmarking.

            </p>

            {/* USER INFO */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 sm:mt-8">

              <div className="bg-white/10 backdrop-blur-xl border border-white/10 px-4 py-4 rounded-2xl">

                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-black">

                  Employee ID

                </p>

                <h3 className="font-black text-lg mt-2 break-words">

                  {currentUser?.empId}

                </h3>

              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/10 px-4 py-4 rounded-2xl">

                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-black">

                  Department

                </p>

                <h3 className="font-black text-lg mt-2 break-words">

                  {currentUser?.dept || "N/A"}

                </h3>

              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div className="w-full lg:max-w-[380px] bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 flex-shrink-0">

            <div className="flex items-center justify-between gap-4">

              <div>

                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-black">

                  Overall Score

                </p>

                <h2 className="text-5xl sm:text-6xl font-black mt-2">

                  {overallScore}%

                </h2>

              </div>

              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">

                <Trophy size={38} />

              </div>

            </div>

            <div className="mt-8 space-y-5">

              {levels.map((level) => (

                <div key={level}>

                  <div className="flex justify-between text-sm font-bold mb-2">

                    <span>{level}</span>

                    <span>
                      {dynamicPerformance[level] || 0}%
                    </span>

                  </div>

                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{
                        width: `${dynamicPerformance[level] || 0}%`,
                      }}
                    />

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

      {/* ================= STATS ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">

        {[
          {
            title: "Total Attempts",
            value: totalAttempts,
            icon: (
              <Target
                size={28}
                className="text-blue-700"
              />
            ),
            bg: "bg-blue-100",
          },
          {
            title: "Subjects",
            value: subjects.length,
            icon: (
              <BookOpen
                size={28}
                className="text-orange-700"
              />
            ),
            bg: "bg-orange-100",
          },
          {
            title: "Available Tests",
            value: tests.length,
            icon: (
              <Award
                size={28}
                className="text-emerald-700"
              />
            ),
            bg: "bg-emerald-100",
          },
        ].map((item, index) => (

          <div
            key={index}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6"
          >

            <div className="flex justify-between items-center gap-4">

              <div>

                <p className="text-[10px] sm:text-xs uppercase tracking-widest font-black text-slate-400">

                  {item.title}

                </p>

                <h2 className="text-3xl sm:text-4xl font-black mt-3">

                  {item.value}

                </h2>

              </div>

              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${item.bg} flex flex-shrink-0 items-center justify-center`}>

                {item.icon}

              </div>

            </div>

          </div>

        ))}

      </div>

      {/* ================= ATTEMPTS ================= */}

      {attempts.length > 0 && (

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="bg-gradient-to-r from-slate-950 to-slate-800 p-4 sm:p-6 text-white">

            <div className="flex items-center gap-3">

              <History size={22} />

              <h2 className="text-xl sm:text-2xl font-black">

                Attempt History

              </h2>

            </div>

          </div>

          <div className="divide-y divide-slate-100">

            {attempts.map((attempt, index) => {

              const isExpanded =
                expandedAttempt === index;

              return (

                <div key={index}>

                  <div className="p-4 sm:p-6 flex flex-col lg:flex-row justify-between gap-4">

                    <div className="min-w-0">

                      <h3 className="text-lg sm:text-xl font-black break-words">

                        {attempt.testTitle || "Unknown Test"}

                      </h3>

                      <p className="text-xs sm:text-sm text-slate-500 break-words">

                        {attempt.subject} • {attempt.level} •{" "}
                        {new Date(attempt.date).toLocaleDateString()}

                      </p>

                    </div>

                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4">

                      <span
                        className={`text-2xl sm:text-3xl font-black ${
                          attempt.percentage >= 70
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >

                        {attempt.percentage}%

                      </span>

                      <button
                        onClick={() =>
                          toggleAnswerSheet(index)
                        }
                        className="bg-slate-100 p-3 rounded-xl"
                      >

                        {isExpanded
                          ? <ChevronUp size={18} />
                          : <ChevronDown size={18} />
                        }

                      </button>

                    </div>

                  </div>

                  {isExpanded && (

                    <div className="bg-slate-50 p-4 sm:p-6 space-y-4">

                      {attempt.answers.map((ans, qIdx) => (

                        <div
                          key={qIdx}
                          className={`p-4 rounded-2xl border-2 ${
                            ans.isCorrect
                              ? "border-emerald-200 bg-white"
                              : "border-red-200 bg-white"
                          }`}
                        >

                          <p className="font-bold text-sm sm:text-base break-words">

                            Q{qIdx + 1}. {ans.questionText}

                          </p>

                          <p className="text-sm mt-2 break-words">

                            Your Answer:
                            <span className="font-bold ml-1">

                              {ans.selectedAnswer}

                            </span>

                          </p>

                          {!ans.isCorrect && (

                            <p className="text-sm text-emerald-700 break-words">

                              Correct:
                              <span className="font-bold ml-1">

                                {ans.correctAnswer}

                              </span>

                            </p>

                          )}

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

      {/* ================= FILTER ================= */}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <input
            type="text"
            placeholder="Search assessment"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            className="w-full border border-slate-200 rounded-2xl p-4 text-sm sm:text-base"
          />

          <select
            value={selectedSubject}
            onChange={(e) =>
              setSelectedSubject(e.target.value)
            }
            className="w-full border border-slate-200 rounded-2xl px-5 py-4 bg-white font-bold text-sm"
          >

            <option value="ALL">

              All Subjects

            </option>

            {subjects.map((sub) => (

              <option
                key={sub}
                value={sub}
              >

                {sub}

              </option>

            ))}

          </select>

          <select
            value={selectedLevel}
            onChange={(e) =>
              setSelectedLevel(e.target.value)
            }
            className="w-full border border-slate-200 rounded-2xl px-5 py-4 bg-white font-bold text-sm"
          >

            <option value="ALL">

              All Levels

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

      {/* ================= TESTS ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">

        {filteredTests.map((test) => (

          <div
            key={test.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm"
          >

            <h3 className="text-xl sm:text-2xl font-black break-words">

              {test.title}

            </h3>

            <p className="text-slate-500 mt-2 text-sm sm:text-base break-words">

              {test.subject} • {test.level}

            </p>

            <button
              onClick={() => startTest(test)}
              className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-3 sm:py-4 rounded-2xl font-black uppercase tracking-wider text-sm sm:text-base transition"
            >

              Start Assessment

            </button>

          </div>

        ))}

      </div>

    </div>
  );
}

export default Dashboard;
