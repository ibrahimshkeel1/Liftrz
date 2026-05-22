const cityAliases: Record<string, string[]> = {
  lahore: ['lahore', 'lhr'],
  karachi: ['karachi', 'khi'],
  islamabad: ['islamabad', 'isb'],
  rawalpindi: ['rawalpindi', 'pindi', 'rwp'],
  faisalabad: ['faisalabad', 'fsd'],
  gujranwala: ['gujranwala', 'grw'],
  sialkot: ['sialkot'],
  online: ['online', 'virtual', 'remote', 'nationwide', 'pakistan']
};

const modeAliases: Record<string, string[]> = {
  gym: ['gym', 'in gym', 'gym training'],
  'home visit': ['home visit', 'home', 'at home', 'home training', 'home trainer'],
  online: ['online', 'virtual', 'remote', 'video call', 'online coaching'],
  studio: ['studio', 'private studio']
};

const specialtyAliases: Record<string, string[]> = {
  strength: ['strength', 'strength training', 'powerlifting'],
  'fat loss': ['fat loss', 'weight loss', 'lose weight', 'losing weight', 'slimming'],
  rehab: ['rehab', 'recovery', 'injury recovery', 'physio', 'mobility'],
  yoga: ['yoga', 'flexibility', 'stretching'],
  'athletic performance': ['athletic performance', 'sports performance', 'athlete', 'conditioning'],
  'muscle gain': ['muscle gain', 'build muscle', 'building muscle', 'hypertrophy', 'bodybuilding', 'bulking'],
  'online coaching': ['online coaching', 'online fitness coach', 'virtual coach'],
  'wedding prep': ['wedding prep', 'wedding fitness', 'bridal fitness', 'shaadi']
};

const genericSearchWords = new Set([
  'a',
  'an',
  'and',
  'are',
  'best',
  'book',
  'coach',
  'coaches',
  'fitness',
  'for',
  'find',
  'hire',
  'in',
  'near',
  'of',
  'personal',
  'the',
  'trainer',
  'trainers',
  'verified',
  'with'
]);

export const toNumber = (value: number | string | undefined) => Number(String(value || 0).replace(/,/g, ''));
const firstPositive = (...values: Array<number | string | undefined>) => values.map(toNumber).find((value) => value > 0) || 0;
export const toStartingPrice = (trainer: any) => firstPositive(trainer.lowestPackagePrice, trainer.startingPrice, trainer.monthlyPrice, trainer.monthlyPackagePrice, trainer.sessionPrice, trainer.price);
export const toSessionPrice = (trainer: any) => toStartingPrice(trainer);
export const toMonthlyEstimate = (trainer: any) => firstPositive(trainer.monthlyPrice, trainer.monthlyPackagePrice, trainer.lowestPackagePrice, trainer.startingPrice) || Math.round(firstPositive(trainer.sessionPrice, trainer.price) * 12);
export const toStartingDuration = (trainer: any) => trainer.lowestPackageDuration || trainer.packageDuration || '';

export function normalizeText(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizedList(values: unknown[]) {
  return values.map(normalizeText).filter(Boolean);
}

function aliasesFor(value: string, aliases: Record<string, string[]>) {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  const match = Object.entries(aliases).find(([canonical, terms]) => canonical === normalized || terms.includes(normalized));
  return match ? match[1] : [normalized];
}

export function normalizeSpecialtyFilter(value: string) {
  const normalized = normalizeText(value);
  if (normalized === 'all') return 'All';
  const match = Object.entries(specialtyAliases).find(([canonical, terms]) => canonical === normalized || terms.includes(normalized));
  if (!match) return value;
  return match[0].replace(/\b\w/g, (char) => char.toUpperCase()).replace('Fat Loss', 'Fat loss').replace('Muscle Gain', 'Muscle gain').replace('Online Coaching', 'Online coaching');
}

function trainerText(trainer: any) {
  const baseValues = [
    trainer.name,
    trainer.headline,
    trainer.specialty,
    trainer.city,
    trainer.location,
    trainer.area,
    trainer.gender,
    trainer.bio,
    trainer.homeVisitAreas,
    trainer.clientAgeMin,
    trainer.clientAgeMax,
    ...(Array.isArray(trainer.clientGenders) ? trainer.clientGenders : []),
    ...(Array.isArray(trainer.goals) ? trainer.goals : []),
    ...(Array.isArray(trainer.serviceModes) ? trainer.serviceModes : []),
    ...(Array.isArray(trainer.languages) ? trainer.languages : []),
    ...(Array.isArray(trainer.certifications) ? trainer.certifications : [])
  ];
  const normalizedBase = normalizedList(baseValues);
  const expanded = normalizedBase.flatMap((item) => [
    item,
    ...aliasesFor(item, cityAliases),
    ...aliasesFor(item, modeAliases),
    ...aliasesFor(item, specialtyAliases)
  ]);
  return normalizeText([...expanded, 'personal trainer', 'fitness coach', 'verified trainer'].join(' '));
}

export function matchesCity(trainer: any, selectedCity: string) {
  const selected = normalizeText(selectedCity);
  if (!selected || selected === 'all') return true;

  const terms = aliasesFor(selected, cityAliases);
  const searchable = normalizeText([
    trainer.city,
    trainer.location,
    trainer.area,
    trainer.homeVisitAreas,
    ...(Array.isArray(trainer.serviceModes) ? trainer.serviceModes : [])
  ].join(' '));

  if (selected === 'online') {
    return terms.some((term) => searchable.includes(term));
  }

  return terms.some((term) => searchable.includes(term));
}

export function matchesMode(trainer: any, selectedMode: string) {
  const selected = normalizeText(selectedMode);
  if (!selected || selected === 'all') return true;
  const terms = aliasesFor(selected, modeAliases);
  const searchable = normalizeText(Array.isArray(trainer.serviceModes) ? trainer.serviceModes.join(' ') : trainer.serviceModes);
  return terms.some((term) => searchable.includes(term));
}

export function matchesGender(trainer: any, selectedGender: string) {
  const selected = normalizeText(selectedGender);
  if (!selected || selected === 'all') return true;
  return normalizeText(trainer.gender) === selected;
}

export function matchesSpecialty(trainer: any, selectedSpecialty: string) {
  const selected = normalizeText(selectedSpecialty);
  if (!selected || selected === 'all') return true;
  const terms = aliasesFor(selected, specialtyAliases);
  const searchable = trainerText(trainer);
  return terms.some((term) => searchable.includes(term));
}

export function matchesSearch(trainer: any, query: string) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;

  const searchable = trainerText(trainer);
  const expandedQuery = normalizeText([
    normalizedQuery,
    ...aliasesFor(normalizedQuery, cityAliases),
    ...aliasesFor(normalizedQuery, modeAliases),
    ...aliasesFor(normalizedQuery, specialtyAliases)
  ].join(' '));

  const tokens = expandedQuery
    .split(' ')
    .filter((token) => token.length > 1 && !genericSearchWords.has(token));

  if (tokens.length === 0) return true;
  const searchableTokens = new Set(searchable.split(' '));
  return tokens.every((token) => searchableTokens.has(token) || (token.length > 4 && searchable.includes(token)));
}
