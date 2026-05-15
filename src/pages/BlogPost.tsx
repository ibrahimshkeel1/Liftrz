import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Share2 } from 'lucide-react';
import SEO from '../components/SEO';
import { PageContainer, PageShell, Surface } from '../components/premium';

const posts: Record<string, { title: string; date: string; category: string; content: string }> = {
  'best-personal-trainer-lahore': {
    title: 'How to Find the Best Personal Trainer in Lahore',
    date: 'May 2026',
    category: 'Guide',
    content: `
      <h2>What to Look For</h2>
      <p>Finding the right trainer in Lahore comes down to three things: location, certification, and personality fit. DHA, Gulberg, and Johar Town are popular areas where many trainers operate, but good trainers work across the city.</p>

      <h2>Location Matters</h2>
      <p>Traffic in Lahore is unpredictable. A trainer who is 30 minutes away will eventually become a trainer you skip. Look for someone within 10-15 minutes of your home or workplace.</p>

      <h2>Certifications to Check</h2>
      <p>Ask for: NASM, ACE, NSCA, or ISSA certifications. While Pakistani certifications exist, international standards show the trainer has invested in their education.</p>

      <h2>Average Cost</h2>
      <p>Based on current market rates in Lahore, personal training sessions typically range from PKR 1,500-3,000 per session. Monthly packages (12-16 sessions) generally fall between PKR 15,000-40,000 depending on the trainer's experience and your location. Always confirm exact pricing directly with the trainer.</p>
    `
  },
  'personal-trainer-cost-pakistan': {
    title: 'Personal Trainer Cost in Pakistan (2026)',
    date: 'May 2026',
    category: 'Pricing',
    content: `
      <h2>Per-Session Pricing</h2>
      <p>Based on market observations across Pakistan, beginner trainers often charge around PKR 1,000-1,500 per session. Trainers with 3+ years of experience typically charge PKR 2,000-3,500. Those with specialized certifications or niche expertise may charge PKR 4,000 or more. These are general market estimates — confirm directly with any trainer you consider.</p>

      <h2>Monthly Packages</h2>
      <p>Monthly packages usually offer better value than per-session rates. Typical market ranges for a 12-session monthly package are approximately PKR 15,000-25,000 in Lahore, PKR 18,000-30,000 in Karachi, and PKR 12,000-20,000 in Islamabad. Exact prices depend on the trainer and what's included.</p>

      <h2>Home vs Gym</h2>
      <p>Home training generally costs 20-30% more than gym-based training because the trainer travels to you. However, you may save on gym membership fees. Online training is typically the most affordable option, often 40-50% cheaper than in-person sessions.</p>

      <h2>Extras to Ask About</h2>
      <p>Some trainers include nutrition plans, body composition analysis, and custom workout programs in their packages. Others charge separately for these services. Always ask what's included before booking.</p>
    `
  },
  'female-personal-trainer-pakistan': {
    title: 'Why More Women in Pakistan Are Hiring Female Personal Trainers',
    date: 'May 2026',
    category: 'Trends',
    content: `
      <h2>The Privacy Factor</h2>
      <p>For many Pakistani women, working out with a male trainer is not culturally comfortable. Female trainers provide a safe, private environment where women can exercise without concern.</p>

      <h2>Growing Demand</h2>
      <p>Demand for female trainers in Pakistan has grown significantly in recent years. Cities with the most listings include Lahore, Karachi, and Islamabad.</p>

      <h2>Specializations</h2>
      <p>Female trainers often specialize in: post-pregnancy fitness, wedding prep, weight loss, and strength training for women. Many also offer home-based training for added privacy.</p>

      <h2>How to Find One</h2>
      <p>Use CoachSet's gender filter to find verified female trainers in your area. All female trainers on our platform are identity-verified and certified.</p>
    `
  },
  'home-vs-gym-training': {
    title: 'Home Training vs Gym Training: Which is Better?',
    date: 'May 2026',
    category: 'Comparison',
    content: `
      <h2>Home Training Pros</h2>
      <p>No commute time, total privacy, flexible scheduling, and no gym membership fees. Your trainer brings equipment or designs bodyweight programs. Best for busy professionals and parents.</p>

      <h2>Gym Training Pros</h2>
      <p>Access to full equipment range, structured environment, and often lower trainer rates. The gym atmosphere can be motivating. Best for people who need external motivation.</p>

      <h2>Cost Comparison</h2>
      <p>Based on general market rates in Pakistan: home training typically ranges from PKR 2,000-4,000 per session; gym training from PKR 1,500-3,000 per session plus gym membership (usually PKR 3,000-8,000/month); and online training from PKR 800-1,500 per session. Actual rates vary by trainer and city.</p>

      <h2>Our Recommendation</h2>
      <p>Start with home training for 1-2 months to build the habit. Once you're consistent, consider a gym for access to heavier weights and equipment variety.</p>
    `
  },
  'wedding-fitness-pakistan': {
    title: 'Wedding Fitness: How to Get in Shape in 3 Months',
    date: 'May 2026',
    category: 'Goals',
    content: `
      <h2>The Timeline</h2>
      <p>12 weeks is a practical timeframe for most people. With consistent training and nutrition, many clients see noticeable changes in body composition and muscle tone. The key is starting early enough that you are not panicking.</p>

      <h2>Month 1: Foundation</h2>
      <p>Focus on building the exercise habit. 3-4 sessions per week, clean eating, and establishing sleep patterns. Early weight changes vary by individual and depend on starting point, consistency, and diet.</p>

      <h2>Month 2: Intensity</h2>
      <p>Increase to 4-5 sessions per week. Add strength training to shape arms, back, and shoulders (for the outfit). Fine-tune nutrition with your trainer.</p>

      <h2>Month 3: Polish</h2>
      <p>Taper training to 3 sessions per week to avoid stress. Focus on posture, skin health (hydration), and maintaining results. Book your final dress fitting in week 10, not week 12.</p>
    `
  },
  'online-fitness-coach': {
    title: 'Do Online Fitness Coaches Actually Work?',
    date: 'May 2026',
    category: 'Online',
    content: `
      <h2>Who Online Coaching Works For</h2>
      <p>Self-motivated people who can follow a plan without someone standing over them. If you have been to a gym before and know basic movements, online coaching is highly effective.</p>
      
      <h2>Who It Does Not Work For</h2>
      <p>Complete beginners who need form correction, people who struggle with consistency, and those who need the social pressure of an in-person session.</p>
      
      <h2>How It Works on CoachSet</h2>
      <p>Your trainer sends weekly workout videos, checks your form via WhatsApp, adjusts your nutrition plan, and tracks progress through the CoachSet app. Weekly video calls keep you accountable.</p>
      
      <h2>Cost Savings</h2>
      <p>Online coaching typically costs 40-60% less than in-person training. Based on market rates, a quality online trainer may charge around PKR 8,000-15,000 per month compared to PKR 20,000-40,000 for in-person training. Exact rates depend on the trainer and what's included in the package.</p>
    `
  },
  'pakistani-diet-for-weight-loss': {
    title: 'Pakistani Diet for Weight Loss: What Actually Works',
    date: 'May 2026',
    category: 'Nutrition',
    content: `
      <h2>The Pakistani Diet Advantage</h2>
      <p>Pakistani food is not inherently unhealthy. Daal, sabzi, roti, and yogurt form a solid nutritional base. The problem is portion size, oil, and the frequency of fried foods.</p>
      
      <h2>Smart Swaps</h2>
      <p>Replace fried parathas with plain roti or egg omelet. Use less oil in salan — measure with a spoon instead of free-pouring. Choose grilled chicken over fried at BBQ spots.</p>
      
      <h2>Portion Control</h2>
      <p>One roti instead of two. Half a plate of salan, half a plate of salad. Eat protein first, then vegetables, then carbs. This simple order reduces total calorie intake without feeling hungry.</p>
      
      <h2>Meal Timing</h2>
      <p>Breakfast within an hour of waking. Lunch your biggest meal. Dinner light and early (before 8 PM). This aligns with Pakistani routines and supports fat loss.</p>
    `
  },
  'ramadan-fitness-guide': {
    title: 'Ramadan Fitness Guide: Train Without Losing Muscle',
    date: 'May 2026',
    category: 'Guide',
    content: `
      <h2>When to Train</h2>
      <p>The best time is 1-2 hours before iftar. Your body is warmed up from fasting, and you can refuel immediately after. Alternatively, train 2 hours after iftar once food has settled.</p>
      
      <h2>What to Avoid</h2>
      <p>High-intensity cardio while fasting risks dehydration and dizziness. Keep sessions to 45 minutes. Focus on strength training with moderate weights and higher reps.</p>
      
      <h2>Iftar Nutrition</h2>
      <p>Break your fast with dates and water, not samosas. Include protein (chicken, eggs, daal) in every iftar and sehri. Avoid sugary drinks — they spike insulin and cause energy crashes.</p>
      
      <h2>Hydration Strategy</h2>
      <p>Drink 2-3 glasses of water between iftar and bedtime. Another 1-2 glasses at sehri. Add a pinch of salt or have coconut water to maintain electrolytes.</p>
    `
  },
  'desi-protein-sources': {
    title: 'Cheap Protein Sources in Pakistan (Non-Meat Included)',
    date: 'May 2026',
    category: 'Nutrition',
    content: `
      <h2>Eggs: The King of Budget Protein</h2>
      <p>At PKR 15-20 per egg, you get 6g of complete protein. A 3-egg omelet at breakfast delivers 18g protein for under PKR 60. Boil them in bulk for the week.</p>
      
      <h2>Daal and Chana</h2>
      <p>Chana daal and lobia are protein-packed and cost under PKR 200/kg. One cooked cup delivers 15g protein plus fiber. Pair with roti for a complete amino acid profile.</p>
      
      <h2>Dairy Power</h2>
      <p>Dahi and paneer are underrated protein sources. 200g dahi = 7g protein. 100g paneer = 18g protein. Both are affordable and available at every dairy shop in Pakistan.</p>
      
      <h2>Soy Chunks</h2>
      <p>The cheapest protein source in Pakistan. PKR 100-150 for 250g dry soy chunks = 50g protein per 100g dry weight. Rehydrate, season with masala, and use in salan or pulao.</p>
    `
  }
};

