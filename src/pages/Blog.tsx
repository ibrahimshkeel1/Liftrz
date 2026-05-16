import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, PageContainer, PageShell, Surface } from '../components/premium';

const posts = [
  {
    slug: 'best-personal-trainer-lahore',
    title: 'How to Find the Best Personal Trainer in Lahore',
    excerpt: 'DHA, Gulberg, or Johar Town? We break down what to look for in a Lahore-based trainer and how much you should expect to pay.',
    date: 'May 2026',
    category: 'Guide'
  },
  {
    slug: 'personal-trainer-cost-pakistan',
    title: 'Personal Trainer Cost in Pakistan (2026)',
    excerpt: 'From PKR 1,500 per session to PKR 50,000 monthly packages. Here is the complete pricing breakdown across Lahore, Karachi, and Islamabad.',
    date: 'May 2026',
    category: 'Pricing'
  },
  {
    slug: 'female-personal-trainer-pakistan',
    title: 'Why More Women in Pakistan Are Hiring Female Personal Trainers',
    excerpt: 'Privacy, comfort, and cultural preferences. We explore the growing demand for female trainers and where to find verified ones.',
    date: 'May 2026',
    category: 'Trends'
  },
  {
    slug: 'home-vs-gym-training',
    title: 'Home Training vs Gym Training: Which is Better?',
    excerpt: 'No time for the gym? A trainer who comes to your home might be the answer. We compare costs, results, and convenience.',
    date: 'May 2026',
    category: 'Comparison'
  },
  {
    slug: 'wedding-fitness-pakistan',
    title: 'Wedding Fitness: How to Get in Shape in 3 Months',
    excerpt: 'The ultimate guide for brides and grooms in Pakistan. Nutrition, workouts, and realistic timelines for your big day.',
    date: 'May 2026',
    category: 'Goals'
  },
  {
    slug: 'online-fitness-coach',
    title: 'Do Online Fitness Coaches Actually Work?',
    excerpt: 'Virtual training exploded post-COVID. We look at the pros, cons, and who online coaching is actually best for.',
    date: 'May 2026',
    category: 'Online'
  },
  {
    slug: 'pakistani-diet-for-weight-loss',
    title: 'Pakistani Diet for Weight Loss: What Actually Works',
    excerpt: 'Roti, biryani, and chai are not the enemy. We break down how to eat Pakistani food and still lose weight sustainably.',
    date: 'May 2026',
    category: 'Nutrition'
  },
  {
    slug: 'ramadan-fitness-guide',
    title: 'Ramadan Fitness Guide: Train Without Losing Muscle',
    excerpt: 'How to structure your workouts, manage hydration, and maintain strength during Ramadan fasting in Pakistan.',
    date: 'May 2026',
    category: 'Guide'
  },
  {
    slug: 'desi-protein-sources',
    title: 'Cheap Protein Sources in Pakistan (Non-Meat Included)',
    excerpt: 'Eggs, daal, chana, dahi, and paneer. Here is how to hit your protein goals on a Pakistani budget without expensive supplements.',
    date: 'May 2026',
    category: 'Nutrition'
  }
];

export default function Blog() {
  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Fitness Blog | Personal Training Tips for Pakistan"
          description="Guides on finding trainers, pricing, home workouts, wedding fitness, and online coaching in Pakistan."
          canonical="https://liftrz.com/blog"
        />

        <HeroBlock
          kicker="Liftrz blog"
          title="Fitness tips for Pakistan"
          description="Practical guides on finding trainers, understanding pricing, and reaching your fitness goals."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`}>
              <Surface className="h-full p-6 transition-all hover:border-primary/30">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5">{post.category}</span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-white">{post.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" /> {post.date}
                </div>
              </Surface>
            </Link>
          ))}
        </div>
      </PageContainer>
    </PageShell>
  );
}
