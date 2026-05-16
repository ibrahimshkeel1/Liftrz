import type { ReactNode } from 'react';
import { MotionCard, Reveal } from './Motion';

export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_30%),radial-gradient(circle_at_left,rgba(255,255,255,0.02),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-5 pb-24 pt-10 md:px-6 md:pt-14 ${className}`}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </div>
  );
}

export function HeroBlock({
  kicker,
  title,
  description,
  actions,
  aside,
  className = ''
}: {
  kicker: string;
  title: string;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end ${className}`}>
      <Reveal>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{kicker}</p>
        <h1 className="editorial-header text-5xl font-bold leading-[0.94] text-white md:text-7xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400 md:text-lg">{description}</p>
        {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
      </Reveal>
      {aside ? <Reveal delay={0.12}>{aside}</Reveal> : null}
    </section>
  );
}

export function Surface({ children, className = '' }: { children: ReactNode; className?: string; key?: string | number }) {
  return (
    <div className={`rounded-2xl border border-slate-700/50 bg-surface/80 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

export function SurfaceGrid({ children, className = '' }: { children: ReactNode; className?: string; key?: string | number }) {
  return (
    <div className={`rounded-2xl border border-slate-700/50 bg-surface/80 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

export function MetricCard({ value, label, active = false }: { value: ReactNode; label: string; active?: boolean }) {
  return (
    <MotionCard className={`rounded-2xl border p-4 ${active ? 'border-primary bg-primary text-white' : 'border-slate-700/50 bg-surface-high/60 text-white'}`}>
      <p className={`text-xs font-medium ${active ? 'text-white/70' : 'text-slate-400'}`}>{label}</p>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </MotionCard>
  );
}

export function InfoPill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-slate-700/50 bg-surface-high/60 px-3 py-1.5 text-xs font-medium text-slate-300 ${className}`}>
      {children}
    </span>
  );
}

export function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <Reveal className="mb-6">
      <h2 className="editorial-header text-4xl font-bold text-white md:text-5xl">{title}</h2>
      {description ? <p className="mt-3 max-w-2xl text-slate-400">{description}</p> : null}
    </Reveal>
  );
}
