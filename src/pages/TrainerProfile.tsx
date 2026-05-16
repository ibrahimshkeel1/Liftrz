import { useEffect, useState, useCallback } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, Copy, Loader2, LockKeyhole, MapPin, MessageCircle, ShieldCheck, Star, Upload, Video, UserRoundCheck, Clock, Award, Languages } from 'lucide-react';
import { api } from '../utils/api';
import { useSession } from '../utils/session';
import SEO from '../components/SEO';
import { SkeletonCard, SkeletonProfile } from '../components/Skeleton';
import { useToast } from '../components/ToastProvider';
import { HeroBlock, InfoPill, MetricCard, PageContainer, PageShell, SectionTitle, Surface } from '../components/premium';

const money = (value: number | string) => `PKR ${Number(String(value || 0).replace(/,/g, '')).toLocaleString()}`;

export default function TrainerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = useSession();
  const toast = useToast();
  const [trainer, setTrainer] = useState<any>(null);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    goal: '',
    message: ''
  });
  const [buddyMode, setBuddyMode] = useState(false);
  const [buddyInfo, setBuddyInfo] = useState({ name: '', phone: '' });
  const [imgError, setImgError] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' });
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const clientSession = session?.user.role === 'client' ? session.user : null;

  const initials = trainer?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'TR';

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getTrainer(id), api.getProtocols(id), api.getReviews(id)])
      .then(([trainerData, protocolsData, reviewsData]) => {
        setTrainer(trainerData);
        setProtocols(protocolsData);
        setReviews(reviewsData);
        // Redirect ID-based URL to slug-based URL for clean SEO URLs
        if (trainerData?.slug && id === trainerData.id) {
          navigate(`/trainer/${trainerData.slug}`, { replace: true });
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trainer profile'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!clientSession) return;
    setInquiryForm((current) => ({
      ...current,
      name: current.name || clientSession.name || '',
      email: current.email || clientSession.email || '',
      phone: current.phone || clientSession.phone || ''
    }));
  }, [clientSession?.id]);

  useEffect(() => {
    if (!trainer?.id) return;
    api.trackEvent({ type: 'profile_view', trainerId: trainer.id, path: `/trainer/${trainer.slug || trainer.id}`, city: trainer.city, goal: trainer.specialty }).catch(() => {});
  }, [trainer?.id]);

  const submitInquiry = async (event: FormEvent) => {
    event.preventDefault();
    if (!trainer) return;
    setInquiryStatus('loading');
    try {
      await api.createLead({
        trainerId: trainer.id,
        goal: inquiryForm.goal,
        message: inquiryForm.message,
        clientName: inquiryForm.name,
        clientEmail: inquiryForm.email,
        clientPhone: inquiryForm.phone,
        selectedProtocolId: selectedPackage?.id,
        buddyMode,
        buddyName: buddyMode ? buddyInfo.name : undefined,
        buddyPhone: buddyMode ? buddyInfo.phone : undefined
      });
      setInquiryStatus('success');
      api.trackEvent({ type: 'inquiry_submit', trainerId: trainer.id, source: 'trainer_profile', city: trainer.city, goal: inquiryForm.goal || trainer.specialty }).catch(() => {});
      toast.addToast('Inquiry sent! The trainer will respond soon.', 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to send inquiry';
      setInquiryStatus('idle');
      toast.addToast(msg, 'error');
    }
  };

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!trainer || !clientSession) return;
    setReviewStatus('loading');
    try {
      await api.createReview({
        trainerId: trainer.id,
        rating: reviewForm.rating,
        text: reviewForm.text
      });
      setReviewStatus('success');
      setReviewForm({ rating: 5, text: '' });
      // Refresh reviews
      const updatedReviews = await api.getReviews(trainer.id);
      setReviews(updatedReviews);
      toast.addToast('Review submitted! Thank you for your feedback.', 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to submit review';
      setReviewStatus('idle');
      toast.addToast(msg, 'error');
    }
  };

  if (loading) {
    return (
      <PageShell>
        <PageContainer>
          <SkeletonProfile />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </PageContainer>
      </PageShell>
    );
  }
  if (error) {
    return <div className="px-6 py-20 text-center text-red-400">{error}</div>;
  }
  if (!trainer) {
    return <div className="px-6 py-20 text-center text-red-400">Trainer not found.</div>;
  }

  const availableSlots = Math.max(Number(trainer.capacity || 0) - Number(trainer.activeClients || 0), 0);
  const monthlyPrice = Math.round(Number(String(trainer.price || 0).replace(/,/g, '')) * 12);

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title={`${trainer.name} | ${trainer.specialty} Personal Trainer in ${trainer.city} | Liftrz`}
          description={`Book ${trainer.name}, a verified ${trainer.specialty} personal trainer in ${trainer.city}, Pakistan. Compare packages, reviews and PKR pricing on Liftrz.`}
          canonical={`https://liftrz.com/trainer/${trainer.slug || trainer.id}`}
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: trainer.name,
            jobTitle: `${trainer.specialty} personal trainer`,
            address: { '@type': 'PostalAddress', addressLocality: trainer.city, addressCountry: 'PK' },
            ...(trainer.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: trainer.rating, reviewCount: reviews.length } } : {})
          }}
        />

        {/* Top Section: Photo + Info */}
        <section className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-high flex items-center justify-center">
              {!imgError && trainer.image ? (
                <img src={trainer.image} alt={`${trainer.name} verified personal trainer in ${trainer.city}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={() => setImgError(true)} />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-surface-high text-primary">
                  <span className="text-6xl font-black">{initials}</span>
                  <span className="mt-2 text-xs uppercase tracking-widest text-slate-500">Verified Trainer</span>
                </div>
              )}
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified
                </span>
                {availableSlots > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-success/90 px-3 py-1.5 text-xs font-bold text-white">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> Available now
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <MapPin className="h-3.5 w-3.5" />
              {trainer.area ? `${trainer.area}, ${trainer.city}` : trainer.city}
            </div>
            <h1 className="editorial-header mt-2 text-4xl font-bold leading-[0.95] text-white md:text-5xl">{trainer.name}</h1>
            <p className="mt-2 text-lg text-slate-400">{trainer.specialty}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {trainer.goals?.map((goal: string) => (
                <span key={goal}><InfoPill>{goal}</InfoPill></span>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard label="Rating" value={<span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {trainer.rating || 'New'}</span>} />
              <MetricCard label="Clients" value={trainer.completedBookings || 0} />
              <MetricCard label="Response" value={`${trainer.responseTimeHours || 0}h`} />
              <MetricCard label="Experience" value={trainer.yearsExperience ? `${trainer.yearsExperience}+ yrs` : trainer.experienceLevel} />
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-400">
              <div className="flex items-center gap-2"><UserRoundCheck className="h-4 w-4 text-primary" /> {trainer.verificationLevel || 'CNIC verified'}</div>
              <div className="flex items-center gap-2"><Languages className="h-4 w-4 text-primary" /> {trainer.languages?.join(', ') || 'Urdu, English'}</div>
              <div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-primary" /> {trainer.serviceModes?.join(', ') || 'Gym, Home Visit'}</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {availableSlots > 0 ? `${availableSlots} client slots open` : 'Waitlist only right now'}</div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {trainer.identityStatus === 'approved' && <TrustBadge label="CNIC verified" />}
              {trainer.certificationsStatus === 'approved' && <TrustBadge label="Certificates verified" />}
              {trainer.payoutStatus === 'approved' && <TrustBadge label="Payout verified" />}
              {trainer.packagesStatus === 'approved' && <TrustBadge label="Packages approved" />}
              {trainer.profileAssetsStatus === 'approved' && <TrustBadge label="Media reviewed" />}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <a href="#inquiry" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-dark">
                Book free trial
              </a>
              <a href="#packages" className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20">
                Compare packages
              </a>
              <ShareButton label="WhatsApp" href={`https://wa.me/?text=${encodeURIComponent(`Check out ${trainer.name} on Liftrz: https://liftrz.com/trainer/${trainer.slug || trainer.id}`)}`} />
              <CopyLinkButton url={`https://liftrz.com/trainer/${trainer.slug || trainer.id}`} />
            </div>
          </div>
        </section>

        {/* Bio */}
        <Surface className="mt-8 p-6">
          <h2 className="text-lg font-semibold text-white">About</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">{trainer.bio}</p>
        </Surface>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <TrustTile icon={ShieldCheck} title="Verified profile" text="CNIC and proof reviewed before public listing." />
          <TrustTile icon={LockKeyhole} title="Contact protected" text="Direct contact unlocks after payment verification." />
          <TrustTile icon={Award} title="Real proof" text="Packages, reviews and transformations stay tied to bookings." />
          <TrustTile icon={Clock} title="First-session safety" text="Clients can raise disputes from their dashboard." />
        </div>

        {trainer.profileGallery?.length > 0 && (
          <section className="mt-10">
            <SectionTitle title="Profile photos" description="More pictures from this trainer's coaching setup and profile." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {trainer.profileGallery.slice(0, 5).map((photo: any, index: number) => (
                <article key={`${photo.image}-${index}`} className="overflow-hidden rounded-2xl border border-slate-700/50 bg-surface">
                  <div className="aspect-square bg-surface-high">
                    <img src={photo.image} alt={photo.caption || `${trainer.name} profile photo ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                  <p className="min-h-14 px-4 py-3 text-sm leading-6 text-slate-300">{photo.caption || 'Profile photo'}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {trainer.transformationImages?.length > 0 && (
          <section className="mt-10">
            <SectionTitle title="Client transformations" description="Client progress pictures uploaded separately from the trainer profile gallery." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {trainer.transformationImages.slice(0, 10).map((photo: any, index: number) => (
                <article key={`${photo.image}-${index}`} className="overflow-hidden rounded-2xl border border-slate-700/50 bg-surface">
                  <div className="grid grid-cols-2 bg-surface-high">
                    {photo.beforeImage && (
                      <div className="relative aspect-square">
                        <img src={photo.beforeImage} alt={`Before ${photo.caption || `${trainer.name} transformation ${index + 1}`}`} className="h-full w-full object-cover" />
                        <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">Before</span>
                      </div>
                    )}
                    <div className="relative aspect-square">
                      <img src={photo.afterImage || photo.image} alt={photo.caption || `${trainer.name} transformation ${index + 1}`} className="h-full w-full object-cover" />
                      <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">After</span>
                    </div>
                  </div>
                  <p className="min-h-16 px-4 py-3 text-sm leading-6 text-slate-300">{photo.caption || 'Client transformation'}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Packages + Inquiry Form */}
        <div id="packages" className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionTitle title="Training packages" description="Choose a package that fits your goal and budget." />
            <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-semibold text-white">Not ready for a package?</p>
              <p className="mt-1 text-xs leading-6 text-slate-400">Send a free inquiry and ask for a trial session, schedule fit, or custom monthly plan. Estimated monthly cost starts around {money(monthlyPrice)} if sessions are weekly.</p>
            </div>
            <div className="grid gap-4">
              {protocols.map((protocol) => {
                const protocolMonthly = Math.round(Number(String(protocol.price || 0).replace(/,/g, '')));
                const isSelected = selectedPackage?.id === protocol.id;
                return (
                  <article key={protocol.id} className={`rounded-2xl border p-5 transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-slate-700/50 bg-surface'}`}>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white">{protocol.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">{protocol.duration}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{money(protocol.price)}</p>
                        <p className="text-xs text-slate-500">{protocolMonthly >= 1000 ? `~PKR ${protocolMonthly.toLocaleString()}/mo` : ''}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{protocol.description}</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {protocol.features?.map((feature: string) => (
                        <div key={feature} className="flex gap-2 text-sm text-slate-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {feature}</div>
                      ))}
                    </div>
                    <button
                      onClick={() => { setSelectedPackage(protocol); setInquiryStatus('idle'); }}
                      className={`mt-5 w-full rounded-xl py-3 text-sm font-bold transition-colors ${isSelected ? 'bg-primary text-white' : 'border border-slate-700/50 bg-surface-high text-white hover:border-primary'}`}
                    >
                      {isSelected ? 'Selected' : 'Select package'}
                    </button>
                  </article>
                );
              })}
            </div>

            {protocols.length === 0 && (
              <EmptyState title="No packages listed yet" description="This trainer hasn't added packages. You can still send a free inquiry." />
            )}
          </div>

          {/* Inquiry Form */}
          <div id="inquiry" className="h-fit scroll-mt-24 lg:sticky lg:top-24">
            <Surface className="p-6">
              <h2 className="text-xl font-bold text-white">Book a free trial inquiry</h2>
              <p className="mt-2 text-sm text-slate-400">Ask {trainer.name} about availability, trial session, monthly pricing, and training mode. No payment required to reach out.</p>

              {inquiryStatus === 'success' ? (
                <div className="mt-6 rounded-xl border border-success/30 bg-success/10 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
                  <h3 className="mt-4 text-lg font-semibold text-white">Inquiry sent!</h3>
                  <p className="mt-2 text-sm text-slate-400">{trainer.name} will review your request and respond within {trainer.responseTimeHours || 24} hours.</p>
                  <Link to="/client/dashboard" className="mt-5 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark">View my inquiries</Link>
                </div>
              ) : !clientSession ? (
                <div className="mt-6 rounded-xl border border-slate-700/50 bg-surface-high/50 p-6">
                  <h3 className="font-semibold text-white">Login to send inquiry</h3>
                  <p className="mt-2 text-sm text-slate-400">Create a free account so the trainer can respond to you directly through Liftrz.</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link to="/login/client" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark">Login</Link>
                    <Link to="/register/client" className="rounded-xl border border-slate-700/50 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-surface-high">Create account</Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={submitInquiry} className="mt-5 grid gap-4">
                  {selectedPackage && (
                    <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                      <p className="text-xs font-medium text-primary">Interested in: {selectedPackage.title}</p>
                      <p className="text-xs text-slate-400">{money(selectedPackage.price)} - {selectedPackage.duration}</p>
                    </div>
                  )}
                  <Input label="Your name" value={inquiryForm.name} onChange={(value) => setInquiryForm({ ...inquiryForm, name: value })} />
                  <Input label="Email" type="email" value={inquiryForm.email} onChange={(value) => setInquiryForm({ ...inquiryForm, email: value })} />
                  <Input label="Phone / WhatsApp" value={inquiryForm.phone} onChange={(value) => setInquiryForm({ ...inquiryForm, phone: value })} />
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-slate-500">Your goal</span>
                    <select value={inquiryForm.goal} onChange={(e) => setInquiryForm({ ...inquiryForm, goal: e.target.value })} className="rounded-xl border border-slate-700/50 bg-surface-high p-3.5 text-sm text-white outline-none">
                      <option value="">Select a goal</option>
                      <option>Lose weight</option>
                      <option>Build muscle</option>
                      <option>Strength training</option>
                      <option>Wedding prep</option>
                      <option>Rehab / Recovery</option>
                      <option>Yoga / Flexibility</option>
                      <option>General fitness</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-slate-500">Message to {trainer.name}</span>
                    <textarea
                      rows={4}
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                      placeholder={`Hi ${trainer.name}, I'm looking for a trainer in ${trainer.city} to help me...`}
                      className="rounded-xl border border-slate-700/50 bg-surface-high p-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                    />
                  </label>

                  {/* Buddy training toggle */}
                  <div className="rounded-xl border border-slate-700/50 bg-surface-high/50 p-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={buddyMode}
                        onChange={(e) => setBuddyMode(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 bg-surface-high text-primary"
                      />
                      <div>
                        <p className="text-sm font-semibold text-white">Buddy training</p>
                        <p className="text-xs text-slate-400">Train with a friend and save 5% each</p>
                      </div>
                    </label>
                    {buddyMode && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Input label="Buddy name" value={buddyInfo.name} onChange={(value) => setBuddyInfo({ ...buddyInfo, name: value })} />
                        <Input label="Buddy phone" value={buddyInfo.phone} onChange={(value) => setBuddyInfo({ ...buddyInfo, phone: value })} />
                      </div>
                    )}
                  </div>

                  <button
                    disabled={inquiryStatus === 'loading'}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                  >
                    {inquiryStatus === 'loading' ? 'Sending...' : buddyMode ? 'Send buddy inquiry' : 'Send free inquiry'}
                  </button>
                  <p className="text-center text-xs text-slate-500">No payment required. Trainer contact stays protected until you both agree to book.</p>
                </form>
              )}
            </Surface>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <StepCard number="1" title="Send inquiry" description="Tell the trainer about your goals, schedule, and budget. Completely free." />
          <StepCard number="2" title="Chat & agree" description="The trainer responds with a personalized package. Discuss details through Liftrz." />
          <StepCard number="3" title="Pay & start" description="Pay through Liftrz. Admin verifies, then your trainer's contact unlocks." />
        </div>

        {/* Write a Review */}
        {clientSession && (
          <section className="mt-14">
            <SectionTitle title="Write a review" description="Share your experience to help others find the right trainer." />
            {reviewStatus === 'success' ? (
              <div className="rounded-xl border border-success/30 bg-success/10 p-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
                <h3 className="mt-4 text-lg font-semibold text-white">Review submitted!</h3>
                <p className="mt-2 text-sm text-slate-400">Thank you for sharing your experience with {trainer.name}.</p>
              </div>
            ) : (
              <form onSubmit={submitReview} className="rounded-2xl border border-slate-700/50 bg-surface p-6">
                <div className="grid gap-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500">Rating</span>
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="p-1"
                        >
                          <Star className={`h-6 w-6 ${star <= reviewForm.rating ? 'fill-primary text-primary' : 'text-slate-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-slate-500">Your review</span>
                    <textarea
                      rows={4}
                      value={reviewForm.text}
                      onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                      placeholder={`How was your experience training with ${trainer.name}? What did you like? What could improve?`}
                      className="rounded-xl border border-slate-700/50 bg-surface-high p-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                      required
                    />
                  </label>
                  <button
                    disabled={reviewStatus === 'loading'}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                  >
                    {reviewStatus === 'loading' ? 'Submitting...' : 'Submit review'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* Reviews */}
        <section className="mt-14">
          <SectionTitle title={`Reviews (${reviews.length})`} description="Only clients who completed training can leave reviews." />
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <div key={review.id}>
                <Surface className="p-5">
                  <div className="mb-3 flex justify-between gap-3">
                    <h3 className="font-semibold text-white">{review.clientName}</h3>
                    <span className="flex gap-0.5 text-primary">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="h-4 w-4 fill-primary" />)}</span>
                  </div>
                  <p className="text-sm leading-7 text-slate-400">{review.text}</p>
                  {review.verifiedBooking && <p className="mt-4 text-xs font-semibold text-success">Verified booking</p>}
                </Surface>
              </div>
            ))}
          </div>
        </section>
      </PageContainer>
      <div className="fixed inset-x-0 bottom-20 z-40 border-t border-slate-700/50 bg-background/95 p-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-xl gap-2">
          <a href="#inquiry" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white">
            <MessageCircle className="h-4 w-4" /> Send inquiry
          </a>
          <a href="#packages" className="flex items-center justify-center rounded-xl border border-slate-700/50 px-4 py-3 text-sm font-semibold text-slate-300">
            Packages
          </a>
        </div>
      </div>
    </PageShell>
  );
}

function TrustTile({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <Surface className="p-4">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
    </Surface>
  );
}

function TrustBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
      <CheckCircle2 className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function ShareButton({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-surface-high px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-primary hover:text-primary">
      {label}
    </a>
  );
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-surface-high px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-primary hover:text-primary">
      <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input required type={type} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-slate-700/50 bg-surface-high p-3.5 text-sm text-white outline-none placeholder:text-slate-600" />
    </label>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-surface p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{number}</div>
      <h3 className="mt-3 text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/30 bg-surface/50 py-12 text-center">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
  );
}
