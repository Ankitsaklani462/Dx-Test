// src/components/QuizPortal.jsx
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";



function QuizPortal({ currentUser, activeTest, questions, setCurrentScreen }) {
  const [showResult, setShowResult] = useState(null);
  const testQuestions = questions.filter(q => activeTest.questionIds.includes(q.id));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState((activeTest.duration || 30) * 60);
    
    
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
          isCorrect: selected ? isCorrect : false
        };
      });

      // Score calculate karein (agar 0 questions hain toh 0 score)
      const total = testQuestions.length || 1;
      const score = testQuestions.length > 0 ? Math.round((correct / testQuestions.length) * 100) : 0;

      // Result state update (Isme 'details' add kar diya hai answer sheet ke liye)
      setShowResult({
        correct: correct,
        total: testQuestions.length,
        percentage: score,
        details: detailedResults 
      });

    // Firebase Update... (Aapka purana code yahan rahega)
    const userRef = doc(db, "users", currentUser.id);
    await updateDoc(userRef, {
      attempts: arrayUnion({
        testId: activeTest.id,
        testTitle: activeTest.title, 
          subject: activeTest.subject,   
          level: activeTest.level,
        percentage: score,
        date: new Date().toISOString(),
        answers: detailedResults
        
      }),
      "performance.overall": score, 
    });

    console.log("Test submitted!");
  } catch (error) {
    console.error("Error: ", error);
  }
};

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit jab time khatam ho jaye
          submitTest(userAnswers).then(() => {
            alert("Time is up! Your test has been submitted.");
            setCurrentScreen('dashboard');
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { clearInterval(timer); document.body.style.overflow = "auto"; };
  }, [userAnswers, setCurrentScreen]); // Dependencies added

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    if (window.confirm("Are you sure you want to go back? Your progress will be lost.")) {
      setCurrentScreen('dashboard');
    }
  };


const handleFinalSubmit = async () => {
  if (window.confirm("Are you sure you want to submit the final test?")) {
    await submitTest(userAnswers); 
  }
};

  const currentQuestion = testQuestions[currentIdx];

  return (
    <div className="fixed inset-0 w-full h-screen flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex-none shadow-md z-50">
        <header className="bg-[#1a2333] text-white p-3 flex items-center justify-between w-full h-14">
          <div className="font-bold text-sm">TOYOTA BOSHOKU | Candidate: {currentUser.name}</div>
          <button onClick={handleBack} className="text-xs bg-red-800 hover:bg-red-700 px-3 py-1 rounded font-bold">
            ← BACK TO DASHBOARD
          </button>
        </header>
        {!showResult && (
          <div className="bg-red-600 text-white font-black text-xl text-center py-2 w-full h-12 flex items-center justify-center border-t border-red-700">
            TIME REMAINING: {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <main className="flex-1 w-full overflow-hidden p-6 gap-6 flex">
        {showResult ? (
  // RESULT SCREEN
  <div className="flex flex-col w-full h-full overflow-y-auto p-8 bg-white rounded-lg shadow-sm border">
    <h2 className="text-3xl font-bold mb-4 text-green-600 text-center">Test Completed!</h2>
    <div className="flex flex-col items-center">
      <p className="text-xl">You scored: <strong>{showResult.correct} / {showResult.total}</strong></p>
      <p className="text-5xl font-black mt-2 mb-6 text-blue-600">{showResult.percentage}%</p>
      
      <button 
        onClick={() => setCurrentScreen('dashboard')}
        className="px-8 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800"
      >
        Back to Dashboard
      </button>
    </div>

   
    <div className="w-full max-w-3xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 border-b pb-2">Your Answer Sheet</h2>
      <div className="space-y-4">
        {showResult.details.map((item, index) => (
          <div key={index} className={`p-4 border-2 rounded-xl ${item.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <p className="font-bold">Q{index + 1}. {item.question}</p>
            <p className="mt-2 text-sm">Your Answer: <strong className={item.isCorrect ? "text-green-700" : "text-red-700"}>{item.selectedAnswer}</strong></p>
            
            {/* Correct answer dikhega */}
            <p className="text-sm text-green-600">
               Correct Answer: <strong>{item.correctAnswer}</strong>
            </p>
          </div>
        ))}
      </div>
    </div>
    {/* -------------------------------------------------- */}
    
  </div>
) : (
          // QUIZ SCREEN
          <>
            <section className="flex-[3] bg-white p-8 rounded-lg shadow-sm border flex flex-col overflow-hidden">
              <div className="text-xs font-black text-orange-600 uppercase mb-4 tracking-wider">{activeTest.subject}</div>
              <h2 className="text-xl font-bold mb-6 overflow-y-auto">Q{currentIdx + 1}. {currentQuestion?.question}</h2>
              
              <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                {currentQuestion?.options.map((opt, i) => (
                  <button key={i} onClick={() => setUserAnswers({...userAnswers, [currentQuestion.id]: opt})} 
                    className={`w-full p-4 border-2 rounded-lg text-left transition ${userAnswers[currentQuestion.id] === opt ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold' : 'border-gray-200 hover:border-gray-300'}`}>
                    {opt}
                  </button>
                ))}
              </div>

              <footer className="flex gap-4 pt-6 border-t mt-6 flex-none">
                <button onClick={() => setCurrentIdx(p => Math.max(0, p - 1))} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded font-bold text-sm">Previous</button>
                <button onClick={() => setUserAnswers(prev => { const n = {...prev}; delete n[currentQuestion.id]; return n; })} className="px-6 py-2 text-red-600 font-bold border border-red-200 rounded text-sm">Clear Selection</button>
                <button onClick={() => setCurrentIdx(p => Math.min(testQuestions.length - 1, p + 1))} className="px-6 py-2 bg-black text-white hover:bg-gray-800 rounded font-bold text-sm ml-auto">Next ▶</button>
              </footer>
            </section>

            <aside className="w-80 bg-white p-6 rounded-lg shadow-sm border flex flex-col flex-none overflow-hidden">
              <h3 className="font-bold text-sm uppercase mb-4 text-gray-500">Question Tracker</h3>
              <div className="grid grid-cols-4 gap-2 overflow-y-auto flex-1 content-start pr-1">
                {testQuestions.map((q, i) => (
                  <button key={i} onClick={() => setCurrentIdx(i)}
                    className={`w-10 h-10 rounded font-bold text-xs border-2 transition ${currentIdx === i ? 'bg-blue-600 text-white border-blue-600' : userAnswers[q.id] ? 'bg-green-500 text-white border-green-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={handleFinalSubmit} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-black uppercase text-sm mt-4 flex-none">
                Submit Final Test
              </button>
            </aside>
          </>
        )}
      </main>
    </div>
  );}
export default QuizPortal;