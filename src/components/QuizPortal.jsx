// src/components/QuizPortal.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

function QuizPortal({ currentUser, activeTest, questions, setUsers, setCurrentScreen, onForceSync }) {
  const testQuestions = questions.filter(q => activeTest.questionIds.includes(q.id));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(activeTest.duration * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Scroll lock for professional exam feel
    document.body.style.overflow = "hidden";
    const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => { clearInterval(timer); document.body.style.overflow = "auto"; };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (option) => setUserAnswers({ ...userAnswers, [testQuestions[currentIdx].id]: option });

  const executeSubmission = async () => {
    setIsSubmitting(true);
    // Add your existing Firestore logic here
    alert("Test Submitted!");
    setCurrentScreen('dashboard');
  };

  const currentQuestion = testQuestions[currentIdx];

  return (
    <div className="h-screen flex flex-col bg-gray-50 p-4">
      {/* Header - Perfect Alignment */}
      <div className="bg-[#1a2333] text-white p-4 rounded-t-lg flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="font-bold text-sm">
          Candidate: {currentUser.name} | Emp ID: {currentUser.empId} | Dept: {currentUser.dept}
        </div>
        <div className="bg-red-600 px-6 py-2 rounded font-bold">
          Time Left: {formatTime(timeLeft)}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 overflow-hidden">
        
        {/* Left Side: Question Card */}
        <div className="lg:col-span-2 bg-white p-8 rounded-lg border shadow-sm flex flex-col h-full overflow-y-auto">
          <span className="bg-orange-100 text-orange-800 px-3 py-1 text-xs font-black rounded uppercase self-start">
            {activeTest.subject}
          </span>
          <h2 className="text-xl font-bold mt-4 mb-8">Q{currentIdx + 1}. {currentQuestion?.question}</h2>
          
          <div className="space-y-4 flex-1">
            {currentQuestion?.options.map((opt, i) => (
              <button key={i} onClick={() => handleSelectOption(opt)} 
                className={`w-full p-4 border rounded text-left font-medium transition ${userAnswers[currentQuestion.id] === opt ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50 border-gray-200'}`}>
                {opt}
              </button>
            ))}
          </div>

          {/* Navigation Buttons - Strictly Aligned */}
          <div className="mt-8 flex gap-3 pt-4 border-t">
            <button onClick={() => setCurrentIdx(p => Math.max(0, p - 1))} className="px-6 py-2 bg-gray-200 rounded font-bold">Previous</button>
            <button onClick={() => setUserAnswers({...userAnswers, [currentQuestion.id]: undefined})} className="px-6 py-2 bg-red-50 text-red-600 rounded font-bold border border-red-100">Clear Choice</button>
            <button onClick={() => setCurrentIdx(p => Math.min(testQuestions.length - 1, p + 1))} className="px-6 py-2 bg-black text-white rounded font-bold ml-auto">Next ▶</button>
          </div>
        </div>

        {/* Right Side: Tracker - Properly Scrolled */}
        <div className="bg-white p-6 rounded-lg border shadow-sm flex flex-col h-full overflow-hidden">
          <h3 className="font-bold mb-4 uppercase text-sm text-gray-500">Question Tracker</h3>
          <div className="grid grid-cols-4 gap-2 mb-6 overflow-y-auto pr-2">
            {testQuestions.map((q, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className={`p-3 border rounded text-sm font-bold transition ${currentIdx === i ? 'border-blue-500 bg-blue-50' : userAnswers[q.id] ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <button onClick={executeSubmission} className="w-full bg-red-600 text-white py-4 rounded font-black uppercase tracking-widest hover:bg-red-700 mt-auto">
            Submit Final Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizPortal;