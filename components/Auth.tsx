import React, { useState } from 'react';
import { 
  BookOpen, 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  UserPlus, 
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { authApi } from '../services/api';

interface AuthProps {
  onLogin: (token: string, user: any) => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
    setSuccess(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }

    if (!isLogin && !formData.name) {
      setError('Name is required');
      return false;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const data = await authApi.login(formData.email, formData.password);
        // Store token and user info
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.token, data.user);
      } else {
        // Register
        const data = await authApi.register(formData.name, formData.email, formData.password);
        // Auto-login after successful registration
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setSuccess('Account created successfully! Logging you in...');
        setTimeout(() => {
          onLogin(data.token, data.user);
        }, 500);
      }
    } catch (err: any) {
      // Show specific error message
      const errorMsg = err.message || 'An error occurred. Please try again.';
      
      // Handle network/connection errors
      if (errorMsg.toLowerCase().includes('failed to fetch') || 
          errorMsg.toLowerCase().includes('network') ||
          errorMsg.toLowerCase().includes('fetch')) {
        setError('🔌 Cannot connect to server. Please ensure the backend server is running on port 5000.');
      } else if (errorMsg.toLowerCase().includes('already exists') || errorMsg.includes('409')) {
        setError('⚠️ This email is already registered. Please use a different email or try logging in.');
      } else if (errorMsg.toLowerCase().includes('invalid email or password') || 
                 errorMsg.toLowerCase().includes('invalid credentials')) {
        setError('❌ Invalid email or password. Please check your credentials.');
      } else if (errorMsg.toLowerCase().includes('user not found')) {
        setError('❌ No account found with this email. Please sign up first.');
      } else {
        setError(`❌ ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4 shadow-lg shadow-orange-500/20">
            <BookOpen size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            {APP_NAME}
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Sparkles size={14} className="text-orange-400" strokeWidth={2.5} />
            <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">
              AI Document Intelligence
            </span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="card-premium p-8 md:p-10 rounded-2xl space-y-6 shadow-2xl">
          {/* Tab Switcher */}
          <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => !isLoading && setIsLogin(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                isLogin 
                  ? 'btn-primary text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <LogIn size={18} />
              <span>Log In</span>
            </button>
            <button
              type="button"
              onClick={() => !isLoading && setIsLogin(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                !isLogin 
                  ? 'btn-primary text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <UserPlus size={18} />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-sm font-medium animate-pulse">
              <CheckCircle2 size={20} className="flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm font-medium">
              <AlertCircle size={20} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-zinc-300 ml-1 block">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full input-premium rounded-xl py-3.5 pl-12 pr-4 text-white text-base placeholder:text-zinc-500 font-medium"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-zinc-300 ml-1 block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full input-premium rounded-xl py-3.5 pl-12 pr-4 text-white text-base placeholder:text-zinc-500 font-medium"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-zinc-300 ml-1 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full input-premium rounded-xl py-3.5 pl-12 pr-4 text-white text-base placeholder:text-zinc-500 font-medium"
                  disabled={isLoading}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-zinc-300 ml-1 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full input-premium rounded-xl py-3.5 pl-12 pr-4 text-white text-base placeholder:text-zinc-500 font-medium"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl flex items-center justify-center gap-3 font-semibold text-base mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : isLogin ? (
                <>
                  <LogIn size={20} />
                  <span>Log In to Your Account</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Create Your Account</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-zinc-800">
            <p className="text-zinc-400 text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={toggleMode}
                disabled={isLoading}
                className="text-orange-400 hover:text-orange-300 font-semibold transition-colors disabled:opacity-50"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-zinc-500 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;
