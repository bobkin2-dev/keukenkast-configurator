// Cabinet type constants - single source of truth

// Color mapping for Tailwind (must use complete class names to avoid tree-shaking).
// Calm style: white cards; the type colour is only a top edge, buttons share one primary style.
export const colorStyles = {
  purple: {
    bg: 'bg-white',
    border: 'border-gray-200 border-t-4 border-t-purple-400',
    button: 'bg-slate-800 hover:bg-slate-900'
  },
  green: {
    bg: 'bg-white',
    border: 'border-gray-200 border-t-4 border-t-green-400',
    button: 'bg-slate-800 hover:bg-slate-900'
  },
  blue: {
    bg: 'bg-white',
    border: 'border-gray-200 border-t-4 border-t-blue-400',
    button: 'bg-slate-800 hover:bg-slate-900'
  },
  orange: {
    bg: 'bg-white',
    border: 'border-gray-200 border-t-4 border-t-orange-400',
    button: 'bg-slate-800 hover:bg-slate-900'
  },
  teal: {
    bg: 'bg-white',
    border: 'border-gray-200 border-t-4 border-t-teal-400',
    button: 'bg-slate-800 hover:bg-slate-900'
  },
  rose: {
    bg: 'bg-white',
    border: 'border-gray-200 border-t-4 border-t-rose-400',
    button: 'bg-slate-800 hover:bg-slate-900'
  },
  amber: {
    bg: 'bg-white',
    border: 'border-gray-200 border-t-4 border-t-amber-400',
    button: 'bg-slate-800 hover:bg-slate-900'
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
export const VRIJE_KAST_ONDERDELEN = ['LZ', 'RZ', 'BK', 'OK', 'RUG', 'VK'];
