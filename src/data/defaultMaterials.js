// Default materials for kitchen cabinet configurator

export const defaultMateriaalBinnenkast = [
  { naam: 'M18 Wit', afmeting: '2800 x 2070', breedte: 2800, hoogte: 2070, prijs: 7.7 },
  { naam: 'M18 Zwart', afmeting: '2800 x 2070', breedte: 2800, hoogte: 2070, prijs: 9.3 },
  { naam: 'M18 Unikleur', afmeting: '2800 x 2070', breedte: 2800, hoogte: 2070, prijs: 10.5 },
  { naam: 'L18 Wit', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 24 },
  { naam: 'L18 Unikleur', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 30 },
  { naam: 'L18 Duur', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 40 }
];

export const defaultMateriaalBuitenzijde = [
  { naam: 'L18 Wit', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 24 },
  { naam: 'L18 Unikleur', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 30 },
  { naam: 'L18 Duur', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 40 }
];

export const defaultMateriaalTablet = [
  { naam: 'L18 Unikleur', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 30 },
  { naam: 'L18 Duur', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 40 },
  { naam: 'L36 Duur', afmeting: '3050 x 1300', breedte: 3050, hoogte: 1300, prijs: 45 }
];

// Default cabinet configurations
export const defaultBovenkast = {
  type: 'Bovenkast',
  hoogte: 600,
  breedte: 600,
  diepte: 350,
  aantalLeggers: 2,
  aantalLades: 0,
  aantalDeuren: 2,
  aantalTussensteunen: 0
};

export const defaultKolomkast = {
  type: 'Kolomkast',
  hoogte: 2100,
  breedte: 600,
  diepte: 600,
  aantalLeggers: 4,
  aantalLades: 0,
  aantalDeuren: 2,
  aantalTussensteunen: 0
};

export const defaultOnderkast = {
  type: 'Onderkast',
  hoogte: 900,
  breedte: 600,
  diepte: 600,
  aantalLeggers: 1,
  aantalLades: 0,
  aantalDeuren: 2,
  aantalTussensteunen: 0
};

export const defaultLadekast = {
  type: 'Ladekast',
  hoogte: 900,
  breedte: 600,
  diepte: 600,
  aantalLeggers: 0,
  aantalLades: 3,
  aantalDeuren: 0,
  aantalTussensteunen: 0
};

export const defaultOpenNisHPL = {
  type: 'Open Nis HPL',
  hoogte: 900,
  breedte: 600,
  diepte: 600,
  aantalLeggers: 2,
  aantalLades: 0,
  aantalDeuren: 0,
  aantalTussensteunen: 0,
  hplMateriaal: 0,
  complexiteit: 'gemiddeld', // heel_gemakkelijk (1u), gemakkelijk (2u), gemiddeld (3u), moeilijk (4u), heel_moeilijk (6u)
  hplOnderdelen: {
    LZ: false,
    RZ: false,
    BK: false,
    OK: false,
    RUG: false
  }
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
