import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, BarChart2, ShieldCheck, UserPlus, CalendarCheck, Menu, X, MessageCircle, Globe } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { clearSession, roleHome, useSession } from '../utils/session';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const { lang, setLang } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState<string | null>(null);
  const profileLabel = session?.user?.name || 'Account';
  const profileHref = session ? roleHome(session.user.role) : '/login/client';

  const navItems = [
    { icon: Home, label: 'Home', path: '/', public: true },
    { icon: Search, label: 'Discover', path: '/discover', public: true },
    { icon: CalendarCheck, label: 'Bookings', path: '/client/dashboard', public: false },
    { icon: UserPlus, label: 'Join', path: '/register/trainer', public: true },
    { icon: BarChart2, label: 'Trainer', path: '/trainer/dashboard', public: false },
    { icon: ShieldCheck, label: 'Admin', path: '/admin', public: false },
  ];

  const desktopLinks = [
    { to: '/discover', label: 'Find Trainers' },
    { to: '/tools', label: 'Calculators' },
    { to: '/compare', label: 'Compare' },
    { to: '/faq', label: 'FAQ' },
    { to: '/register/trainer', label: 'For Trainers' },
    { to: profileHref, label: profileLabel },
  ];

  const logout = () => {
    clearSession();
    setMobileOpen(false);
    navigate('/login/client');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-700/30 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-6">
          <Link to="/" className="font-serif text-2xl font-black italic tracking-tight text-white">
            Liftrz
          </Link>
          <div className="hidden items-center gap-6 text-xs font-medium text-slate-400 md:flex">
            {desktopLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`transition-colors hover:text-white ${isActive(link.to) ? 'text-primary' : ''}`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              className="flex items-center gap-1.5 rounded-full border border-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:text-white"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === 'en' ? 'اردو' : 'English'}
            </button>
            {session ? (
              <button onClick={logout} className="transition-colors hover:text-white">Logout</button>
            ) : (
              <Link to="/login/client" className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-dark">Login</Link>
            )}
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center text-slate-400 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-700/30 bg-background/95 backdrop-blur-xl md:hidden">
            <div className="mx-auto max-w-7xl px-5 py-4">
              <div className="grid gap-2 text-sm font-medium text-slate-300">
                {desktopLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-high ${isActive(link.to) ? 'text-primary' : ''}`}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => { setLang(lang === 'en' ? 'ur' : 'en'); setMobileOpen(false); }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-slate-300 transition-colors hover:bg-surface-high"
                >
                  <Globe className="h-4 w-4" />
                  {lang === 'en' ? 'اردو میں دیکھیں' : 'View in English'}
                </button>
                {session ? (
                  <button onClick={logout} className="rounded-xl px-3 py-2.5 text-left text-slate-400 transition-colors hover:bg-surface-high hover:text-white">Logout</button>
                ) : (
                  <Link to="/login/client" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-primary transition-colors hover:bg-surface-high">Login</Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow pt-16 pb-28">
        {children}
      </main>

      <footer className="border-t border-slate-700/30 bg-surface px-5 py-12 pb-28">
        <div className="mx-auto max-w-7xl grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Link to="/" className="text-2xl font-black italic font-serif tracking-tighter text-white">Liftrz</Link>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">Verified personal trainers in Pakistan. Find strength coaches, yoga instructors, and rehab specialists near you. Book your free trial today.</p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <FooterLink to="/personal-trainer-lahore" label="Personal trainer Lahore" />
            <FooterLink to="/personal-trainer-karachi" label="Personal trainer Karachi" />
            <FooterLink to="/personal-trainer-islamabad" label="Personal trainer Islamabad" />
            <FooterLink to="/personal-trainer-rawalpindi" label="Personal trainer Rawalpindi" />
            <FooterLink to="/personal-trainer-faisalabad" label="Personal trainer Faisalabad" />
            <FooterLink to="/personal-trainer-gujranwala" label="Personal trainer Gujranwala" />
            <FooterLink to="/personal-trainer-sialkot" label="Personal trainer Sialkot" />
            <FooterLink to="/online-fitness-coach-pakistan" label="Online fitness coach Pakistan" />
            <FooterLink to="/female-personal-trainer-lahore" label="Female personal trainer Lahore" />
            <FooterLink to="/home-personal-trainer-karachi" label="Home personal trainer Karachi" />
            <FooterLink to="/register/trainer" label="Register as trainer" />
            <FooterLink to="/discover" label="Find trainers" />
            <FooterLink to="/quiz" label="Find my trainer" />
            <FooterLink to="/blog" label="Fitness blog" />
            <FooterLink to="/tools" label="Fitness calculators" />
            <FooterLink to="/transformations" label="Transformations" />
            <FooterLink to="/faq" label="FAQ" />
            <FooterLink to="/refer" label="Refer & earn" />
            <FooterLink to="/compare" label="Compare trainers" />
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-500">
          <FooterLink to="/about" label="About" />
          <FooterLink to="/contact" label="Contact" />
          <FooterLink to="/faq" label="FAQ" />
          <FooterLink to="/terms" label="Terms of Service" />
          <FooterLink to="/privacy" label="Privacy Policy" />
          <FooterLink to="/refund-policy" label="Refund Policy" />
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-700/30 bg-background/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 md:px-8">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const needsAuth = !item.public && !session;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  if (needsAuth) {
                    setLoginPrompt(item.label);
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-colors ${active ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'drop-shadow-[0_0_12px_rgba(249,115,22,0.35)]' : ''}`} />
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Login Prompt Modal */}
      {loginPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setLoginPrompt(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-700/50 bg-surface p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-white">Login required</h3>
            <p className="mt-2 text-sm text-slate-400">You need to be logged in to access {loginPrompt}.</p>
            <div className="mt-5 flex flex-col gap-2">
              <Link to="/login/client" onClick={() => setLoginPrompt(null)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">Login</Link>
              <Link to="/register/client" onClick={() => setLoginPrompt(null)} className="rounded-xl border border-slate-700/50 px-5 py-2.5 text-sm font-semibold text-slate-300">Create account</Link>
              <button onClick={() => setLoginPrompt(null)} className="mt-1 text-xs text-slate-500 hover:text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <FloatingWhatsApp />
    </div>
  );
}

function FooterLink({ to, label }: { to: string; label: string }) {
  return <Link to={to} className="text-slate-400 transition-colors hover:text-primary">{label}</Link>;
}

function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/923000000001?text=Hi%20Liftrz%2C%20I%20am%20looking%20for%20a%20personal%20trainer%20in%20Pakistan.%20Can%20you%20help%20me%20find%20the%20right%20one%3F"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-24 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-success shadow-lg shadow-success/30 transition-transform hover:scale-110 md:bottom-8 md:right-8"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 text-white" />
    </a>
  );
}
