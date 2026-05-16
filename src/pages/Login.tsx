import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import SEO from '../components/SEO';
import { api } from '../utils/api';
import { useToast } from '../components/ToastProvider';
import { roleHome, setSession, useSession } from '../utils/session';
import { HeroBlock, InfoPill, PageContainer, PageShell, Surface } from '../components/premium';

export default function Login() {
  const params = useParams();
  const navigate = useNavigate();
  const session = useSession();
  const toast = useToast();
  const role = params.role === 'admin' || params.role === 'trainer' ? params.role : 'client';
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (session) {
      navigate(roleHome(session.user.role), { replace: true });
    }
  }, [navigate, session]);

  useEffect(() => {
    setForm({
      email: '',
      password: ''
    });
  }, [role]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    try {
      const data = await api.login(form);
      setSession(data);
      toast.addToast(`Welcome back, ${data.user.name}`, 'success');
      navigate(roleHome(data.user.role), { replace: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login failed';
      setStatus(msg);
      toast.addToast(msg, 'error');
    }
  };

  const title = role === 'admin' ? 'Owner login' : role === 'trainer' ? 'Trainer login' : 'Client login';

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title={`Login as ${role[0].toUpperCase()}${role.slice(1)} | Liftrz Pakistan`}
          description="Secure login for Liftrz clients, trainers and admin."
          canonical={`https://liftrz.com/login/${role}`}
        />

        <HeroBlock
          kicker="Liftrz access"
          title={title}
          description="Signed sessions now back the dashboards, approvals and payouts. Use the matching account role to enter the correct workspace."
          aside={
            <Surface className="p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
                {role === 'admin' ? <ShieldCheck className="h-7 w-7" /> : role === 'trainer' ? <LockKeyhole className="h-7 w-7" /> : <UserRound className="h-7 w-7" />}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <InfoPill className={role === 'client' ? 'border-primary text-primary' : ''}><Link to="/login/client">Client</Link></InfoPill>
                <InfoPill className={role === 'trainer' ? 'border-primary text-primary' : ''}><Link to="/login/trainer">Trainer</Link></InfoPill>
                <InfoPill className={role === 'admin' ? 'border-primary text-primary' : ''}><Link to="/login/admin">Admin</Link></InfoPill>
              </div>
            </Surface>
          }
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Surface className="p-6 md:p-8">
            <form onSubmit={submit} className="grid gap-5">
              <Input label="Username or email" type="text" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
              <Input label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />

              <div className="flex items-center justify-between">
                <Link to="/reset-password" className="text-xs text-slate-500 hover:text-primary transition-colors">Forgot password?</Link>
              </div>
              {status && status !== 'loading' && <p className="text-sm text-red-400">{status}</p>}
              <button disabled={status === 'loading'} className="rounded-full bg-primary py-4 text-xs font-semibold text-white disabled:opacity-50">
                {status === 'loading' ? 'Signing in...' : 'Login'}
              </button>
            </form>
          </Surface>

          <Surface className="p-6 md:p-8">
            <p className="text-xs font-semibold text-primary">Access notes</p>
            <div className="mt-6 grid gap-4">
              <InfoCard title="Client" text="Browse trainers, submit payment proof and track bookings inside one account." />
              <InfoCard title="Trainer" text="Manage inquiries, packages, revenue and payouts from the same verified workspace." />
              <InfoCard title="Admin" text="Approve trainers, verify payments and control commission-sensitive flows." />
            </div>
            <div className="mt-8 text-sm text-slate-400">
              Need an account?{' '}
              <Link to={role === 'trainer' ? '/register/trainer' : '/register/client'} className="text-primary">
                Register here
              </Link>
            </div>
          </Surface>
        </div>
      </PageContainer>
    </PageShell>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input required type={type} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none" />
    </label>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-surface-high/80 p-5">
      <h2 className="font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-400">{text}</p>
    </div>
  );
}
