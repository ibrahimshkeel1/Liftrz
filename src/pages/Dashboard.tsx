import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Banknote, CheckCircle2, Clock, Eye, ImageIcon, Loader2, MessageSquare, Star, UsersRound, WalletCards, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import SEO from '../components/SEO';
import { useSession } from '../utils/session';
import BookingChatPanel from '../components/BookingChatPanel';
import EmptyState from '../components/EmptyState';
import { SkeletonDashboard } from '../components/Skeleton';
import { HeroBlock, MetricCard, PageContainer, PageShell, Surface } from '../components/premium';

const money = (value: number) => `PKR ${Number(value || 0).toLocaleString()}`;

export default function Dashboard() {
  const session = useSession();
  const trainerId = session?.user.trainerId || '';
  const [stats, setStats] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');
  const [actionError, setActionError] = useState('');
  const [selectedChatId, setSelectedChatId] = useState('');
  const [payoutTab, setPayoutTab] = useState<'pending' | 'paid'>('pending');
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);

  const load = async () => {
    if (!trainerId) return;
    try {
      setError('');
      const [trainerData, statsData, bookingsData, leadsData, payoutsData] = await Promise.all([
        api.getTrainer(trainerId),
        api.getTrainerStats(trainerId),
        api.getTrainerBookings(trainerId),
        api.getLeads(trainerId),
        api.getTrainerPayouts(trainerId)
      ]);
      setTrainer(trainerData);
      setStats(statsData);
      setBookings(bookingsData);
      setLeads(leadsData);
      setPayouts(payoutsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trainer dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!trainerId) {
      setLoading(false);
      return;
    }
    load();
  }, [trainerId]);

  const updateLead = async (id: string, status: string) => {
    setActionId(id);
    setActionError('');
    try {
      await api.updateLeadStatus(id, { status });
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update lead');
    } finally {
      setActionId('');
    }
  };

  if (!trainerId) return <div className="px-6 py-20 text-center text-muted">Trainer session not found.</div>;
  if (loading) return (
    <PageShell>
      <PageContainer>
        <SkeletonDashboard />
      </PageContainer>
    </PageShell>
  );
  if (error) return <div className="px-6 py-20 text-center text-red-400">{error}</div>;

  const pendingPayouts = payouts.filter((p) => p.status !== 'paid');
  const paidPayouts = payouts.filter((p) => p.status === 'paid');
  const commissionPercent = Math.round((trainer.commissionRate || 0.15) * 100);

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Trainer Dashboard | Liftrz Pakistan"
          description="Trainer dashboard for client bookings, verified reviews, revenue, commission, payout tracking and response performance."
          canonical="https://liftrz.vercel.app/trainer/dashboard"
        />

        <HeroBlock
          kicker="Trainer command"
          title={trainer.name}
          description={`${trainer.city}, ${trainer.area} / ${trainer.verificationLevel}`}
          actions={<Link to={`/trainer/${trainerId}`} className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">Public profile</Link>}
          aside={
            <Surface className="p-6">
              <p className="text-xs font-semibold text-primary">Revenue posture</p>
              <div className="mt-5 grid gap-3">
                <MetricCard label="Gross revenue" value={money(stats.grossRevenue)} active />
                <MetricCard label="Pending payout" value={money(stats.pendingPayout)} />
                <div className="rounded-xl border border-slate-700/50 bg-surface-high/50 px-4 py-3">
                  <p className="text-xs text-slate-500">Your commission rate</p>
                  <p className="text-lg font-bold text-white">{commissionPercent}%</p>
                </div>
              </div>
            </Surface>
          }
        />

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Active clients" value={stats.activeClients} />
          <MetricCard label="Inquiries" value={stats.inquiries} />
          <MetricCard label="Rating" value={`${stats.averageRating || trainer.rating} / 5`} />
          <MetricCard label="Completed" value={stats.completedClients} />
          <MetricCard label="Response time" value={`${trainer.responseTimeHours || 0}h`} />
          <MetricCard label="Commission paid" value={money(stats.commissionPaid)} />
          <MetricCard label="Bookings" value={stats.bookings} />
          <MetricCard label="Review count" value={stats.reviewCount} />
        </div>

        {actionError && (
          <div className="mt-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {actionError}
          </div>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <Panel title="Bookings">
            {bookings.length === 0 && (
              <EmptyState title="No bookings yet" description="Once clients complete payment verification, bookings will appear here." />
            )}
            {bookings.map((booking) => (
              <div key={booking.id}>
                <Row>
                <div>
                  <h3 className="font-semibold text-white">{booking.clientName}</h3>
                  <p className="mt-1 text-sm text-slate-400">{booking.packageTitle} / {money(booking.grossAmount)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{booking.status} / contact {booking.contactUnlocked ? 'unlocked' : 'locked'}</p>
                    {booking.unreadByTrainer > 0 && <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{booking.unreadByTrainer} unread</span>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Commission: {Math.round((booking.commissionRate || 0.15) * 100)}%</p>
                </div>
                <div className="grid gap-3 text-right text-sm">
                  <p>Liftrz: {money(booking.commissionAmount)}</p>
                  <p className="text-slate-400">Your cut: {money(booking.trainerPayoutAmount)}</p>
                  {booking.contactUnlocked && (
                    <button type="button" onClick={() => setSelectedChatId(selectedChatId === booking.id ? '' : booking.id)} className="justify-self-end rounded-full bg-primary px-3 py-2 text-xs font-medium text-black">
                      {selectedChatId === booking.id ? 'Close chat' : 'Open chat'}
                    </button>
                  )}
                </div>
                </Row>
                {selectedChatId === booking.id && booking.contactUnlocked && (
                  <div className="border-b border-slate-700/50 px-5 pb-5">
                    <BookingChatPanel booking={booking} title={`Chat with ${booking.clientName}`} />
                  </div>
                )}
              </div>
            ))}
          </Panel>

          <Panel title="Lead pipeline">
            {leads.length === 0 && (
              <EmptyState title="No leads yet" description="New client inquiries will show up here. Share your profile to get more visibility." />
            )}
            {leads.map((lead) => {
              const paymentVerified = lead.paymentStatus === 'verified';
              return (
              <div key={lead.id} className="border-b border-slate-700/50 px-5 py-5 last:border-b-0">
                <div className="mb-3 flex justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{lead.clientName}</h3>
                    <p className="text-sm text-slate-400">{lead.goal}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">{lead.status}</span>
                </div>
                <p className="mb-4 text-sm text-slate-300">{lead.message}</p>
                <div className="flex gap-2">
                  <button disabled={actionId === lead.id} onClick={() => updateLead(lead.id, 'contacted')} className="rounded-full border border-slate-700/50 bg-surface-high/80 px-3 py-2 text-[10px]  text-slate-300 disabled:opacity-50">Contacted</button>
                  <button disabled={actionId === lead.id || !paymentVerified} title={paymentVerified ? '' : 'Admin must verify payment first'} onClick={() => updateLead(lead.id, 'booked')} className="rounded-full bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50">{actionId === lead.id ? 'Working...' : 'Booked'}</button>
                </div>
              </div>
              );
            })}
          </Panel>

          <Panel title="Payouts" className="lg:col-span-2">
            <div className="flex gap-2 border-b border-slate-700/50 px-5 pt-4">
              <button onClick={() => setPayoutTab('pending')} className={`rounded-t-lg px-4 py-2 text-xs font-semibold ${payoutTab === 'pending' ? 'bg-primary text-white' : 'text-slate-400'}`}>
                Pending ({pendingPayouts.length})
              </button>
              <button onClick={() => setPayoutTab('paid')} className={`rounded-t-lg px-4 py-2 text-xs font-semibold ${payoutTab === 'paid' ? 'bg-success text-white' : 'text-slate-400'}`}>
                Paid ({paidPayouts.length})
              </button>
            </div>

            {payoutTab === 'pending' && (
              <div>
                {pendingPayouts.length === 0 && <EmptyState title="No pending payouts" description="Payouts are created when admin verifies your client bookings." />}
                {pendingPayouts.map((payout) => (
                  <div key={payout.id}>
                    <Row>
                    <div>
                      <h3 className="font-semibold text-white">{money(payout.amount)}</h3>
                      <p className="mt-1 text-sm text-slate-400">{payout.method} / Bookings: {payout.bookingIds?.join(', ')}</p>
                      <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">PENDING</span>
                    </div>
                    <Clock className="h-5 w-5 text-slate-500" />
                    </Row>
                  </div>
                ))}
              </div>
            )}

            {payoutTab === 'paid' && (
              <div>
                {paidPayouts.length === 0 && <EmptyState title="No paid payouts yet" description="Your completed payouts will appear here." />}
                {paidPayouts.map((payout) => (
                  <div key={payout.id}>
                    <Row>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{money(payout.amount)}</h3>
                      <p className="mt-1 text-sm text-slate-400">{payout.method} / Ref: {payout.reference || 'N/A'}</p>
                      <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-[0.28em] text-success">PAID</span>
                      <p className="mt-1 text-xs text-slate-500">{payout.paidAt ? new Date(payout.paidAt).toLocaleDateString() : ''}</p>
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
        </div>

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
