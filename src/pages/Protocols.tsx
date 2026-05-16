import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUpRight, Banknote, Clock3, Loader2, Plus, Sparkles, Trash2, X } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, InfoPill, MetricCard, PageContainer, PageShell, SectionTitle, Surface } from '../components/premium';
import { api } from '../utils/api';
import { useSession } from '../utils/session';

const emptyForm = { title: '', description: '', duration: '', price: '', features: '' };

export default function Protocols() {
  const session = useSession();
  const trainerId = session?.user.trainerId || '';
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchProtocols = async () => {
    if (!trainerId) {
      setProtocols([]);
      setLoading(false);
      return;
    }

    try {
      setError('');
      const data = await api.getProtocols(trainerId);
      setProtocols(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load protocols');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocols();
  }, [trainerId]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setActionError('');
    try {
      await api.createProtocol({
        trainerId,
        ...formData,
        features: formData.features.split('\n').map((item) => item.trim()).filter(Boolean)
      });
      setModalOpen(false);
      setFormData(emptyForm);
      await fetchProtocols();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save protocol');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this protocol?')) return;
    setDeletingId(id);
    setActionError('');
    try {
      await api.deleteProtocol(id);
      await fetchProtocols();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete protocol');
    } finally {
      setDeletingId('');
    }
  };

  if (!trainerId) {
    return <div className="px-6 py-20 text-center text-muted">Trainer session not found.</div>;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="px-6 py-20 text-center text-red-400">{error}</div>;
  }

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Trainer Packages | Liftrz Pakistan"
          description="Create and manage standardized coaching packages, pricing, duration and offer features from the Liftrz trainer dashboard."
          canonical="https://liftrz.com/lab"
        />

        <HeroBlock
          kicker="Protocol catalog"
          title="Build offers clients can compare fast."
          description="Liftrz works better when packages are standardized. Define duration, price and what is included so discovery and booking stay clear."
          actions={
            <button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
              <Plus className="h-4 w-4" /> New protocol
            </button>
          }
          aside={
            <Surface className="p-6">
              <p className="text-xs font-semibold text-primary">Offer posture</p>
              <div className="mt-5 grid gap-3">
                <MetricCard label="Approved packages" value={protocols.filter((protocol) => protocol.status === 'approved' || !protocol.status).length} active={protocols.length > 0} />
                <MetricCard label="Price range" value={protocols.length ? `PKR ${Math.min(...protocols.map((protocol) => Number(protocol.price || 0))).toLocaleString()}` : 'None'} />
                <MetricCard label="Packaging" value="Standardized" />
              </div>
            </Surface>
          }
        />

        <div className="mt-8 flex flex-wrap gap-3">
          <InfoPill><Sparkles className="mr-2 h-3.5 w-3.5 text-primary" /> Clear deliverables convert better</InfoPill>
          <InfoPill><Clock3 className="mr-2 h-3.5 w-3.5 text-primary" /> Duration and cadence should be explicit</InfoPill>
          <InfoPill><Banknote className="mr-2 h-3.5 w-3.5 text-primary" /> Keep pricing in PKR for local trust</InfoPill>
        </div>

        {actionError && (
          <div className="mt-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {actionError}
          </div>
        )}

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {protocols.length === 0 ? (
            <Surface className="md:col-span-2 xl:col-span-3 p-10 text-center">
              <p className="text-slate-400">No packages yet. Add at least one clear coaching offer before driving traffic to your profile.</p>
            </Surface>
          ) : (
            protocols.map((protocol) => (
              <div key={protocol.id}>
                <Surface className="overflow-hidden">
                <div className="flex items-start justify-between gap-4 border-b border-slate-700/50 px-6 py-5">
                  <div>
                    <p className="text-xs font-semibold text-primary">Liftrz package / {protocol.status === 'approved' || !protocol.status ? 'approved' : 'approval within 24hr'}</p>
                    <h2 className="editorial-header mt-2 text-3xl font-bold text-white">{protocol.title}</h2>
                  </div>
                  <button type="button" disabled={deletingId === protocol.id} onClick={() => handleDelete(protocol.id)} className="rounded-full border border-slate-700/50 bg-surface-high/80 p-3 text-slate-400 transition hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-5 px-6 py-6">
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="Price" value={`PKR ${Number(protocol.price || 0).toLocaleString()}`} active />
                    <MetricCard label="Status" value={protocol.status === 'approved' || !protocol.status ? 'Approved' : protocol.status === 'rejected' ? 'Rejected' : 'Pending'} />
                  </div>

                  <p className="text-sm leading-7 text-slate-400">{protocol.description}</p>

                  <div>
                    <p className="text-xs font-semibold text-slate-500">Included features</p>
                    <div className="mt-4 grid gap-3">
                      {protocol.features?.map((feature: string, index: number) => (
                        <div key={`${protocol.id}-${index}`} className="flex gap-3 rounded-2xl border border-slate-700/50 bg-surface-high/80 px-4 py-3 text-sm text-white">
                          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </Surface>
              </div>
            ))
          )}
        </section>

        {modalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
            <div className="flex min-h-full items-center justify-center py-12">
              <Surface className="relative w-full max-w-2xl p-6 md:p-8">
                <button type="button" onClick={() => setModalOpen(false)} className="absolute right-5 top-5 rounded-full border border-slate-700/50 bg-surface-high/80 p-3 text-slate-400 transition hover:text-white">
                  <X className="h-4 w-4" />
                </button>

                <SectionTitle title="Create a package" description="Keep the offer simple, priced in PKR, and easy to compare with other trainers." />

                <form onSubmit={handleCreate} className="grid gap-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Package title" value={formData.title} onChange={(value) => setFormData({ ...formData, title: value })} />
                    <Input label="Duration" value={formData.duration} onChange={(value) => setFormData({ ...formData, duration: value })} placeholder="8 weeks, 12 weeks" />
                    <Input label="Price PKR" value={formData.price} onChange={(value) => setFormData({ ...formData, price: value })} />
                  </div>

                  <TextArea label="Description" rows={4} value={formData.description} onChange={(value) => setFormData({ ...formData, description: value })} />
                  <TextArea label="Features" rows={5} value={formData.features} onChange={(value) => setFormData({ ...formData, features: value })} placeholder="Weekly check-ins&#10;Custom meal plan&#10;Video form review" />

                  <button type="submit" disabled={saving} className="rounded-full bg-primary py-4 text-xs font-semibold text-white disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save protocol'}
                  </button>
                </form>
              </Surface>
            </div>
          </div>
        )}
      </PageContainer>
    </PageShell>
  );
}

function Input({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none placeholder:text-slate-600"
      />
    </label>
  );
}

function TextArea({ label, rows, value, onChange, placeholder = '' }: { label: string; rows: number; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <textarea
        required
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none placeholder:text-slate-600"
      />
    </label>
  );
}
