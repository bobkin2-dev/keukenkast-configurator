// Calculation utilities for kitchen cabinet configurator

// Constants to avoid magic numbers
const HINGE_THRESHOLDS = {
  THRESHOLD_1000: { min: 1000, max: 1700, hinges: 3 },
  THRESHOLD_1700: { min: 1700, max: 2200, hinges: 4 },
  THRESHOLD_2200: { min: 2200, max: 2400, hinges: 5 },
  THRESHOLD_2400: { min: 2400, max: 2600, hinges: 6 },
  THRESHOLD_2600: { min: 2600, max: Infinity, hinges: 7 },
  DEFAULT_HINGES: 2
};

const PROFIEL_BK_MULTIPLIER = 1.2;
const MINUTES_PER_HOUR = 60;
const MM_TO_M_DIVISOR = 1000;
const MM2_TO_M2_DIVISOR = 1000000;
const TEKENWERK_MINUTES_PER_KAST = 15;
const TRANSPORT_MINIMUM_HOURS = 0.5;
const TRANSPORT_HOURS_PER_KAST = 0.1;

// Helper function to calculate hinges per door based on height
const calculateHingesPerDoor = (doorHeight) => {
  if (doorHeight >= HINGE_THRESHOLDS.THRESHOLD_2600.min) return HINGE_THRESHOLDS.THRESHOLD_2600.hinges;
  if (doorHeight >= HINGE_THRESHOLDS.THRESHOLD_2400.min) return HINGE_THRESHOLDS.THRESHOLD_2400.hinges;
  if (doorHeight >= HINGE_THRESHOLDS.THRESHOLD_2200.min) return HINGE_THRESHOLDS.THRESHOLD_2200.hinges;
  if (doorHeight >= HINGE_THRESHOLDS.THRESHOLD_1700.min) return HINGE_THRESHOLDS.THRESHOLD_1700.hinges;
  if (doorHeight >= HINGE_THRESHOLDS.THRESHOLD_1000.min) return HINGE_THRESHOLDS.THRESHOLD_1000.hinges;
  return HINGE_THRESHOLDS.DEFAULT_HINGES;
};

// Safe array access with bounds checking
const safeArrayAccess = (array, index, defaultValue = null) => {
  if (!array || index < 0 || index >= array.length) {
    console.warn(`Array index ${index} out of bounds for array of length ${array?.length || 0}`);
    return defaultValue || array?.[0] || { breedte: 1000, hoogte: 1000, prijs: 0 };
  }
  return array[index];
};

// Safe division to prevent division by zero
const safeDivide = (numerator, denominator, defaultValue = 0) => {
  if (!denominator || denominator === 0) return defaultValue;
  return numerator / denominator;
};

