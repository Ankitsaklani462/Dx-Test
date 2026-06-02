// src/components/QuizPortal.jsx

import { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
// ChatBot removed from quiz page per request

function QuizPortal({ currentUser, activeTest, questions, setCurrentScreen, setCurrentUser }) {
  const [showResult, setShowResult] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState((activeTest.duration || 30) * 60);

  const testQuestionIds = Array.isArray(activeTest?.questionIds) ? activeTest.questionIds : [];
  const testQuestions = questions.filter((q) => testQuestionIds.includes(q.id || q._id));

  const answeredQuestions = testQuestions.filter((q) => userAnswers[q.id] !== undefined);
  const currentCorrect = answeredQuestions.reduce(
    (count, q) => (userAnswers[q.id] === q.answer ? count + 1 : count),
    0
  );
  const currentPercent = testQuestions.length
    ? Math.round((currentCorrect / testQuestions.length) * 100)
    : 0;

  const submitTest = async () => {
    try {
      let correct = 0;
      const detailedResults = testQuestions.map((q) => {
        const selected = userAnswers[q.id];
        const correctAns = q.correctAnswer || q.answer || q.correct || '';
        const isCorrect = selected && correctAns ? selected === correctAns : !!q.isCorrect;
        if (selected && isCorrect) correct++;

        return {
          questionId: q.id,
          question: q.question || q.questionText || '',
          questionText: q.question || q.questionText || '',
          selectedAnswer: selected || 'Not Attempted',
          correctAnswer: correctAns,
          isCorrect: selected ? isCorrect : false,
        };
      });

      const score = testQuestions.length > 0 ? Math.round((correct / testQuestions.length) * 100) : 0;
      
      const newAttempt = {
        testId: activeTest.id,
        testTitle: activeTest.title,
        percentage: score,
        date: new Date().toISOString(),
        answers: detailedResults,
      };

      setShowResult({ correct, total: testQuestions.length, percentage: score, details: detailedResults });

      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, {
        attempts: arrayUnion(newAttempt),
        "performance.overall": score,
      });

      // Update local currentUser immediately so dashboard reflects the new attempt
      if (typeof setCurrentUser === 'function') {
        const updatedUser = {
          ...currentUser,
          attempts: [...(currentUser?.attempts || []), newAttempt],
          performance: {
            ...(currentUser?.performance || {}),
            overall: score,
          },
        };
        setCurrentUser(updatedUser);
      }

      // Navigate back to dashboard so user sees updated data immediately
      if (typeof setCurrentScreen === 'function') {
        setCurrentScreen('dashboard');
      }
    } catch (error) {
      console.error("Error submitting test:", error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (testQuestions.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-lg text-center max-w-xl">
          <h2 className="text-2xl font-black mb-4">Test not ready</h2>
          <p className="text-slate-600 mb-4">
            This assessment has no questions available yet.
            Please contact your test administrator or try another test.
          </p>
          <button
            onClick={() => setCurrentScreen("dashboard")}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-100 min-h-screen">
      {/* HEADER WITH DASHBOARD BUTTON */}
      <header className="bg-[#1a2333] text-white p-4 flex justify-between items-center relative">
        <div className="font-bold">TOYOTA BOSHOKU | {currentUser.name}</div>
        <div className="flex gap-4 items-center">
          {!showResult && <div className="bg-red-600 px-3 py-1 rounded font-bold">Time: {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</div>}
          <button onClick={() => setCurrentScreen("dashboard")} className="bg-white text-black px-4 py-1 rounded font-bold text-sm">
            {showResult ? "Back to Dashboard" : "Exit Test"}
          </button>
        </div>
      </header>

      <main className="p-4">
        {showResult ? (
          <div className="bg-white p-6 rounded-xl shadow max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-center text-blue-600 mb-2">Test Completed!</h2>
            <p className="text-xl font-bold text-center">Score: {showResult.percentage}% ({showResult.correct}/{showResult.total})</p>
            
            <div className="mt-6 space-y-4">
              <h3 className="font-bold border-b pb-2">Your Answer History</h3>
              {showResult.details.map((item, i) => (
                <div key={i} className={`p-4 border-l-4 ${item.isCorrect ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}`}>
                  <p className="font-bold">Q{i + 1}: {item.question}</p>
                  <p>Your Answer: {item.selectedAnswer}</p>
                  {!item.isCorrect && <p className="text-green-600 font-bold">Correct: {item.correctAnswer}</p>}
                </div>
              ))}
            </div>
            
            <button onClick={() => setCurrentScreen("dashboard")} className="mt-8 w-full bg-black text-white p-4 rounded-xl font-bold hover:bg-gray-800">
              ← GO TO DASHBOARD
            </button>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[1fr_300px] gap-6">
            <section className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-bold mb-4">Q{currentIdx + 1}. {testQuestions[currentIdx]?.question}</h2>
              <div className="space-y-3">
                {testQuestions[currentIdx]?.options.map((opt, i) => (
                  <button key={i} onClick={() => setUserAnswers({...userAnswers, [testQuestions[currentIdx].id]: opt})}
                    className={`w-full p-3 border-2 rounded text-left ${userAnswers[testQuestions[currentIdx].id] === opt ? "bg-blue-100 border-blue-600" : "border-gray-200"}`}>
                    {opt}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} className="px-4 py-2 bg-gray-200 rounded font-bold">Prev</button>
                <button onClick={() => setUserAnswers({...userAnswers, [testQuestions[currentIdx].id]: undefined})} className="px-4 py-2 border border-red-500 text-red-500 rounded font-bold">Clear</button>
                <button onClick={() => setCurrentIdx(Math.min(testQuestions.length - 1, currentIdx + 1))} className="px-4 py-2 bg-black text-white rounded font-bold ml-auto">Next</button>
              </div>
            </section>

            <aside className="bg-white p-4 rounded-xl shadow h-fit space-y-4">
              <h3 className="font-bold mb-3 uppercase text-sm text-gray-500">Question Tracker</h3>
              <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pb-2">
                {testQuestions.map((q, i) => (
                  <button key={i} onClick={() => setCurrentIdx(i)}
                    className={`p-2 rounded font-bold ${currentIdx === i ? "bg-blue-600 text-white" : userAnswers[q.id] ? "bg-green-500 text-white" : "bg-gray-200"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={submitTest} className="w-full mt-4 bg-red-700 text-white p-3 rounded font-black hover:bg-red-800">SUBMIT FINAL TEST</button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default QuizPortal;