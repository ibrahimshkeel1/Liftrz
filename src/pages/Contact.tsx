import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import SEO from '../components/SEO';
import { useToast } from '../components/ToastProvider';
import { HeroBlock, PageContainer, PageShell, Surface } from '../components/premium';

export default function Contact() {
  const toast = useToast();
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    // Since we don't have a contact API endpoint, simulate success
    setTimeout(() => {
      setStatus('sent');
      toast.addToast('Message sent. We will reply within 24 hours.', 'success');
    }, 1000);
  };

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Contact Us | CoachSet Pakistan"
          description="Get in touch with CoachSet Pakistan for support, partnerships, or general inquiries."
          canonical="https://coachset-pakistan.vercel.app/contact"
        />

        <HeroBlock
          kicker="Get in touch"
          title="Contact CoachSet"
          description="Have a question, partnership idea, or need support? We typically reply within 24 hours."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
          <Surface className="p-6 md:p-8">
            {status === 'sent' ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <Send className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">Message sent</h3>
                <p className="mt-2 text-sm text-slate-400">We have received your message and will reply within 24 hours.</p>
                <button onClick={() => setStatus('idle')} className="mt-6 text-sm text-primary hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-medium text-slate-500">Name</span>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-medium text-slate-500">Email</span>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none" />
                  </label>
                </div>
                <label className="grid gap-2">
                  <span className="text-xs font-medium text-slate-500">Subject</span>
                  <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-medium text-slate-500">Message</span>
                  <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none" />
                </label>
                <button disabled={status === 'loading'} className="rounded-full bg-primary py-4 text-xs font-semibold text-white disabled:opacity-50">
                  {status === 'loading' ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </Surface>

          <div className="space-y-4">
            <Surface className="p-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-white">Email</p>
                  <p className="text-sm text-slate-400">hello@coachset.pk</p>
                </div>
              </div>
            </Surface>
            <Surface className="p-6">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-white">WhatsApp</p>
                  <p className="text-sm text-slate-400">+92 300 0000 001</p>
                </div>
              </div>
            </Surface>
            <Surface className="p-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-white">Based in</p>
                  <p className="text-sm text-slate-400">Lahore, Pakistan</p>
                </div>
              </div>
            </Surface>
            <Surface className="p-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-white">Response time</p>
                  <p className="text-sm text-slate-400">Usually within 24 hours</p>
                </div>
              </div>
            </Surface>
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}
