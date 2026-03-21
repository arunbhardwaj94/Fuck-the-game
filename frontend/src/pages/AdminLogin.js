import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, admin } = useAuth();
  const navigate = useNavigate();

  if (admin) {
    navigate('/bastar-admin/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/bastar-admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4" data-testid="admin-login-page">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-green rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-400 font-body mt-1">Sign in to manage Bastar Mart</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="admin-login-form">
          <div className="space-y-2">
            <label className="text-sm font-heading font-bold text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                data-testid="admin-email-input"
                type="email"
                placeholder="admin@bastarmart.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 rounded-xl"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-heading font-bold text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                data-testid="admin-password-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 rounded-xl"
                required
              />
            </div>
          </div>
          <Button
            data-testid="admin-login-submit"
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-brand-green hover:bg-brand-green-dark text-white font-heading font-bold rounded-xl active:scale-[0.98] transition-transform duration-150"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
