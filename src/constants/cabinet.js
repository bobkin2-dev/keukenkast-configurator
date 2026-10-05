// Cabinet type constants - single source of truth

// Color mapping for Tailwind (must use complete class names to avoid tree-shaking).
// Calm style: white cards; the type colour is only used for the title + a small label (badge),
// buttons share one primary style.
export const colorStyles = {
  purple: {
    bg: 'bg-white',
    border: 'border-gray-200',
    button: 'bg-slate-800 hover:bg-slate-900',
    title: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800'
  },
  green: {
    bg: 'bg-white',
    border: 'border-gray-200',
    button: 'bg-slate-800 hover:bg-slate-900',
    title: 'text-green-700',
    badge: 'bg-green-100 text-green-800'
  },
  blue: {
    bg: 'bg-white',
    border: 'border-gray-200',
    button: 'bg-slate-800 hover:bg-slate-900',
    title: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800'
  },
  orange: {
    bg: 'bg-white',
    border: 'border-gray-200',
    button: 'bg-slate-800 hover:bg-slate-900',
    title: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-800'
  },
  teal: {
    bg: 'bg-white',
    border: 'border-gray-200',
    button: 'bg-slate-800 hover:bg-slate-900',
    title: 'text-teal-700',
    badge: 'bg-teal-100 text-teal-800'
  },
  rose: {
    bg: 'bg-white',
    border: 'border-gray-200',
    button: 'bg-slate-800 hover:bg-slate-900',
    title: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800'
  },
  slate: {
    bg: 'bg-white',
    border: 'border-gray-200',
    button: 'bg-slate-800 hover:bg-slate-900',
    title: 'text-slate-700',
    badge: 'bg-slate-200 text-slate-800'
  },
  amber: {
    bg: 'bg-white',
    border: 'border-gray-200',
    button: 'bg-slate-800 hover:bg-slate-900',
    title: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800'
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
  { id: 'Vaatwasserdeur', label: 'Vaatwasserdeur', colorClass: 'rose', short: 'VW' },
  { id: 'Onderkast Schuifdeur', label: 'Onderkast Schuifdeur', colorClass: 'teal', short: 'OS' },
  { id: 'Kolomkast Schuifdeur', label: 'Kolomkast Schuifdeur', colorClass: 'green', short: 'KS' },
  { id: 'Tablet', label: 'Tablet', colorClass: 'amber', short: 'TB' },
];

// Colour + short label for any kast (used for the type badge in configurators and lists)
export const getKastTypeStijl = (kast) => {
  if (kast?.isZijpaneel) return { short: 'ZP', styles: colorStyles.slate };
  const type = kast?.type;
  if (CABINET_TYPE_CONFIG[type]) {
    const c = CABINET_TYPE_CONFIG[type];
    return { short: c.label, styles: colorStyles[c.colorClass] };
  }
  const custom = CUSTOM_CABINET_TYPES.find(t => t.id === type);
  if (custom) return { short: custom.short, styles: colorStyles[custom.colorClass] };
  if (type === 'Vrije Kast' || type === 'Open Nis HPL') return { short: 'VK', styles: colorStyles.slate };
  return { short: '?', styles: colorStyles.slate };
};

// Small coloured label, e.g. "BK"
export const typeBadgeClass = 'inline-block text-[10px] font-bold leading-none px-1.5 py-1 rounded';

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
