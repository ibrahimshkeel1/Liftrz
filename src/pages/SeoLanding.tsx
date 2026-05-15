import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MapPin, Search, ShieldCheck, Star } from 'lucide-react';
import SEO from '../components/SEO';
import { api } from '../utils/api';
import { HeroBlock, MetricCard, PageContainer, PageShell, SectionTitle, Surface } from '../components/premium';

const baseUrl = 'https://coachset-pakistan.vercel.app';

const pages: Record<string, {
  title: string;
  description: string;
  kicker: string;
  h1: string;
  city?: string;
  specialty?: string;
  gender?: string;
  mode?: string;
  areas: string[];
  faqs: Array<{ question: string; answer: string }>;
  related: Array<{ label: string; href: string }>;
}> = {
  '/personal-trainer-lahore': {
    title: 'Personal Trainer Lahore | Verified Fitness Coaches | CoachSet',
    description: 'Find verified personal trainers in Lahore for gym, home and online coaching. Compare PKR pricing, reviews, completed bookings and trainer availability.',
    kicker: 'Lahore trainer marketplace',
    h1: 'Book a verified personal trainer in Lahore',
    city: 'Lahore',
    areas: ['DHA', 'Gulberg', 'Model Town', 'Johar Town', 'Bahria Town'],
    faqs: [
      { question: 'How much does a personal trainer cost in Lahore?', answer: 'CoachSet lets clients compare session prices in PKR before booking. Prices vary by trainer experience, mode and package length.' },
      { question: 'Can I book a home personal trainer in Lahore?', answer: 'Yes. Use the Home Visit filter to find trainers who can train clients at home or in private spaces.' },
      { question: 'Are Lahore trainer reviews verified?', answer: 'Reviews are tied to bookings in the platform, so fake public reviews are reduced.' }
    ],
    related: [
      { label: 'Female personal trainer Lahore', href: '/female-personal-trainer-lahore' },
      { label: 'Online fitness coach Pakistan', href: '/online-fitness-coach-pakistan' },
      { label: 'Find all trainers', href: '/discover?city=Lahore' }
    ]
  },
  '/personal-trainer-karachi': {
    title: 'Personal Trainer Karachi | Home, Gym and Online Coaches | CoachSet',
    description: 'Compare verified personal trainers in Karachi by area, rating, price, gender, response time and training mode.',
    kicker: 'Karachi trainer marketplace',
    h1: 'Find a personal trainer in Karachi without guessing',
    city: 'Karachi',
    areas: ['Clifton', 'DHA', 'PECHS', 'Gulshan', 'North Nazimabad'],
    faqs: [
      { question: 'Can I compare Karachi trainers before paying?', answer: 'Yes. Discovery shows rating, clients, completed bookings, service mode and package price before you submit payment proof.' },
      { question: 'Does CoachSet support home trainers in Karachi?', answer: 'Yes. Many trainers can offer gym, home visit or online coaching depending on availability.' },
      { question: 'When does trainer contact unlock?', answer: 'Contact unlocks after admin verifies the payment receipt.' }
    ],
    related: [
      { label: 'Home personal trainer Karachi', href: '/home-personal-trainer-karachi' },
      { label: 'Personal trainer Lahore', href: '/personal-trainer-lahore' },
      { label: 'Find all trainers', href: '/discover?city=Karachi' }
    ]
  },
  '/personal-trainer-islamabad': {
    title: 'Personal Trainer Islamabad | Verified Coaches | CoachSet',
    description: 'Book verified personal trainers in Islamabad for fat loss, strength, muscle gain, rehab and online coaching.',
    kicker: 'Islamabad trainer marketplace',
    h1: 'Compare verified personal trainers in Islamabad',
    city: 'Islamabad',
    areas: ['F-6', 'F-7', 'F-8', 'F-11', 'Blue Area'],
    faqs: [
      { question: 'Can I find online and in-person trainers in Islamabad?', answer: 'Yes. CoachSet supports both location-based and online coaching options.' },
      { question: 'What should I check before booking?', answer: 'Check rating, completed bookings, response time, service mode, area and package details.' },
      { question: 'Is payment tracked?', answer: 'Yes. Payment proof is submitted inside the platform before trainer contact unlocks.' }
    ],
    related: [
      { label: 'Personal trainer Rawalpindi', href: '/personal-trainer-rawalpindi' },
      { label: 'Online fitness coach Pakistan', href: '/online-fitness-coach-pakistan' },
      { label: 'Find all trainers', href: '/discover?city=Islamabad' }
    ]
  },
  '/personal-trainer-rawalpindi': {
    title: 'Personal Trainer Rawalpindi | Verified Gym Trainers | CoachSet',
    description: 'Search verified personal trainers in Rawalpindi and nearby Islamabad areas with transparent prices and booking records.',
    kicker: 'Rawalpindi trainer marketplace',
    h1: 'Book verified personal trainers in Rawalpindi',
    city: 'Rawalpindi',
    areas: ['Bahria Town', 'Saddar', 'Satellite Town', 'PWD', 'Chaklala'],
    faqs: [
      { question: 'Can Rawalpindi clients book Islamabad trainers?', answer: 'Yes. Use nearby city filters and online coaching if the trainer can serve both areas.' },
      { question: 'Are trainers approved before they appear?', answer: 'Trainer profiles are reviewed before they are shown publicly in discovery.' },
      { question: 'Can I filter by budget?', answer: 'Yes. The discovery page includes a max-price slider in PKR.' }
    ],
    related: [
      { label: 'Personal trainer Islamabad', href: '/personal-trainer-islamabad' },
      { label: 'Find all trainers', href: '/discover?city=Rawalpindi' },
      { label: 'Register as trainer', href: '/register/trainer' }
    ]
  },
  '/personal-trainer-faisalabad': {
    title: 'Personal Trainer Faisalabad | Verified Fitness Coaches | CoachSet',
    description: 'Find verified personal trainers in Faisalabad for gym, home and online coaching. Compare PKR prices, reviews, training mode and availability.',
    kicker: 'Faisalabad trainer marketplace',
    h1: 'Book a verified personal trainer in Faisalabad',
    city: 'Faisalabad',
    areas: ['D Ground', 'Madina Town', 'People Colony', 'Susan Road', 'Canal Road'],
    faqs: [
      { question: 'Can I find verified trainers in Faisalabad?', answer: 'Yes. CoachSet supports Faisalabad in discovery and lets clients compare trainer profiles before booking.' },
      { question: 'Can Faisalabad trainers offer home visits?', answer: 'Use the Home Visit filter to find trainers who can train clients at home or private spaces.' },
      { question: 'How does payment verification work?', answer: 'Clients submit payment proof inside CoachSet. Contact unlocks after admin verifies the receipt.' }
    ],
    related: [
      { label: 'Personal trainer Lahore', href: '/personal-trainer-lahore' },
      { label: 'Online fitness coach Pakistan', href: '/online-fitness-coach-pakistan' },
      { label: 'Find Faisalabad trainers', href: '/discover?city=Faisalabad' }
    ]
  },
  '/personal-trainer-gujranwala': {
    title: 'Personal Trainer Gujranwala | Verified Gym Trainers | CoachSet',
    description: 'Search verified personal trainers in Gujranwala for strength, fat loss, muscle gain and online coaching with transparent PKR pricing.',
    kicker: 'Gujranwala trainer marketplace',
    h1: 'Find a verified personal trainer in Gujranwala',
    city: 'Gujranwala',
    areas: ['Model Town', 'Satellite Town', 'Wapda Town', 'DC Colony', 'Peoples Colony'],
    faqs: [
      { question: 'Does CoachSet list Gujranwala trainers?', answer: 'Yes. Gujranwala is available as a city filter and has a dedicated landing page for search visibility.' },
      { question: 'Can I compare trainer ratings?', answer: 'Yes. Discovery shows ratings, completed bookings, active clients, response time and package pricing.' },
      { question: 'Can trainers register from Gujranwala?', answer: 'Yes. Trainers can submit an application and go live after admin approval.' }
    ],
    related: [
      { label: 'Personal trainer Sialkot', href: '/personal-trainer-sialkot' },
      { label: 'Personal trainer Lahore', href: '/personal-trainer-lahore' },
      { label: 'Find Gujranwala trainers', href: '/discover?city=Gujranwala' }
    ]
  },
  '/personal-trainer-sialkot': {
    title: 'Personal Trainer Sialkot | Verified Fitness Coaches | CoachSet',
    description: 'Find verified personal trainers in Sialkot for gym, home visit and online coaching. Compare reviews, package prices and availability.',
    kicker: 'Sialkot trainer marketplace',
    h1: 'Book verified personal trainers in Sialkot',
    city: 'Sialkot',
    areas: ['Cantt', 'Daska Road', 'Paris Road', 'Kashmir Road', 'Model Town'],
    faqs: [
      { question: 'Can I book personal trainers in Sialkot?', answer: 'Yes. CoachSet includes Sialkot in city filters and search landing pages.' },
      { question: 'What trainer details should I compare?', answer: 'Compare rating, completed bookings, price, response time, service modes and profile verification.' },
      { question: 'Is online coaching available for Sialkot clients?', answer: 'Yes. Clients can choose local trainers or use online coaching from approved trainers across Pakistan.' }
    ],
    related: [
      { label: 'Personal trainer Gujranwala', href: '/personal-trainer-gujranwala' },
      { label: 'Online fitness coach Pakistan', href: '/online-fitness-coach-pakistan' },
      { label: 'Find Sialkot trainers', href: '/discover?city=Sialkot' }
    ]
  },
  '/online-fitness-coach-pakistan': {
    title: 'Online Fitness Coach Pakistan | Verified Online Trainers | CoachSet',
    description: 'Find online fitness coaches in Pakistan for fat loss, strength, muscle gain and habit-based coaching with verified reviews and payment tracking.',
    kicker: 'Online coaching Pakistan',
    h1: 'Hire an online fitness coach in Pakistan',
    city: 'Online',
    mode: 'Online',
    areas: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Gujranwala', 'Sialkot', 'Nationwide'],
    faqs: [
      { question: 'How does online fitness coaching work?', answer: 'You choose a package, submit payment proof, then the trainer shares the online coaching process after verification.' },
      { question: 'Can online trainers help with fat loss?', answer: 'Yes. Filter by fat loss, muscle gain, strength, rehab or athletic performance to match your goal.' },
      { question: 'Can I choose a trainer from another city?', answer: 'Yes. Online mode lets you work with approved trainers across Pakistan.' }
    ],
    related: [
      { label: 'Personal trainer Lahore', href: '/personal-trainer-lahore' },
      { label: 'Personal trainer Karachi', href: '/personal-trainer-karachi' },
      { label: 'Find online coaches', href: '/discover?city=Online&mode=Online' }
    ]
  },
  '/female-personal-trainer-lahore': {
    title: 'Female Personal Trainer Lahore | Verified Coaches | CoachSet',
    description: 'Find female personal trainers in Lahore for gym, home and online coaching. Compare reviews, prices, service modes and availability.',
    kicker: 'Female trainers Lahore',
    h1: 'Find a female personal trainer in Lahore',
    city: 'Lahore',
    gender: 'Female',
    areas: ['DHA', 'Gulberg', 'Model Town', 'Johar Town', 'Bahria Town'],
    faqs: [
      { question: 'Can I filter for female trainers?', answer: 'Yes. Discovery includes a gender filter so clients can find female trainers where available.' },
      { question: 'Can female trainers offer home visits?', answer: 'Some trainers offer home visits, depending on schedule, area and safety preferences.' },
      { question: 'Is contact shared publicly?', answer: 'No. Trainer contact stays locked until booking payment is verified.' }
    ],
    related: [
      { label: 'Personal trainer Lahore', href: '/personal-trainer-lahore' },
      { label: 'Online fitness coach Pakistan', href: '/online-fitness-coach-pakistan' },
      { label: 'Search female trainers', href: '/discover?city=Lahore&gender=Female' }
    ]
  },
  '/home-personal-trainer-karachi': {
    title: 'Home Personal Trainer Karachi | Verified Home Visit Trainers | CoachSet',
    description: 'Book home personal trainers in Karachi for strength, fat loss and general fitness. Compare verified trainers by area, rating and price.',
    kicker: 'Home trainer Karachi',
    h1: 'Book a home personal trainer in Karachi',
    city: 'Karachi',
    mode: 'Home Visit',
    areas: ['Clifton', 'DHA', 'PECHS', 'Gulshan', 'North Nazimabad'],
    faqs: [
      { question: 'How do I find home visit trainers in Karachi?', answer: 'Use the Home Visit mode filter to see trainers who offer coaching at home or private spaces.' },
      { question: 'Can I compare trainer prices?', answer: 'Yes. CoachSet shows package and session pricing in PKR before you submit a booking.' },
      { question: 'Why does CoachSet lock trainer contact?', answer: 'Contact locking keeps bookings traceable and protects the marketplace from direct bypass.' }
    ],
    related: [
      { label: 'Personal trainer Karachi', href: '/personal-trainer-karachi' },
      { label: 'Find home visit trainers', href: '/discover?city=Karachi&mode=Home%20Visit' },
      { label: 'Register as trainer', href: '/register/trainer' }
    ]
  }
};

