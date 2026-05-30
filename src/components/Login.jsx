// src/components/Login.jsx

import { useState } from 'react';
import myBgImage from '../assets/image.png';
import logo from '../assets/ogp.png';

function Login({ onAuth }) {

  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');

  const [empId, setEmpId] = useState('');

  const [dept, setDept] = useState('');

  const [password, setPassword] = useState('');

  // ================= SUBMIT =================

  const handleSubmit = (e) => {

    e.preventDefault();

    const cleanId = empId.trim().toUpperCase();

    if (!cleanId || !password) {

      return alert('Please fill in all required fields');

    }

    // ADMIN LOGIN

    if (cleanId === 'ADMIN01' && password === 'admin123') {

      onAuth({
        type: 'login',
        name: 'System Admin',
        empId: 'ADMIN01',
        dept: 'Admin',
        role: 'admin'
      });

      return;
    }

    // USER LOGIN / REGISTER

    onAuth({
      type: isRegister ? 'register' : 'login',
      name,
      empId: cleanId,
      dept,
      password
    });

  };

  return (

    <div
      className="min-h-screen w-full overflow-y-auto bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${myBgImage})`
      }}
    >

      {/* ================= HEADER ================= */}

      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-md w-full">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">

          <img
            src={logo}
            alt="Company Logo"
            className="h-10 sm:h-12 w-auto object-contain flex-shrink-0"
          />

          <div className="min-w-0">

            <h1 className="font-black text-slate-900 tracking-wide text-sm sm:text-lg md:text-xl break-words">

              TOYOTA BOSHOKU

            </h1>

            <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 font-bold tracking-widest uppercase break-words">

              Device India Private Limited

            </p>

          </div>

        </div>

      </div>

      {/* ================= MAIN LOGIN AREA ================= */}

      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center lg:justify-end px-3 sm:px-6 md:px-10 lg:px-20 py-6">

        <div className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/20">

          {/* ================= CARD HEADER ================= */}

          <div className="text-center mb-6">

            <img
              src={logo}
              alt="Logo"
              className="h-12 sm:h-14 mx-auto mb-4 object-contain"
            />

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-wide">

              {isRegister ? 'Create Account' : 'User Login'}

            </h2>

          </div>

          {/* ================= FORM ================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-5"
          >

            {/* EMPLOYEE ID */}

            <input
              type="text"
              placeholder="Employee ID"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-cyan-500 uppercase font-semibold"
              required
            />

            {/* REGISTER FIELDS */}

            {isRegister && (

              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
                  required
                />

                <input
                  type="text"
                  placeholder="Department"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
                  required
                />
              </>

            )}

            {/* PASSWORD */}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
              required
            />

            {/* BUTTON */}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 sm:py-3.5 rounded-xl uppercase transition-all shadow-lg text-sm sm:text-base"
            >

              {isRegister ? 'Register' : 'Login'}

            </button>

          </form>

          {/* ================= TOGGLE ================= */}

          <p className="text-center text-xs sm:text-sm mt-6 text-gray-600 leading-relaxed">

            {isRegister
              ? 'Already registered? '
              : "Don't have an account? "
            }

            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-cyan-600 font-bold hover:underline"
            >

              {isRegister ? 'Login' : 'Signup'}

            </button>

          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;
