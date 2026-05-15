import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Banknote, CheckCircle2, CircleDollarSign, Eye, ImageIcon, Loader2, ShieldCheck, Siren, Star, Upload, UsersRound, WalletCards, X } from 'lucide-react';
import { api } from '../utils/api';
import SEO from '../components/SEO';
import BookingChatPanel from '../components/BookingChatPanel';
import { useToast } from '../components/ToastProvider';
import { HeroBlock, MetricCard, PageContainer, PageShell, Surface } from '../components/premium';

const money = (value: number) => `PKR ${Number(value || 0).toLocaleString()}`;
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'trainers', label: 'Trainers' },
  { id: 'payments', label: 'Payments' },
  { id: 'chats', label: 'Chats' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'disputes', label: 'Disputes' }
] as const;

const commissionOptions = [
  { label: '10% (First 10 promo)', value: 0.10 },
  { label: '15% (Standard)', value: 0.15 },
  { label: '20% (Premium)', value: 0.20 }
];

type Tab = typeof tabs[number]['id'];

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState<any>(null);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedChatId, setSelectedChatId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');
  const [actionError, setActionError] = useState('');
  const [commissionEdits, setCommissionEdits] = useState<Record<string, number>>({});
  const [payoutTab, setPayoutTab] = useState<'pending' | 'paid'>('pending');
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [uploadingPayoutId, setUploadingPayoutId] = useState('');

  const load = async () => {
    try {
      setError('');
      setActionError('');
      const [statsData, trainersData, paymentsData, chatsData, payoutsData, disputesData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminTrainers(),
        api.getAdminPayments(),
        api.getAdminChats(),
        api.getAdminPayouts(),
        api.getAdminDisputes()
      ]);
      setStats(statsData);
      setTrainers(trainersData);
      setPayments(paymentsData);
      setChats(chatsData);
      setPayouts(payoutsData);
      setDisputes(disputesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approveTrainer = async (id?: string, verificationStatus = 'approved', commissionRate?: number) => {
    if (!id) {
      setActionError('Missing trainer id for this action.');
      return;
    }
    setActionId(id);
    setActionError('');
    try {
      await api.updateTrainerStatus(id, { verificationStatus, commissionRate });
      setTrainers((current) =>
        current.map((trainer) =>
          trainer.id === id || trainer.userId === id
            ? {
                ...trainer,
                verificationStatus,
                profileStatus: verificationStatus === 'approved' ? 'live' : verificationStatus === 'rejected' ? 'rejected' : 'pending_review',
                verificationLevel: verificationStatus === 'approved' ? 'CNIC and certification verified' : 'Pending admin approval',
                commissionRate: commissionRate !== undefined ? commissionRate : trainer.commissionRate
              }
            : trainer
        )
      );
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update trainer status');
    } finally {
      setActionId('');
    }
  };

  const updateCommission = async (id: string, rate: number) => {
    try {
      await api.updateTrainerCommission(id, { commissionRate: rate });
      setTrainers((current) =>
        current.map((trainer) =>
          trainer.id === id || trainer.userId === id ? { ...trainer, commissionRate: rate } : trainer
        )
      );
      toast.addToast(`Commission updated to ${Math.round(rate * 100)}%`, 'success');
    } catch (err) {
      toast.addToast(err instanceof Error ? err.message : 'Failed to update commission', 'error');
    }
  };

  const verifyPayment = async (id: string, status = 'verified') => {
    setActionId(id);
    setActionError('');
    try {
      await api.verifyPayment(id, { status });
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to verify payment');
    } finally {
      setActionId('');
    }
  };

  const markPayoutPaid = async (id: string, reference: string, receiptImage?: string) => {
    setActionId(id);
    setActionError('');
    try {
      await api.updatePayout(id, { status: 'paid', reference, receiptImage });
      await load();
      toast.addToast('Payout marked as paid. Trainer notified.', 'success');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to mark payout paid');
    } finally {
      setActionId('');
    }
  };

  const handleReceiptUpload = async (payoutId: string, file: File) => {
    setUploadingPayoutId(payoutId);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const upload = await api.uploadFile({
          bucket: 'coachset-private',
          folder: 'payouts',
          fileName: `payout-${payoutId}-${Date.now()}.${file.name.split('.').pop()}`,
          dataUrl: base64
        });
        await api.updatePayout(payoutId, { receiptImage: upload.url });
        await load();
        toast.addToast('Receipt uploaded', 'success');
        setUploadingPayoutId('');
      };
    } catch (err) {
      toast.addToast('Failed to upload receipt', 'error');
      setUploadingPayoutId('');
    }
  };

  const closeDispute = async (id: string) => {
    setActionId(id);
    setActionError('');
    try {
      await api.updateDispute(id, { status: 'resolved', resolution: 'Resolved by admin review' });
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to resolve dispute');
    } finally {
      setActionId('');
    }
  };

  if (loading) return <div className="px-6 py-20 text-center text-muted">Loading owner backend...</div>;
  if (error) return <div className="px-6 py-20 text-center text-red-400">{error}</div>;

  const pendingPayments = payments.filter((payment) => payment.status === 'pending_verification');
  const pendingTrainers = trainers.filter((trainer) => trainer.verificationStatus !== 'approved');
  const pendingPayoutsList = payouts.filter((payout) => payout.status !== 'paid');
  const paidPayoutsList = payouts.filter((payout) => payout.status === 'paid');
  const pendingPayoutsTotal = pendingPayoutsList.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const openDisputes = disputes.filter((dispute) => dispute.status === 'open');
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || chats[0];

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="CoachSet Owner Backend | Payments, Trainers and Commission"
          description="Owner backend for CoachSet Pakistan marketplace payments, trainer approvals, commission, payouts, disputes and reviews."
          canonical="https://coachset-pakistan.vercel.app/admin"
        />

        <HeroBlock
          kicker="Owner backend"
          title="CoachSet Control Room"
          description="Commission-sensitive operations, trainer approvals, payment verification and disputes all live inside one controlled workspace."
          aside={
            <Surface className="p-6">
              <p className="text-xs font-semibold text-primary">Commission model</p>
              <p className="mt-4 text-4xl font-semibold text-white">10-20%</p>
              <p className="mt-2 text-sm text-slate-400">adjustable per trainer</p>
            </Surface>
          }
        />

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="GMV" value={money(stats.grossMerchandiseValue)} />
          <MetricCard label="Commission" value={money(stats.commissionEarned)} active />
          <MetricCard label="Pending payouts" value={money(pendingPayoutsTotal)} />
          <MetricCard label="Admin queue" value={`${stats.pendingTrainerApprovals + stats.pendingPaymentVerifications + openDisputes.length}`} />
          <MetricCard label="Clients" value={stats.totalClients} />
          <MetricCard label="Approved trainers" value={stats.approvedTrainers} />
          <MetricCard label="Active bookings" value={stats.activeBookings} />
          <MetricCard label="Monitored chats" value={chats.length} />
          <MetricCard label="Open disputes" value={openDisputes.length} />
        </div>

        <Surface className="mt-8 p-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-full px-5 py-3 text-xs font-semibold ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-surface-high text-slate-400'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </Surface>

        {actionError && (
          <div className="mt-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {actionError}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <Panel title="Priority queue">
              <SummaryRow label="Trainer approvals" value={pendingTrainers.length} />
              <SummaryRow label="Payment verifications" value={pendingPayments.length} />
              <SummaryRow label="Active monitored chats" value={chats.length} />
              <SummaryRow label="Payouts waiting" value={pendingPayoutsList.length} />
              <SummaryRow label="Open disputes" value={openDisputes.length} />
            </Panel>
            <Panel title="Commission snapshot">
              <SummaryRow label="Gross merchandise value" value={money(stats.grossMerchandiseValue)} />
              <SummaryRow label="Commission earned" value={money(stats.commissionEarned)} />
              <SummaryRow label="Pending trainer payouts" value={money(pendingPayoutsTotal)} />
              <SummaryRow label="Commission range" value="10% - 20% per trainer" />
            </Panel>
          </div>
        )}

        {activeTab === 'trainers' && (
          <Panel className="mt-8" title="Trainer approvals">
            {trainers.length === 0 && <EmptyRow text="No trainer applications found." />}
            {trainers.map((trainer) => {
              const trainerActionKey = trainer.id || trainer.userId || '';
              const commission = commissionEdits[trainerActionKey] ?? trainer.commissionRate ?? 0.15;
              return (
              <div key={trainerActionKey || trainer.email}>
                <Row>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{trainer.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">{trainer.city} / {trainer.area || 'Area pending'} / {trainer.specialty}</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{trainer.verificationStatus}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs text-slate-500">Commission:</span>
                    <select
                      value={commission}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCommissionEdits((prev) => ({ ...prev, [trainerActionKey]: val }));
                      }}
                      className="rounded-lg border border-slate-700/50 bg-surface-high px-2 py-1 text-xs text-white"
                    >
                      {commissionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => updateCommission(trainerActionKey, commission)}
                      className="rounded-lg bg-primary/20 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/30"
                    >
                      Update
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  {trainer.verificationStatus !== 'approved' && <button disabled={actionId === trainerActionKey} onClick={() => approveTrainer(trainerActionKey, 'approved', commission)} className="rounded-full bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50">{actionId === trainerActionKey ? 'Working...' : 'Approve'}</button>}
                  {trainer.verificationStatus !== 'rejected' && <button disabled={actionId === trainerActionKey} onClick={() => approveTrainer(trainerActionKey, 'rejected')} className="rounded-full border border-slate-700/50 bg-surface-high/80 px-3 py-2 text-xs font-medium text-slate-300 disabled:opacity-50">Reject</button>}
                </div>
                </Row>
              </div>
              );
            })}
          </Panel>
        )}

        {activeTab === 'payments' && (
          <Panel className="mt-8" title="Payment verification">
            {payments.length === 0 && <EmptyRow text="No payments found." />}
            {payments.map((payment) => (
              <div key={payment.id}>
                <Row>
                <div>
                  <h3 className="font-semibold text-white">{money(payment.amount)}</h3>
                  <p className="mt-1 text-xs text-slate-400">{payment.method} / {payment.bookingId}</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{payment.status}</p>
                  {payment.receiptImage && (
                    <a href={payment.receiptImage} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-medium text-primary">
                      View receipt
                    </a>
                  )}
                </div>
                {payment.status === 'pending_verification' ? (
                  <div className="flex gap-2">
                    <button disabled={actionId === payment.id} onClick={() => verifyPayment(payment.id)} className="rounded-full bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Verify</button>
                    <button disabled={actionId === payment.id} onClick={() => verifyPayment(payment.id, 'rejected')} className="rounded-full border border-slate-700/50 bg-surface-high/80 px-3 py-2 text-xs font-medium text-slate-300 disabled:opacity-50">Reject</button>
                  </div>
                ) : <span className="text-xs text-slate-500">Closed</span>}
                </Row>
              </div>
            ))}
          </Panel>
        )}

        {activeTab === 'chats' && (
          <div className="mt-8 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
            <Panel title="Monitored chats">
              {chats.length === 0 && <EmptyRow text="No verified booking chats yet." />}
              {chats.map((chat) => (
                <button key={chat.id} type="button" onClick={() => setSelectedChatId(chat.id)} className="block w-full border-b border-slate-700/50 px-5 py-5 text-left last:border-b-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{chat.clientName}</h3>
                      <p className="mt-1 text-xs text-slate-400">{chat.trainerName} / {chat.packageTitle}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{chat.messageCount} messages</p>
                        {chat.unreadByAdmin > 0 && <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{chat.unreadByAdmin} unread</span>}
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${selectedChat?.id === chat.id ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-500'}`}>
                      {selectedChat?.id === chat.id ? 'Open' : 'View'}
                    </span>
                  </div>
                </button>
              ))}
            </Panel>

            <Panel title="Conversation monitor">
              {selectedChat ? (
                <div className="p-5">
                  <BookingChatPanel booking={selectedChat} title={`${selectedChat.clientName} / ${selectedChat.trainerName}`} readOnly />
                </div>
              ) : (
                <EmptyRow text="Select a chat to monitor messages." />
              )}
            </Panel>
          </div>
        )}

        {activeTab === 'payouts' && (
          <Panel className="mt-8" title="Trainer payouts">
            <div className="flex gap-2 border-b border-slate-700/50 px-5 pt-4">
              <button onClick={() => setPayoutTab('pending')} className={`rounded-t-lg px-4 py-2 text-xs font-semibold ${payoutTab === 'pending' ? 'bg-primary text-white' : 'text-slate-400'}`}>
                Pending ({pendingPayoutsList.length})
              </button>
              <button onClick={() => setPayoutTab('paid')} className={`rounded-t-lg px-4 py-2 text-xs font-semibold ${payoutTab === 'paid' ? 'bg-success text-white' : 'text-slate-400'}`}>
                Paid ({paidPayoutsList.length})
              </button>
            </div>

            {payoutTab === 'pending' && (
              <div>
                {pendingPayoutsList.length === 0 && <EmptyRow text="No pending payouts." />}
                {pendingPayoutsList.map((payout) => (
                  <div key={payout.id}>
                    <Row>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{money(payout.amount)}</h3>
                      <p className="mt-1 text-xs text-slate-400">{payout.trainerId} / {payout.method}</p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{payout.status}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Transaction reference"
                          className="rounded-lg border border-slate-700/50 bg-surface-high px-3 py-1.5 text-xs text-white"
                          id={`ref-${payout.id}`}
                        />
                        <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-700/50 bg-surface-high px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-high/80">
                          <Upload className="h-3 w-3" />
                          <span>{uploadingPayoutId === payout.id ? 'Uploading...' : 'Receipt'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleReceiptUpload(payout.id, file);
                            }}
                          />
                        </label>
                        <button
                          disabled={actionId === payout.id}
                          onClick={() => {
                            const refInput = document.getElementById(`ref-${payout.id}`) as HTMLInputElement;
                            markPayoutPaid(payout.id, refInput?.value || `TRN-${Date.now()}`, payout.receiptImage);
                          }}
                          className="rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {actionId === payout.id ? 'Working...' : 'Mark paid'}
                        </button>
                      </div>
                    </div>
                    </Row>
                  </div>
                ))}
              </div>
            )}

            {payoutTab === 'paid' && (
              <div>
                {paidPayoutsList.length === 0 && <EmptyRow text="No paid payouts yet." />}
                {paidPayoutsList.map((payout) => (
                  <div key={payout.id}>
                    <Row>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{money(payout.amount)}</h3>
                      <p className="mt-1 text-xs text-slate-400">{payout.trainerId} / {payout.method}</p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-success">PAID</p>
                      <p className="mt-1 text-xs text-slate-500">Ref: {payout.reference || 'N/A'}</p>
                      <p className="text-xs text-slate-500">Date: {payout.paidAt ? new Date(payout.paidAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="flex gap-2">
                      {payout.receiptImage && (
                        <button
                          onClick={() => setViewReceipt(payout.receiptImage)}
                          className="flex items-center gap-1 rounded-lg border border-slate-700/50 bg-surface-high px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                      )}
                    </div>
                    </Row>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        {activeTab === 'disputes' && (
          <Panel className="mt-8" title="Disputes">
            {disputes.length === 0 && <EmptyRow text="No disputes found." />}
            {disputes.map((dispute) => (
              <div key={dispute.id}>
                <Row>
                <div>
                  <h3 className="font-semibold text-white">{dispute.reason}</h3>
                  <p className="mt-1 text-xs text-slate-400">{dispute.bookingId} / opened by {dispute.openedBy}</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{dispute.status}</p>
                </div>
                {dispute.status === 'open' ? (
                  <button disabled={actionId === dispute.id} onClick={() => closeDispute(dispute.id)} className="rounded-full bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Resolve</button>
                ) : <span className="text-xs text-slate-500">Resolved</span>}
                </Row>
              </div>
            ))}
          </Panel>
        )}

        {viewReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setViewReceipt(null)}>
            <div className="relative max-h-[90vh] max-w-3xl overflow-auto rounded-2xl border border-slate-700/50 bg-surface p-4">
              <button onClick={() => setViewReceipt(null)} className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">
                <X className="h-4 w-4" />
              </button>
              <img src={viewReceipt} alt="Transaction receipt" className="max-w-full rounded-lg" />
            </div>
          </div>
        )}
      </PageContainer>
    </PageShell>
  );
}

function Panel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Surface className={`overflow-hidden ${className}`}>
      <header className="border-b border-slate-700/50 px-5 py-5">
        <h2 className="editorial-header text-3xl font-bold text-white">{title}</h2>
      </header>
      <div>{children}</div>
    </Surface>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-4 border-b border-slate-700/50 px-5 py-5 last:border-b-0">{children}</div>;
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Row>
      <span className="text-sm text-slate-400">{label}</span>
      <strong className="text-white">{value}</strong>
    </Row>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div className="border-b border-slate-700/50 px-5 py-5 text-sm text-slate-500 last:border-b-0">{text}</div>;
}
