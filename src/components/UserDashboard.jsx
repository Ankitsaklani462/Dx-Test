import React, { useState } from 'react';

function UserDashboard({ currentUser, tests, questions, setActiveTest, setCurrentScreen }) {
  const [selectedLevel, setSelectedLevel] = useState('Beginner'); 
  const [selectedSubject, setSelectedSubject] = useState('HTML'); 

  // Parse candidate metric states
  const stats = currentUser?.performance || { overall: 0, Beginner: 0, Mid: 0, Advanced: 0 };
  const pastAttempts = currentUser?.attempts || [];

  // Identify tests deployed by admin matching the current UI criteria
  const availableTests = tests.filter(
    (test) => test.level === selectedLevel && test.subject === selectedSubject
  );

  const handleStartTestClick = (test) => {
    setActiveTest(test);
    setCurrentScreen('quiz');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Dynamic Profile Welcome Card */}
      <div className="bg-slate-800 text-white p-6 rounded-lg shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {currentUser?.name}!</h2>
          <p className="text-slate-300 text-sm mt-1">Emp ID: {currentUser?.empId} | Dept: {currentUser?.dept}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-wider bg-red-600 px-3 py-1 rounded text-white">
            Candidate Mode
          </span>
        </div>
      </div>

      {/* Analytics Performance Matrix Tracker */}
      <div>
        <h3 className="text-lg font-bold text-slate-700 mb-4">Your Performance Tracker</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border-l-4 border-blue-600 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Overall Performance</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.overall}%</p>
          </div>
          <div className="bg-white p-5 rounded-lg border-l-4 border-green-500 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Beginner Level</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.Beginner}%</p>
          </div>
          <div className="bg-white p-5 rounded-lg border-l-4 border-yellow-500 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Mid Level</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.Mid}%</p>
          </div>
          <div className="bg-white p-5 rounded-lg border-l-4 border-purple-600 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Advanced Level</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.Advanced}%</p>
          </div>
        </div>
      </div>

      {/* Target Module Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Assessment Module Hub Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Choose Your Assessment</h3>
            
            {/* Navigation Level Segment Filters */}
            <div className="flex border-b border-gray-200 mb-6">
              {['Beginner', 'Mid', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`flex-1 text-center py-2.5 font-semibold text-sm transition-all border-b-2 ${
                    selectedLevel === lvl
                      ? 'border-slate-800 text-slate-800 bg-slate-50'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {lvl} Level
                </button>
              ))}
            </div>

            {/* Language/Subject Filter Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {['HTML', 'CSS', 'JavaScript', 'Python'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`py-3 px-4 rounded text-sm font-bold border transition ${
                    selectedSubject === sub
                      ? 'bg-slate-100 border-slate-700 text-slate-800 shadow-inner'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* Active Test Module List */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Available Tests for {selectedSubject} ({selectedLevel})
              </h4>

              {availableTests.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded border border-dashed">
                  No active tests launched by Admin for this segment yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {availableTests.map((test) => {
                    const totalQ = test.questionIds?.length || 0;
                    return (
                      <div 
                        key={test.id} 
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 rounded border border-gray-200 hover:border-slate-400 transition"
                      >
                        <div>
                          <h5 className="font-bold text-slate-800">{test.title}</h5>
                          <p className="text-xs text-gray-500 mt-1">
                            ⏱️ Duration: {test.duration} Mins | 📝 Questions: {totalQ}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStartTestClick(test)}
                          className="mt-3 sm:mt-0 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded shadow transition"
                        >
                          Start Exam
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Historic Verification Metrics Logging Table */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Past Test Attempts</h3>
            
            {pastAttempts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12 border border-dashed rounded">
                No past tests attempted yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {pastAttempts.map((attempt, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200 text-xs">
                    <div className="flex justify-between font-bold text-gray-700 mb-1">
                      <span>{attempt.subject} ({attempt.level})</span>
                      <span className={attempt.score >= 50 ? 'text-green-600' : 'text-red-600'}>
                        {attempt.score}% Score
                      </span>
                    </div>
                    <div className="text-gray-400 flex justify-between">
                      <span>Date: {attempt.date}</span>
                      <span>Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default UserDashboard;