export default function BlogPost() {
  const { slug } = useParams();
  const post = posts[slug || ''];

  if (!post) {
    return (
      <PageShell>
        <PageContainer>
          <div className="py-20 text-center">
            <h1 className="text-2xl font-bold text-white">Article not found</h1>
            <Link to="/blog" className="mt-4 inline-flex items-center gap-2 text-primary">← Back to blog</Link>
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContainer>
        <SEO
          title={`${post.title} | CoachSet Pakistan Blog`}
          description={post.title}
          canonical={`https://coachset-pakistan.vercel.app/blog/${slug}`}
        />

        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>

        <div className="mt-6 max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-primary">
            <span className="rounded-full bg-primary/10 px-2 py-0.5">{post.category}</span>
            <span className="flex items-center gap-1 text-slate-500"><Calendar className="h-3.5 w-3.5" /> {post.date}</span>
          </div>
          <h1 className="editorial-header mt-4 text-4xl font-bold text-white">{post.title}</h1>
        </div>

        <Surface className="mt-8 max-w-3xl p-6 md:p-8">
          <div
            className="prose prose-invert prose-headings:font-semibold prose-headings:text-white prose-p:text-slate-400 prose-strong:text-white prose-h2:mt-8 prose-h2:text-xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </Surface>

        <div className="mt-10 max-w-3xl">
          <h3 className="text-lg font-semibold text-white">Ready to start your fitness journey?</h3>
          <p className="mt-2 text-slate-400">Find a verified trainer in your area today.</p>
          <div className="mt-4 flex gap-3">
            <Link to="/discover" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark">Find trainers</Link>
            <Link to="/quiz" className="rounded-xl border border-slate-700/50 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-surface-high">Take quiz</Link>
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}
