import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react';
import SEO from '../components/SEO';
import { api } from '../utils/api';
import { useToast } from '../components/ToastProvider';
import { HeroBlock, PageContainer, PageShell, Surface } from '../components/premium';

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'success'>('idle');
  const toast = useToast();

  useEffect(() => {
    document.title = token ? 'Set New Password | Liftrz' : 'Reset Password | Liftrz';
  }, [token]);

  const submitRequest = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    try {
      await api.requestPasswordReset({ email });
      setStatus('sent');
      toast.addToast('Reset link sent if account exists', 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to send reset link';
      setStatus('idle');
      toast.addToast(msg, 'error');
    }
  };

  const submitNewPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.addToast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 6) {
      toast.addToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (!token) {
      toast.addToast('Invalid or missing reset token', 'error');
      return;
    }
    setStatus('loading');
    try {
      await api.confirmPasswordReset(token, { password });
      setStatus('success');
      toast.addToast('Password updated successfully', 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to reset password';
      setStatus('idle');
      toast.addToast(msg, 'error');
    }
  };

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title={token ? 'Set New Password | Liftrz Pakistan' : 'Reset Password | Liftrz Pakistan'}
          description="Reset your Liftrz account password."
          canonical="https://liftrz.com/reset-password"
        />

        <HeroBlock
          kicker="Account recovery"
          title={token ? 'Set new password' : 'Reset password'}
          description={token ? 'Enter your new password below.' : 'Enter your email and we will send you a reset link if the account exists.'}
        />

        <div className="mt-10 max-w-xl">
          <Surface className="p-6 md:p-8">
            {status === 'success' ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">Password updated</h3>
                <p className="mt-2 text-sm text-slate-400">Your password has been changed. You can now log in with your new password.</p>
                <Link to="/login/client" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
                  Go to login
                </Link>
              </div>
            ) : status === 'sent' ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Mail className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">Check your email</h3>
                <p className="mt-2 text-sm text-slate-400">
                  If an account exists for <strong className="text-white">{email}</strong>, you will receive a password reset link.
                </p>
                <Link to="/login/client" className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </Link>
              </div>
            ) : token ? (
              <form onSubmit={submitNewPassword} className="grid gap-5">
                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                  <KeyRound className="h-5 w-5 shrink-0" />
                  <span>Token accepted. Choose a strong new password.</span>
                </div>
                <label className="grid gap-2">
                  <span className="text-xs font-medium text-slate-500">New password</span>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none"
                    placeholder="At least 6 characters"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-medium text-slate-500">Confirm password</span>
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none"
                  />
                </label>
                <button
                  disabled={status === 'loading'}
                  className="rounded-full bg-primary py-4 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {status === 'loading' ? 'Updating...' : 'Update password'}
                </button>
                <div className="text-center text-sm text-slate-400">
                  <Link to="/login/client" className="text-primary">Back to login</Link>
                </div>
              </form>
            ) : (
              <form onSubmit={submitRequest} className="grid gap-5">
                <label className="grid gap-2">
                  <span className="text-xs font-medium text-slate-500">Email</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none"
                  />
                </label>
                <button
                  disabled={status === 'loading'}
                  className="rounded-full bg-primary py-4 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {status === 'loading' ? 'Sending...' : 'Send reset link'}
                </button>
                <div className="text-center text-sm text-slate-400">
                  Remember your password?{' '}
                  <Link to="/login/client" className="text-primary">Login</Link>
                </div>
              </form>
            )}
          </Surface>
        </div>
      </PageContainer>
    </PageShell>
  );
}
