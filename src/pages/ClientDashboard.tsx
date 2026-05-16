import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CreditCard, LockKeyhole, MessageCircle, Search, ShieldCheck, Star } from 'lucide-react';
import { api } from '../utils/api';
import SEO from '../components/SEO';
import { useSession } from '../utils/session';
import BookingChatPanel from '../components/BookingChatPanel';
import ProgressTracker from '../components/ProgressTracker';
import { SkeletonDashboard } from '../components/Skeleton';
import { HeroBlock, MetricCard, PageContainer, PageShell, Surface } from '../components/premium';

const money = (value: number) => `PKR ${Number(value || 0).toLocaleString()}`;

export default function ClientDashboard() {
  const session = useSession();
  const clientId = session?.user.id || '';
  const [bookings, setBookings] = useState<any[]>([]);
  const [progressEntries, setProgressEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState('');

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.getClientBookings(clientId),
      api.getClientProgress(clientId)
    ])
      .then(([bookingsData, progressData]) => {
        setBookings(bookingsData);
        setProgressEntries(progressData || []);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  if (!clientId) {
    return <div className="px-6 py-20 text-center text-muted">Client session not found.</div>;
  }

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Client Dashboard | Liftrz Pakistan"
          description="Client dashboard for Liftrz Pakistan bookings, payment status, trainer contact unlocks, active protocols and verified reviews."
          canonical="https://liftrz.com/client/dashboard"
        />

        <HeroBlock
          kicker="Client portal"
          title="My bookings"
          description="Payments, contact unlocks and active protocols stay inside Liftrz."
          actions={<Link to="/discover" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark"><Search className="h-4 w-4" /> Find trainer</Link>}
          aside={
            <Surface className="p-6">
              <p className="text-xs font-semibold text-primary">Booking summary</p>
              <div className="mt-5 grid gap-3">
                <MetricCard label="Total bookings" value={bookings.length} />
                <MetricCard label="Unlocked contacts" value={bookings.filter((booking) => booking.contactUnlocked).length} />
              </div>
            </Surface>
          }
        />

        {loading ? (
          <SkeletonDashboard />
        ) : (
          <section className="mt-10 grid gap-5">
            {bookings.map((booking) => (
              <div key={booking.id}>
                <Surface className="p-5">
                <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
                  <div>
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-black">{booking.status}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">{booking.paymentStatus}</span>
                      {booking.unreadByClient > 0 && <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{booking.unreadByClient} unread</span>}
                    </div>
                    <h2 className="editorial-header text-4xl font-bold text-white">{booking.packageTitle}</h2>
                    <p className="mt-2 text-slate-400">Coach: {booking.trainerName} / Paid: {money(booking.grossAmount)}</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <MetricCard label="Liftrz fee" value={money(booking.commissionAmount)} />
                      <MetricCard label="Trainer payout" value={money(booking.trainerPayoutAmount)} />
                      <MetricCard label="Contact" value={booking.contactUnlocked ? 'Unlocked' : 'Locked'} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-700/50 bg-surface-high/80 p-5">
                    {booking.contactUnlocked ? (
                      <>
                        <h3 className="flex items-center gap-2 font-semibold text-white"><MessageCircle className="h-5 w-5 text-primary" /> Trainer contact unlocked</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-400">Payment has been verified by admin. Use Liftrz chat so your conversation stays protected and monitored.</p>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button type="button" onClick={() => setSelectedChatId(selectedChatId === booking.id ? '' : booking.id)} className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-black">
                            {selectedChatId === booking.id ? 'Close chat' : 'Open chat'}
                          </button>
                          <Link to={`/trainer/${booking.trainerSlug || booking.trainerId}`} className="inline-flex items-center text-xs font-medium text-primary">Open trainer profile</Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="flex items-center gap-2 font-semibold text-white"><LockKeyhole className="h-5 w-5 text-primary" /> Awaiting verification</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-400">Admin must verify your receipt before direct trainer contact unlocks.</p>
                        <span className="mt-5 inline-flex text-xs font-medium text-primary">Owner review in progress</span>
                      </>
                    )}
                  </div>
                </div>
                {selectedChatId === booking.id && booking.contactUnlocked && (
                  <div className="mt-5">
                    <BookingChatPanel booking={booking} title={`Chat with ${booking.trainerName}`} />
                  </div>
                )}
                </Surface>
              </div>
            ))}

            {bookings.length === 0 && (
              <Surface className="py-20 text-center">
                <Star className="mx-auto h-10 w-10 text-primary" />
                <p className="mt-4 text-slate-400">No bookings yet.</p>
                <Link to="/discover" className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">Browse trainers</Link>
              </Surface>
            )}
          </section>
        )}

        {/* Progress Tracker */}
        <section className="mt-10">
          <div className="mb-6">
            <h2 className="editorial-header text-3xl font-bold text-white">My Progress</h2>
            <p className="mt-2 text-slate-400">Track your weight and progress over time.</p>
          </div>
          <ProgressTracker
            entries={progressEntries}
            onAddEntry={async (entry) => {
              try {
                const saved = await api.addProgressEntry(clientId, entry);
                setProgressEntries((prev) => [...prev, saved]);
              } catch {
                const newEntry = { ...entry, id: `progress-${Date.now()}`, clientId };
                setProgressEntries((prev) => [...prev, newEntry]);
              }
            }}
          />
        </section>
      </PageContainer>
    </PageShell>
  );
}
