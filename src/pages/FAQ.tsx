import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, PageContainer, PageShell, Surface } from '../components/premium';

const faqs = [
  {
    question: 'How do I find a personal trainer in Pakistan?',
    answer: 'Use Liftrz Discover to filter by your city, goal, budget, and gender preference. Every trainer is identity-verified before they appear on the platform. Browse profiles, compare pricing, and send a free inquiry.'
  },
  {
    question: 'How much does a personal trainer cost in Pakistan?',
    answer: 'Prices vary widely by city, experience, and training mode. Based on market rates in Pakistan, in-person training typically ranges from PKR 15,000-40,000 per month. Online coaching is usually 40-60% cheaper. Home visit training tends to cost 20-30% more than gym sessions. Check individual trainer profiles on Liftrz for exact pricing.'
  },
  {
    question: 'Are the trainers verified?',
    answer: 'Yes. Every trainer submits CNIC and certifications. Liftrz reviews each application before approval. Verified trainers display a green checkmark badge on their profile.'
  },
  {
    question: 'Can I get a female personal trainer?',
    answer: 'Absolutely. Use the gender filter on the Discover page to find female trainers in your city. Many offer home-based training for added privacy and comfort.'
  },
  {
    question: 'How does payment work?',
    answer: 'Submit payment proof (bank transfer, JazzCash, or EasyPaisa receipt) through the platform. Once admin verifies your payment, direct trainer contact unlocks automatically.'
  },
  {
    question: 'What if I am not satisfied with my trainer?',
    answer: 'Open a dispute from your client dashboard within 7 days of your first session. Liftrz reviews each case and offers resolution options including trainer replacement where possible.'
  },
  {
    question: 'Do you offer online coaching?',
    answer: 'Yes. Many trainers offer online coaching via video calls and WhatsApp. Online coaching is the most affordable option and works well for self-motivated clients who need structured programming.'
  },
  {
    question: 'How do I become a trainer on Liftrz?',
    answer: 'Click "Join as trainer" and complete the registration form. You will need to submit your CNIC, certifications, and a short bio. Approval typically takes 24-48 hours.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="FAQ | Liftrz Pakistan"
          description="Frequently asked questions about finding personal trainers in Pakistan, pricing, verification, payments, and more."
          canonical="https://liftrz.vercel.app/faq"
        />

        <HeroBlock
          kicker="Support"
          title="Frequently asked questions"
          description="Everything you need to know about finding, booking, and working with trainers on Liftrz."
        />

        <div className="mt-10 mx-auto max-w-3xl space-y-3">
          {faqs.map((faq, i) => (
            <Surface key={i} className="overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-semibold text-white">{faq.question}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === i && (
                <div className="border-t border-slate-700/50 px-5 py-4 text-sm leading-7 text-slate-400">
                  {faq.answer}
                </div>
              )}
            </Surface>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-slate-400">Still have questions?</p>
          <Link to="/contact" className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark">
            <HelpCircle className="h-4 w-4" /> Contact us
          </Link>
        </div>
      </PageContainer>
    </PageShell>
  );
}
