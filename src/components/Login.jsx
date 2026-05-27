// src/components/Login.jsx
import React, { useState } from 'react';

function Login({ onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [empId, setEmpId] = useState('');
  const [dept, setDept] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanId = empId.trim().toUpperCase();

    if (!cleanId || !password) {
      alert('Please fill in both Employee ID and Password.');
      return;
    }

    // Explicit Admin Access Route Validation
    if (cleanId === 'ADMIN01') {
      if (password === 'admin123') { 
        onAuth({ type: 'login', name: 'System Admin', empId: 'ADMIN01', dept: 'Admin', role: 'admin' });
      } else {
        alert('Incorrect Admin Password!');
      }
      return;
    }

    if (isRegister) {
      if (!name || !dept) {
        alert('Please fill all details to Register.');
        return;
      }
      onAuth({
        type: 'register',
        name: name.trim(),
        empId: cleanId,
        dept: dept,
        password: password
      });
    } else {
      onAuth({
        type: 'login',
        empId: cleanId,
        password: password
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-md max-w-md w-full space-y-6">
        
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black mx-auto mb-2 text-xl tracking-tighter">TB</div>
          <h2 className="text-xl font-black tracking-wider text-slate-900 uppercase">
            {isRegister ? 'Create Account' : 'Gateway Portal'}
          </h2>
          <p className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase">
            {isRegister ? 'Skill Portal Registration' : 'Secure Employee Login'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-600 mb-1">Employee ID / Code *</label>
            <input 
              type="text" 
              placeholder="e.g. EMP101 or ADMIN01" 
              value={empId} 
              onChange={(e) => setEmpId(e.target.value)} 
              className="w-full border border-gray-300 rounded px-3 py-2.5 focus:outline-none focus:border-slate-800 font-semibold uppercase tracking-wide bg-slate-50/50"
              required
            />
          </div>

          {isRegister && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter your first and last name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full border border-gray-300 rounded px-3 py-2.5 focus:outline-none focus:border-slate-800 font-semibold bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Department Section *</label>
                <select 
                  value={dept} 
                  onChange={(e) => setDept(e.target.value)} 
                  className="w-full border border-gray-300 rounded px-3 py-2.5 bg-white focus:outline-none focus:border-slate-800 font-semibold text-gray-700"
                  required
                >
                  <option value="">-- Select Department --</option>
                  <option value="Production Line A">Production Line A</option>
                  <option value="Production Line B">Production Line B</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Logistics & Stores">Logistics & Stores</option>
                  <option value="Office Operations">Office Operations</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-600 mb-1">Password *</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full border border-gray-300 rounded px-3 py-2.5 focus:outline-none focus:border-slate-800 font-semibold tracking-wide bg-slate-50/50"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded tracking-wide shadow-md transition-colors uppercase mt-2 text-xs"
          >
            {isRegister ? '📝 Complete Registration' : '🔑 Secure Login'}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-gray-100 text-xs">
          {isRegister ? (
            <p className="text-gray-500">
              Already registered?{' '}
              <button type="button" onClick={() => setIsRegister(false)} className="text-blue-600 font-bold hover:underline">
                Login Here
              </button>
            </p>
          ) : (
            <p className="text-gray-500">
              New user? / Admin login?{' '}
              <button type="button" onClick={() => setIsRegister(true)} className="text-emerald-600 font-bold hover:underline">
                Register / Sign Up Here
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

export default Login;