import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, Banknote, CheckCircle2, Dumbbell, ShieldCheck, UserRound } from 'lucide-react';
import { api } from '../utils/api';
import SEO from '../components/SEO';
import { useToast } from '../components/ToastProvider';
import { roleHome, setSession } from '../utils/session';
import { HeroBlock, InfoPill, PageContainer, PageShell, Surface } from '../components/premium';

const cities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Gujranwala', 'Sialkot', 'Online'];
const specialties = ['Strength', 'Fat loss', 'Rehab', 'Yoga', 'Athletic Performance', 'Muscle gain'];
const serviceModes = ['Gym', 'Home Visit', 'Online', 'Studio'];

export default function Register() {
  const params = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const role = params.role === 'trainer' ? 'trainer' : 'client';
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    city: 'Lahore',
    area: '',
    gender: '',
    bio: '',
    price: '',
    capacity: '',
    payoutMethod: 'Bank Transfer',
    payoutAccount: '',
    certifications: '',
    cnicConsent: false,
    transformationConsent: false,
    goals: [] as string[],
    serviceModes: [] as string[],
    languages: 'Urdu, English',
    referralCode: ''
  });

  const toggleList = (key: 'goals' | 'serviceModes', value: string) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value]
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    try {
      if (role === 'trainer') {
        const data = await api.createTrainer({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          city: form.city,
          location: form.city,
          area: form.area,
          gender: form.gender,
          bio: form.bio,
          price: form.price,
          capacity: form.capacity,
          payoutMethod: form.payoutMethod,
          payoutAccount: form.payoutAccount,
          specialty: form.goals[0] || 'General Fitness',
          goals: form.goals,
          serviceModes: form.serviceModes,
          languages: form.languages.split(',').map((item) => item.trim()).filter(Boolean),
          certifications: form.certifications.split(',').map((item) => item.trim()).filter(Boolean).length
            ? form.certifications.split(',').map((item) => item.trim()).filter(Boolean)
            : ['Pending admin verification'],
          referralCode: form.referralCode
        });
        if (data?.token && data?.user) {
          setSession({ token: data.token, user: data.user });
          toast.addToast('Trainer registration submitted for approval', 'success');
          navigate(roleHome(data.user.role));
          return;
        }
      } else {
        const data = await api.register({
          role: 'client',
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          city: form.city,
          goals: form.goals,
          referralCode: form.referralCode
        });
        if (data?.token && data?.user) {
          setSession({ token: data.token, user: data.user });
          toast.addToast('Welcome to CoachSet', 'success');
          navigate(roleHome(data.user.role));
          return;
        }
      }
      setStatus('success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Registration failed';
      setStatus(msg);
      toast.addToast(msg, 'error');
    }
  };

  const steps = role === 'trainer' ? ['Profile', 'Services', 'Verification'] : ['Account', 'Goals', 'Book'];

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title={`${role === 'trainer' ? 'Register as a Personal Trainer' : 'Create a Client Account'} | CoachSet Pakistan`}
          description="Join CoachSet Pakistan to book verified personal trainers or register as a trainer for Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Gujranwala, Sialkot and online coaching."
          canonical={`https://coachset-pakistan.vercel.app/register/${role}`}
        />

        <HeroBlock
          kicker="CoachSet onboarding"
          title={role === 'trainer' ? 'Trainer application' : 'Client registration'}
          description={role === 'trainer'
            ? 'Apply to sell verified training packages in Pakistan. Your profile stays hidden until admin approval.'
            : 'Create a client profile to book verified trainers, keep payment records and unlock trainer contact after verification.'}
          aside={
            <Surface className="p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
                {role === 'trainer' ? <Dumbbell className="h-7 w-7" /> : <UserRound className="h-7 w-7" />}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <InfoPill className={role === 'client' ? 'border-primary text-primary' : ''}><Link to="/register/client">Client</Link></InfoPill>
                <InfoPill className={role === 'trainer' ? 'border-primary text-primary' : ''}><Link to="/register/trainer">Trainer</Link></InfoPill>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-slate-400">
                <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> CNIC and certification review for trainers.</div>
                <div className="flex gap-3"><Banknote className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> Payments stay inside CoachSet for commission control.</div>
                <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> Reviews are linked to completed bookings.</div>
              </div>
            </Surface>
          }
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Surface className="p-6 md:p-8">
            {status === 'success' ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
                <h2 className="editorial-header mt-5 text-4xl font-bold text-white">{role === 'trainer' ? 'Application submitted' : 'Account created'}</h2>
                <p className="mx-auto mt-4 max-w-md text-slate-400">
                  {role === 'trainer'
                    ? 'Your trainer profile is pending admin approval. It will appear in discovery after verification.'
                    : 'You can now browse trainers and submit a paid booking request.'}
                </p>
                <Link to={role === 'trainer' ? '/trainer/dashboard' : '/discover'} className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
                  {role === 'trainer' ? 'Open trainer dashboard' : 'Find Trainers'}
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-6">
                <div className="grid gap-2 md:grid-cols-3">
                  {steps.map((step, index) => (
                    <div key={step} className="rounded-xl border border-slate-700/50 bg-surface-high/80 p-4">
                      <p className="text-xs font-black text-primary">{String(index + 1).padStart(2, '0')}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Full name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
                  <Input label="Phone / WhatsApp" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="+92..." required />
                  <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
                  <Input label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required />
                  <Select label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} options={cities} />
                  <Input label="Area" value={form.area} onChange={(value) => setForm({ ...form, area: value })} placeholder="DHA, Clifton, F-11" />
                  <Select label="Gender" value={form.gender} onChange={(value) => setForm({ ...form, gender: value })} options={['Prefer not to say', 'Male', 'Female']} emptyToBlank />
                  <Input label="Languages" value={form.languages} onChange={(value) => setForm({ ...form, languages: value })} placeholder="Urdu, English" />
                </div>

                <Input label="Referral code (optional)" value={form.referralCode} onChange={(value) => setForm({ ...form, referralCode: value.toUpperCase() })} placeholder="CSXXXXX" />

                <ChoiceGroup title={role === 'trainer' ? 'Specialties' : 'Goals'} items={specialties} values={form.goals} onToggle={(item) => toggleList('goals', item)} />

                {role === 'trainer' && (
                  <>
                    <ChoiceGroup title="Service modes" items={serviceModes} values={form.serviceModes} onToggle={(item) => toggleList('serviceModes', item)} />
                    <div className="grid gap-4 md:grid-cols-3">
                      <Input label="Session price PKR" value={form.price} onChange={(value) => setForm({ ...form, price: value })} required />
                      <Input label="Capacity" value={form.capacity} onChange={(value) => setForm({ ...form, capacity: value })} required />
                      <Select label="Payout method" value={form.payoutMethod} onChange={(value) => setForm({ ...form, payoutMethod: value })} options={['Bank Transfer', 'JazzCash', 'EasyPaisa']} />
                    </div>
                    <Input label="Payout account" value={form.payoutAccount} onChange={(value) => setForm({ ...form, payoutAccount: value })} placeholder="Bank IBAN or wallet number" required />
                    <TextArea label="Trainer bio" value={form.bio} onChange={(value) => setForm({ ...form, bio: value })} rows={4} required />
                    <TextArea label="Certifications / proof notes" value={form.certifications} onChange={(value) => setForm({ ...form, certifications: value })} rows={3} placeholder="ACE, ISSA, sports nutrition, gym employment, transformation proof" />
                    <div className="grid gap-3 text-sm text-slate-400">
                      <CheckLine checked={form.cnicConsent} onChange={(checked) => setForm({ ...form, cnicConsent: checked })} text="I agree to submit CNIC/certification proof for admin verification before going public." />
                      <CheckLine checked={form.transformationConsent} onChange={(checked) => setForm({ ...form, transformationConsent: checked })} text="I will only upload transformation photos with client consent." />
                    </div>
                  </>
                )}

                {status && status !== 'loading' && <p className="text-sm text-red-400">{status}</p>}
                <button disabled={status === 'loading'} className="rounded-full bg-primary py-4 text-xs font-semibold text-white disabled:opacity-50">
                  {status === 'loading' ? 'Submitting...' : role === 'trainer' ? 'Submit trainer application' : 'Create client account'}
                </button>
              </form>
            )}
          </Surface>

          <div className="grid gap-6">
            <Surface className="p-6">
              <p className="text-xs font-semibold text-primary">Live preview</p>
              <div className="mt-5 flex items-start gap-3">
                <BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h2 className="font-semibold text-white">{role === 'trainer' ? 'Public profile preview' : 'Booking profile preview'}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    {role === 'trainer'
                      ? `${form.name || 'Your name'} will appear in ${form.city} with ${form.goals[0] || 'your main specialty'} after admin approval.`
                      : `${form.name || 'Your name'} can search ${form.city} trainers for ${form.goals[0] || 'fitness goals'} after registration.`}
                  </p>
                </div>
              </div>
            </Surface>

            <Surface className="p-6">
              <p className="text-xs font-semibold text-primary">Account switch</p>
              <div className="mt-5 text-sm text-slate-400">
                Already have an account?{' '}
                <Link to={`/login/${role}`} className="text-primary">
                  Login here
                </Link>
              </div>
            </Surface>
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder = '', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none placeholder:text-slate-600" />
    </label>
  );
}

function Select({ label, value, onChange, options, emptyToBlank = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; emptyToBlank?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select value={emptyToBlank && value === '' ? options[0] : value} onChange={(e) => onChange(emptyToBlank && e.target.value === options[0] ? '' : e.target.value)} className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, rows, placeholder = '', required = false }: { label: string; value: string; onChange: (value: string) => void; rows: number; placeholder?: string; required?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <textarea required={required} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none placeholder:text-slate-600" />
    </label>
  );
}

function ChoiceGroup({ title, items, values, onToggle }: { title: string; items: string[]; values: string[]; onToggle: (item: string) => void }) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button type="button" key={item} onClick={() => onToggle(item)} className={`rounded-full px-4 py-2 text-[11px] font-black  ${values.includes(item) ? 'bg-primary text-white' : 'border border-slate-700/50 bg-surface-high/80 text-slate-300'}`}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function CheckLine({ checked, onChange, text }: { checked: boolean; onChange: (checked: boolean) => void; text: string }) {
  return (
    <label className="flex gap-3">
      <input required type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 accent-primary" />
      <span>{text}</span>
    </label>
  );
}
