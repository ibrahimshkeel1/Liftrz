import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, PageContainer, PageShell, Surface } from '../components/premium';

export default function NotFound() {
  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Page Not Found | CoachSet Pakistan"
          description="The page you are looking for does not exist."
        />

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="editorial-header text-8xl font-bold text-primary">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-white">Page not found</h2>
          <p className="mt-4 text-slate-400">The page you are looking for does not exist or has been moved.</p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
              <Home className="h-4 w-4" /> Return home
            </Link>
            <Link to="/discover" className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-surface-high">
              <ArrowLeft className="h-4 w-4" /> Browse trainers
            </Link>
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}
