import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, User, AlertCircle } from 'lucide-react';

const Login = () => {
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await login(usernameInput, password);
      navigate('/admin');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'Invalid username or password. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-md bg-slate-800 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex p-3 bg-blue-600/10 text-blue-400 rounded-xl mb-4">
            <LogIn size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin Console</h2>
          <p className="text-slate-400 text-sm mt-1">
            Sign in to manage employees, upload plans, and track reports
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-200 p-3 rounded-lg text-sm mb-6">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User size={18} />
              </span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors text-sm"
                placeholder="Enter admin username"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors text-sm"
                placeholder="Enter password"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/')} 
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors underline"
          >
            Back to Public Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
