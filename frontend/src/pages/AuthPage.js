import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowLeft, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_ecommerce-preview-9/artifacts/jueohop5_IMG_2943.png';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // login | signup | forgot
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const { login, signup, resetPassword, user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (user) navigate(redirect, { replace: true });
  }, [user, navigate, redirect]);

  if (user) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally { setSubmitting(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSubmitting(true);
    try {
      await signup(form.name, form.email, form.password, form.phone);
      toast.success('Account created!');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed');
    } finally { setSubmitting(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSubmitting(true);
    try {
      await resetPassword(form.email, form.newPassword);
      toast.success('Password reset successful! Please login.');
      setMode('login');
      setForm(prev => ({ ...prev, password: '' }));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Reset failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12" data-testid="auth-page">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="Bastar Mart" className="h-16 mx-auto mb-3 object-contain" />
          <p className="text-xs text-gray-400 font-body tracking-wider uppercase">The Smart Way to Shop</p>
        </div>

        {/* LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
            <h2 className="font-heading font-extrabold text-2xl text-gray-900 text-center">Welcome Back</h2>
            <p className="text-sm text-gray-400 font-body text-center mb-2">Sign in to your account</p>
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input data-testid="login-email" type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="pl-11 h-12 rounded-xl text-base font-body" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input data-testid="login-password" type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="pl-11 h-12 rounded-xl text-base font-body" required />
              </div>
            </div>
            <button type="button" onClick={() => setMode('forgot')} className="text-sm text-brand-green font-body font-medium hover:underline block" data-testid="forgot-password-link">
              Forgot password?
            </button>
            <Button data-testid="login-submit" type="submit" disabled={submitting} className="w-full h-12 bg-brand-green hover:bg-brand-green-dark text-white font-heading font-bold rounded-xl text-base active:scale-[0.98] transition-transform">
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-gray-400 font-body text-center">
              New to Bastar Mart?{' '}
              <button type="button" onClick={() => setMode('signup')} className="text-brand-green font-bold hover:underline" data-testid="switch-to-signup">Create an account</button>
            </p>
          </form>
        )}

        {/* SIGNUP */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4" data-testid="signup-form">
            <h2 className="font-heading font-extrabold text-2xl text-gray-900 text-center">Create Account</h2>
            <p className="text-sm text-gray-400 font-body text-center mb-2">Join Bastar Mart today</p>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input data-testid="signup-name" type="text" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="pl-11 h-12 rounded-xl text-base font-body" required />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input data-testid="signup-email" type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="pl-11 h-12 rounded-xl text-base font-body" required />
              </div>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input data-testid="signup-phone" type="tel" placeholder="Phone number (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="pl-11 h-12 rounded-xl text-base font-body" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input data-testid="signup-password" type="password" placeholder="Create password (min 6 chars)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="pl-11 h-12 rounded-xl text-base font-body" required />
              </div>
            </div>
            <Button data-testid="signup-submit" type="submit" disabled={submitting} className="w-full h-12 bg-brand-green hover:bg-brand-green-dark text-white font-heading font-bold rounded-xl text-base active:scale-[0.98] transition-transform">
              {submitting ? 'Creating account...' : 'Create Account'}
            </Button>
            <p className="text-sm text-gray-400 font-body text-center">
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-brand-green font-bold hover:underline" data-testid="switch-to-login">Sign in</button>
            </p>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4" data-testid="forgot-form">
            <button type="button" onClick={() => setMode('login')} className="flex items-center gap-1 text-sm text-gray-400 font-body hover:text-brand-green mb-2" data-testid="back-to-login">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>
            <h2 className="font-heading font-extrabold text-2xl text-gray-900 text-center">Reset Password</h2>
            <p className="text-sm text-gray-400 font-body text-center mb-2">Enter your email and new password</p>
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input data-testid="forgot-email" type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="pl-11 h-12 rounded-xl text-base font-body" required />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input data-testid="forgot-new-password" type="password" placeholder="New password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} className="pl-11 h-12 rounded-xl text-base font-body" required />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input data-testid="forgot-confirm-password" type="password" placeholder="Confirm new password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className="pl-11 h-12 rounded-xl text-base font-body" required />
              </div>
            </div>
            <Button data-testid="forgot-submit" type="submit" disabled={submitting} className="w-full h-12 bg-brand-green hover:bg-brand-green-dark text-white font-heading font-bold rounded-xl text-base active:scale-[0.98] transition-transform">
              {submitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
