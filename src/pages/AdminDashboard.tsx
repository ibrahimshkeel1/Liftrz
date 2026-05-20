import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Banknote, CheckCircle2, CircleDollarSign, Copy, Eye, ImageIcon, Loader2, ShieldCheck, Siren, Star, Upload, UsersRound, WalletCards, X } from 'lucide-react';
import { api } from '../utils/api';
import SEO from '../components/SEO';
import BookingChatPanel from '../components/BookingChatPanel';
import { useToast } from '../components/ToastProvider';
import { HeroBlock, MetricCard, PageContainer, PageShell, Surface } from '../components/premium';

const money = (value: number) => `PKR ${Number(value || 0).toLocaleString()}`;
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'trainers', label: 'Trainers' },
  { id: 'submissions', label: 'Submissions' },
  { id: 'featured', label: 'Featured' },
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
  const [protocols, setProtocols] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
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
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'pending_verification' | 'verified' | 'rejected' | 'all'>('pending_verification');

  const load = async () => {
    try {
      setError('');
      setActionError('');
      const [statsData, trainersData, paymentsData, chatsData, payoutsData, disputesData, protocolsData, notificationsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminTrainers(),
        api.getAdminPayments(),
        api.getAdminChats(),
        api.getAdminPayouts(),
        api.getAdminDisputes(),
        api.getAdminProtocols(),
        api.getAdminNotifications()
      ]);
      setStats(statsData);
      setTrainers(trainersData);
      setPayments(paymentsData);
      setChats(chatsData);
      setPayouts(payoutsData);
      setDisputes(disputesData);
      setProtocols(protocolsData);
      setNotifications(notificationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (activeTab !== 'chats') return undefined;
    const interval = window.setInterval(async () => {
      try {
        const chatsData = await api.getAdminChats();
        setChats(chatsData);
      } catch {
        // Keep the current monitor visible if a background refresh fails.
      }
    }, 15000);
    return () => window.clearInterval(interval);
  }, [activeTab]);

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

  const updateFeatured = async (id: string, data: any) => {
    setActionId(`featured-${id}`);
    setActionError('');
    try {
      await api.updateTrainerFeatured(id, data);
      await load();
      toast.addToast('Featured placement updated', 'success');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update featured placement');
    } finally {
      setActionId('');
    }
  };

  const reviewTrainerSection = async (id: string, data: any) => {
    setActionId(`review-${id}`);
    setActionError('');
    try {
      await api.updateTrainerProfileReview(id, data);
      await load();
      toast.addToast('Trainer section reviewed', 'success');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to review section');
    } finally {
      setActionId('');
    }
  };

  const reviewWithReason = async (id: string, data: any, needsReason = false) => {
    const reviewNote = needsReason ? window.prompt('Reason or note for trainer?') || '' : '';
    await reviewTrainerSection(id, { ...data, reviewNote });
  };

  const reviewMedia = async (trainerId: string, mediaType: string, index: number, status: string) => {
    const reviewNote = status === 'rejected' ? window.prompt('Why is this item rejected?') || '' : '';
    await reviewTrainerSection(trainerId, { mediaType, index, status, reviewNote });
  };

  const reviewProtocol = async (id: string, status: string) => {
    setActionId(`protocol-${id}`);
    setActionError('');
    try {
      const reviewNote = status === 'rejected' ? window.prompt('Why is this package rejected?') || '' : '';
      await api.updateAdminProtocol(id, { status, reviewNote });
      await load();
      toast.addToast('Package reviewed', 'success');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to review package');
    } finally {
      setActionId('');
    }
  };

  const verifyPayment = async (id: string, status = 'verified') => {
    const reviewNote = status === 'rejected' ? window.prompt('Why is this payment rejected?') || '' : '';
    setActionId(id);
    setActionError('');
    try {
      await api.verifyPayment(id, { status, reviewNote });
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
          bucket: 'Liftrz-private',
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
  const visiblePayments = paymentFilter === 'all' ? payments : payments.filter((payment) => payment.status === paymentFilter);
  const pendingTrainers = trainers.filter((trainer) => trainer.verificationStatus !== 'approved');
  const pendingFeatured = trainers.filter((trainer) => trainer.featuredStatus === 'requested');
  const pendingSubmissions = trainers.filter((trainer) => ['identityStatus', 'profileAssetsStatus', 'payoutStatus', 'certificationsStatus'].some((key) => trainer[key] === 'pending_review')).length + protocols.filter((protocol) => protocol.status === 'pending_review').length;
  const activeFeatured = trainers.filter((trainer) => trainer.featuredStatus === 'approved' || trainer.featuredManual);
  const pendingPayoutsList = payouts.filter((payout) => payout.status !== 'paid');
  const paidPayoutsList = payouts.filter((payout) => payout.status === 'paid');
  const pendingPayoutsTotal = pendingPayoutsList.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const openDisputes = disputes.filter((dispute) => dispute.status === 'open');
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || chats[0];
  const selectedTrainer = trainers.find((trainer) => trainer.id === selectedTrainerId || trainer.userId === selectedTrainerId);

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Liftrz Owner Backend | Payments, Trainers and Commission"
          description="Owner backend for Liftrz Pakistan marketplace payments, trainer approvals, commission, payouts, disputes and reviews."
          canonical="https://liftrz.com/admin"
        />

        <HeroBlock
          kicker="Owner backend"
          title="Liftrz Control Room"
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
          <MetricCard label="Admin queue" value={`${stats.pendingTrainerApprovals + stats.pendingPaymentVerifications + pendingFeatured.length + pendingSubmissions + openDisputes.length}`} />
          <MetricCard label="Clients" value={stats.totalClients} />
          <MetricCard label="Approved trainers" value={stats.approvedTrainers} />
          <MetricCard label="Active bookings" value={stats.activeBookings} />
          <MetricCard label="Monitored chats" value={chats.length} />
          <MetricCard label="Open disputes" value={openDisputes.length} />
          <MetricCard label="Featured requests" value={pendingFeatured.length} />
          <MetricCard label="Profile submissions" value={pendingSubmissions} />
          <MetricCard label="Notifications" value={notifications.length} />
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

        {activeTab === 'notifications' && (
          <Panel className="mt-8" title="Notification center">
            {notifications.length === 0 && <EmptyRow text="No active notifications." />}
            {notifications.map((item) => (
              <div key={item.id}>
              <Row>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{item.type}</p>
                </div>
                <span className="text-xs text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</span>
              </Row>
              </div>
            ))}
          </Panel>
        )}

        {activeTab === 'overview' && (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <Panel title="Priority queue">
              <SummaryRow label="Trainer approvals" value={pendingTrainers.length} />
              <SummaryRow label="Featured requests" value={pendingFeatured.length} />
              <SummaryRow label="Profile submissions" value={pendingSubmissions} />
              <SummaryRow label="Payment verifications" value={pendingPayments.length} />
              <SummaryRow label="Active monitored chats" value={chats.length} />
              <SummaryRow label="Payouts waiting" value={pendingPayoutsList.length} />
              <SummaryRow label="Open disputes" value={openDisputes.length} />
            </Panel>
            <Panel title="Commission snapshot">
              <SummaryRow label="Gross merchandise value" value={money(stats.grossMerchandiseValue)} />
              <SummaryRow label="Commission earned" value={money(stats.commissionEarned)} />
              <SummaryRow label="Pending trainer payouts" value={money(pendingPayoutsTotal)} />
              <SummaryRow label="Active featured trainers" value={activeFeatured.length} />
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

        {activeTab === 'submissions' && (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <Panel title="Trainer verification">
              {trainers.map((trainer) => {
                const id = trainer.id || trainer.userId || '';
                return (
                  <div key={`submission-${id}`}>
                    <Row>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{trainer.name}</h3>
                      <p className="mt-1 text-xs text-slate-400">{trainer.city} / {trainer.area || 'Area pending'} / {trainer.specialty}</p>
                      <div className="mt-3 grid gap-2 text-xs text-slate-400">
                        <ReviewLine label="CNIC" status={trainer.identityStatus} onApprove={() => reviewWithReason(id, { identityStatus: 'approved' })} onReject={() => reviewWithReason(id, { identityStatus: 'rejected' }, true)} />
                        <ReviewLine label="Profile/photos" status={trainer.profileAssetsStatus} onApprove={() => reviewWithReason(id, { profileAssetsStatus: 'approved' })} onReject={() => reviewWithReason(id, { profileAssetsStatus: 'rejected' }, true)} />
                        <ReviewLine label="Payout" status={trainer.payoutStatus} onApprove={() => reviewWithReason(id, { payoutStatus: 'approved' })} onReject={() => reviewWithReason(id, { payoutStatus: 'rejected' }, true)} />
                        <ReviewLine label="Certificates" status={trainer.certificationsStatus} onApprove={() => reviewWithReason(id, { certificationsStatus: 'approved' })} onReject={() => reviewWithReason(id, { certificationsStatus: 'rejected' }, true)} />
                        <ReviewLine label="Packages" status={trainer.packagesStatus} onApprove={() => reviewWithReason(id, { packagesStatus: 'approved' })} onReject={() => reviewWithReason(id, { packagesStatus: 'rejected' }, true)} />
                      </div>
                      <div className="mt-4 rounded-xl border border-slate-700/50 bg-surface-high/50 p-3 text-xs text-slate-400">
                        <p>CNIC: {trainer.cnicNumber || 'Not submitted'}</p>
                        <p>Bank: {trainer.bankName || 'N/A'} / {trainer.accountTitle || 'N/A'} / {trainer.bankAccountNumber || 'N/A'}</p>
                        <p>Certs: {Array.isArray(trainer.certifications) && trainer.certifications.length ? trainer.certifications.join(', ') : 'None'}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {trainer.cnicFrontImage && <a href={trainer.cnicFrontImage} target="_blank" rel="noreferrer" className="text-primary">CNIC front</a>}
                          {trainer.cnicBackImage && <a href={trainer.cnicBackImage} target="_blank" rel="noreferrer" className="text-primary">CNIC back</a>}
                          {trainer.image && <a href={trainer.image} target="_blank" rel="noreferrer" className="text-primary">Profile image</a>}
                        </div>
                        <button type="button" onClick={() => setSelectedTrainerId(id)} className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
                          Open full review
                        </button>
                      </div>
                    </div>
                    </Row>
                  </div>
                );
              })}
            </Panel>

            <Panel title="Package approvals">
              {protocols.length === 0 && <EmptyRow text="No packages submitted." />}
              {protocols.map((protocol) => (
                <div key={protocol.id}>
                  <Row>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{protocol.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">{protocol.trainer?.name || protocol.trainerId} / {protocol.duration} / {money(protocol.price)}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{protocol.status || 'approved'}</p>
                    <p className="mt-3 text-sm text-slate-400">{protocol.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={actionId === `protocol-${protocol.id}`} onClick={() => reviewProtocol(protocol.id, 'approved')} className="rounded-full bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Approve</button>
                    <button disabled={actionId === `protocol-${protocol.id}`} onClick={() => reviewProtocol(protocol.id, 'rejected')} className="rounded-full border border-slate-700/50 bg-surface-high/80 px-3 py-2 text-xs font-medium text-slate-300 disabled:opacity-50">Reject</button>
                  </div>
                  </Row>
                </div>
              ))}
            </Panel>
          </div>
        )}

        {activeTab === 'featured' && (
          <Panel className="mt-8" title="Featured approvals">
            {trainers.length === 0 && <EmptyRow text="No trainers found." />}
            {trainers.map((trainer) => {
              const trainerActionKey = trainer.id || trainer.userId || '';
              const until = trainer.featuredUntil || defaultFeaturedUntil();
              const isWorking = actionId === `featured-${trainerActionKey}`;
              return (
              <div key={`featured-${trainerActionKey || trainer.email}`}>
                <Row>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{trainer.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">{trainer.city} / {trainer.area || 'Area pending'} / {trainer.specialty}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-700/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{trainer.featuredStatus || 'none'}</span>
                    <span className="rounded-full border border-slate-700/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{trainer.featuredPaymentStatus || 'not_required'}</span>
                    {trainer.featuredManual && <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Manual</span>}
                  </div>
                  {trainer.featuredNote && <p className="mt-3 text-sm text-slate-300">{trainer.featuredNote}</p>}
                  {trainer.featuredReceiptImage && (
                    <a href={trainer.featuredReceiptImage} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-medium text-primary">
                      View featured payment proof
                    </a>
                  )}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs text-slate-500">
                      Placement
                      <select
                        defaultValue={trainer.featuredPlacement || 'home'}
                        id={`placement-${trainerActionKey}`}
                        className="rounded-lg border border-slate-700/50 bg-surface-high px-2 py-2 text-xs text-white"
                      >
                        <option value="home">Home</option>
                        <option value="discover">Discover</option>
                        <option value="all">Home and Discover</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs text-slate-500">
                      Featured until
                      <input
                        type="date"
                        defaultValue={until.slice(0, 10)}
                        id={`until-${trainerActionKey}`}
                        className="rounded-lg border border-slate-700/50 bg-surface-high px-2 py-2 text-xs text-white"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    disabled={isWorking || trainer.verificationStatus !== 'approved'}
                    onClick={() => updateFeatured(trainerActionKey, {
                      featuredStatus: 'approved',
                      featuredPaymentStatus: 'verified',
                      featuredManual: false,
                      featuredPlacement: selectValue(`placement-${trainerActionKey}`, trainer.featuredPlacement || 'home'),
                      featuredUntil: dateValue(`until-${trainerActionKey}`, until)
                    })}
                    className="rounded-full bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Approve paid
                  </button>
                  <button
                    disabled={isWorking || trainer.verificationStatus !== 'approved'}
                    onClick={() => updateFeatured(trainerActionKey, {
                      featuredStatus: 'approved',
                      featuredPaymentStatus: 'not_required',
                      featuredManual: true,
                      featuredPlacement: selectValue(`placement-${trainerActionKey}`, trainer.featuredPlacement || 'home'),
                      featuredUntil: dateValue(`until-${trainerActionKey}`, until)
                    })}
                    className="rounded-full border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary disabled:opacity-50"
                  >
                    Feature manually
                  </button>
                  <button disabled={isWorking} onClick={() => updateFeatured(trainerActionKey, { featuredStatus: 'rejected', featuredPaymentStatus: 'rejected', featuredManual: false })} className="rounded-full border border-slate-700/50 bg-surface-high/80 px-3 py-2 text-xs font-medium text-slate-300 disabled:opacity-50">Reject</button>
                  <button disabled={isWorking} onClick={() => updateFeatured(trainerActionKey, { featuredStatus: 'none', featuredPaymentStatus: 'not_required', featuredManual: false })} className="rounded-full border border-slate-700/50 px-3 py-2 text-xs font-medium text-slate-500 disabled:opacity-50">Remove</button>
                </div>
                </Row>
              </div>
              );
            })}
          </Panel>
        )}

        {activeTab === 'payments' && (
          <Panel className="mt-8" title="Payment verification">
            <div className="flex flex-wrap gap-2 border-b border-slate-700/50 px-5 py-4">
              {[
                ['pending_verification', 'Pending'],
                ['verified', 'Verified'],
                ['rejected', 'Rejected'],
                ['all', 'All']
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentFilter(value as typeof paymentFilter)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${paymentFilter === value ? 'border-primary bg-primary/10 text-primary' : 'border-slate-700/50 text-slate-400 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {visiblePayments.length === 0 && <EmptyRow text="No payments found." />}
            {visiblePayments.map((payment) => (
              <div key={payment.id}>
                <Row>
                <div>
                  <h3 className="font-semibold text-white">{money(payment.amount)}</h3>
                  <p className="mt-1 text-xs text-slate-400">{payment.method} / {payment.bookingId}</p>
                  <div className="mt-3 grid gap-1 text-xs text-slate-400">
                    <p>Bank: <span className="text-slate-200">{payment.bankName || 'N/A'}</span></p>
                    <p>Account: <span className="text-slate-200">{payment.accountNumber || 'N/A'}</span></p>
                    <p>Name: <span className="text-slate-200">{payment.accountName || 'N/A'}</span></p>
                    <p>Transaction ID: <span className="text-slate-200">{payment.transactionId || 'Not provided'}</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText([payment.bankName, payment.accountNumber, payment.accountName, payment.transactionId].filter(Boolean).join(' / '))}
                    className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-700/50 px-2 py-1 text-xs text-slate-300 hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy proof details
                  </button>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{payment.status}</p>
                  {payment.reviewNote && <p className="mt-2 text-xs text-rose-200">Review note: {payment.reviewNote}</p>}
                  {payment.receiptImage && (
                    <button type="button" onClick={() => setViewReceipt(payment.receiptImage)} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Eye className="h-3.5 w-3.5" /> View receipt
                    </button>
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
                  <BookingChatPanel booking={selectedChat} title={`${selectedChat.clientName} / ${selectedChat.trainerName}`} readOnly onModerated={load} />
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
                      {(() => {
                        const trainer = trainers.find((item) => item.id === payout.trainerId);
                        const details = trainer ? `${trainer.name}\nBank: ${trainer.bankName || 'N/A'}\nAccount title: ${trainer.accountTitle || 'N/A'}\nAccount number: ${trainer.bankAccountNumber || trainer.payoutAccount || 'N/A'}\nMethod: ${trainer.payoutMethod || payout.method}` : payout.trainerId;
                        return (
                          <div className="mb-3 rounded-xl border border-slate-700/50 bg-surface-high/50 p-3 text-xs text-slate-400">
                            <div className="flex items-center justify-between gap-3">
                              <span>Due payment details</span>
                              <button type="button" onClick={() => navigator.clipboard.writeText(details)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700/50 px-2 py-1 text-slate-300 hover:text-white">
                                <Copy className="h-3 w-3" /> Copy
                              </button>
                            </div>
                            <p className="mt-2 whitespace-pre-line">{details}</p>
                          </div>
                        );
                      })()}
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

        {selectedTrainer && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
            <div className="mx-auto my-8 max-w-6xl rounded-2xl border border-slate-700/50 bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Trainer detail review</p>
                  <h2 className="mt-2 text-3xl font-bold text-white">{selectedTrainer.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{selectedTrainer.city} / {selectedTrainer.area || 'Area pending'} / {selectedTrainer.specialty}</p>
                </div>
                <button onClick={() => setSelectedTrainerId('')} className="rounded-full bg-black/40 p-2 text-white hover:bg-black/70">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <DetailBox title="Identity">
                  <p>CNIC: {selectedTrainer.cnicNumber || 'Not submitted'}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <ImagePreview src={selectedTrainer.cnicFrontImage} label="CNIC front" />
                    <ImagePreview src={selectedTrainer.cnicBackImage} label="CNIC back" />
                  </div>
                </DetailBox>
                <DetailBox title="Payout">
                  <p>Bank: {selectedTrainer.bankName || 'N/A'}</p>
                  <p>Title: {selectedTrainer.accountTitle || 'N/A'}</p>
                  <p>Account: {selectedTrainer.bankAccountNumber || selectedTrainer.payoutAccount || 'N/A'}</p>
                </DetailBox>
                <DetailBox title="Profile gallery">
                  <MediaReviewGrid items={selectedTrainer.profileGallery || []} type="profileGallery" trainerId={selectedTrainer.id} onReview={reviewMedia} />
                </DetailBox>
                <DetailBox title="Transformations">
                  <MediaReviewGrid items={selectedTrainer.transformationImages || []} type="transformationImages" trainerId={selectedTrainer.id} onReview={reviewMedia} paired />
                </DetailBox>
                <DetailBox title="Certificates">
                  <p>{Array.isArray(selectedTrainer.certifications) && selectedTrainer.certifications.length ? selectedTrainer.certifications.join(', ') : 'No certificate names submitted'}</p>
                  <MediaReviewGrid items={selectedTrainer.certificationDocs || []} type="certificationDocs" trainerId={selectedTrainer.id} onReview={reviewMedia} />
                </DetailBox>
                <DetailBox title="Packages">
                  <div className="grid gap-3">
                    {protocols.filter((protocol) => protocol.trainerId === selectedTrainer.id).map((protocol) => (
                      <div key={protocol.id} className="rounded-xl border border-slate-700/50 bg-surface-high/50 p-3">
                        <p className="font-semibold text-white">{protocol.title}</p>
                        <p className="text-xs text-slate-400">{money(protocol.price)} / {protocol.status || 'approved'}</p>
                        {protocol.reviewNote && <p className="mt-1 text-xs text-rose-200">{protocol.reviewNote}</p>}
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => reviewProtocol(protocol.id, 'approved')} className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white">Approve</button>
                          <button onClick={() => reviewProtocol(protocol.id, 'rejected')} className="rounded-lg border border-slate-700/50 px-3 py-1 text-xs font-bold text-slate-300">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </DetailBox>
              </div>
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

function ReviewLine({ label, status, onApprove, onReject }: { label: string; status?: string; onApprove: () => void; onReject: () => void }) {
  const pending = status === 'pending_review';
  const approved = status === 'approved';
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700/50 bg-surface-high/50 px-3 py-2">
      <span>{label}: <strong className={approved ? 'text-success' : pending ? 'text-primary' : 'text-slate-300'}>{approved ? 'approved' : pending ? 'pending review' : status || 'not submitted'}</strong></span>
      <span className="flex gap-2">
        <button type="button" onClick={onApprove} className="rounded-lg bg-primary px-2 py-1 text-[10px] font-semibold text-white">Approve</button>
        <button type="button" onClick={onReject} className="rounded-lg border border-slate-700/50 px-2 py-1 text-[10px] font-semibold text-slate-300">Reject</button>
      </span>
    </div>
  );
}

function DetailBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-surface-high/40 p-4 text-sm text-slate-300">
      <h3 className="mb-3 text-lg font-bold text-white">{title}</h3>
      {children}
    </div>
  );
}

function ImagePreview({ src, label }: { src?: string; label: string }) {
  if (!src) return <div className="rounded-xl border border-slate-700/50 p-4 text-xs text-slate-500">{label}: not uploaded</div>;
  return (
    <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-700/50">
      <img src={src} alt={label} className="aspect-video w-full bg-black object-contain" />
      <p className="px-3 py-2 text-xs text-slate-300">{label} - open full size</p>
    </a>
  );
}

function MediaReviewGrid({ items, type, trainerId, onReview, paired = false }: { items: any[]; type: string; trainerId: string; onReview: (trainerId: string, mediaType: string, index: number, status: string) => void; paired?: boolean }) {
  if (!items.length) return <p className="text-sm text-slate-500">Nothing uploaded yet.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-slate-700/50 bg-surface p-3">
          {paired ? (
            <div className="grid grid-cols-2 gap-2">
              <ImagePreview src={item.beforeImage} label="Before" />
              <ImagePreview src={item.afterImage || item.image} label="After" />
            </div>
          ) : (
            <ImagePreview src={item.image || item.url} label={`Item ${index + 1}`} />
          )}
          <p className="mt-2 text-xs text-slate-300">{item.caption || item.name || 'No caption'}</p>
          <p className={`mt-1 text-[10px] font-bold uppercase ${item.status === 'approved' ? 'text-success' : item.status === 'rejected' ? 'text-rose-300' : 'text-primary'}`}>{item.status || 'pending_review'}</p>
          {item.reviewNote && <p className="mt-1 text-xs text-rose-200">{item.reviewNote}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={() => onReview(trainerId, type, index, 'approved')} className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white">Approve</button>
            <button onClick={() => onReview(trainerId, type, index, 'rejected')} className="rounded-lg border border-slate-700/50 px-3 py-1 text-xs font-bold text-slate-300">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function defaultFeaturedUntil() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}

function selectValue(id: string, fallback: string) {
  return (document.getElementById(id) as HTMLSelectElement | null)?.value || fallback;
}

function dateValue(id: string, fallback: string) {
  const value = (document.getElementById(id) as HTMLInputElement | null)?.value;
  return value ? new Date(`${value}T23:59:59.000Z`).toISOString() : fallback;
}
