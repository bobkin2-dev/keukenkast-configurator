// Cabinet type constants - single source of truth

// Color mapping for Tailwind (must use complete class names to avoid tree-shaking)
export const colorStyles = {
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    button: 'bg-purple-500 hover:bg-purple-600'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    button: 'bg-green-500 hover:bg-green-600'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    button: 'bg-blue-500 hover:bg-blue-600'
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    button: 'bg-orange-500 hover:bg-orange-600'
  }
};

// Cabinet type configuration for data-driven rendering
export const CABINET_TYPE_CONFIG = {
  Bovenkast:  { colorClass: 'purple', emoji: '', label: 'BK' },
  Kolomkast:  { colorClass: 'green',  emoji: '', label: 'KK' },
  Onderkast:  { colorClass: 'blue',   emoji: '', label: 'OK' },
  Ladekast:   { colorClass: 'orange', emoji: '', label: 'LK' },
};

// Toestellen options for Kolomkast (0, 1, or 2 appliances - each adds 1 hour)
export const toestelOpties = [0, 1, 2];

// Complexity options for Vrije Kast (and legacy Open Nis HPL)
export const complexiteitOpties = [
  { key: 'heel_gemakkelijk', label: 'Heel gemakkelijk', uren: 1 },
  { key: 'gemakkelijk', label: 'Gemakkelijk', uren: 2 },
  { key: 'gemiddeld', label: 'Gemiddeld', uren: 3 },
  { key: 'moeilijk', label: 'Moeilijk', uren: 4 },
  { key: 'heel_moeilijk', label: 'Heel moeilijk', uren: 6 }
];

// Complexity hours mapping (used in kastCalculator.js)
export const COMPLEXITEIT_UREN = {
  'heel_gemakkelijk': 1,
  'gemakkelijk': 2,
  'gemiddeld': 3,
  'moeilijk': 4,
  'heel_moeilijk': 6
};

// Vrije Kast onderdelen labels
export const VRIJE_KAST_ONDERDELEN = ['LZ', 'RZ', 'BK', 'OK', 'RUG'];
