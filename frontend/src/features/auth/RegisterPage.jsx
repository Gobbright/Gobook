import { useState } from 'react';
import { Building2, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';

import { register } from '../../services/authService.js';

const INPUT = 'w-full border border-[#dbe4ef] rounded-md py-2.5 pl-9 pr-3.5 text-[14px] outline-none focus:border-blue-500';
const LABEL = 'block text-[13px] font-medium text-[#111827] mb-1.5';
const ICON = 'absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none';

export function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        businessName: form.businessName,
        phone: form.phone,
      });
      window.location.hash = '/login';
    } catch (err) {
      setError(err.message || 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f9fd] px-4 py-10">
      <div className="w-full max-w-110">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center flex-none">
            <span className="text-white text-sm font-black">G</span>
          </div>
          <span className="text-[22px] font-extrabold tracking-tight text-[#111827]">GoBook</span>
        </div>

        <div className="bg-white border border-[#dfe7f1] rounded-lg p-7 shadow-sm">
          <h1 className="m-0 text-[24px] font-bold text-[#111827]">Create your account</h1>
          <p className="text-[#536173] mt-1.5 mb-6 text-[13px]">Set up GoBook to manage your business.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className={LABEL}>Full name</label>
                <div className="relative">
                  <User size={15} className={ICON} />
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange('name')}
                    className={INPUT}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="businessName" className={LABEL}>Business name</label>
                <div className="relative">
                  <Building2 size={15} className={ICON} />
                  <input
                    id="businessName"
                    type="text"
                    required
                    placeholder="Your company"
                    value={form.businessName}
                    onChange={handleChange('businessName')}
                    className={INPUT}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className={LABEL}>Email address</label>
              <div className="relative">
                <Mail size={15} className={ICON} />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange('email')}
                  className={INPUT}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className={LABEL}>Phone number</label>
              <div className="relative">
                <Phone size={15} className={ICON} />
                <input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  className={INPUT}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className={LABEL}>Password</label>
                <div className="relative">
                  <Lock size={15} className={ICON} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange('password')}
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
              <div>
                <label htmlFor="confirmPassword" className={LABEL}>Confirm password</label>
                <div className="relative">
                  <Lock size={15} className={ICON} />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    className={INPUT}
                  />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 text-[13px] text-[#536173] cursor-pointer select-none">
              <input type="checkbox" required className="mt-0.5 rounded border-[#dbe4ef]" />
              <span>
                I agree to the <a href="#terms" className="text-blue-600 no-underline hover:underline">Terms of Service</a> and{' '}
                <a href="#privacy" className="text-blue-600 no-underline hover:underline">Privacy Policy</a>
              </span>
            </label>

            {error && (
              <p className="text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2 m-0">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer border rounded-md px-3.5 py-2.5 text-white bg-blue-600 border-blue-600 font-medium text-[14px] hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-[#536173] mt-5">
          Already have an account?{' '}
          <a href="#/login" className="text-blue-600 font-medium no-underline hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
