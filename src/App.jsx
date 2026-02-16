import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

// Data imports
import {
  defaultMateriaalBinnenkast,
  defaultMateriaalBuitenzijde,
  defaultMateriaalTablet,
  defaultBovenkast,
  defaultKolomkast,
  defaultOnderkast,
  defaultLadekast,
  defaultOpenNisHPL,
  defaultAccessoires,
  defaultExtraBeslag,
  defaultArbeidParameters
} from './data/defaultMaterials';

// Utility imports
import { berekenTotalen, berekenArbeid } from './utils/calculations';

// Component imports
import MaterialenPanel from './components/MaterialenPanel';
import AccessoiresPanel from './components/AccessoiresPanel';
import KastConfigurator from './components/KastConfigurator';
import KastenLijst from './components/KastenLijst';
import TotalenOverzicht from './components/TotalenOverzicht';
import DebugTabel from './components/DebugTabel';
import ExtraBeslag from './components/ExtraBeslag';
import AdminSettings from './components/Admin/AdminSettings';
import { DEFAULT_PRODUCTION_PARAMS } from './components/Admin/AdminSettings';

// Supabase
import { db, supabase } from './lib/supabase';

const ADMIN_EMAIL = 'robin@merger.be';

const KeukenKastInvoer = ({ user, projectId, initialData, onBackToHome, onLogout }) => {
  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Admin state
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [productionParams, setProductionParams] = useState(DEFAULT_PRODUCTION_PARAMS);
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Project info - initialize from initialData if available
  const [projectInfo, setProjectInfo] = useState({
    project: initialData?.name || '',
    meubelnummer: initialData?.meubelnummer || ''
  });

  // Materials state
  const [materiaalBinnenkast, setMateriaalBinnenkast] = useState(defaultMateriaalBinnenkast);
  const [materiaalBuitenzijde, setMateriaalBuitenzijde] = useState(defaultMateriaalBuitenzijde);
  const [materiaalTablet, setMateriaalTablet] = useState(defaultMateriaalTablet);

  // Selected materials
  const [geselecteerdMateriaalBinnen, setGeselecteerdMateriaalBinnen] = useState(0);
  const [geselecteerdMateriaalBuiten, setGeselecteerdMateriaalBuiten] = useState(0);
  const [geselecteerdMateriaalTablet, setGeselecteerdMateriaalTablet] = useState(0);

  // Efficiency percentages
  const [rendementBinnenzijde, setRendementBinnenzijde] = useState(75);
  const [rendementBuitenzijde, setRendementBuitenzijde] = useState(70);
  const [toonRendementParameters, setToonRendementParameters] = useState(false);

  // Labor parameters
  const [toonArbeidParameters, setToonArbeidParameters] = useState(false);
  const [toonDebugTabel, setToonDebugTabel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [arbeidParameters, setArbeidParameters] = useState(defaultArbeidParameters);

  // Refs for timeout cleanup
  const notificationTimeoutsRef = useRef([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      notificationTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, []);

  // Price adjustment panels
  const [showPrijsAanpassing, setShowPrijsAanpassing] = useState({
    binnen: false,
    buiten: false,
    tablet: false
  });

  // Alternative materials
  const [alternatieveMateriaal, setAlternatieveMateriaal] = useState({
    ruggenGebruiken: false,
    ruggenMateriaal: 0,
    leggersGebruiken: false,
    leggersMateriaal: 0
  });

  // Accessories state
  const [accessoires, setAccessoires] = useState(defaultAccessoires);

  const updateAccessoire = (field, value) => {
    setAccessoires(prev => ({ ...prev, [field]: value }));
  };

  // Cabinets list - initialize from initialData if available
  const [kastenLijst, setKastenLijst] = useState(
    initialData?.cabinets?.map(c => c.config) || []
  );

  // Extra hardware
  const [extraBeslag, setExtraBeslag] = useState(defaultExtraBeslag);

  // Current cabinet state
  const [huidigKast, setHuidigKast] = useState({
    type: 'Bovenkast',
    hoogte: 600,
    breedte: 600,
    diepte: 350,
    aantalLeggers: 2,
    aantalLades: 0,
    aantalDeuren: 2,
    aantalTussensteunen: 0
  });

  // Individual cabinet states
  const [bovenkast, setBovenkast] = useState(defaultBovenkast);
  const [kolomkast, setKolomkast] = useState(defaultKolomkast);
  const [onderkast, setOnderkast] = useState(defaultOnderkast);
  const [ladekast, setLadekast] = useState(defaultLadekast);
  const [openNisHPL, setOpenNisHPL] = useState(defaultOpenNisHPL);

  // Add cabinet function
  const voegKastToe = (kastData) => {
    const nieuweKast = {
      ...kastData,
      id: Date.now(),
      timestamp: new Date().toLocaleString()
    };
    setKastenLijst(prev => [...prev, nieuweKast]);

    // Add notification
    const notificationId = Date.now();
    const dimensions = `${kastData.hoogte}×${kastData.breedte}×${kastData.diepte}`;
    setNotifications(prev => [...prev, {
      id: notificationId,
      text: `${kastData.type} toegevoegd - ${dimensions}`
    }]);

    // Remove notification after 3 seconds (with cleanup)
    const timeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      notificationTimeoutsRef.current = notificationTimeoutsRef.current.filter(id => id !== timeoutId);
    }, 3000);
    notificationTimeoutsRef.current.push(timeoutId);
  };

  // Add side panel function
  const voegZijpaneelToe = (kast) => {
    const zijpaneel = {
      type: `Zijpaneel (${kast.type})`,
      hoogte: kast.hoogte,
      breedte: kast.diepte,
      diepte: 18,
      aantalLeggers: 0,
      aantalLades: 0,
      aantalDeuren: 0,
      aantalTussensteunen: 0,
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      isZijpaneel: true,
      parentId: kast.id
    };
    setKastenLijst(prev => [...prev, zijpaneel]);

    const notificationId = Date.now();
    const dimensions = `${zijpaneel.hoogte}×${zijpaneel.breedte}×${zijpaneel.diepte}`;
    setNotifications(prev => [...prev, {
      id: notificationId,
      text: `Zijpaneel (${kast.type}) toegevoegd - ${dimensions}`
    }]);

    // Remove notification after 3 seconds (with cleanup)
    const timeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      notificationTimeoutsRef.current = notificationTimeoutsRef.current.filter(id => id !== timeoutId);
    }, 3000);
    notificationTimeoutsRef.current.push(timeoutId);
  };

  const voegZijpaneelToeVoorType = (type, config) => {
    const zijpaneel = {
      type: `Zijpaneel ${type}`,
      hoogte: config.hoogte,
      breedte: config.diepte,
      diepte: 18,
      aantalLeggers: 0,
      aantalLades: 0,
      aantalDeuren: 0,
      aantalTussensteunen: 0,
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      isZijpaneel: true
    };
    setKastenLijst(prev => [...prev, zijpaneel]);
  };

  // Remove cabinet function
  const verwijderKast = (id) => {
    setKastenLijst(prev => prev.filter(kast => kast.id !== id));
  };

  // Material price update function
  const updateMateriaalPrijs = (type, index, field, value) => {
    const setters = {
      binnen: setMateriaalBinnenkast,
      buiten: setMateriaalBuitenzijde,
      tablet: setMateriaalTablet
    };

    const materials = {
      binnen: materiaalBinnenkast,
      buiten: materiaalBuitenzijde,
      tablet: materiaalTablet
    };

    const updated = [...materials[type]];
    if (field === 'prijs') {
      updated[index] = { ...updated[index], prijs: parseFloat(value) || 0 };
    } else if (field === 'breedte' || field === 'hoogte') {
      updated[index] = {
        ...updated[index],
        [field]: parseInt(value) || 0,
        afmeting: `${field === 'breedte' ? value : updated[index].breedte} x ${field === 'hoogte' ? value : updated[index].hoogte}`
      };
    }
    setters[type](updated);
  };

  // Calculate totals (memoized to prevent unnecessary recalculations)
  const totalen = useMemo(() => berekenTotalen(
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
  ), [
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
  ]);

  const arbeidUren = useMemo(() =>
    berekenArbeid(kastenLijst, totalen, arbeidParameters),
    [kastenLijst, totalen, arbeidParameters]
  );

  // Mark as having unsaved changes when data changes
  useEffect(() => {
    if (projectId) {
      setHasUnsavedChanges(true);
    }
  }, [kastenLijst, projectInfo, accessoires, extraBeslag, rendementBinnenzijde, rendementBuitenzijde]);

  // Save project function
  const handleSave = async () => {
    if (!projectId) return;

    setIsSaving(true);

    const settings = {
      materiaalBinnenkast,
      materiaalBuitenzijde,
      materiaalTablet,
      geselecteerdMateriaalBinnen,
      geselecteerdMateriaalBuiten,
      geselecteerdMateriaalTablet,
      rendementBinnenzijde,
      rendementBuitenzijde,
      accessoires,
      extraBeslag,
      arbeidParameters,
      alternatieveMateriaal
    };

    const { error } = await db.saveProjectState(projectId, projectInfo, settings, kastenLijst);

    if (error) {
      alert('Kon niet opslaan: ' + error.message);
    } else {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    }

    setIsSaving(false);
  };

  // Load settings from initialData
  useEffect(() => {
    if (initialData?.settings) {
      const s = initialData.settings;
      if (s.materiaalBinnenkast) setMateriaalBinnenkast(s.materiaalBinnenkast);
      if (s.materiaalBuitenzijde) setMateriaalBuitenzijde(s.materiaalBuitenzijde);
      if (s.materiaalTablet) setMateriaalTablet(s.materiaalTablet);
      if (s.geselecteerdMateriaalBinnen !== undefined) setGeselecteerdMateriaalBinnen(s.geselecteerdMateriaalBinnen);
      if (s.geselecteerdMateriaalBuiten !== undefined) setGeselecteerdMateriaalBuiten(s.geselecteerdMateriaalBuiten);
      if (s.geselecteerdMateriaalTablet !== undefined) setGeselecteerdMateriaalTablet(s.geselecteerdMateriaalTablet);
      if (s.rendementBinnenzijde) setRendementBinnenzijde(s.rendementBinnenzijde);
      if (s.rendementBuitenzijde) setRendementBuitenzijde(s.rendementBuitenzijde);
      if (s.accessoires) setAccessoires(s.accessoires);
      if (s.extraBeslag) setExtraBeslag(s.extraBeslag);
      if (s.arbeidParameters) setArbeidParameters(s.arbeidParameters);
      if (s.alternatieveMateriaal) setAlternatieveMateriaal(s.alternatieveMateriaal);
    }
    // Reset unsaved changes after loading
    setHasUnsavedChanges(false);
  }, [initialData]);

  // Load production params from Supabase
  useEffect(() => {
    const loadProductionParams = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('*')
          .eq('key', 'production_params')
          .single();

        if (data && !error) {
          setProductionParams({ ...DEFAULT_PRODUCTION_PARAMS, ...data.value });
        }
      } catch (err) {
        console.log('Using default production params');
      }
    };
    loadProductionParams();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 p-2 rounded-lg transition"
                title="Terug naar projecten"
              >
                ← Terug
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Keukenkast Configurator</h1>
              {user && (
                <p className="text-sm text-gray-500">
                  {projectInfo.project || 'Nieuw Project'}
                  {hasUnsavedChanges && <span className="text-orange-500 ml-2">• Niet opgeslagen</span>}
                  {lastSaved && !hasUnsavedChanges && (
                    <span className="text-green-600 ml-2">
                      ✓ Opgeslagen om {lastSaved.toLocaleTimeString('nl-BE')}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            {projectId && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : hasUnsavedChanges
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isSaving ? '💾 Opslaan...' : '💾 Opslaan'}
              </button>
            )}
            <button
              onClick={() => setToonDebugTabel(!toonDebugTabel)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              Debug Tabel
              <span>{toonDebugTabel ? '▲' : '▼'}</span>
            </button>
            <button
              onClick={() => setToonRendementParameters(!toonRendementParameters)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              Rendement
              <span>{toonRendementParameters ? '▲' : '▼'}</span>
            </button>
            <button
              onClick={() => setToonArbeidParameters(!toonArbeidParameters)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              Arbeid Parameters
              <span>{toonArbeidParameters ? '▲' : '▼'}</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAdminSettings(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                title="Admin Instellingen"
              >
                ⚙️ Admin
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
              >
                Uitloggen
              </button>
            )}
          </div>
        </div>

        {/* Rendement Parameters Panel */}
        {toonRendementParameters && (
          <div className="bg-yellow-50 p-4 rounded-lg mb-4 border-2 border-yellow-200">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Rendement Materialen</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Rendement Binnenzijde (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={rendementBinnenzijde}
                  onChange={(e) => setRendementBinnenzijde(parseInt(e.target.value) || 75)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Rendement Buitenzijde (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={rendementBuitenzijde}
                  onChange={(e) => setRendementBuitenzijde(parseInt(e.target.value) || 70)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* Arbeid Parameters Panel */}
        {toonArbeidParameters && (
          <div className="bg-indigo-50 p-4 rounded-lg mb-4 border-2 border-indigo-200">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Arbeid Parameters</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Platen verwerken (platen/uur)</label>
                <input
                  type="number"
                  step="0.5"
                  value={arbeidParameters.platenPerUur}
                  onChange={(e) => setArbeidParameters(prev => ({ ...prev, platenPerUur: parseFloat(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Afplakken (lm/uur)</label>
                <input
                  type="number"
                  step="1"
                  value={arbeidParameters.afplakkenPerUur}
                  onChange={(e) => setArbeidParameters(prev => ({ ...prev, afplakkenPerUur: parseFloat(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Tijd per deur (minuten)</label>
                <input
                  type="number"
                  step="1"
                  value={arbeidParameters.minutenPerDeur}
                  onChange={(e) => setArbeidParameters(prev => ({ ...prev, minutenPerDeur: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Montage per kast (minuten)</label>
                <input
                  type="number"
                  step="5"
                  value={arbeidParameters.minutenMontagePerKast}
                  onChange={(e) => setArbeidParameters(prev => ({ ...prev, minutenMontagePerKast: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Montage per zijpaneel (minuten)</label>
                <input
                  type="number"
                  step="5"
                  value={arbeidParameters.minutenPerZijpaneel}
                  onChange={(e) => setArbeidParameters(prev => ({ ...prev, minutenPerZijpaneel: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Plaatsing per kast (uur)</label>
                <input
                  type="number"
                  step="0.1"
                  value={arbeidParameters.plaatsingPerKast}
                  onChange={(e) => setArbeidParameters(prev => ({ ...prev, plaatsingPerKast: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">Transport (uur/project)</label>
                <input
                  type="number"
                  step="0.5"
                  value={arbeidParameters.transport}
                  onChange={(e) => setArbeidParameters(prev => ({ ...prev, transport: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* Project Info */}
        <div className="bg-blue-50 p-4 rounded-lg mb-4 border-2 border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <input
                type="text"
                value={projectInfo.project}
                onChange={(e) => setProjectInfo(prev => ({ ...prev, project: e.target.value }))}
                placeholder="Projectnaam"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meubelnummer</label>
              <input
                type="text"
                value={projectInfo.meubelnummer}
                onChange={(e) => setProjectInfo(prev => ({ ...prev, meubelnummer: e.target.value }))}
                placeholder="Meubelnummer"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Material Selection Panels */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <MaterialenPanel
            type="binnen"
            materialen={materiaalBinnenkast}
            geselecteerd={geselecteerdMateriaalBinnen}
            label="Materiaal Binnenkast"
            color="purple"
            showPrijsAanpassing={showPrijsAanpassing}
            setShowPrijsAanpassing={setShowPrijsAanpassing}
            setGeselecteerd={setGeselecteerdMateriaalBinnen}
            updateMateriaalPrijs={updateMateriaalPrijs}
          />

          <MaterialenPanel
            type="buiten"
            materialen={materiaalBuitenzijde}
            geselecteerd={geselecteerdMateriaalBuiten}
            label="Materiaal Buitenzijde"
            color="indigo"
            showPrijsAanpassing={showPrijsAanpassing}
            setShowPrijsAanpassing={setShowPrijsAanpassing}
            setGeselecteerd={setGeselecteerdMateriaalBuiten}
            updateMateriaalPrijs={updateMateriaalPrijs}
          />

          <MaterialenPanel
            type="tablet"
            materialen={materiaalTablet}
            geselecteerd={geselecteerdMateriaalTablet}
            label="Materiaal Tablet"
            color="pink"
            showPrijsAanpassing={showPrijsAanpassing}
            setShowPrijsAanpassing={setShowPrijsAanpassing}
            setGeselecteerd={setGeselecteerdMateriaalTablet}
            updateMateriaalPrijs={updateMateriaalPrijs}
          />
        </div>

        {/* Alternative Materials */}
        <div className="bg-green-50 p-4 rounded-lg mb-4 border-2 border-green-200">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Alternatieve Materialen</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="ruggenAlternatief"
                checked={alternatieveMateriaal.ruggenGebruiken}
                onChange={(e) => setAlternatieveMateriaal(prev => ({ ...prev, ruggenGebruiken: e.target.checked }))}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="ruggenAlternatief" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Ruggen in ander materiaal
                </label>
                {alternatieveMateriaal.ruggenGebruiken && (
                  <select
                    value={alternatieveMateriaal.ruggenMateriaal}
                    onChange={(e) => setAlternatieveMateriaal(prev => ({ ...prev, ruggenMateriaal: parseInt(e.target.value) }))}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {materiaalBinnenkast.map((mat, index) => (
                      <option key={index} value={index}>
                        {mat.naam} - {mat.afmeting} mm - €{mat.prijs.toFixed(2)}/m²
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="leggersAlternatief"
                checked={alternatieveMateriaal.leggersGebruiken}
                onChange={(e) => setAlternatieveMateriaal(prev => ({ ...prev, leggersGebruiken: e.target.checked }))}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="leggersAlternatief" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Leggers in ander materiaal
                </label>
                {alternatieveMateriaal.leggersGebruiken && (
                  <select
                    value={alternatieveMateriaal.leggersMateriaal}
                    onChange={(e) => setAlternatieveMateriaal(prev => ({ ...prev, leggersMateriaal: parseInt(e.target.value) }))}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {materiaalBinnenkast.map((mat, index) => (
                      <option key={index} value={index}>
                        {mat.naam} - {mat.afmeting} mm - €{mat.prijs.toFixed(2)}/m²
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Accessories Panel */}
        <AccessoiresPanel
          accessoires={accessoires}
          updateAccessoire={updateAccessoire}
        />

        {/* Cabinet Configurators */}
        <KastConfigurator
          bovenkast={bovenkast}
          setBovenkast={setBovenkast}
          kolomkast={kolomkast}
          setKolomkast={setKolomkast}
          onderkast={onderkast}
          setOnderkast={setOnderkast}
          ladekast={ladekast}
          setLadekast={setLadekast}
          openNisHPL={openNisHPL}
          setOpenNisHPL={setOpenNisHPL}
          huidigKast={huidigKast}
          setHuidigKast={setHuidigKast}
          voegKastToe={voegKastToe}
          voegZijpaneelToeVoorType={voegZijpaneelToeVoorType}
          materiaalTablet={materiaalTablet}
        />

        {/* Cabinets List */}
        <KastenLijst
          kastenLijst={kastenLijst}
          materiaalTablet={materiaalTablet}
          voegZijpaneelToe={voegZijpaneelToe}
          verwijderKast={verwijderKast}
        />

        {/* Debug Table */}
        {toonDebugTabel && (
          <DebugTabel
            kastenLijst={kastenLijst}
            materiaalTablet={materiaalTablet}
            rendementBinnenzijde={rendementBinnenzijde}
            rendementBuitenzijde={rendementBuitenzijde}
            productionParams={productionParams}
          />
        )}

        {/* Extra Hardware */}
        {kastenLijst.length > 0 && (
          <ExtraBeslag
            extraBeslag={extraBeslag}
            setExtraBeslag={setExtraBeslag}
          />
        )}

        {/* Totals Overview */}
        <TotalenOverzicht
          kastenLijst={kastenLijst}
          totalen={totalen}
          arbeidUren={arbeidUren}
          accessoires={accessoires}
          extraBeslag={extraBeslag}
          materiaalBinnenkast={materiaalBinnenkast}
          materiaalBuitenzijde={materiaalBuitenzijde}
          materiaalTablet={materiaalTablet}
          geselecteerdMateriaalBinnen={geselecteerdMateriaalBinnen}
          geselecteerdMateriaalBuiten={geselecteerdMateriaalBuiten}
          geselecteerdMateriaalTablet={geselecteerdMateriaalTablet}
          alternatieveMateriaal={alternatieveMateriaal}
          rendementBuitenzijde={rendementBuitenzijde}
        />

        {/* Summary */}
        {kastenLijst.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mt-4">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Samenvatting Configuratie</h2>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Geselecteerde Materialen</h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">Binnenkast:</span> {materiaalBinnenkast[geselecteerdMateriaalBinnen].naam}
                  ({materiaalBinnenkast[geselecteerdMateriaalBinnen].afmeting} mm) - €{materiaalBinnenkast[geselecteerdMateriaalBinnen].prijs.toFixed(2)}/m²
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Buitenzijde:</span> {materiaalBuitenzijde[geselecteerdMateriaalBuiten].naam}
                  ({materiaalBuitenzijde[geselecteerdMateriaalBuiten].afmeting} mm) - €{materiaalBuitenzijde[geselecteerdMateriaalBuiten].prijs.toFixed(2)}/m²
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Tablet:</span> {materiaalTablet[geselecteerdMateriaalTablet].naam}
                  ({materiaalTablet[geselecteerdMateriaalTablet].afmeting} mm) - €{materiaalTablet[geselecteerdMateriaalTablet].prijs.toFixed(2)}/m²
                </p>
                {alternatieveMateriaal.ruggenGebruiken && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Ruggen:</span> {materiaalBinnenkast[alternatieveMateriaal.ruggenMateriaal].naam}
                    ({materiaalBinnenkast[alternatieveMateriaal.ruggenMateriaal].afmeting} mm) - €{materiaalBinnenkast[alternatieveMateriaal.ruggenMateriaal].prijs.toFixed(2)}/m²
                  </p>
                )}
                {alternatieveMateriaal.leggersGebruiken && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Leggers:</span> {materiaalBinnenkast[alternatieveMateriaal.leggersMateriaal].naam}
                    ({materiaalBinnenkast[alternatieveMateriaal.leggersMateriaal].afmeting} mm) - €{materiaalBinnenkast[alternatieveMateriaal.leggersMateriaal].prijs.toFixed(2)}/m²
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2 mt-4">Accessoires Prijzen</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <p className="text-gray-700">Afplakken standaard: €{accessoires.afplakkenStandaard.toFixed(2)}/m</p>
                <p className="text-gray-700">Afplakken speciaal: €{accessoires.afplakkenSpeciaal.toFixed(2)}/m</p>
                <p className="text-gray-700">Kastpootjes: €{accessoires.kastpootjes.toFixed(2)}/st</p>
                <p className="text-gray-700">
                  Scharnieren: {accessoires.scharnierType === '110' ? '110°' : '155-170°'} -
                  €{accessoires.scharnierType === '110' ? accessoires.scharnier110.toFixed(2) : accessoires.scharnier170.toFixed(2)}/st
                </p>
                <p className="text-gray-700">Profiel BK: €{accessoires.profielBK.toFixed(2)}/m</p>
                <p className="text-gray-700">Ophangsysteem BK: €{accessoires.ophangsysteemBK.toFixed(2)}/st</p>
                <p className="text-gray-700">
                  Laden: {accessoires.ladeType === 'standaard' ? 'Standaard' : 'Grote hoeveelheid'} -
                  €{accessoires.ladeType === 'standaard' ? accessoires.ladeStandaard.toFixed(2) : accessoires.ladeGroteHoeveelheid.toFixed(2)}/st
                </p>
                <p className="text-gray-700">Handgrepen: €{accessoires.handgrepen.toFixed(2)}/st</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold animate-slide-in"
            style={{
              animation: 'slideIn 0.3s ease-out',
              marginBottom: index > 0 ? '8px' : '0'
            }}
          >
            {notification.text}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Admin Settings Modal */}
      <AdminSettings
        isOpen={showAdminSettings}
        onClose={() => setShowAdminSettings(false)}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default KeukenKastInvoer;
