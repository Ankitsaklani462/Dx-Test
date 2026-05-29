// src/components/QuizPortal.jsx

import React, { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

function QuizPortal({
  currentUser,
  activeTest,
  questions,
  setCurrentScreen,
}) {
  const [showResult, setShowResult] = useState(null);

  const testQuestions = questions.filter((q) =>
    activeTest.questionIds.includes(q.id)
  );

  const [currentIdx, setCurrentIdx] = useState(0);

  const [userAnswers, setUserAnswers] = useState({});

  const [timeLeft, setTimeLeft] = useState(
    (activeTest.duration || 30) * 60
  );

  // ================= SUBMIT TEST =================

  const submitTest = async (finalAnswers) => {
    try {
      let correct = 0;

      const detailedResults = testQuestions.map((q) => {
        const selected = finalAnswers[q.id];

        const isCorrect = selected === q.answer;

        if (selected && isCorrect) correct++;

        return {
          questionId: q.id,
          question: q.question,
          questionText: q.question,
          selectedAnswer: selected || "Not Attempted",
          correctAnswer: q.answer,
          isCorrect: selected ? isCorrect : false,
        };
      });

      const score =
        testQuestions.length > 0
          ? Math.round(
              (correct / testQuestions.length) * 100
            )
          : 0;

      setShowResult({
        correct,
        total: testQuestions.length,
        percentage: score,
        details: detailedResults,
      });

      const userRef = doc(
        db,
        "users",
        currentUser.id
      );

      await updateDoc(userRef, {
        attempts: arrayUnion({
          testId: activeTest.id,
          testTitle: activeTest.title,
          subject: activeTest.subject,
          level: activeTest.level,
          percentage: score,
          date: new Date().toISOString(),
          answers: detailedResults,
        }),

        "performance.overall": score,
      });

      console.log("Test submitted!");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // ================= TIMER =================

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          submitTest(userAnswers).then(() => {
            alert(
              "Time is up! Your test has been submitted."
            );

            setCurrentScreen("dashboard");
          });

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [userAnswers, setCurrentScreen]);

  // ================= FORMAT TIME =================

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${mins
      .toString()
      .padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // ================= BACK =================

  const handleBack = () => {
    if (
      window.confirm(
        "Are you sure you want to go back? Your progress will be lost."
      )
    ) {
      setCurrentScreen("dashboard");
    }
  };

  // ================= FINAL SUBMIT =================

  const handleFinalSubmit = async () => {
    if (
      window.confirm(
        "Are you sure you want to submit the final test?"
      )
    ) {
      await submitTest(userAnswers);
    }
  };

  const currentQuestion =
    testQuestions[currentIdx];

  // ================= UI =================

  return (
    <div className="min-h-screen bg-gray-100 w-full overflow-x-hidden">

      {/* HEADER */}

      <div className="sticky top-0 z-50 shadow-md">

        <header className="bg-[#1a2333] text-white px-3 sm:px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">

          <div className="font-bold text-xs sm:text-sm break-words">

            TOYOTA BOSHOKU | Candidate:
            {" "}
            {currentUser.name}

          </div>

          <button
            onClick={handleBack}
            className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded text-xs font-bold w-full md:w-auto"
          >
            ← BACK TO DASHBOARD
          </button>

        </header>

        {!showResult && (
          <div className="bg-red-600 text-white text-center font-black text-sm sm:text-lg py-2">

            TIME REMAINING:
            {" "}
            {formatTime(timeLeft)}

          </div>
        )}
      </div>

      {/* MAIN */}

      <main className="p-2 sm:p-4 lg:p-6">

        {showResult ? (

          // ================= RESULT =================

          <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6 lg:p-8">

            <h2 className="text-2xl sm:text-3xl font-black text-green-600 text-center">

              Test Completed!

            </h2>

            <div className="flex flex-col items-center mt-5">

              <p className="text-lg sm:text-xl text-center">

                You scored:
                {" "}
                <strong>
                  {showResult.correct}
                  {" / "}
                  {showResult.total}
                </strong>

              </p>

              <p className="text-4xl sm:text-5xl font-black text-blue-600 mt-3 mb-6">

                {showResult.percentage}%

              </p>

              <button
                onClick={() =>
                  setCurrentScreen("dashboard")
                }
                className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-bold w-full sm:w-auto"
              >
                Back to Dashboard
              </button>

            </div>

            {/* ANSWERS */}

            <div className="mt-10 max-w-5xl mx-auto">

              <h2 className="text-xl sm:text-2xl font-bold border-b pb-3 mb-5">

                Your Answer Sheet

              </h2>

              <div className="space-y-4">

                {showResult.details.map(
                  (item, index) => (

                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 ${
                        item.isCorrect
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >

                      <p className="font-bold text-sm sm:text-base break-words">

                        Q{index + 1}. {item.question}

                      </p>

                      <p className="mt-2 text-sm break-words">

                        Your Answer:
                        {" "}

                        <strong
                          className={
                            item.isCorrect
                              ? "text-green-700"
                              : "text-red-700"
                          }
                        >
                          {item.selectedAnswer}
                        </strong>

                      </p>

                      <p className="text-sm text-green-700 break-words">

                        Correct Answer:
                        {" "}

                        <strong>
                          {item.correctAnswer}
                        </strong>

                      </p>

                    </div>
                  )
                )}

              </div>

            </div>

          </div>

        ) : (

          // ================= QUIZ =================

          <div className="flex flex-col xl:grid xl:grid-cols-[1fr_220px] gap-4 items-start">

            {/* QUESTION SECTION */}

            <section className="w-full bg-white rounded-2xl shadow-sm border p-4 sm:p-6 flex flex-col order-2 xl:order-1">

              <div className="text-orange-600 font-black uppercase text-xs tracking-wider mb-4">

                {activeTest.subject}

              </div>

              <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-6 break-words leading-relaxed">

                Q{currentIdx + 1}.
                {" "}
                {currentQuestion?.question}

              </h2>

              {/* OPTIONS */}

              <div className="space-y-3">

                {currentQuestion?.options.map(
                  (opt, i) => (

                    <button
                      key={i}
                      onClick={() =>
                        setUserAnswers({
                          ...userAnswers,
                          [currentQuestion.id]: opt,
                        })
                      }
                      className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition text-sm sm:text-base break-words ${
                        userAnswers[
                          currentQuestion.id
                        ] === opt
                          ? "bg-blue-50 border-blue-600 text-blue-700 font-bold"
                          : "border-gray-200 hover:border-gray-400 bg-white"
                      }`}
                    >

                      {opt}

                    </button>
                  )
                )}

              </div>

              {/* FOOTER */}

              <footer className="pt-5 mt-5 border-t flex flex-col sm:flex-row gap-3">

                <button
                  onClick={() =>
                    setCurrentIdx((prev) =>
                      Math.max(0, prev - 1)
                    )
                  }
                  className="w-full sm:w-auto px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-sm"
                >
                  Previous
                </button>

                <button
                  onClick={() =>
                    setUserAnswers((prev) => {
                      const updated = {
                        ...prev,
                      };

                      delete updated[
                        currentQuestion.id
                      ];

                      return updated;
                    })
                  }
                  className="w-full sm:w-auto px-5 py-3 border border-red-200 text-red-600 rounded-lg font-bold text-sm"
                >
                  Clear Selection
                </button>

                <button
                  onClick={() =>
                    setCurrentIdx((prev) =>
                      Math.min(
                        testQuestions.length - 1,
                        prev + 1
                      )
                    )
                  }
                  className="w-full sm:w-auto sm:ml-auto px-5 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-bold text-sm"
                >
                  Next ▶
                </button>

              </footer>

            </section>

            {/* SIDEBAR */}

            <aside className="bg-white rounded-2xl shadow-sm border p-3 sm:p-4 flex flex-col order-1 xl:order-2 xl:w-[220px] 2xl:w-[230px] h-fit w-full">

              <h3 className="text-gray-500 font-bold uppercase text-xs sm:text-sm mb-3">

                Question Tracker

              </h3>

              {/* QUESTION BUTTONS */}

              <div className="max-h-[420px] overflow-y-auto pr-1">

                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-4 gap-2">

                  {testQuestions.map((q, i) => (

                    <button
                      key={i}
                      onClick={() =>
                        setCurrentIdx(i)
                      }
                      className={`h-8 sm:h-9 rounded-lg border-2 text-xs font-bold transition ${
                        currentIdx === i
                          ? "bg-blue-600 border-blue-600 text-white"
                          : userAnswers[q.id]
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-gray-100 hover:bg-gray-200 border-gray-300"
                      }`}
                    >

                      {i + 1}

                    </button>

                  ))}

                </div>

              </div>

              {/* SUBMIT */}

              <button
                onClick={handleFinalSubmit}
                className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black uppercase text-xs sm:text-sm"
              >

                Submit Final Test

              </button>

            </aside>

          </div>

        )}

      </main>

    </div>
  );
}

export default QuizPortal;