// Calculation utilities for kitchen cabinet configurator
// Now delegates to kastCalculator.js for per-cabinet calculations (single source of truth)

import { berekenAlleKasten, convertToFlatTotalen } from './kastCalculator';

// Constants for arbeid calculation
const MINUTES_PER_HOUR = 60;
const TEKENWERK_MINUTES_PER_KAST = 15;
const TRANSPORT_MINIMUM_HOURS = 0.5;
const TRANSPORT_HOURS_PER_KAST = 0.1;

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

  // Calculate waste factors
  const afvalfactorBinnen = safeDivide(100, rendementBinnenzijde || 75, 1.33);
  const afvalfactorBuiten = safeDivide(100, rendementBuitenzijde || 70, 1.43);

  // Use kastCalculator for all per-cabinet calculations
  const { totalen: aggTotalen } = berekenAlleKasten(kastenLijst, {
    afvalfactorBinnen,
    afvalfactorBuiten
  });

  // Convert to flat format with plate counts
  const flat = convertToFlatTotalen(
    aggTotalen,
    { materiaalBinnenkast, materiaalBuitenzijde, materiaalTablet },
    { geselecteerdMateriaalBinnen, geselecteerdMateriaalBuiten, geselecteerdMateriaalTablet },
    alternatieveMateriaal
  );

  return flat;
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
