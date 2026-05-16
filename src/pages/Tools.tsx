import { useState, type FormEvent } from 'react';
import { Activity, Flame, Scale } from 'lucide-react';
import SEO from '../components/SEO';
import { HeroBlock, PageContainer, PageShell, Surface } from '../components/premium';

export default function Tools() {
  return (
    <PageShell>
      <PageContainer>
        <SEO
          title="Fitness Calculators | BMI, TDEE, Body Fat | Liftrz Pakistan"
          description="Free fitness calculators for Pakistan. Calculate your BMI, daily calorie needs (TDEE), and body fat percentage."
          canonical="https://liftrz.com/tools"
        />

        <HeroBlock
          kicker="Free tools"
          title="Fitness calculators"
          description="Quick, accurate calculators to understand your body and plan your fitness journey."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <BMICalculator />
          <TDEECalculator />
          <BodyFatCalculator />
        </div>
      </PageContainer>
    </PageShell>
  );
}

/* ─── helpers ─── */
const toCm = (inches: number) => inches * 2.54;
const toKg = (lbs: number) => lbs * 0.453592;
const ftInToCm = (ft: number, inc: number) => (ft * 12 + inc) * 2.54;

/* ─── BMI ─── */
function BMICalculator() {
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightMode, setHeightMode] = useState<'cm' | 'ft'>('cm');
  const [weight, setWeight] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [result, setResult] = useState<{ bmi: number; label: string } | null>(null);

  const calculate = (e: FormEvent) => {
    e.preventDefault();
    let w = Number(weight);
    if (weightUnit === 'lbs') w = toKg(w);

    let h = 0;
    if (heightMode === 'cm') {
      h = Number(heightCm) / 100;
    } else {
      h = ftInToCm(Number(heightFt), Number(heightIn)) / 100;
    }
    if (!w || !h) return;

    const bmi = w / (h * h);
    let label = '';
    if (bmi < 18.5) label = 'Underweight';
    else if (bmi < 25) label = 'Normal weight';
    else if (bmi < 30) label = 'Overweight';
    else label = 'Obese';
    setResult({ bmi: Math.round(bmi * 10) / 10, label });
  };

  return (
    <Surface className="p-6">
      <div className="flex items-center gap-3">
        <Scale className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-white">BMI Calculator</h2>
      </div>
      <p className="mt-2 text-sm text-slate-400">Body Mass Index for adults.</p>
      <form onSubmit={calculate} className="mt-5 grid gap-4">
        {/* Weight */}
        <div>
          <div className="mb-1.5 flex gap-2">
            <button type="button" onClick={() => setWeightUnit('kg')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${weightUnit === 'kg' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>kg</button>
            <button type="button" onClick={() => setWeightUnit('lbs')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${weightUnit === 'lbs' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>lbs</button>
          </div>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder={weightUnit === 'kg' ? '70' : '154'} />
        </div>

        {/* Height */}
        <div>
          <div className="mb-1.5 flex gap-2">
            <button type="button" onClick={() => setHeightMode('cm')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${heightMode === 'cm' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>cm</button>
            <button type="button" onClick={() => setHeightMode('ft')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${heightMode === 'ft' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>ft + in</button>
          </div>
          {heightMode === 'cm' ? (
            <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder="175" />
          ) : (
            <div className="flex gap-2">
              <input type="number" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder="5" />
              <input type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder="9" />
            </div>
          )}
        </div>

        <button type="submit" className="rounded-full bg-primary py-3 text-xs font-semibold text-white">Calculate BMI</button>
      </form>
      {result && (
        <div className="mt-5 space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{result.bmi}</p>
            <p className={`mt-1 text-sm font-semibold ${result.label === 'Normal weight' ? 'text-success' : result.label === 'Underweight' ? 'text-yellow-400' : 'text-primary'}`}>{result.label}</p>
          </div>
          <div className="border-t border-primary/10 pt-3 text-xs leading-5 text-slate-400">
            {result.label === 'Underweight' && (
              <>
                <p className="mb-1 font-semibold text-yellow-400">Below healthy range (18.5+)</p>
                <p>Focus on calorie-dense foods: nuts, dates, paratha, whole milk, and eggs. Add strength training to build muscle, not just fat. Aim for a slight surplus of 300-500 calories above your maintenance.</p>
              </>
            )}
            {result.label === 'Normal weight' && (
              <>
                <p className="mb-1 font-semibold text-success">Healthy range (18.5 - 24.9)</p>
                <p>Great spot. Maintain with balanced Pakistani meals, regular exercise, and adequate protein. Focus on body composition — strength training shapes your physique even at the same weight.</p>
              </>
            )}
            {result.label === 'Overweight' && (
              <>
                <p className="mb-1 font-semibold text-primary">Above healthy range (25 - 29.9)</p>
                <p>Small changes matter. Reduce oil in salan, cut sugary chai, and aim for a 300-500 calorie deficit. Walk 30 minutes daily. A Liftrz trainer can structure this safely.</p>
              </>
            )}
            {result.label === 'Obese' && (
              <>
                <p className="mb-1 font-semibold text-red-400">Well above healthy range (30+)</p>
                <p>Prioritize sustainable habits over crash diets. Start with daily walks, portion control, and whole foods. Consider a certified trainer for a structured, safe fat-loss plan.</p>
              </>
            )}
          </div>
        </div>
      )}
    </Surface>
  );
}

/* ─── TDEE ─── */
function TDEECalculator() {
  const [gender, setGender] = useState('male');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightMode, setHeightMode] = useState<'cm' | 'in' | 'ft'>('cm');
  const [weight, setWeight] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightFtIn, setHeightFtIn] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState('1.2');
  const [result, setResult] = useState<number | null>(null);

  const calculate = (e: FormEvent) => {
    e.preventDefault();
    let w = Number(weight);
    if (weightUnit === 'lbs') w = toKg(w);
    let h = 0;
    if (heightMode === 'cm') h = Number(heightCm);
    else if (heightMode === 'in') h = toCm(Number(heightIn));
    else h = ftInToCm(Number(heightFt), Number(heightFtIn));
    const a = Number(age);
    const act = Number(activity);
    if (!w || !h || !a) return;
    const bmr = gender === 'male' ? (10 * w) + (6.25 * h) - (5 * a) + 5 : (10 * w) + (6.25 * h) - (5 * a) - 161;
    setResult(Math.round(bmr * act));
  };

  return (
    <Surface className="p-6">
      <div className="flex items-center gap-3">
        <Flame className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-white">Calorie Calculator (TDEE)</h2>
      </div>
      <p className="mt-2 text-sm text-slate-400">Daily calories to maintain your weight.</p>
      <form onSubmit={calculate} className="mt-5 grid gap-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => setGender('male')} className={`flex-1 rounded-xl py-2 text-xs font-semibold ${gender === 'male' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>Male</button>
          <button type="button" onClick={() => setGender('female')} className={`flex-1 rounded-xl py-2 text-xs font-semibold ${gender === 'female' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>Female</button>
        </div>

        {/* Weight */}
        <div>
          <div className="mb-1.5 flex gap-2">
            <button type="button" onClick={() => setWeightUnit('kg')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${weightUnit === 'kg' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>kg</button>
            <button type="button" onClick={() => setWeightUnit('lbs')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${weightUnit === 'lbs' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>lbs</button>
          </div>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder={weightUnit === 'kg' ? '70' : '154'} />
        </div>

        {/* Height */}
        <div>
          <div className="mb-1.5 flex gap-2">
            <button type="button" onClick={() => setHeightMode('cm')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${heightMode === 'cm' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>cm</button>
            <button type="button" onClick={() => setHeightMode('in')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${heightMode === 'in' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>inches</button>
            <button type="button" onClick={() => setHeightMode('ft')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${heightMode === 'ft' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>ft + in</button>
          </div>
          {heightMode === 'cm' && (
            <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder="175" />
          )}
          {heightMode === 'in' && (
            <input type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder="69" />
          )}
          {heightMode === 'ft' && (
            <div className="flex gap-2">
              <input type="number" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder="5" />
              <input type="number" value={heightFtIn} onChange={(e) => setHeightFtIn(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder="9" />
            </div>
          )}
        </div>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-500">Age</span>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder="30" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-500">Activity</span>
          <select value={activity} onChange={(e) => setActivity(e.target.value)} className="rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none">
            <option value="1.2">Sedentary (office job)</option>
            <option value="1.375">Light exercise (1-2 days/week)</option>
            <option value="1.55">Moderate exercise (3-5 days/week)</option>
            <option value="1.725">Heavy exercise (6-7 days/week)</option>
          </select>
        </label>
        <button type="submit" className="rounded-full bg-primary py-3 text-xs font-semibold text-white">Calculate TDEE</button>
      </form>
      {result !== null && (
        <div className="mt-5 space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{result.toLocaleString()}</p>
            <p className="mt-1 text-sm text-slate-400">calories per day to maintain</p>
          </div>
          <div className="border-t border-primary/10 pt-3 text-xs leading-5 text-slate-400">
            <p className="mb-2 font-semibold text-white">What to do with this number:</p>
            <ul className="grid gap-2">
              <li className="flex gap-2">
                <span className="shrink-0 rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success">FAT LOSS</span>
                <span>Eat <strong className="text-white">{Math.round(result * 0.8).toLocaleString()}</strong> calories (20% deficit). Safe, sustainable. Expect 0.5-1kg loss per week.</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">MAINTAIN</span>
                <span>Eat <strong className="text-white">{result.toLocaleString()}</strong> calories. Keep activity consistent.</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 rounded bg-blue-400/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">MUSCLE GAIN</span>
                <span>Eat <strong className="text-white">{Math.round(result * 1.1).toLocaleString()}</strong> calories (10% surplus). Lift weights 3-4x per week.</span>
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-slate-500">Protein target: 1.6-2.2g per kg bodyweight daily (eggs, chicken, daal, paneer, whey).</p>
          </div>
        </div>
      )}
    </Surface>
  );
}

/* ─── Body Fat ─── */
function BodyFatCalculator() {
  const [gender, setGender] = useState('male');
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');
  const [heightMode, setHeightMode] = useState<'cm' | 'in' | 'ft'>('cm');
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightFtIn, setHeightFtIn] = useState('');
  const [hip, setHip] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = (e: FormEvent) => {
    e.preventDefault();
    let w = Number(waist);
    let n = Number(neck);
    let h = 0;
    let hi = Number(hip);
    if (heightMode === 'cm') h = Number(heightCm);
    else if (heightMode === 'in') h = toCm(Number(heightIn));
    else h = ftInToCm(Number(heightFt), Number(heightFtIn));
    if (unit === 'in') {
      w = toCm(w);
      n = toCm(n);
      hi = toCm(hi);
    }
    if (!w || !n || !h) return;
    let bf = 0;
    if (gender === 'male') {
      bf = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
    } else {
      if (!hi) return;
      bf = 495 / (1.29579 - 0.35004 * Math.log10(w + hi - n) + 0.22100 * Math.log10(h)) - 450;
    }
    setResult(Math.round(bf * 10) / 10);
  };

  return (
    <Surface className="p-6">
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-white">Body Fat %</h2>
      </div>
      <p className="mt-2 text-sm text-slate-400">US Navy method.</p>
      <form onSubmit={calculate} className="mt-5 grid gap-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => setGender('male')} className={`flex-1 rounded-xl py-2 text-xs font-semibold ${gender === 'male' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>Male</button>
          <button type="button" onClick={() => setGender('female')} className={`flex-1 rounded-xl py-2 text-xs font-semibold ${gender === 'female' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>Female</button>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => setUnit('cm')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${unit === 'cm' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>cm</button>
          <button type="button" onClick={() => setUnit('in')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${unit === 'in' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>inches</button>
        </div>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-500">Waist ({unit})</span>
          <input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} className="rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder={unit === 'cm' ? '80' : '31'} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-500">Neck ({unit})</span>
          <input type="number" value={neck} onChange={(e) => setNeck(e.target.value)} className="rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder={unit === 'cm' ? '38' : '15'} />
        </label>
        {/* Height */}
        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-500">Height</span>
          <div className="mb-1.5 flex gap-2">
            <button type="button" onClick={() => setHeightMode('cm')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${heightMode === 'cm' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>cm</button>
            <button type="button" onClick={() => setHeightMode('in')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${heightMode === 'in' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>inches</button>
            <button type="button" onClick={() => setHeightMode('ft')} className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${heightMode === 'ft' ? 'bg-primary text-white' : 'border border-slate-700/50 text-slate-400'}`}>ft + in</button>
          </div>
          {heightMode === 'cm' && (
            <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder="175" />
          )}
          {heightMode === 'in' && (
            <input type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder="69" />
          )}
          {heightMode === 'ft' && (
            <div className="flex gap-2">
              <input type="number" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder="5" />
              <input type="number" value={heightFtIn} onChange={(e) => setHeightFtIn(e.target.value)} className="w-full rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder="9" />
            </div>
          )}
        </div>
        {gender === 'female' && (
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-slate-500">Hip ({unit})</span>
            <input type="number" value={hip} onChange={(e) => setHip(e.target.value)} className="rounded-xl border border-slate-700/50 bg-surface-high p-3 text-sm text-white outline-none" placeholder={unit === 'cm' ? '95' : '37'} />
          </label>
        )}
        <button type="submit" className="rounded-full bg-primary py-3 text-xs font-semibold text-white">Calculate Body Fat</button>
      </form>
      {result !== null && (
        <div className="mt-5 space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{result}%</p>
            <p className="mt-1 text-sm text-slate-400">estimated body fat</p>
          </div>
          <div className="border-t border-primary/10 pt-3 text-xs leading-5 text-slate-400">
            {gender === 'male' ? (
              <>
                <p className="mb-1 font-semibold text-white">For men:</p>
                <ul className="mb-2 space-y-1">
                  <li><span className="text-success">Athletic:</span> 6-13%</li>
                  <li><span className="text-primary">Fitness:</span> 14-17%</li>
                  <li><span className="text-slate-300">Average:</span> 18-24%</li>
                  <li><span className="text-red-400">Above average:</span> 25%+</li>
                </ul>
                {result <= 13 && <p>Excellent. Focus on maintaining strength and diet discipline. Recomp or lean bulk if you want more size.</p>}
                {result > 13 && result <= 17 && <p>Solid. To get leaner, add 2-3 cardio sessions per week and tighten portion control. To gain size, eat at a 10% surplus and lift heavy.</p>}
                {result > 17 && result <= 24 && <p>Decent base. Start tracking food. Aim for a 300-500 calorie deficit and resistance training 3-4x per week. Consistency beats intensity.</p>}
                {result > 24 && <p>Priority: sustainable fat loss. Start with daily walking, reduce fried/oily foods, and get a structured plan from a Liftrz trainer. Small daily wins compound.</p>}
              </>
            ) : (
              <>
                <p className="mb-1 font-semibold text-white">For women:</p>
                <ul className="mb-2 space-y-1">
                  <li><span className="text-success">Athletic:</span> 14-20%</li>
                  <li><span className="text-primary">Fitness:</span> 21-24%</li>
                  <li><span className="text-slate-300">Average:</span> 25-31%</li>
                  <li><span className="text-red-400">Above average:</span> 32%+</li>
                </ul>
                {result <= 20 && <p>Excellent. Maintain with balanced nutrition and strength training. Do not undereat — female hormones need adequate body fat.</p>}
                {result > 20 && result <= 24 && <p>Solid. To get leaner, add light cardio and track intake. To build curves, focus on glute/leg focused strength work with a slight surplus.</p>}
                {result > 24 && result <= 31 && <p>Good starting point. Aim for a modest 300-calorie deficit, prioritize protein, and train 3-4x per week. Results show in 8-12 weeks.</p>}
                {result > 31 && <p>Focus on building habits first: daily walks, home-cooked meals, and consistent sleep. A female trainer on Liftrz can design a plan around your lifestyle and comfort.</p>}
              </>
            )}
          </div>
        </div>
      )}
    </Surface>
  );
}
