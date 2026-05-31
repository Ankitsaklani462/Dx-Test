import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';

import Login from './components/Login';
import QuizPortal from './components/QuizPortal';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import BrandLogo from './components/BrandLogo';

function App() {

  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('login');
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [tests, setTests] = useState([]);

  const [subjects, setSubjects] = useState([
    'HTML',
    'CSS',
    'JavaScript',
    'Python'
  ]);

  const [activeTest, setActiveTest] = useState(null);
  const [selectedReviewAttempt, setSelectedReviewAttempt] = useState(null);

  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [selectedSubject, setSelectedSubject] = useState('HTML');

  const [newSubjectName, setNewSubjectName] = useState('');
  const isLoginScreen = currentScreen === 'login';
  const isQuizScreen = currentScreen === 'quiz';

  // ================= FETCH DATA =================

  const fetchGlobalData = async () => {
    try {

      const configDoc = await getDoc(doc(db, "system", "config"));

      if (configDoc.exists() && configDoc.data().subjects) {
        setSubjects(configDoc.data().subjects);
      } else {
        await setDoc(doc(db, "system", "config"), {
          subjects: ['HTML', 'CSS', 'JavaScript', 'Python']
        });
      }

      const usersSnap = await getDocs(collection(db, "users"));
      setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))); // Fix: id include ki

      const questionsSnap = await getDocs(collection(db, "questions"));
      setQuestions(
        questionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );

      const testsSnap = await getDocs(collection(db, "tests"));
      setTests(
        testsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );

    } catch (error) {
      console.error("Firebase Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, [currentScreen]);

  // ================= USER SYNC =================

  const syncCurrentUserState = async (empId) => {

    if (!empId || empId === 'ADMIN01') return;

    const uDoc = await getDoc(doc(db, "users", empId));

    if (uDoc.exists()) {
      setCurrentUser({ id: uDoc.id, ...uDoc.data() });
    }
  };

  // ================= TEST START =================

  const startTest = (testToStart) => {
    setActiveTest(testToStart);
    setCurrentScreen('quiz');
  };

  // ================= LOGOUT =================

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  // ================= ADD SUBJECT =================

  const handleAddSubject = async () => {

    const cleanSub = newSubjectName.trim().toUpperCase();

    if (!cleanSub) return;

    if (subjects.includes(cleanSub)) {
      alert("Subject already exists!");
      return;
    }

    const updatedSubs = [...subjects, cleanSub];

    await setDoc(doc(db, "system", "config"), {
      subjects: updatedSubs
    });

    setSubjects(updatedSubs);
    setNewSubjectName('');

    alert(`Subject "${cleanSub}" added!`);
  };

  // ================= DELETE SUBJECT =================

  const handleDeleteSubject = async (subToDelete) => {

    if (!window.confirm(`Delete "${subToDelete}"?`)) return;

    const updatedSubs = subjects.filter(
      s => s !== subToDelete
    );

    await setDoc(doc(db, "system", "config"), {
      subjects: updatedSubs
    });

    setSubjects(updatedSubs);

    if (selectedSubject === subToDelete) {
      setSelectedSubject(updatedSubs[0] || '');
    }
  };

  // ================= AUTH =================

  const handleAuth = async (authData) => {

    // ADMIN LOGIN
    if (
      authData.role === 'admin' ||
      authData.empId === 'ADMIN01'
    ) {

      setCurrentUser({
        id: 'ADMIN01',
        name: 'System Admin',
        empId: 'ADMIN01',
        role: 'admin'
      });

      setCurrentScreen('admin');

      return;
    }

    try {

      const userDocRef = doc(
        db,
        "users",
        authData.empId
      );

      const userDocSnap = await getDoc(userDocRef);

      // REGISTER
      if (authData.type === 'register') {

        if (userDocSnap.exists()) {
          alert("Employee ID already registered!");
          return;
        }

        const newUserProfile = {
          id: authData.empId,
          name: authData.name,
          empId: authData.empId,
          dept: authData.dept,
          password: authData.password,
          role: 'candidate',

          performance: {
            overall: 0,
            Beginner: 0,
            Mid: 0,
            Advanced: 0
          },

          attempts: []
        };

        await setDoc(userDocRef, newUserProfile);

        setCurrentUser(newUserProfile);

        setCurrentScreen('dashboard');

      }

      // LOGIN
      else {

        if (!userDocSnap.exists()) {
          alert("Employee ID not found!");
          return;
        }

        const existingUser = { id: userDocSnap.id, ...userDocSnap.data() };

        if (
          existingUser.password === authData.password
        ) {

          setCurrentUser(existingUser);

          setCurrentScreen(
            existingUser.role === 'admin'
              ? 'admin'
              : 'dashboard'
          );

        } else {
          alert("Invalid Password!");
        }
      }

    } catch (error) {
      console.log(error);
      alert("Authentication Failed!");
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center text-white text-sm font-bold uppercase tracking-widest">
        Loading Platform Matrix...
      </div>
    );
  }

  // ================= MAIN UI =================

  return (

    <div className="min-h-screen w-full overflow-x-hidden bg-[#f8fafc] text-slate-800 font-sans antialiased">

      {/* HEADER */}

      {!isLoginScreen && (

        <div className="bg-white border-b border-slate-200 py-3 sm:py-4 px-3 sm:px-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3 shadow-sm sticky top-0 z-40">

        <BrandLogo />

        {currentUser && (

          <div className="flex w-full flex-wrap items-center justify-center gap-2 md:w-auto md:justify-end">

            <button
              type="button"
              onClick={() => setCurrentScreen('profile')}
              className="flex max-w-full min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-left transition hover:border-emerald-300 hover:bg-slate-100"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-white text-sm font-black">
                {currentUser.profileImage || currentUser.photoURL ? (
                  <img
                    src={currentUser.profileImage || currentUser.photoURL}
                    alt="User avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{currentUser.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-700">
                  {currentUser.name} ({currentUser.empId})
                </p>
                <span className="truncate text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                  {currentUser.role === 'admin'
                    ? 'SYSTEM ADMIN'
                    : 'CANDIDATE'}
                </span>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition"
            >
              Logout
            </button>

          </div>
        )}

        </div>

      )}

      {/* MAIN */}

      <main
        className={
          isLoginScreen
            ? "w-full"
            : isQuizScreen
            ? "w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4"
            : "w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-5 sm:py-8"
        }
      >

        {/* LOGIN */}

        {currentScreen === 'login' && (
          <Login onAuth={handleAuth} />
        )}

        {/* DASHBOARD */}

        {currentScreen === 'dashboard' && (

          <Dashboard
            currentUser={currentUser}
            onEditProfile={() => setCurrentScreen('profile')}
            tests={tests}
            subjects={subjects}

            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}

            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}

            startTest={startTest}

            selectedReviewAttempt={selectedReviewAttempt}
            setSelectedReviewAttempt={setSelectedReviewAttempt}
          />

        )}

        {/* PROFILE */}

        {currentScreen === 'profile' && (
          <ProfilePage
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {/* QUIZ */}

        {currentScreen === 'quiz' && activeTest && (

          <QuizPortal
            currentUser={currentUser}
            activeTest={activeTest}
            questions={questions}

            setUsers={setUsers}

            setCurrentScreen={setCurrentScreen}

            onForceSync={() =>
              syncCurrentUserState(currentUser?.empId)
            }
            setCurrentUser={setCurrentUser}
          />

        )}

        {/* ADMIN */}

        {currentScreen === 'admin' && (

          <div className="space-y-6 sm:space-y-8">

            {/* SUBJECT MANAGEMENT */}

            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">

              <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">

                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 break-words">
                  Dynamic Categorization Framework Engine
                </h2>

                <button
                  onClick={() => setCurrentScreen('dashboard')}
                  className="w-full sm:w-auto bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl uppercase tracking-wide"
                >
                  Return Dashboard
                </button>

              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-end w-full max-w-xl text-xs">

                <div className="flex-1 w-full">

                  <label className="block font-bold text-slate-600 mb-1">
                    New Subject
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. REACT"
                    value={newSubjectName}
                    onChange={(e) =>
                      setNewSubjectName(e.target.value)
                    }
                    className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2.5 font-bold uppercase"
                  />

                </div>

                <button
                  onClick={handleAddSubject}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider"
                >
                  Add Subject
                </button>

              </div>

              <div className="flex flex-wrap gap-2">

                {subjects.map(sub => (

                  <div
                    key={sub}
                    className="bg-slate-950 text-white pl-3 pr-1 py-1 rounded-xl flex items-center gap-2 text-xs font-bold"
                  >

                    <span>{sub}</span>

                    <button
                      onClick={() => handleDeleteSubject(sub)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] p-1 rounded-md"
                    >
                      ✕
                    </button>

                  </div>

                ))}

              </div>

            </div>

            {/* ADMIN PANEL */}

            <AdminPanel
              users={users}
              setUsers={setUsers}
              questions={questions}
              setQuestions={setQuestions}
              tests={tests}
              setTests={setTests}
              setCurrentScreen={setCurrentScreen}
            />

          </div>

        )}

      </main>

    </div>
  );
}

export default App;
