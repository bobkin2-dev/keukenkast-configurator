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
  },
  teal: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    button: 'bg-teal-500 hover:bg-teal-600'
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    button: 'bg-rose-500 hover:bg-rose-600'
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    button: 'bg-amber-500 hover:bg-amber-600'
  }
};

// Cabinet type configuration for data-driven rendering
export const CABINET_TYPE_CONFIG = {
  Bovenkast:  { colorClass: 'purple', emoji: '', label: 'BK' },
  Kolomkast:  { colorClass: 'green',  emoji: '', label: 'KK' },
  Onderkast:  { colorClass: 'blue',   emoji: '', label: 'OK' },
  Ladekast:   { colorClass: 'orange', emoji: '', label: 'LK' },
};

// Custom cabinet types (dropdown-based)
export const CUSTOM_CABINET_TYPES = [
  { id: 'Vaatwasserdeur', label: 'Vaatwasserdeur', colorClass: 'rose' },
  { id: 'Onderkast Schuifdeur', label: 'Onderkast Schuifdeur', colorClass: 'teal' },
  { id: 'Kolomkast Schuifdeur', label: 'Kolomkast Schuifdeur', colorClass: 'green' },
  { id: 'Tablet', label: 'Tablet', colorClass: 'amber' },
];

// Schuifdeur options
export const SCHUIFDEUR_DEMPING = [
  { id: 'geen', label: 'Zonder demping' },
  { id: '1_zijde', label: '1 zijde demping' },
  { id: '2_zijden', label: '2 zijden demping' },
];

export const SCHUIFDEUR_PROFIEL = [
  { id: '2_5m', label: '2.5m' },
  { id: '3_5m', label: '3.5m' },
];

// Default schuifbeslag pricing (loaded from admin_settings, these are fallbacks)
export const defaultSchuifbeslagPrijzen = {
  systeem_licht: { geen: 45, '1_zijde': 65, '2_zijden': 85 },
  systeem_zwaar: { geen: 75, '1_zijde': 105, '2_zijden': 135 },
  bovenprofiel_licht: { '2_5m': 25, '3_5m': 35 },
  bovenprofiel_zwaar: { '2_5m': 40, '3_5m': 55 },
  onderprofiel: { '2_5m': 30, '3_5m': 42 },
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
