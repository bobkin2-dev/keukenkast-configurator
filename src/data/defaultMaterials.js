// Default materials for kitchen cabinet configurator
// Unified plate materials table with popular use categories

export const defaultPlaatMaterialen = [
  { id: 1, naam: 'M18 Wit', afmeting: '2800 x 2070', breedte: 2800, hoogte: 2070, prijs: 7.7, binnenkast: true, buitenzijde: false, tablet: false },
  { id: 2, naam: 'M18 Zwart', afmeting: '2800 x 2070', breedte: 2800, hoogte: 2070, prijs: 9.3, binnenkast: true, buitenzijde: false, tablet: false },
  { id: 3, naam: 'M18 Unikleur', afmeting: '2800 x 2070', breedte: 2800, hoogte: 2070, prijs: 10.5, binnenkast: true, buitenzijde: false, tablet: false },
  { id: 4, naam: 'L18 Wit', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 24, binnenkast: true, buitenzijde: true, tablet: false },
  { id: 5, naam: 'L18 Unikleur', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 30, binnenkast: true, buitenzijde: true, tablet: true },
  { id: 6, naam: 'L18 Duur', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 40, binnenkast: true, buitenzijde: true, tablet: true },
  { id: 7, naam: 'L36 Duur', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 45, binnenkast: false, buitenzijde: false, tablet: true }
];

// Helper: filter materials by popular use, sorted with popular ones first
export const getMateriaalVoor = (materialen, categorie) => {
  // Popular materials for this category come first, then others
  const popular = materialen.filter(m => m[categorie]);
  const overig = materialen.filter(m => !m[categorie]);
  return { popular, overig, all: [...popular, ...overig] };
};

// Legacy exports for backward compatibility (derived from unified table)
export const defaultMateriaalBinnenkast = defaultPlaatMaterialen.filter(m => m.binnenkast);
export const defaultMateriaalBuitenzijde = defaultPlaatMaterialen.filter(m => m.buitenzijde);
export const defaultMateriaalTablet = defaultPlaatMaterialen.filter(m => m.tablet);

// Default cabinet configurations
export const defaultBovenkast = {
  type: 'Bovenkast',
  hoogte: 600,
  breedte: 600,
  diepte: 350,
  aantalLeggers: 2,
  aantalLades: 0,
  aantalDeuren: 1,
  aantalTussensteunen: 0,
  isOpen: false
};

export const defaultKolomkast = {
  type: 'Kolomkast',
  hoogte: 2100,
  breedte: 600,
  diepte: 600,
  aantalLeggers: 4,
  aantalLades: 0,
  aantalDeuren: 1,
  aantalTussensteunen: 0,
  isOpen: false
};

export const defaultOnderkast = {
  type: 'Onderkast',
  hoogte: 900,
  breedte: 600,
  diepte: 600,
  aantalLeggers: 1,
  aantalLades: 0,
  aantalDeuren: 1,
  aantalTussensteunen: 0,
  isOpen: false
};

export const defaultLadekast = {
  type: 'Ladekast',
  hoogte: 900,
  breedte: 600,
  diepte: 600,
  aantalLeggers: 0,
  aantalLades: 3,
  aantalDeuren: 0,
  aantalTussensteunen: 0,
  isOpen: false
};

export const defaultVrijeKast = {
  type: 'Vrije Kast',
  naam: '',
  hoogte: 900,
  breedte: 600,
  diepte: 600,
  aantalLeggers: 2,
  aantalLades: 0,
  aantalDeuren: 0,
  aantalTussensteunen: 0,
  vrijeKastMateriaalId: null,  // stores material id from plaatMaterialen (null = first in list)
  complexiteit: 'gemiddeld',   // heel_gemakkelijk (1u), gemakkelijk (2u), gemiddeld (3u), moeilijk (4u), heel_moeilijk (6u)
  vrijeKastOnderdelen: {
    LZ: false,
    RZ: false,
    BK: false,
    OK: false,
    RUG: false
  }
};

// Backward compatibility alias
export const defaultOpenNisHPL = defaultVrijeKast;

// Default custom cabinet configurations
export const defaultCustomKast = {
  type: 'Vaatwasserdeur',
  hoogte: 700,
  breedte: 605,
  diepte: 600,
  aantalLeggers: 0,
  aantalLades: 0,
  aantalDeuren: 2,
  aantalTussensteunen: 0,
  isOpen: false,
  // Schuifdeur options (for Onderkast/Kolomkast Schuifdeur)
  schuifdeurDemping: 'geen',
  schuifdeurBovenprofiel: '2_5m',
  schuifdeurOnderprofiel: '2_5m',
  // Tablet options
  spatwand: false,
};

// Default accessoires
export const defaultAccessoires = {
  afplakkenStandaard: 1.5,
  afplakkenSpeciaal: 3,
  kastpootjes: 0.8,
  scharnierType: '110',
  scharnier110: 3.05,
  scharnier170: 6.66,
  profielBK: 3,
  ophangsysteemBK: 2,
  ladeType: 'standaard',
  ladeStandaard: 100,
  ladeGroteHoeveelheid: 50,
  handgrepen: 10
};

// Default extra beslag
export const defaultExtraBeslag = {
  led: 0,
  prijsLed: 35,
  handdoekdrager: 0,
  prijsHanddoekdrager: 16.5,
  alubodem600: 0,
  prijsAlubodem600: 7,
  alubodem1200: 0,
  prijsAlubodem1200: 14,
  vuilbaksysteem: 0,
  prijsVuilbaksysteem: 170,
  bestekbak: 0,
  prijsBestekbak: 14,
  slot: 0,
  prijsSlot: 10,
  cylinderslot: 0,
  prijsCylinderslot: 25
};

// Default arbeid parameters
export const defaultArbeidParameters = {
  platenPerUur: 10,
  afplakkenPerUur: 50,
  minutenPerDeur: 15,
  minutenMontagePerKast: 30,
  minutenPerZijpaneel: 15,
  plaatsingPerKast: 0.5,
  transport: 2
};

// Keukentoestellen types
export const TOESTEL_TYPES = [
  { id: 'spoelbak_enkel', naam: 'Spoelbak 1x' },
  { id: 'spoelbak_afdruip', naam: 'Spoelbak 1x met afdruip' },
  { id: 'spoelbak_1_5_afdruip', naam: 'Spoelbak 1+0.5 met afdruip' },
  { id: 'kraan', naam: 'Kraan standaard' },
  { id: 'koelkast_onderbouw', naam: 'Koelkast onderbouw' },
  { id: 'koelkast_178', naam: 'Koelkast 178 cm' },
  { id: 'microgolf', naam: 'Microgolf' },
  { id: 'oven', naam: 'Oven' },
  { id: 'combi_oven', naam: 'Combi-oven' },
  { id: 'vaatwasser', naam: 'Vaatwasser' },
];

export const TOESTEL_TIERS = [
  { id: 'budget', label: 'Budget (Whirlpool)' },
  { id: 'medium', label: 'Medium (AEG)' },
  { id: 'high-end', label: 'High-end (Siemens)' },
];

// Default keukentoestellen (empty selection per project)
export const defaultKeukentoestellen = {};

// Default admin pricing for keukentoestellen
export const defaultToestellenPrijzen = Object.fromEntries(
  TOESTEL_TYPES.map(t => [t.id, { budget: 0, medium: 0, 'high-end': 0 }])
);
