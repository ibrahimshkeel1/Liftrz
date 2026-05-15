import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Calendar, Check, ChevronLeft, Clock3, FileText, Loader2, Mail, MapPin, MessageCircle, Phone, Send, ShieldCheck, Target, WalletCards, X } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, InfoPill, MetricCard, PageContainer, PageShell, SectionTitle, Surface } from '../components/premium';
import { api } from '../utils/api';
import { useSession } from '../utils/session';

const toneClasses: Record<string, string> = {
  pending: 'border-primary/40 bg-primary/10 text-primary',
  contacted: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  accepted: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  booked: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  rejected: 'border-rose-500/40 bg-rose-500/10 text-rose-300'
};

export default function LeadDetail() {
  const session = useSession();
  const trainerId = session?.user.trainerId || '';
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');
  const [actionError, setActionError] = useState('');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  const loadLeads = async () => {
    if (!trainerId) {
      setLeads([]);
      setLoading(false);
      return [];
    }

    try {
      setError('');
      const data = await api.getLeads(trainerId);
      setLeads(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [trainerId]);

  const updateStatus = async (id: string, updates: any) => {
    setActionId(id);
    setActionError('');
    try {
      await api.updateLeadStatus(id, updates);
      const refreshed = await loadLeads();
      const nextLead = refreshed.find((lead: any) => lead.id === id);
      if (selectedLead?.id === id) {
        setSelectedLead(nextLead || { ...selectedLead, ...updates });
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update lead');
    } finally {
      setActionId('');
    }
  };

  const pendingCount = useMemo(() => leads.filter((lead) => lead.status === 'pending').length, [leads]);
  const bookedCount = useMemo(() => leads.filter((lead) => lead.status === 'booked' || lead.status === 'accepted').length, [leads]);
  const newestLead = leads[0];

  if (!trainerId) {
    return <div className="px-6 py-20 text-center text-muted">Trainer session not found.</div>;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="px-6 py-20 text-center text-red-400">{error}</div>;
  }

  if (!selectedLead) {
    return (
      <PageShell>
        <PageContainer>
          <SEO
            title="Trainer Inbox | CoachSet Pakistan"
            description="Review new client leads, booking status, payment verification state and onboarding notes from the CoachSet trainer inbox."
            canonical="https://coachset-pakistan.vercel.app/inbox"
          />

          <HeroBlock
            kicker="Trainer inbox"
            title="Review clients before they book."
            description="Every inquiry stays inside CoachSet until payment is verified. Accept, reject or move a lead into the booked pipeline without losing the audit trail."
            aside={
              <Surface className="p-6">
                <p className="text-xs font-semibold text-primary">Inbox posture</p>
                <div className="mt-5 grid gap-3">
                  <MetricCard label="Pending replies" value={pendingCount} active={pendingCount > 0} />
                  <MetricCard label="Booked clients" value={bookedCount} />
                  <MetricCard label="Newest lead" value={newestLead ? new Date(newestLead.createdAt).toLocaleDateString() : 'None'} />
                </div>
              </Surface>
            }
          />

          <div className="mt-8 flex flex-wrap gap-3">
            <InfoPill><MessageCircle className="mr-2 h-3.5 w-3.5 text-primary" /> Inquiry history tracked</InfoPill>
            <InfoPill><WalletCards className="mr-2 h-3.5 w-3.5 text-primary" /> Payment gate protected</InfoPill>
            <InfoPill><ShieldCheck className="mr-2 h-3.5 w-3.5 text-primary" /> Contact unlock after verification</InfoPill>
          </div>

          <div className="mt-8 grid gap-4">
            {leads.length === 0 ? (
              <Surface className="p-10 text-center">
                <p className="text-slate-400">No leads yet. New client inquiries will appear here after profile visits and booking requests.</p>
              </Surface>
            ) : (
              leads.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => setSelectedLead(lead)}
                  className="w-full text-left"
                >
                  <Surface className="p-5 transition hover:border-primary/50 hover:bg-surface-high/90">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="editorial-header text-3xl font-bold text-white">{lead.clientName}</h2>
                          <StatusPill status={lead.status} />
                        </div>
                        <p className="mt-2 text-xs font-medium text-slate-500">{lead.goal}</p>
                        <p className="mt-4 line-clamp-2 max-w-3xl text-sm leading-7 text-slate-400">{lead.message}</p>
                      </div>

                      <div className="grid min-w-full gap-3 sm:min-w-0 sm:grid-cols-3 lg:w-[24rem]">
                        <MiniStat icon={<Calendar className="h-4 w-4 text-primary" />} label="Received" value={new Date(lead.createdAt).toLocaleDateString()} />
                        <MiniStat icon={<WalletCards className="h-4 w-4 text-primary" />} label="Payment" value={lead.paymentStatus || 'Pending'} />
                        <MiniStat icon={<Clock3 className="h-4 w-4 text-primary" />} label="Timeline" value={`${(lead.statusHistory || []).length || 1} events`} />
                      </div>
                    </div>
                  </Surface>
                </button>
              ))
            )}
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  const messages = selectedLead.messages || [
    { id: 1, sender: 'client', text: selectedLead.message, timestamp: selectedLead.createdAt }
  ];

  const history = selectedLead.statusHistory || [
    { status: 'new', timestamp: selectedLead.createdAt, note: 'Lead created from trainer discovery page.' }
  ];

  const sendDraftReply = () => {
    if (!replyText.trim()) return;
    const nextMessages = [
      ...messages,
      {
        id: Date.now(),
        sender: 'trainer',
        text: replyText.trim(),
        timestamp: new Date().toISOString()
      }
    ];
    setSelectedLead({ ...selectedLead, messages: nextMessages });
    setReplyText('');
  };

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title={`${selectedLead.clientName} Lead | CoachSet Pakistan`}
          description="Review client contact details, payment verification, history, notes and nutrition targets from the CoachSet trainer inbox."
          canonical="https://coachset-pakistan.vercel.app/inbox"
        />

        <HeroBlock
          kicker="Lead detail"
          title={selectedLead.clientName}
          description={`${selectedLead.goal} / received ${new Date(selectedLead.createdAt).toLocaleDateString()} / ${selectedLead.city || selectedLead.location || 'Pakistan'}`}
          actions={
            <>
              <button type="button" onClick={() => setSelectedLead(null)} className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-surface-high/80 px-5 py-3 text-xs font-semibold text-white">
                <ChevronLeft className="h-4 w-4" /> Back to inbox
              </button>
              {(selectedLead.status === 'pending' || selectedLead.status === 'contacted') && (
                <>
                  <button type="button" disabled={actionId === selectedLead.id} onClick={() => updateStatus(selectedLead.id, { status: 'accepted' })} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-semibold text-white disabled:opacity-50">
                    <Check className="h-4 w-4" /> Accept lead
                  </button>
                  <button type="button" disabled={actionId === selectedLead.id} onClick={() => updateStatus(selectedLead.id, { status: 'contacted' })} className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-surface-high/80 px-5 py-3 text-xs font-semibold text-white disabled:opacity-50">
                    <FileText className="h-4 w-4" /> Mark contacted
                  </button>
                  <button type="button" disabled={actionId === selectedLead.id} onClick={() => updateStatus(selectedLead.id, { status: 'rejected' })} className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-xs font-semibold text-rose-300 disabled:opacity-50">
                    <X className="h-4 w-4" /> Reject
                  </button>
                </>
              )}
            </>
          }
          aside={
            <Surface className="p-6">
              <p className="text-xs font-semibold text-primary">Lead posture</p>
              <div className="mt-5 grid gap-3">
                <MetricCard label="Status" value={<span className="capitalize">{selectedLead.status}</span>} active={selectedLead.status === 'pending'} />
                <MetricCard label="Payment" value={selectedLead.paymentStatus || 'Unverified'} />
                <MetricCard label="History" value={`${history.length} events`} />
              </div>
            </Surface>
          }
        />

        <div className="mt-8 flex flex-wrap gap-3">
          <StatusPill status={selectedLead.status} />
          <InfoPill><Target className="mr-2 h-3.5 w-3.5 text-primary" /> {selectedLead.goal}</InfoPill>
          <InfoPill><MapPin className="mr-2 h-3.5 w-3.5 text-primary" /> {selectedLead.city || selectedLead.location || 'Pakistan'}</InfoPill>
        </div>

        {actionError && (
          <div className="mt-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {actionError}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="grid gap-6">
            {(selectedLead.status === 'booked' || selectedLead.status === 'accepted') && (
              <Surface className="p-6">
                <SectionTitle title="Nutrition targets" description="Update working macro targets while the client is active." />
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricInput
                    label="Calories"
                    defaultValue={selectedLead.nutritionTargets?.calories || 2000}
                    onCommit={(value) => updateStatus(selectedLead.id, { nutritionTargets: { ...selectedLead.nutritionTargets, calories: value } })}
                  />
                  <MetricInput
                    label="Protein"
                    defaultValue={selectedLead.nutritionTargets?.protein || 150}
                    onCommit={(value) => updateStatus(selectedLead.id, { nutritionTargets: { ...selectedLead.nutritionTargets, protein: value } })}
                  />
                  <MetricInput
                    label="Carbs"
                    defaultValue={selectedLead.nutritionTargets?.carbs || 200}
                    onCommit={(value) => updateStatus(selectedLead.id, { nutritionTargets: { ...selectedLead.nutritionTargets, carbs: value } })}
                  />
                  <MetricInput
                    label="Fats"
                    defaultValue={selectedLead.nutritionTargets?.fats || 60}
                    onCommit={(value) => updateStatus(selectedLead.id, { nutritionTargets: { ...selectedLead.nutritionTargets, fats: value } })}
                  />
                </div>

                {selectedLead.nutritionLogs?.length > 0 && (
                  <div className="mt-8">
                    <p className="text-xs font-semibold text-primary">Recent nutrition logs</p>
                    <div className="mt-4 grid gap-3">
                      {selectedLead.nutritionLogs.slice().reverse().map((log: any, index: number) => (
                        <div key={`${log.date}-${index}`} className="rounded-xl border border-slate-700/50 bg-surface-high/80 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                            <span className="text-slate-400">{new Date(log.date).toLocaleDateString()}</span>
                            <div className="flex flex-wrap gap-3 text-white">
                              <span>Cals {log.calories}</span>
                              <span>Protein {log.protein}g</span>
                              <span>Carbs {log.carbs}g</span>
                              <span>Fats {log.fats}g</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Surface>
            )}

            <Surface className="overflow-hidden">
              <header className="border-b border-slate-700/50 px-6 py-5">
                <h2 className="editorial-header text-3xl font-bold text-white">Conversation</h2>
                <p className="mt-2 text-sm text-slate-400">Client messages, inquiry notes and trainer responses stay inside the booking trail.</p>
              </header>

              <div className="grid gap-6 px-6 py-6">
                {messages.map((message: any) => (
                  <div key={message.id} className={`flex ${message.sender === 'trainer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[42rem] rounded-2xl px-5 py-4 ${message.sender === 'trainer' ? 'bg-primary text-white' : 'border border-slate-700/50 bg-surface-high/80 text-white'}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] opacity-70">
                        {message.sender === 'trainer' ? 'You' : selectedLead.clientName} / {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="mt-3 text-sm leading-7">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-700/50 bg-surface/70 px-6 py-5">
                <label className="grid gap-3">
                  <span className="text-xs font-semibold text-slate-500">Draft response</span>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder="Write the next client-facing message."
                      className="min-h-[7rem] w-full rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none placeholder:text-slate-600"
                    />
                    <button type="button" onClick={sendDraftReply} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark md:self-end">
                      <Send className="h-4 w-4" /> Add reply
                    </button>
                  </div>
                </label>
              </div>
            </Surface>
          </div>

          <div className="grid gap-6">
            {selectedLead.paymentStatus === 'pending_verification' && (
              <Surface className="p-6">
                <SectionTitle title="Payment verification" description="Only the admin backend can approve receipt proof and unlock booked workflow." />
                <div className="grid gap-5">
                  <InfoRow icon={<WalletCards className="h-4 w-4 text-primary" />} label="Method" value={selectedLead.paymentMethod || 'Manual transfer'} />
                  {selectedLead.receiptImage ? (
                    <img src={selectedLead.receiptImage} alt="Uploaded receipt" className="max-h-80 w-full rounded-2xl border border-slate-700/50 bg-black object-contain" />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-700/50 px-4 py-8 text-center text-sm text-slate-400">Receipt image not available.</div>
                  )}
                  <div className="rounded-2xl border border-slate-700/50 bg-surface-high/80 px-4 py-4 text-sm text-slate-400">
                    Waiting for owner verification in the admin panel.
                  </div>
                </div>
              </Surface>
            )}

            <Surface className="p-6">
              <SectionTitle title="Client profile" description="Contact and booking context for this lead." />
              <div className="grid gap-4">
                <InfoRow icon={<Mail className="h-4 w-4 text-primary" />} label="Email" value={selectedLead.clientEmail || 'client@example.com'} />
                <InfoRow icon={<Phone className="h-4 w-4 text-primary" />} label="Phone" value={selectedLead.clientPhone || '+92 300 0000000'} />
                <InfoRow icon={<Calendar className="h-4 w-4 text-primary" />} label="Inquiry date" value={new Date(selectedLead.createdAt).toLocaleDateString()} />
                <InfoRow icon={<Target className="h-4 w-4 text-primary" />} label="Goal" value={selectedLead.goal} />
              </div>
            </Surface>

            <Surface className="p-6">
              <SectionTitle title="Status timeline" description="Each step remains visible for client support and commission disputes." />
              <div className="grid gap-4">
                {history.map((item: any, index: number) => (
                  <div key={`${item.status}-${index}`} className="rounded-2xl border border-slate-700/50 bg-surface-high/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <StatusPill status={item.status} />
                      <span className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{item.note}</p>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium ${toneClasses[status] || 'border-zinc-700 bg-surface-high text-slate-300'}`}>
      {status}
    </span>
  );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-surface-high/80 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em]">{label}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function MetricInput({ label, defaultValue, onCommit }: { label: string; defaultValue: number; onCommit: (value: number) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        type="number"
        defaultValue={defaultValue}
        onBlur={(event) => onCommit(Number(event.target.value || 0))}
        className="rounded-2xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none"
      />
    </label>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-surface-high/80 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em]">{label}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