export const berekenTotalen = (
  kastenLijst,
  rendementBinnenzijde,
  rendementBuitenzijde,
  alternatieveMateriaal,
  materiaalBinnenkast,
  materiaalBuitenzijde,
  materiaalTablet,
  geselecteerdMateriaalBinnen,
  geselecteerdMateriaalBuiten,
  geselecteerdMateriaalTablet
) => {
  // Validate inputs
  if (!kastenLijst || !Array.isArray(kastenLijst)) {
    kastenLijst = [];
  }

  let totalen = {
    m2Binnenkast: 0,
    m2Rug: 0,
    m2Leggers: 0,
    m2Buitenzijde: 0,
    m2Tablet: 0,
    kantenbandStandaard: 0,
    kantenbandSpeciaal: 0,
    kastpootjes: 0,
    scharnieren110: 0,
    scharnieren170: 0,
    profielBK: 0,
    ophangsysteemBK: 0,
    ladenStandaard: 0,
    ladenGoedkoper: 0,
    handgrepen: 0
  };

  // Safe efficiency calculations with fallback
  const afvalfactorBinnen = safeDivide(100, rendementBinnenzijde || 75, 1.33);
  const afvalfactorBuiten = safeDivide(100, rendementBuitenzijde || 70, 1.43);

  kastenLijst.forEach(kast => {
    const {
      hoogte = 0,
      breedte = 0,
      diepte = 0,
      aantalLeggers = 0,
      aantalDeuren = 0,
      aantalLades = 0,
      aantalTussensteunen = 0,
      type,
      isZijpaneel,
      hplOnderdelen
    } = kast;

    // Skip if dimensions are invalid
    if (hoogte <= 0 || breedte <= 0) return;

    if (isZijpaneel) {
      const oppBuitenzijde = (breedte * hoogte) / MM2_TO_M2_DIVISOR * afvalfactorBuiten;
      totalen.m2Buitenzijde += oppBuitenzijde;
      const afplakken = (2 * breedte + 2 * hoogte) / MM_TO_M_DIVISOR;
      totalen.kantenbandStandaard += afplakken;
      return;
    }

    if (type === 'Open Nis HPL' && hplOnderdelen) {
      let kantenbandHPL = 0;

      if (hplOnderdelen.LZ) kantenbandHPL += hoogte / MM_TO_M_DIVISOR;
      if (hplOnderdelen.RZ) kantenbandHPL += hoogte / MM_TO_M_DIVISOR;
      if (hplOnderdelen.BK) kantenbandHPL += breedte / MM_TO_M_DIVISOR;
      if (hplOnderdelen.OK) kantenbandHPL += breedte / MM_TO_M_DIVISOR;

      if (aantalDeuren > 0) {
        totalen.handgrepen += aantalDeuren;
        const scharnierenPerDeur = calculateHingesPerDoor(hoogte);
        totalen.scharnieren110 += aantalDeuren * scharnierenPerDeur;
        kantenbandHPL += (hoogte * 2 * aantalDeuren) / MM_TO_M_DIVISOR;
      }

      if (aantalLeggers > 0) {
        const oppLeggers = (breedte * diepte * aantalLeggers) / MM2_TO_M2_DIVISOR * afvalfactorBinnen;
        totalen.m2Leggers += oppLeggers;
        kantenbandHPL += (breedte * aantalLeggers) / MM_TO_M_DIVISOR;
      }

      if (aantalTussensteunen > 0) {
        kantenbandHPL += (hoogte * aantalTussensteunen) / MM_TO_M_DIVISOR;
      }

      totalen.kantenbandStandaard += kantenbandHPL;
      return;
    }

    // Normal cabinet calculations
    // Formula: (depth × height × (2 sides + supports)) + (width × depth × 2 for top/bottom)
    const oppBinnenkast = (
      (diepte * hoogte * (2 + aantalTussensteunen)) +
      (breedte * diepte * 2)
    ) / MM2_TO_M2_DIVISOR * afvalfactorBinnen;
    totalen.m2Binnenkast += oppBinnenkast;

    if (aantalLeggers > 0) {
      const oppLeggers = (breedte * diepte * aantalLeggers) / MM2_TO_M2_DIVISOR * afvalfactorBinnen;
      totalen.m2Leggers += oppLeggers;
    }

    const oppRug = (breedte * hoogte) / MM2_TO_M2_DIVISOR * afvalfactorBinnen;
    totalen.m2Rug += oppRug;

    if (aantalDeuren > 0) {
      const oppBuitenzijde = (breedte * hoogte) / MM2_TO_M2_DIVISOR * afvalfactorBuiten;
      totalen.m2Buitenzijde += oppBuitenzijde;

      // Calculate hinges using helper function
      const scharnierenPerDeur = calculateHingesPerDoor(hoogte);
      totalen.scharnieren110 += aantalDeuren * scharnierenPerDeur;
    }

    if (type === 'Onderkast' || type === 'Ladekast') {
      if (breedte < 601) totalen.kastpootjes += 4;
      else if (breedte < 1201) totalen.kastpootjes += 6;
      else totalen.kastpootjes += Math.ceil(breedte / 600) * 2 + 2;
    }

    const afplakken = (
      (breedte * (2 + aantalLeggers)) +
      (hoogte * (2 + aantalTussensteunen)) +
      (hoogte * 2 * aantalDeuren) +
      (breedte * 2)
    ) / MM_TO_M_DIVISOR;
    totalen.kantenbandStandaard += afplakken;

    if (type === 'Bovenkast') {
      totalen.profielBK += (breedte / MM_TO_M_DIVISOR) * PROFIEL_BK_MULTIPLIER;
      totalen.ophangsysteemBK += 2;
    }

    totalen.handgrepen += aantalDeuren + aantalLades;

    // Drawer calculation - use standard drawers (ladenGoedkoper can be set via UI toggle if needed)
    if (aantalLades > 0) {
      totalen.ladenStandaard += aantalLades;
    }
  });

  // Calculate plate counts with safe array access
  const binnenMat = safeArrayAccess(materiaalBinnenkast, geselecteerdMateriaalBinnen);
  const m2PerPlaatBinnen = (binnenMat.breedte / MM_TO_M_DIVISOR) * (binnenMat.hoogte / MM_TO_M_DIVISOR);

  let totaalM2Binnenkast = totalen.m2Binnenkast;

  if (!alternatieveMateriaal?.ruggenGebruiken) {
    totaalM2Binnenkast += totalen.m2Rug;
  }

  if (!alternatieveMateriaal?.leggersGebruiken) {
    totaalM2Binnenkast += totalen.m2Leggers;
  }

  totalen.platenBinnenkast = m2PerPlaatBinnen > 0 ? Math.ceil(totaalM2Binnenkast / m2PerPlaatBinnen) : 0;

  if (alternatieveMateriaal?.ruggenGebruiken) {
    const rugMat = safeArrayAccess(materiaalBinnenkast, alternatieveMateriaal.ruggenMateriaal);
    const m2PerPlaatRug = (rugMat.breedte / MM_TO_M_DIVISOR) * (rugMat.hoogte / MM_TO_M_DIVISOR);
    totalen.platenRug = m2PerPlaatRug > 0 ? Math.ceil(totalen.m2Rug / m2PerPlaatRug) : 0;
  } else {
    totalen.platenRug = 0;
  }

  if (alternatieveMateriaal?.leggersGebruiken) {
    const leggerMat = safeArrayAccess(materiaalBinnenkast, alternatieveMateriaal.leggersMateriaal);
    const m2PerPlaatLeggers = (leggerMat.breedte / MM_TO_M_DIVISOR) * (leggerMat.hoogte / MM_TO_M_DIVISOR);
    totalen.platenLeggers = m2PerPlaatLeggers > 0 ? Math.ceil(totalen.m2Leggers / m2PerPlaatLeggers) : 0;
  } else {
    totalen.platenLeggers = 0;
  }

  const buitenMat = safeArrayAccess(materiaalBuitenzijde, geselecteerdMateriaalBuiten);
  const m2PerPlaatBuiten = (buitenMat.breedte / MM_TO_M_DIVISOR) * (buitenMat.hoogte / MM_TO_M_DIVISOR);
  totalen.platenBuitenzijde = m2PerPlaatBuiten > 0 ? Math.ceil(totalen.m2Buitenzijde / m2PerPlaatBuiten) : 0;

  // Calculate tablet plates per material type
  const tabletPerMateriaal = {};

  kastenLijst.forEach(kast => {
    if (kast.type === 'Open Nis HPL' && kast.hplMateriaal !== undefined) {
      const matIndex = kast.hplMateriaal;
      if (!tabletPerMateriaal[matIndex]) tabletPerMateriaal[matIndex] = 0;

      const { hoogte = 0, breedte = 0, diepte = 0, aantalDeuren = 0, hplOnderdelen } = kast;
      const afvalfactorBuitenLocal = safeDivide(100, rendementBuitenzijde || 70, 1.43);
      let m2VoorDezeKast = 0;

      if (hplOnderdelen) {
        if (hplOnderdelen.LZ) m2VoorDezeKast += (hoogte * diepte) / MM2_TO_M2_DIVISOR * afvalfactorBuitenLocal;
        if (hplOnderdelen.RZ) m2VoorDezeKast += (hoogte * diepte) / MM2_TO_M2_DIVISOR * afvalfactorBuitenLocal;
        if (hplOnderdelen.BK) m2VoorDezeKast += (breedte * diepte) / MM2_TO_M2_DIVISOR * afvalfactorBuitenLocal;
        if (hplOnderdelen.OK) m2VoorDezeKast += (breedte * diepte) / MM2_TO_M2_DIVISOR * afvalfactorBuitenLocal;
        if (hplOnderdelen.RUG) m2VoorDezeKast += (breedte * hoogte) / MM2_TO_M2_DIVISOR * afvalfactorBuitenLocal;
      }

      if (aantalDeuren > 0) {
        m2VoorDezeKast += (breedte * hoogte) / MM2_TO_M2_DIVISOR * afvalfactorBuitenLocal;
      }

      tabletPerMateriaal[matIndex] += m2VoorDezeKast;
    }
  });

  let totaalPlatenTablet = 0;
  Object.entries(tabletPerMateriaal).forEach(([matIndex, m2]) => {
    const mat = safeArrayAccess(materiaalTablet, parseInt(matIndex));
    if (mat) {
      const m2PerPlaat = (mat.breedte / MM_TO_M_DIVISOR) * (mat.hoogte / MM_TO_M_DIVISOR);
      if (m2PerPlaat > 0) {
        totaalPlatenTablet += Math.ceil(m2 / m2PerPlaat);
      }
    }
  });

  const m2TabletReguliereKasten = totalen.m2Tablet - Object.values(tabletPerMateriaal).reduce((sum, m2) => sum + m2, 0);
  if (m2TabletReguliereKasten > 0) {
    const tabletMat = safeArrayAccess(materiaalTablet, geselecteerdMateriaalTablet);
    const m2PerPlaatTablet = (tabletMat.breedte / MM_TO_M_DIVISOR) * (tabletMat.hoogte / MM_TO_M_DIVISOR);
    if (m2PerPlaatTablet > 0) {
      totaalPlatenTablet += Math.ceil(m2TabletReguliereKasten / m2PerPlaatTablet);
    }
  }

  totalen.platenTablet = totaalPlatenTablet;

  return totalen;
};

