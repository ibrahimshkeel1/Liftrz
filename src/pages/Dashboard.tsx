import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Banknote, CheckCircle2, Clock, Copy, Eye, ImageIcon, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import SEO from '../components/SEO';
import { useSession } from '../utils/session';
import BookingChatPanel from '../components/BookingChatPanel';
import EmptyState from '../components/EmptyState';
import { SkeletonDashboard } from '../components/Skeleton';
import { HeroBlock, MetricCard, PageContainer, PageShell, Surface } from '../components/premium';
import { getAreasForCity } from '../utils/areas';

const money = (value: number) => `PKR ${Number(value || 0).toLocaleString()}`;
const clientGenderOptions = ['Male', 'Female'];
const paymentAccount = {
  bankName: 'nayapay',
  accountNumber: '03214026075',
  accountName: 'ibrahim shakeel'
};

export default function Dashboard() {
  const session = useSession();
  const trainerId = session?.user.trainerId || '';
  const [stats, setStats] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');
  const [actionError, setActionError] = useState('');
  const [selectedChatId, setSelectedChatId] = useState('');
  const [payoutTab, setPayoutTab] = useState<'pending' | 'paid'>('pending');
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [featuredPlacement, setFeaturedPlacement] = useState('home');
  const [featuredNote, setFeaturedNote] = useState('');
  const [featuredReceiptImage, setFeaturedReceiptImage] = useState('');
  const [uploadingFeaturedReceipt, setUploadingFeaturedReceipt] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});
  const [savingSection, setSavingSection] = useState('');
  const [uploadingField, setUploadingField] = useState('');

  const load = async () => {
    if (!trainerId) return;
    try {
      setError('');
      const [trainerData, statsData, bookingsData, leadsData, payoutsData, protocolsData] = await Promise.all([
        api.getTrainer(trainerId),
        api.getTrainerStats(trainerId),
        api.getTrainerBookings(trainerId),
        api.getLeads(trainerId),
        api.getTrainerPayouts(trainerId),
        api.getProtocols(trainerId)
      ]);
      setTrainer(trainerData);
      setStats(statsData);
      setBookings(bookingsData);
      setLeads(leadsData);
      setPayouts(payoutsData);
      setProtocols(protocolsData);
      setFeaturedPlacement(trainerData.featuredPlacement || 'home');
      setFeaturedNote(trainerData.featuredNote || '');
      setFeaturedReceiptImage(trainerData.featuredReceiptImage || '');
      setProfileForm({
        bio: trainerData.bio || '',
        price: trainerData.price || '',
        capacity: trainerData.capacity || '',
        image: trainerData.image || '',
        name: trainerData.name || '',
        headline: trainerData.headline || 'Personal Trainer',
        city: trainerData.city || '',
        area: trainerData.area || '',
        gender: trainerData.gender || '',
        clientGenders: Array.isArray(trainerData.clientGenders) ? trainerData.clientGenders : ['Male', 'Female'],
        clientAgeMin: trainerData.clientAgeMin || '',
        clientAgeMax: trainerData.clientAgeMax || '',
        languages: Array.isArray(trainerData.languages) ? trainerData.languages.join(', ') : '',
        goals: trainerData.goals || [],
        serviceModes: trainerData.serviceModes || [],
        availableDays: trainerData.availableDays || [],
        availableTimeSlots: trainerData.availableTimeSlots || '',
        homeVisitAreas: trainerData.homeVisitAreas || '',
        availabilityNote: trainerData.availabilityNote || '',
        profileGallery: trainerData.profileGallery || [],
        cnicNumber: trainerData.cnicNumber || '',
        cnicFrontImage: trainerData.cnicFrontImage || '',
        cnicBackImage: trainerData.cnicBackImage || '',
        bankName: trainerData.bankName || '',
        bankAccountNumber: trainerData.bankAccountNumber || '',
        accountTitle: trainerData.accountTitle || '',
        payoutMethod: trainerData.payoutMethod || 'Bank Transfer',
        certifications: Array.isArray(trainerData.certifications) ? trainerData.certifications.join(', ') : '',
        certificationDocs: trainerData.certificationDocs || [],
        transformationImages: trainerData.transformationImages || [],
        transformations: trainerData.transformations || [],
        reviewMessages: trainerData.reviewMessages || []
      });
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

  const handleFeaturedReceiptUpload = async (file: File) => {
    setUploadingFeaturedReceipt(true);
    setActionError('');
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const upload = await api.uploadFile({
          bucket: 'Liftrz-private',
          folder: 'featured',
          fileName: `featured-${trainerId}-${Date.now()}.${file.name.split('.').pop()}`,
          dataUrl: reader.result as string
        });
        setFeaturedReceiptImage(upload.url);
        setUploadingFeaturedReceipt(false);
      };
    } catch (err) {
      setUploadingFeaturedReceipt(false);
      setActionError(err instanceof Error ? err.message : 'Failed to upload featured payment receipt');
    }
  };

  const requestFeaturedPlacement = async () => {
    setActionId('featured-request');
    setActionError('');
    try {
      await api.requestFeaturedPlacement(trainerId, {
        featuredPlacement,
        featuredNote,
        featuredReceiptImage
      });
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to request featured placement');
    } finally {
      setActionId('');
    }
  };

  const saveProfileSection = async (section: string, patch: any) => {
    setSavingSection(section);
    setActionError('');
    try {
      await api.updateTrainerProfile(trainerId, patch);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save profile section');
    } finally {
      setSavingSection('');
    }
  };

  const uploadToProfile = async (field: string, file: File) => {
    setUploadingField(field);
    setActionError('');
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const upload = await api.uploadFile({
          bucket: 'Liftrz-private',
          folder: 'trainer-profile',
          fileName: `${field}-${trainerId}-${Date.now()}.${file.name.split('.').pop()}`,
          dataUrl: reader.result as string
        });
        setProfileForm((current: any) => ({ ...current, [field]: upload.url }));
        setUploadingField('');
      };
    } catch (err) {
      setUploadingField('');
      setActionError(err instanceof Error ? err.message : 'Failed to upload file');
    }
  };

  const updateMediaItem = (key: 'profileGallery' | 'transformationImages', index: number, patch: any) => {
    const next = [...(profileForm[key] || [])];
    next[index] = { ...next[index], ...patch, status: 'pending_review' };
    setProfileForm({ ...profileForm, [key]: next });
  };

  const addProfileGalleryImage = () => {
    if ((profileForm.profileGallery || []).length >= 5) return;
    setProfileForm((current: any) => ({
      ...current,
      profileGallery: [
        ...(current.profileGallery || []),
        { image: '', caption: '', status: 'pending_review' }
      ]
    }));
  };

  const addTransformationImage = () => {
    if ((profileForm.transformationImages || []).length >= 10) return;
    setProfileForm((current: any) => ({
      ...current,
      transformationImages: [
        ...(current.transformationImages || []),
        { image: '', caption: '', status: 'pending_review' }
      ]
    }));
  };

  const toggleProfileList = (key: 'clientGenders', value: string) => {
    setProfileForm((current: any) => {
      const values = Array.isArray(current[key]) ? current[key] : [];
      return {
        ...current,
        [key]: values.includes(value)
          ? values.filter((item: string) => item !== value)
          : [...values, value]
      };
    });
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
  const canRequestFeatured = trainer.verificationStatus === 'approved' && trainer.profileStatus === 'live';
  const featuredActive = trainer.featuredStatus === 'approved' || trainer.featuredManual;
  const pendingProtocols = protocols.filter((protocol) => protocol.status === 'pending_review');
  const approvedProtocols = protocols.filter((protocol) => protocol.status === 'approved' || !protocol.status);

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Trainer Dashboard | Liftrz Pakistan"
          description="Trainer dashboard for client bookings, verified reviews, revenue, commission, payout tracking and response performance."
          canonical="https://liftrz.com/trainer/dashboard"
        />

        <HeroBlock
          kicker="Trainer command"
          title={trainer.name}
          description={`${trainer.city}, ${trainer.area} / ${trainer.verificationLevel}`}
          actions={<Link to={`/trainer/${trainer?.slug || trainerId}`} className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">Public profile</Link>}
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

        <Surface className="mt-8 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Profile checklist</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{profileChecklist(trainer, protocols).approved}/{profileChecklist(trainer, protocols).total} approved</h2>
              <p className="mt-1 text-sm text-slate-400">Your profile can go live after the core sections are approved. Rejected items can be changed and resubmitted.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {profileChecklist(trainer, protocols).items.map((item) => (
                <div key={item.label} className={`rounded-xl border px-3 py-2 text-xs ${item.done ? 'border-success/30 bg-success/10 text-success' : item.pending ? 'border-primary/30 bg-primary/10 text-primary' : 'border-slate-700/50 bg-surface-high text-slate-400'}`}>
                  {item.label}: {item.done ? 'approved' : item.pending ? 'pending' : 'needed'}
                </div>
              ))}
            </div>
          </div>
          {Array.isArray(trainer.reviewMessages) && trainer.reviewMessages.length > 0 && (
            <div className="mt-4 grid gap-2">
              {trainer.reviewMessages.slice(-3).map((message: any) => (
                <div key={message.id} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  <strong>{message.section}</strong>: {message.note}
                </div>
              ))}
            </div>
          )}
        </Surface>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <Panel title="Basic profile">
            <div className="grid gap-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" value={profileForm.name || ''} onChange={(value) => setProfileForm({ ...profileForm, name: value })} />
                <Input label="Card headline" value={profileForm.headline || ''} onChange={(value) => setProfileForm({ ...profileForm, headline: value })} placeholder="Personal Trainer" />
                <Input label="City" value={profileForm.city || ''} onChange={(value) => setProfileForm({ ...profileForm, city: value })} />
                <Input label="Area" value={profileForm.area || ''} onChange={(value) => setProfileForm({ ...profileForm, area: value })} suggestions={getAreasForCity(profileForm.city || '')} />
                <Input label="Trainer gender" value={profileForm.gender || ''} onChange={(value) => setProfileForm({ ...profileForm, gender: value })} />
                <Input label="Languages" value={profileForm.languages || ''} onChange={(value) => setProfileForm({ ...profileForm, languages: value })} placeholder="Urdu, English" />
                <Input label="Specialties" value={(profileForm.goals || []).join(', ')} onChange={(value) => setProfileForm({ ...profileForm, goals: value.split(',').map((item) => item.trim()).filter(Boolean), specialty: value.split(',')[0]?.trim() || trainer.specialty })} />
                <Input label="Service modes" value={(profileForm.serviceModes || []).join(', ')} onChange={(value) => setProfileForm({ ...profileForm, serviceModes: value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Gym, Home Visit, Online" />
              </div>
              <MultiChoice label="Client genders you train" items={clientGenderOptions} values={profileForm.clientGenders || []} onToggle={(item) => toggleProfileList('clientGenders', item)} helper="Select both if you train male and female clients." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Minimum client age" value={profileForm.clientAgeMin || ''} onChange={(value) => setProfileForm({ ...profileForm, clientAgeMin: value.replace(/\D/g, '') })} placeholder="18" />
                <Input label="Maximum client age" value={profileForm.clientAgeMax || ''} onChange={(value) => setProfileForm({ ...profileForm, clientAgeMax: value.replace(/\D/g, '') })} placeholder="65" />
              </div>
              <button onClick={() => saveProfileSection('basic', {
                name: profileForm.name,
                headline: profileForm.headline || 'Personal Trainer',
                city: profileForm.city,
                location: profileForm.city,
                area: profileForm.area,
                gender: profileForm.gender,
                clientGenders: profileForm.clientGenders,
                clientAgeMin: profileForm.clientAgeMin,
                clientAgeMax: profileForm.clientAgeMax,
                languages: String(profileForm.languages || '').split(',').map((item) => item.trim()).filter(Boolean),
                goals: profileForm.goals,
                specialty: profileForm.specialty || profileForm.goals?.[0] || trainer.specialty,
                serviceModes: profileForm.serviceModes
              })} disabled={savingSection === 'basic'} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                {savingSection === 'basic' ? 'Saving...' : 'Save basic profile'}
              </button>
            </div>
          </Panel>

          <Panel title="Availability">
            <div className="grid gap-4 p-5">
              <Input label="Available days" value={(profileForm.availableDays || []).join(', ')} onChange={(value) => setProfileForm({ ...profileForm, availableDays: value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Mon, Tue, Wed, Sat" />
              <Input label="Time slots" value={profileForm.availableTimeSlots || ''} onChange={(value) => setProfileForm({ ...profileForm, availableTimeSlots: value })} placeholder="6-9am, 6-10pm" />
              <Input label="Home visit areas" value={profileForm.homeVisitAreas || ''} onChange={(value) => setProfileForm({ ...profileForm, homeVisitAreas: value })} placeholder="DHA, Gulberg, Clifton" />
              <TextArea label="Availability note" rows={3} value={profileForm.availabilityNote || ''} onChange={(value) => setProfileForm({ ...profileForm, availabilityNote: value })} placeholder="Online slots available on weekends, home visits only near DHA..." />
              <button onClick={() => saveProfileSection('availability', {
                availableDays: profileForm.availableDays,
                availableTimeSlots: profileForm.availableTimeSlots,
                homeVisitAreas: profileForm.homeVisitAreas,
                availabilityNote: profileForm.availabilityNote
              })} disabled={savingSection === 'availability'} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                {savingSection === 'availability' ? 'Saving...' : 'Save availability'}
              </button>
            </div>
          </Panel>

          <Panel title="Verification">
            <div className="grid gap-4 p-5">
              <StatusNote status={trainer.identityStatus} />
              <Input label="CNIC number" value={profileForm.cnicNumber || ''} onChange={(value) => setProfileForm({ ...profileForm, cnicNumber: value })} placeholder="35202-XXXXXXX-X" />
              <div className="grid gap-3 sm:grid-cols-2">
                <UploadBox label="CNIC front picture" value={profileForm.cnicFrontImage} field="cnicFrontImage" uploadingField={uploadingField} onUpload={uploadToProfile} />
                <UploadBox label="CNIC back picture" value={profileForm.cnicBackImage} field="cnicBackImage" uploadingField={uploadingField} onUpload={uploadToProfile} />
              </div>
              <button onClick={() => saveProfileSection('identity', {
                cnicNumber: profileForm.cnicNumber,
                cnicFrontImage: profileForm.cnicFrontImage,
                cnicBackImage: profileForm.cnicBackImage
              })} disabled={savingSection === 'identity'} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                {savingSection === 'identity' ? 'Submitting...' : 'Submit verification'}
              </button>
            </div>
          </Panel>

          <Panel title="Payout details">
            <div className="grid gap-4 p-5">
              <StatusNote status={trainer.payoutStatus} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Bank name" value={profileForm.bankName || ''} onChange={(value) => setProfileForm({ ...profileForm, bankName: value })} placeholder="HBL, Meezan, UBL" />
                <Input label="Account title" value={profileForm.accountTitle || ''} onChange={(value) => setProfileForm({ ...profileForm, accountTitle: value })} placeholder="Your account title" />
                <Input label="Account / IBAN number" value={profileForm.bankAccountNumber || ''} onChange={(value) => setProfileForm({ ...profileForm, bankAccountNumber: value })} placeholder="PK..." />
                <label className="grid gap-2">
                  <span className="text-xs font-medium text-slate-500">Payout method</span>
                  <select value={profileForm.payoutMethod || 'Bank Transfer'} onChange={(e) => setProfileForm({ ...profileForm, payoutMethod: e.target.value })} className="rounded-xl border border-slate-700/50 bg-surface-high px-4 py-3 text-sm text-white">
                    <option>Bank Transfer</option>
                    <option>JazzCash</option>
                    <option>EasyPaisa</option>
                  </select>
                </label>
              </div>
              <button onClick={() => saveProfileSection('payout', {
                bankName: profileForm.bankName,
                accountTitle: profileForm.accountTitle,
                bankAccountNumber: profileForm.bankAccountNumber,
                payoutMethod: profileForm.payoutMethod,
                payoutAccount: profileForm.bankAccountNumber
              })} disabled={savingSection === 'payout'} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                {savingSection === 'payout' ? 'Submitting...' : 'Submit payout details'}
              </button>
            </div>
          </Panel>

          <Panel title="Profile picture">
            <div className="grid gap-4 p-5">
              <StatusNote status={trainer.profileAssetsStatus} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Starting session price" value={profileForm.price || ''} onChange={(value) => setProfileForm({ ...profileForm, price: value })} placeholder="3000" />
                <Input label="Open client slots" value={profileForm.capacity || ''} onChange={(value) => setProfileForm({ ...profileForm, capacity: value })} placeholder="3" />
                <UploadBox label="Profile picture" value={profileForm.image} field="image" uploadingField={uploadingField} onUpload={uploadToProfile} />
              </div>
              <TextArea label="Profile bio" rows={4} value={profileForm.bio || ''} onChange={(value) => setProfileForm({ ...profileForm, bio: value })} placeholder="Example: Certified personal trainer with 5+ years of experience in strength training and fat loss. Based in DHA Lahore, offering gym and home visit sessions. Specializing in wedding prep, muscle gain, and beginner fitness." />
              <button onClick={() => saveProfileSection('profile', {
                bio: profileForm.bio,
                price: profileForm.price,
                capacity: profileForm.capacity,
                image: profileForm.image
              })} disabled={savingSection === 'profile'} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                {savingSection === 'profile' ? 'Submitting...' : 'Submit profile picture'}
              </button>
            </div>
          </Panel>

          <Panel title="Profile gallery">
            <div className="grid gap-4 p-5">
              <StatusNote status={trainer.profileAssetsStatus} label="Gallery approval" />
              <p className="text-xs text-slate-400">Upload up to 5 extra profile photos. Every photo needs a caption and admin approval.</p>
              <button type="button" disabled={(profileForm.profileGallery || []).length >= 5} onClick={addProfileGalleryImage} className="rounded-xl border border-slate-700/50 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-surface-high disabled:opacity-50">Add gallery photo ({(profileForm.profileGallery || []).length}/5)</button>
              {(profileForm.profileGallery || []).map((item: any, index: number) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-slate-700/50 bg-surface-high/40 p-4">
                  <UploadBox label={`Gallery photo ${index + 1}`} value={item.image} field={`profileGallery-${index}`} uploadingField={uploadingField} onUpload={async (_field, file) => {
                    setUploadingField(`profileGallery-${index}`);
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = async () => {
                      const upload = await api.uploadFile({ bucket: 'Liftrz-private', folder: 'trainer-gallery', fileName: `gallery-${trainerId}-${Date.now()}.${file.name.split('.').pop()}`, dataUrl: reader.result as string });
                      updateMediaItem('profileGallery', index, { image: upload.url });
                      setUploadingField('');
                    };
                  }} />
                  <Input label="Caption" value={item.caption || ''} onChange={(value) => updateMediaItem('profileGallery', index, { caption: value })} placeholder="Training setup, gym floor, coaching style..." />
                  <MediaStatus item={item} />
                </div>
              ))}
              <button onClick={() => saveProfileSection('gallery', {
                profileGallery: (profileForm.profileGallery || []).slice(0, 5)
              })} disabled={savingSection === 'gallery'} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                {savingSection === 'gallery' ? 'Submitting...' : 'Submit gallery photos'}
              </button>
            </div>
          </Panel>

          <Panel title="Client transformations">
            <div className="grid gap-4 p-5">
              <StatusNote status={trainer.profileAssetsStatus} label="Transformation approval" />
              <p className="text-xs text-slate-400">Upload up to 10 client transformation pictures. Every picture needs a caption and client consent.</p>
              <button type="button" disabled={(profileForm.transformationImages || []).length >= 10} onClick={addTransformationImage} className="rounded-xl border border-slate-700/50 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-surface-high disabled:opacity-50">Add transformation photo ({(profileForm.transformationImages || []).length}/10)</button>
              {(profileForm.transformationImages || []).map((item: any, index: number) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-slate-700/50 bg-surface-high/40 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                  <UploadBox label={`Before photo ${index + 1}`} value={item.beforeImage} field={`transformationBefore-${index}`} uploadingField={uploadingField} onUpload={async (_field, file) => {
                    setUploadingField(`transformationBefore-${index}`);
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = async () => {
                      const upload = await api.uploadFile({ bucket: 'Liftrz-private', folder: 'trainer-transformations', fileName: `transformation-before-${trainerId}-${Date.now()}.${file.name.split('.').pop()}`, dataUrl: reader.result as string });
                      updateMediaItem('transformationImages', index, { beforeImage: upload.url });
                      setUploadingField('');
                    };
                  }} />
                  <UploadBox label={`After photo ${index + 1}`} value={item.afterImage || item.image} field={`transformationAfter-${index}`} uploadingField={uploadingField} onUpload={async (_field, file) => {
                    setUploadingField(`transformationAfter-${index}`);
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = async () => {
                      const upload = await api.uploadFile({ bucket: 'Liftrz-private', folder: 'trainer-transformations', fileName: `transformation-after-${trainerId}-${Date.now()}.${file.name.split('.').pop()}`, dataUrl: reader.result as string });
                      updateMediaItem('transformationImages', index, { afterImage: upload.url, image: upload.url });
                      setUploadingField('');
                    };
                  }} />
                  </div>
                  <Input label="Caption" value={item.caption || ''} onChange={(value) => updateMediaItem('transformationImages', index, { caption: value })} placeholder="12kg fat loss in 16 weeks, strength progress..." />
                  <MediaStatus item={item} />
                </div>
              ))}
              <button onClick={() => saveProfileSection('transformations', {
                transformationImages: (profileForm.transformationImages || []).slice(0, 10)
              })} disabled={savingSection === 'transformations'} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                {savingSection === 'transformations' ? 'Submitting...' : 'Submit transformation photos'}
              </button>
            </div>
          </Panel>

          <Panel title="Packages and certificates">
            <div className="grid gap-4 p-5">
              <StatusNote status={trainer.packagesStatus} label="Package approval" />
              <div className="rounded-2xl border border-slate-700/50 bg-surface-high/50 p-4">
                <p className="text-sm font-semibold text-white">{approvedProtocols.length} approved packages / {pendingProtocols.length} pending</p>
                <p className="mt-2 text-xs leading-6 text-slate-400">Create or change packages from the package builder. New packages appear after admin approval.</p>
                <Link to="/lab" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">Manage packages</Link>
              </div>
              <StatusNote status={trainer.certificationsStatus} label="Certification approval" />
              <TextArea label="Certificates" rows={3} value={profileForm.certifications || ''} onChange={(value) => setProfileForm({ ...profileForm, certifications: value })} placeholder="ACE, ISSA, NASM, gym employment, nutrition course" />
              <button type="button" onClick={() => setProfileForm({ ...profileForm, certificationDocs: [...(profileForm.certificationDocs || []), { image: '', caption: '', status: 'pending_review' }] })} className="rounded-xl border border-slate-700/50 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-surface-high">
                Add certificate picture
              </button>
              {(profileForm.certificationDocs || []).map((item: any, index: number) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-slate-700/50 bg-surface-high/40 p-4">
                  <UploadBox label={`Certificate ${index + 1}`} value={item.image || item.url} field={`certificationDocs-${index}`} uploadingField={uploadingField} onUpload={async (_field, file) => {
                    setUploadingField(`certificationDocs-${index}`);
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = async () => {
                      const upload = await api.uploadFile({ bucket: 'Liftrz-private', folder: 'trainer-certificates', fileName: `certificate-${trainerId}-${Date.now()}.${file.name.split('.').pop()}`, dataUrl: reader.result as string });
                      const next = [...(profileForm.certificationDocs || [])];
                      next[index] = { ...next[index], image: upload.url, caption: next[index]?.caption || '', status: 'pending_review' };
                      setProfileForm({ ...profileForm, certificationDocs: next });
                      setUploadingField('');
                    };
                  }} />
                  <Input label="Caption" value={item.caption || ''} onChange={(value) => {
                    const next = [...(profileForm.certificationDocs || [])];
                    next[index] = { ...next[index], caption: value, status: 'pending_review' };
                    setProfileForm({ ...profileForm, certificationDocs: next });
                  }} placeholder="Certificate name, issuing body, year" />
                  <MediaStatus item={item} />
                </div>
              ))}
              <button onClick={() => saveProfileSection('certifications', {
                certifications: String(profileForm.certifications || '').split(',').map((item) => item.trim()).filter(Boolean),
                certificationDocs: profileForm.certificationDocs || []
              })} disabled={savingSection === 'certifications'} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                {savingSection === 'certifications' ? 'Submitting...' : 'Submit certificates'}
              </button>
            </div>
          </Panel>
        </div>

        <div className="mt-8">
          <Panel title="Paid featured placement">
            <div className="grid gap-5 p-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-2xl border border-slate-700/50 bg-surface-high/50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Current status</p>
                <h3 className="mt-3 text-2xl font-bold text-white">{featuredActive ? 'Featured' : trainer.featuredStatus === 'requested' ? 'Awaiting approval' : 'Not featured'}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Paid placements go live only after admin checks your payment proof. Admin can also feature a trainer manually from the owner backend.
                </p>
                <div className="mt-4 grid gap-2 text-xs text-slate-400">
                  <p>Status: <span className="font-semibold text-white">{trainer.featuredStatus || 'none'}</span></p>
                  <p>Payment: <span className="font-semibold text-white">{trainer.featuredPaymentStatus || 'not_required'}</span></p>
                  {trainer.featuredUntil && <p>Until: <span className="font-semibold text-white">{new Date(trainer.featuredUntil).toLocaleDateString()}</span></p>}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-2 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
                  <p className="text-sm font-semibold text-white">Featured placement payment account</p>
                  <p className="text-slate-300">Bank name: <span className="font-semibold text-white">{paymentAccount.bankName}</span></p>
                  <p className="text-slate-300">Account no: <span className="font-semibold text-white">{paymentAccount.accountNumber}</span></p>
                  <p className="text-slate-300">Account name: <span className="font-semibold text-white">{paymentAccount.accountName}</span></p>
                  <button type="button" onClick={() => navigator.clipboard.writeText(`${paymentAccount.bankName} / ${paymentAccount.accountNumber} / ${paymentAccount.accountName}`)} className="mt-2 inline-flex w-fit items-center gap-2 rounded-lg border border-primary/40 px-3 py-2 text-xs font-semibold text-primary">
                    <Copy className="h-3.5 w-3.5" /> Copy account details
                  </button>
                </div>
                <label className="grid gap-2 text-xs font-semibold text-slate-400">
                  Placement
                  <select value={featuredPlacement} onChange={(e) => setFeaturedPlacement(e.target.value)} className="rounded-xl border border-slate-700/50 bg-surface-high px-4 py-3 text-sm text-white">
                    <option value="home">Home page</option>
                    <option value="discover">Discover page</option>
                    <option value="all">Home and Discover</option>
                  </select>
                </label>
                <label className="grid gap-2 text-xs font-semibold text-slate-400">
                  Payment note or transaction reference
                  <textarea value={featuredNote} onChange={(e) => setFeaturedNote(e.target.value)} rows={3} className="rounded-xl border border-slate-700/50 bg-surface-high px-4 py-3 text-sm text-white outline-none" placeholder="Nayapay transaction/reference ID, package duration, or admin note" />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-700/70 bg-surface-high/60 px-4 py-3 text-sm text-slate-300">
                  <span>{featuredReceiptImage ? 'Receipt uploaded' : uploadingFeaturedReceipt ? 'Uploading receipt...' : 'Upload payment receipt'}</span>
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFeaturedReceiptUpload(file); }} />
                </label>
                <button disabled={!canRequestFeatured || actionId === 'featured-request' || uploadingFeaturedReceipt} onClick={requestFeaturedPlacement} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                  {!canRequestFeatured ? 'Approval required first' : actionId === 'featured-request' ? 'Submitting...' : 'Request paid feature'}
                </button>
              </div>
            </div>
          </Panel>
        </div>

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

function StatusNote({ status, label = 'Approval status' }: { status?: string; label?: string }) {
  const approved = status === 'approved';
  const pending = status === 'pending_review';
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${approved ? 'border-success/30 bg-success/10 text-success' : pending ? 'border-primary/30 bg-primary/10 text-primary' : 'border-slate-700/50 bg-surface-high/50 text-slate-400'}`}>
      <p className="font-semibold">{label}: {approved ? 'Approved / verified' : pending ? 'Submitted, approval within 24hr' : 'Not submitted'}</p>
      {!approved && <p className="mt-1 text-xs opacity-80">You can change and resubmit this section any time.</p>}
    </div>
  );
}

function Input({ label, value, onChange, placeholder = '', suggestions }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; suggestions?: string[] }) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} list={suggestions ? `${id}-list` : undefined} className="rounded-xl border border-slate-700/50 bg-surface-high px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
      {suggestions && (
        <datalist id={`${id}-list`}>
          {suggestions.map((s) => <option key={s} value={s} />)}
        </datalist>
      )}
    </label>
  );
}

function TextArea({ label, value, onChange, rows, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; rows: number; placeholder?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl border border-slate-700/50 bg-surface-high px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
    </label>
  );
}

function MultiChoice({ label, items, values, onToggle, helper = '' }: { label: string; items: string[]; values: string[]; onToggle: (item: string) => void; helper?: string }) {
  return (
    <div className="grid gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => onToggle(item)}
            className={`rounded-full px-4 py-2 text-[11px] font-bold ${values.includes(item) ? 'bg-primary text-white' : 'border border-slate-700/50 bg-surface-high/80 text-slate-300'}`}
          >
            {item}
          </button>
        ))}
      </div>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

function UploadBox({ label, value, field, uploadingField, onUpload }: { label: string; value?: string; field: string; uploadingField: string; onUpload: (field: string, file: File) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-700/70 bg-surface-high/60 px-4 py-3 text-sm text-slate-300">
      <span>{value ? `${label} uploaded` : uploadingField === field ? 'Uploading...' : label}</span>
      <Upload className="h-4 w-4 text-primary" />
      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(field, file); }} />
    </label>
  );
}

function MediaStatus({ item }: { item: any }) {
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs ${item.status === 'approved' ? 'border-success/30 bg-success/10 text-success' : item.status === 'rejected' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-primary/30 bg-primary/10 text-primary'}`}>
      Status: {item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'rejected' : 'pending review'}
      {item.reviewNote && <p className="mt-1 text-slate-300">Admin note: {item.reviewNote}</p>}
    </div>
  );
}

function profileChecklist(trainer: any, protocols: any[]) {
  const items = [
    { label: 'CNIC', done: trainer.identityStatus === 'approved', pending: trainer.identityStatus === 'pending_review' },
    { label: 'Profile', done: trainer.profileAssetsStatus === 'approved', pending: trainer.profileAssetsStatus === 'pending_review' },
    { label: 'Gallery', done: (trainer.profileGallery || []).some((item: any) => item.status === 'approved'), pending: (trainer.profileGallery || []).some((item: any) => item.status === 'pending_review') },
    { label: 'Transformations', done: (trainer.transformationImages || []).some((item: any) => item.status === 'approved'), pending: (trainer.transformationImages || []).some((item: any) => item.status === 'pending_review') },
    { label: 'Packages', done: protocols.some((protocol) => protocol.status === 'approved' || !protocol.status), pending: protocols.some((protocol) => protocol.status === 'pending_review') },
    { label: 'Certificates', done: trainer.certificationsStatus === 'approved', pending: trainer.certificationsStatus === 'pending_review' },
    { label: 'Payout', done: trainer.payoutStatus === 'approved', pending: trainer.payoutStatus === 'pending_review' }
  ];
  return { items, approved: items.filter((item) => item.done).length, total: items.length };
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-4 border-b border-slate-700/50 px-5 py-5 last:border-b-0">{children}</div>;
}
