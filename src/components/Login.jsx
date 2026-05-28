// src/components/Login.jsx
import React, { useState } from 'react';
import myBgImage from '../assets/image.png'; // Background image
import logo from '../assets/ogp.png';        // Toyota Boshoku logo

function Login({ onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [empId, setEmpId] = useState('');
  const [dept, setDept] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanId = empId.trim().toUpperCase();
    if (!cleanId || !password) return alert('Please fill in all required fields');

    if (cleanId === 'ADMIN01' && password === 'admin123') {
      onAuth({ type: 'login', name: 'System Admin', empId: 'ADMIN01', dept: 'Admin', role: 'admin' });
      return;
    }
    onAuth({ type: isRegister ? 'register' : 'login', name, empId: cleanId, dept, password });
  };

  return (
    <div 
      className="fixed inset-0 w-full h-screen flex flex-col bg-cover bg-center overflow-hidden"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${myBgImage})` 
      }}
    >
      
      {/* Updated Header Section */}
<div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center space-x-3 shadow-md w-full">
  {/* Added 'block' and 'object-contain' to ensure image renders */}
  <img 
    src={logo} 
    alt="Company Logo" 
    className="h-10 w-auto block object-contain" 
  />
  <div>
    <h1 className="font-black text-slate-900 tracking-wider">TOYOTA BOSHOKU</h1>
    <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Device India Private Limited</p>
  </div>
</div>

      {/* 2. LOGIN CARD SECTION (Right Side) */}
      <div className="flex-1 flex items-center justify-end pr-10 md:pr-20 p-4">
        <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl p-8 w-full max-w-sm">
          
          <div className="text-center mb-6">
            {/* Logo inside the card */}
            <img src={logo} alt="Logo" className="h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
              {isRegister ? 'Create Account' : 'User Login'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input 
                type="text" 
                placeholder="Employee ID"
                value={empId} 
                onChange={(e) => setEmpId(e.target.value)} 
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 uppercase font-semibold" 
                required 
              />
            </div>

            {isRegister && (
              <>
                <input 
                  type="text" 
                  placeholder="Full Name"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 font-semibold" 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="Department"
                  value={dept} 
                  onChange={(e) => setDept(e.target.value)} 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 font-semibold" 
                  required 
                />
              </>
            )}

            <div>
              <input 
                type="password" 
                placeholder="Password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 font-semibold" 
                required 
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl uppercase transition-all shadow-lg"
            >
              {isRegister ? 'Register' : 'Login'}
            </button>
          </form>

          <p className="text-center text-sm mt-6 text-gray-600">
            {isRegister ? 'Already registered? ' : "Don't have an account? "}
            <button onClick={() => setIsRegister(!isRegister)} className="text-cyan-600 font-bold hover:underline">
              {isRegister ? 'Login' : 'Signup'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;