export default function SeoLanding() {
  const location = useLocation();
  const page = pages[location.pathname] || pages['/personal-trainer-lahore'];
  const [trainers, setTrainers] = useState<any[]>([]);

  useEffect(() => {
    api.getTrainers().then(setTrainers).catch(() => setTrainers([]));
  }, []);

  const matchingTrainers = useMemo(() => {
    return trainers.filter((trainer) => {
      const cityMatch = !page.city || page.city === 'Online' || trainer.city === page.city;
      const genderMatch = !page.gender || trainer.gender === page.gender;
      const modeMatch = !page.mode || trainer.serviceModes?.includes(page.mode);
      const specialtyMatch = !page.specialty || trainer.goals?.includes(page.specialty) || String(trainer.specialty || '').includes(page.specialty);
      return cityMatch && genderMatch && modeMatch && specialtyMatch;
    }).slice(0, 3);
  }, [page, trainers]);

  const discoverHref = `/discover?${new URLSearchParams({
    ...(page.city ? { city: page.city } : {}),
    ...(page.gender ? { gender: page.gender } : {}),
    ...(page.mode ? { mode: page.mode } : {}),
    ...(page.specialty ? { specialty: page.specialty } : {})
  }).toString()}`;

  return (
    <PageShell>
      <PageContainer>
      <SEO
        title={page.title}
        description={page.description}
        canonical={`${baseUrl}${location.pathname}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              name: page.title,
              description: page.description,
              url: `${baseUrl}${location.pathname}`
            },
            {
              '@type': 'FAQPage',
              mainEntity: page.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer }
              }))
            }
          ]
        }}
      />

      <HeroBlock
        kicker={page.kicker}
        title={page.h1}
        description={page.description}
        actions={
          <>
            <Link to={discoverHref} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
              Search trainers <Search className="h-4 w-4" />
            </Link>
            <Link to="/register/trainer" className="inline-flex rounded-full border border-slate-700/50 bg-surface-high/80 px-6 py-3 text-xs font-semibold text-white">
              Join as trainer
            </Link>
          </>
        }
        aside={
          <Surface className="p-5">
          <h2 className="text-3xl editorial-header font-bold mb-5">What to compare before booking</h2>
          <div className="grid gap-3">
            <Check text="CNIC or certification verification status" />
            <Check text="Session price, package length and included support" />
            <Check text="Rating, completed bookings and active client capacity" />
            <Check text="Training mode: gym, home visit, studio or online" />
          </div>
          </Surface>
        }
      />

      <section className="mt-10 grid md:grid-cols-3 gap-3 mb-10">
        <MetricCard value="Verified" label="Trainer approval" />
        <MetricCard value="Reviews" label="Booking-linked ratings" />
        <MetricCard value={page.city || 'Pakistan'} label="Target location" />
      </section>

      <section className="grid lg:grid-cols-[0.8fr_1.2fr] gap-6 mb-10">
        <Surface className="p-6">
          <h2 className="text-3xl editorial-header font-bold mb-5">Popular areas</h2>
          <div className="flex flex-wrap gap-2">
            {page.areas.map((area) => (
              <span key={area} className="rounded-full border border-slate-700/50 bg-surface-high/80 px-3 py-2 text-xs uppercase tracking-widest text-slate-400">{area}</span>
            ))}
          </div>
        </Surface>

        <Surface className="p-6">
          <h2 className="text-3xl editorial-header font-bold mb-5">Featured matches</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {matchingTrainers.length > 0 ? matchingTrainers.map((trainer) => (
              <Link key={trainer.id} to={`/trainer/${trainer.id}`} className="rounded-xl border border-slate-700/50 bg-surface-high/80 p-4 hover:border-primary">
                <h3 className="font-bold">{trainer.name}</h3>
                <p className="text-xs text-muted mt-1">{trainer.city} / {trainer.specialty}</p>
                <p className="text-primary text-sm mt-3">PKR {trainer.price}</p>
              </Link>
            )) : (
              <div className="md:col-span-3 text-muted">No exact match is live yet. Use discovery to browse nearby or online trainers.</div>
            )}
          </div>
        </Surface>
      </section>

      <section className="grid lg:grid-cols-[1fr_0.7fr] gap-6">
        <Surface className="p-6">
          <SectionTitle title="Questions clients ask" />
          <div className="grid gap-4">
            {page.faqs.map((faq) => (
              <article key={faq.question} className="border-b border-slate-700/50 pb-4">
                <h3 className="font-bold mb-2">{faq.question}</h3>
                <p className="text-sm text-muted leading-relaxed">{faq.answer}</p>
              </article>
            ))}
          </div>
        </Surface>

        <div className="bg-primary text-white p-6">
          <h2 className="text-3xl editorial-header font-bold mb-5">Related searches</h2>
          <div className="grid gap-3">
            {page.related.map((item) => (
              <Link key={item.href} to={item.href} className="bg-black text-white px-4 py-3 flex items-center justify-between gap-3 text-sm font-bold">
                {item.label} <ArrowRight className="w-4 h-4 text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>
      </PageContainer>
    </PageShell>
  );
}

function Check({ text }: { text: string }) {
  return (
    <div className="flex gap-3 text-sm text-white/80">
      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
      {text}
    </div>
  );
}
