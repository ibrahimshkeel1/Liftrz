export const CITY_AREAS: Record<string, string[]> = {
  Lahore: [
    'DHA Phase 1', 'DHA Phase 3', 'DHA Phase 5', 'DHA Phase 6', 'DHA Raya',
    'Gulberg', 'Gulberg III', 'Model Town', 'Johar Town',
    'Bahria Town', 'Cantt', 'Mall Road', 'Faisal Town',
    'Township', 'Wapda Town', 'Valencia Town', 'Lake City', 'Iqbal Town',
    'Garden Town', 'Shadman', 'Defence (Askari)', 'LDA Avenue'
  ],
  Karachi: [
    'Clifton', 'DHA Phase 1-8', 'PECHS', 'Gulshan-e-Iqbal',
    'North Nazimabad', 'Gulistan-e-Jauhar', 'Bahadurabad', 'Defence View',
    'KDA Scheme 1', 'Malir Cantt', 'Nazimabad', 'Federal B Area'
  ],
  Islamabad: [
    'F-6', 'F-7', 'F-8', 'F-10', 'F-11', 'G-6', 'G-7', 'G-8',
    'E-7', 'E-11', 'I-8', 'Blue Area', 'Sector H', 'Bahria Enclave',
    'DHA Islamabad', 'Soan Gardens', 'Park Road'
  ],
  Rawalpindi: [
    'Bahria Town', 'Saddar', 'Satellite Town', 'PWD Housing Society',
    'Chaklala', 'Westridge', 'Gulraiz', 'DHA Rawalpindi',
    'Airport Housing', 'Lalazar', 'Race Course'
  ],
  Faisalabad: [
    'D Ground', 'Madina Town', 'People Colony', 'Susan Road',
    'Canal Road', 'Jinnah Colony', 'Millat Town', 'Satiana Road',
    'Ghulam Muhammad Abad', 'Gulistan Colony'
  ],
  Gujranwala: [
    'Model Town', 'Satellite Town', 'Wapda Town', 'DC Colony',
    'Peoples Colony', 'Cantt', 'Garden Town', 'Civil Lines'
  ],
  Sialkot: [
    'Cantt', 'Daska Road', 'Paris Road', 'Kashmir Road',
    'Model Town', 'Sambrial Road', 'Shahabpura', 'Hajipura'
  ]
};

export function getAreasForCity(city: string): string[] {
  return CITY_AREAS[city] || [];
}
