import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

import { login } from '../../services/authService.js';

const INPUT = 'w-full border border-[#dbe4ef] rounded-md py-2.5 pl-9 pr-3.5 text-[14px] outline-none focus:border-blue-500';
const LABEL = 'block text-[13px] font-medium text-[#111827] mb-1.5';
const ICON = 'absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      window.location.hash = '/dashboard';
    } catch (err) {
      setError(err.message || 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f9fd] px-4">
      <div className="w-full max-w-100">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center flex-none">
            <span className="text-white text-sm font-black">G</span>
          </div>
          <span className="text-[22px] font-extrabold tracking-tight text-[#111827]">GoBook</span>
        </div>

        <div className="bg-white border border-[#dfe7f1] rounded-lg p-7 shadow-sm">
          <h1 className="m-0 text-[24px] font-bold text-[#111827]">Welcome back</h1>
          <p className="text-[#536173] mt-1.5 mb-6 text-[13px]">Sign in to your GoBook account to continue.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className={LABEL}>Email address</label>
              <div className="relative">
                <Mail size={15} className={ICON} />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-[13px] font-medium text-[#111827]">Password</label>
                <a href="#forgot-password" className="text-[12px] text-blue-600 no-underline hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock size={15} className={ICON} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${INPUT} pr-9`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#536173] cursor-pointer bg-transparent border-0 p-0 flex items-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[13px] text-[#536173] cursor-pointer select-none">
              <input type="checkbox" className="rounded border-[#dbe4ef]" />
              Remember me
            </label>

            {error && (
              <p className="text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2 m-0">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer border rounded-md px-3.5 py-2.5 text-white bg-blue-600 border-blue-600 font-medium text-[14px] hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-[#536173] mt-5">
          Don&apos;t have an account?{' '}
          <a href="#/register" className="text-blue-600 font-medium no-underline hover:underline">Create one</a>
        </p>
      </div>
    </div>
  );
}
