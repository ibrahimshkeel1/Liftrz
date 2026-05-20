import { HeroBlock, PageContainer, PageShell } from '../components/premium';

export default function Privacy() {
  return (
    <PageShell>
      <PageContainer>
        <HeroBlock
          kicker="Legal"
          title="Privacy Policy"
          description="How we collect, use, and protect your data"
        />

        <div className="prose prose-invert mt-10 max-w-3xl">
          <h3 className="text-xl font-semibold text-white">1. Information We Collect</h3>
          <p className="text-slate-400">We collect name, email, phone, city, fitness goals, and payment information. Trainers additionally submit CNIC, certifications, and payout details.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">2. How We Use Your Data</h3>
          <p className="text-slate-400">Your data is used to match clients with trainers, process payments, send notifications, and improve our platform. We never sell your personal information.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">3. Data Sharing</h3>
          <p className="text-slate-400">Client contact details are shared with trainers only after payment verification. Trainer contact details are hidden until booking is confirmed. Payment proof is reviewed manually by Liftrz admin.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">4. Security</h3>
          <p className="text-slate-400">We use industry-standard encryption, secure authentication, and regular security audits. Passwords are hashed with scrypt. Sessions use signed JWT tokens.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">5. Your Rights</h3>
          <p className="text-slate-400">You may request deletion of your account and associated data. Email hey@liftrz.com with subject "Data Deletion Request."</p>

          <h3 className="mt-6 text-xl font-semibold text-white">6. Cookies</h3>
          <p className="text-slate-400">We use essential cookies for authentication and session management. We do not use tracking cookies for advertising.</p>

          <h3 className="mt-6 text-xl font-semibold text-white">7. Contact</h3>
          <p className="text-slate-400">For privacy concerns, contact hey@liftrz.com</p>
        </div>
      </PageContainer>
    </PageShell>
  );
}