export const berekenArbeid = (kastenLijst, totalen, arbeidParameters) => {
  // Validate inputs
  if (!kastenLijst || !Array.isArray(kastenLijst)) {
    kastenLijst = [];
  }
  if (!totalen) {
    totalen = { platenBinnenkast: 0, platenRug: 0, platenLeggers: 0, platenBuitenzijde: 0, platenTablet: 0, kantenbandStandaard: 0, handgrepen: 0 };
  }
  if (!arbeidParameters) {
    arbeidParameters = { platenPerUur: 4, afplakkenPerUur: 50, minutenPerDeur: 5, minutenMontagePerKast: 30, minutenPerZijpaneel: 10, plaatsingPerKast: 0.5, transport: 2 };
  }

  const totaalPlaten = (totalen.platenBinnenkast || 0) + (totalen.platenRug || 0) +
    (totalen.platenLeggers || 0) + (totalen.platenBuitenzijde || 0) +
    (totalen.platenTablet || 0);

  const aantalZijpanelen = kastenLijst.filter(k => k.isZijpaneel).length;
  const aantalReguliereKasten = kastenLijst.filter(k => !k.isZijpaneel).length;

  // Count total appliances (each appliance adds 1 hour of work)
  const aantalToestellen = kastenLijst.reduce((sum, k) => sum + (k.aantalToestellen || 0), 0);

  const tekenwerk = (aantalReguliereKasten * TEKENWERK_MINUTES_PER_KAST) / MINUTES_PER_HOUR;

  const urenPlatenVerwerken = safeDivide(totaalPlaten, arbeidParameters.platenPerUur || 4);
  const urenAfplakken = safeDivide(totalen.kantenbandStandaard || 0, arbeidParameters.afplakkenPerUur || 50);
  const urenDeuren = ((totalen.handgrepen || 0) * (arbeidParameters.minutenPerDeur || 5)) / MINUTES_PER_HOUR;
  const urenMontage = (kastenLijst.length * (arbeidParameters.minutenMontagePerKast || 30)) / MINUTES_PER_HOUR;
  const urenZijpanelen = (aantalZijpanelen * (arbeidParameters.minutenPerZijpaneel || 10)) / MINUTES_PER_HOUR;
  const urenToestellen = aantalToestellen; // 1 hour per appliance

  const montageWerkhuis = urenPlatenVerwerken + urenAfplakken + urenDeuren + urenMontage + urenZijpanelen + urenToestellen;
  const plaatsing = kastenLijst.length * (arbeidParameters.plaatsingPerKast || 0.5);

  // Use transport parameter if provided, otherwise calculate based on number of cabinets
  const transport = arbeidParameters.transport !== undefined
    ? arbeidParameters.transport
    : Math.max(TRANSPORT_MINIMUM_HOURS, aantalReguliereKasten * TRANSPORT_HOURS_PER_KAST);

  return {
    tekenwerk,
    montageWerkhuis,
    plaatsing,
    transport
  };
};
