import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

// Data imports
import { defaultAccessoires, defaultExtraBeslag, defaultArbeidParameters, defaultKeukentoestellen, defaultToestellenPrijzen } from './data/defaultMaterials';
import { defaultSchuifbeslagPrijzen } from './constants/cabinet';

// Utility imports
import { berekenTotalen, berekenArbeid } from './utils/calculations';
import { supabase, auth } from './lib/supabase';

// Component imports
import MaterialenPanel from './components/MaterialenPanel';
import KastConfigurator from './components/KastConfigurator';
import KastenVooraanzicht from './components/KastenVooraanzicht';
import KastenLijst from './components/KastenLijst';
import CustomPlaatRequests from './components/CustomPlaatRequests';
import FloatingKastenLijst from './components/FloatingKastenLijst';
import TotalenOverzicht from './components/TotalenOverzicht';
import NestingResultaten from './components/NestingResultaten';
import DebugTabel from './components/DebugTabel';
import KeukentoestellenPanel from './components/KeukentoestellenPanel';
import AdminSettings from './components/Admin/AdminSettings';

// Hooks
import { useNotifications } from './hooks/useNotifications';
import { useMaterials } from './hooks/useMaterials';
import { useKabinet } from './hooks/useKabinet';
import { useProjectState } from './hooks/useProjectState';

// Constants
import { ADMIN_EMAIL } from './constants/app';

// Material panels config for data-driven rendering
const MATERIAL_PANELS = [
  { type: 'binnen', label: 'Materiaal Binnenkast', color: 'purple', matKey: 'materiaalBinnenkast', selectKey: 'geselecteerdMateriaalBinnen', setKey: 'setGeselecteerdMateriaalBinnen' },
  { type: 'buiten', label: 'Materiaal Buitenzijde', color: 'indigo', matKey: 'materiaalBuitenzijde', selectKey: 'geselecteerdMateriaalBuiten', setKey: 'setGeselecteerdMateriaalBuiten' },
  { type: 'tablet', label: 'Materiaal Tablet', color: 'pink', matKey: 'materiaalTablet', selectKey: 'geselecteerdMateriaalTablet', setKey: 'setGeselecteerdMateriaalTablet' },
];

// Arbeid parameter fields config
const ARBEID_FIELDS = [
  { key: 'platenPerUur', label: 'Platen verwerken (platen/uur)', step: '0.5', fallback: 1 },
  { key: 'afplakkenPerUur', label: 'Afplakken (lm/uur)', step: '1', fallback: 1 },
  { key: 'plaatsingPerKast', label: 'Plaatsing per kast (uur)', step: '0.1', fallback: 0 },
  { key: 'transport', label: 'Transport (uur/project)', step: '0.5', fallback: 0 },
];

const KeukenKastInvoer = ({ user, projectId, initialData, onBackToHome, onLogout }) => {
  // Admin state
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Project info
  const [projectInfo, setProjectInfo] = useState({
    project: initialData?.name || '',
    meubelnummer: initialData?.meubelnummer || '',
    aantal: initialData?.aantal || initialData?.settings?.aantal || 1
  });
  const groupInfo = initialData?.project_groups || null;

  // UI toggles
  const [toonRendementParameters, setToonRendementParameters] = useState(false);
  const [toonArbeidParameters, setToonArbeidParameters] = useState(false);
  const [toonDebugTabel, setToonDebugTabel] = useState(false);
  const [toonInstellingenMenu, setToonInstellingenMenu] = useState(false);
  // Display style per user: 'rustig' (default) or 'klassiek'. Saved in the Supabase user
  // metadata so it follows the login; localStorage is only a fast cache to avoid a flash.
  const [weergaveStijl, setWeergaveStijl] = useState(() => {
    const vanLogin = user?.user_metadata?.weergaveStijl;
    if (vanLogin) return vanLogin;
    try { return localStorage.getItem(`weergaveStijl:${user?.email || ''}`) || 'rustig'; } catch { return 'rustig'; }
  });
  const kiesWeergaveStijl = (stijl) => {
    setWeergaveStijl(stijl);
    try { localStorage.setItem(`weergaveStijl:${user?.email || ''}`, stijl); } catch { /* ignore */ }
    if (user) auth.setVoorkeur('weergaveStijl', stijl).then(({ error }) => {
      if (error) console.error('Weergave niet bewaard:', error.message);
    });
  };

  // Accessories & extra hardware
  const [accessoires, setAccessoires] = useState(defaultAccessoires);
  const [extraBeslag, setExtraBeslag] = useState(defaultExtraBeslag);
  const [arbeidParameters, setArbeidParameters] = useState(defaultArbeidParameters);
  const [keukentoestellen, setKeukentoestellen] = useState(defaultKeukentoestellen);
  const [toestellenPrijzen, setToestellenPrijzen] = useState(defaultToestellenPrijzen);
  const [schuifbeslagPrijzen, setSchuifbeslagPrijzen] = useState(defaultSchuifbeslagPrijzen);
  const [beslagBibliotheek, setBeslagBibliotheek] = useState([]);

  // Totalen overrides (persisted with project)
  const [extraAmounts, setExtraAmounts] = useState({});
  const [priceOverrides, setPriceOverrides] = useState({});
  const [arbeidOverrides, setArbeidOverrides] = useState({});
  const [customBeslag, setCustomBeslag] = useState([]);
  const [customPlaatmateriaal, setCustomPlaatmateriaal] = useState([]);
  const [customPlaatRequests, setCustomPlaatRequests] = useState([]);
  const [nestingMode, setNestingMode] = useState(true); // plate counts come from the nesting by default
  const [nestingBuffer, setNestingBuffer] = useState(0); // no buffer by default — packer result is already tight
  const [tabletsteun, setTabletsteun] = useState({ type: '', aantal: 0 });
  const [infoOverrides, setInfoOverrides] = useState({});
  // Project/quote-specific custom materials (override the dropdown per category)
  const [customProjectMaterialen, setCustomProjectMaterialen] = useState({ binnen: null, buiten: null, tablet: null });
  // Per plate-row price locks in the totaallijst (keyed by plate row key e.g. 'binnenkast', 'buitenzijde', …)
  // Stored separately so Supabase reloads can never wipe the user's locked price
  const [priceOverrideLocks, setPriceOverrideLocks] = useState({});
  // Quote margin percentage for the grand-total summary box
  const [marge, setMarge] = useState(25);
  // Calculated value at the moment a quantity/hours override was made → detects stale overrides
  const [overrideBasis, setOverrideBasis] = useState({});
  // Live grand total for the sidebar { exclMarge, inclMarge, platen } (reported by TotalenOverzicht)
  const [sidebarTotaal, setSidebarTotaal] = useState(null);
  const handleTotaalChange = useCallback((t) => setSidebarTotaal(prev =>
    (prev?.exclMarge === t?.exclMarge && prev?.inclMarge === t?.inclMarge && prev?.platen === t?.platen) ? prev : t
  ), []);
  const exportPDFRef = useRef(null);
  // Latest grand total { exclMarge, inclMarge } written by TotalenOverzicht, saved with the project for the offerte list
  const totaalPrijsRef = useRef(null);

  // Custom hooks
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const materials = useMaterials(initialData);
  const kabinet = useKabinet({ initialData, addNotification });

  const { isSaving, lastSaved, hasUnsavedChanges, handleSave, productionParams } = useProjectState({
    projectId,
    initialData,
    materials,
    kastenLijst: kabinet.kastenLijst,
    projectInfo,
    accessoires,
    extraBeslag,
    arbeidParameters,
    keukentoestellen,
    extraAmounts,
    priceOverrides,
    arbeidOverrides,
    customBeslag,
    customPlaatmateriaal,
    customPlaatRequests,
    nestingMode,
    nestingBuffer,
    tabletsteun,
    infoOverrides,
    customProjectMaterialen,
    setAccessoires,
    setExtraBeslag,
    setArbeidParameters,
    setKeukentoestellen,
    setExtraAmounts,
    setPriceOverrides,
    setArbeidOverrides,
    setCustomBeslag,
    setCustomPlaatmateriaal,
    setCustomPlaatRequests,
    setNestingMode,
    setNestingBuffer,
    setTabletsteun,
    setInfoOverrides,
    setCustomProjectMaterialen,
    priceOverrideLocks,
    setPriceOverrideLocks,
    marge,
    overrideBasis,
    totaalPrijsRef,
    setMarge,
    setOverrideBasis,
  });

  // Keep the saved Cafca list (used by "Export naar Cafca" on the home page) in sync:
  // when the calculated list differs from the saved one, save the project once.
  // Waits a few seconds after the last recalculation so materials/prices are loaded.
  const savedCafcaRef = useRef(JSON.stringify(initialData?.settings?.cafcaLijst ?? null));
  useEffect(() => {
    if (!projectId || !sidebarTotaal) return;
    const timer = setTimeout(() => {
      const huidig = JSON.stringify(totaalPrijsRef.current?.cafca ?? null);
      if (huidig !== 'null' && huidig !== savedCafcaRef.current && !isSaving) {
        savedCafcaRef.current = huidig;
        handleSave();
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [sidebarTotaal, projectId, isSaving, handleSave]);

  // Load admin pricing (toestellen + schuifbeslag + accessoires defaults)
  useEffect(() => {
    const loadAdminPricing = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('*')
          .in('key', ['keukentoestellen_prijzen', 'schuifbeslag_prijzen', 'beslag_bibliotheek', 'accessoires_defaults']);

        if (data && !error) {
          data.forEach(row => {
            if (row.key === 'keukentoestellen_prijzen') {
              setToestellenPrijzen(prev => ({ ...prev, ...row.value }));
            }
            if (row.key === 'schuifbeslag_prijzen') {
              setSchuifbeslagPrijzen(prev => ({ ...prev, ...row.value }));
            }
            if (row.key === 'beslag_bibliotheek') {
              setBeslagBibliotheek(row.value || []);
            }
            if (row.key === 'accessoires_defaults') {
              // Only seed for NEW projects — never overwrite saved project values
              if (!initialData?.settings?.accessoires) {
                setAccessoires(prev => ({ ...prev, ...row.value }));
              }
            }
          });
        }
      } catch (err) {
        console.log('Using default admin pricing');
      }
    };
    loadAdminPricing();
  }, []);

  const saveBeslagBibliotheek = async (newLib) => {
    setBeslagBibliotheek(newLib);
    try {
      await supabase.from('admin_settings').upsert({
        key: 'beslag_bibliotheek',
        value: newLib
      }, { onConflict: 'key' });
    } catch (err) {
      console.error('Could not save beslag library:', err);
    }
  };

  // Effective material arrays: custom project material takes priority, otherwise use the dropdown
  const effectiveMaterialenBinnen = customProjectMaterialen.binnen
    ? [customProjectMaterialen.binnen]
    : materials.materiaalBinnenkast;
  const effectiveMaterialenBuiten = customProjectMaterialen.buiten
    ? [customProjectMaterialen.buiten]
    : materials.materiaalBuitenzijde;
  const effectiveMaterialenTablet = customProjectMaterialen.tablet
    ? [customProjectMaterialen.tablet]
    : materials.materiaalTablet;
  const effectiveGeselecteerdBinnen = customProjectMaterialen.binnen ? 0 : materials.geselecteerdMateriaalBinnen;
  const effectiveGeselecteerdBuiten = customProjectMaterialen.buiten ? 0 : materials.geselecteerdMateriaalBuiten;
  const effectiveGeselecteerdTablet = customProjectMaterialen.tablet ? 0 : materials.geselecteerdMateriaalTablet;

  // Calculate totals (memoized)
  const totalen = useMemo(() => berekenTotalen(
    kabinet.kastenLijst,
    materials.rendementBinnenzijde,
    materials.rendementBuitenzijde,
    materials.alternatieveMateriaal,
    effectiveMaterialenBinnen,
    effectiveMaterialenBuiten,
    effectiveMaterialenTablet,
    effectiveGeselecteerdBinnen,
    effectiveGeselecteerdBuiten,
    effectiveGeselecteerdTablet,
    productionParams,
    materials.plaatMaterialen,
    { useNesting: nestingMode, nestingBuffer }
  ), [
    kabinet.kastenLijst,
    materials.rendementBinnenzijde,
    materials.rendementBuitenzijde,
    materials.alternatieveMateriaal,
    effectiveMaterialenBinnen,
    effectiveMaterialenBuiten,
    effectiveMaterialenTablet,
    effectiveGeselecteerdBinnen,
    effectiveGeselecteerdBuiten,
    effectiveGeselecteerdTablet,
    productionParams,
    materials.plaatMaterialen,
    nestingMode,
    nestingBuffer
  ]);

  const arbeidUren = useMemo(() =>
    berekenArbeid(kabinet.kastenLijst, totalen, arbeidParameters),
    [kabinet.kastenLijst, totalen, arbeidParameters]
  );

  return (
    <div className={weergaveStijl === 'klassiek' ? 'stijl-klassiek' : ''}>
    <div className="min-h-screen bg-gray-50 klassiek:bg-gradient-to-br klassiek:from-gray-50 klassiek:to-gray-100 p-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
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
          <div className="flex gap-2 items-center">
            {/* Daily actions */}
            {projectId && (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    isSaving ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : hasUnsavedChanges ? 'bg-slate-800 hover:bg-slate-900 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {isSaving ? 'Opslaan…' : 'Opslaan'}
                </button>
                <button
                  onClick={() => exportPDFRef.current?.()}
                  className="px-4 py-2 rounded-lg font-semibold bg-white border border-gray-300 hover:bg-gray-100 text-gray-800"
                >
                  PDF Offerte
                </button>
              </>
            )}

            {/* Settings menu: everything that isn't used every day */}
            <div className="relative">
              <button
                onClick={() => setToonInstellingenMenu(v => !v)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-1 ${
                  toonInstellingenMenu ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                ⚙ Instellingen <span className="text-xs">▾</span>
              </button>
              {toonInstellingenMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setToonInstellingenMenu(false)} />
                  <div className="absolute right-0 mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-40 py-1 text-sm">
                    {[
                      { label: 'Rendement materialen', actief: toonRendementParameters, onClick: () => setToonRendementParameters(v => !v) },
                      { label: 'Arbeid parameters', actief: toonArbeidParameters, onClick: () => setToonArbeidParameters(v => !v) },
                      { label: 'Debug tabel', actief: toonDebugTabel, onClick: () => setToonDebugTabel(v => !v) },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => { item.onClick(); setToonInstellingenMenu(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 flex justify-between items-center text-gray-700"
                      >
                        {item.label}
                        <span className={`text-xs ${item.actief ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                          {item.actief ? '✓ getoond' : 'verborgen'}
                        </span>
                      </button>
                    ))}
                    <div className="border-t border-gray-100 my-1" />
                    <div className="px-3 py-2">
                      <p className="text-xs text-gray-500 mb-1.5">Weergave (bewaard bij je login)</p>
                      <div className="flex rounded-md overflow-hidden border border-gray-300 text-xs">
                        {[{ id: 'rustig', label: 'Rustig' }, { id: 'klassiek', label: 'Klassiek' }].map(s => (
                          <button
                            key={s.id}
                            onClick={() => kiesWeergaveStijl(s.id)}
                            className={`flex-1 px-2 py-1 font-semibold ${weergaveStijl === s.id ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => { setShowAdminSettings(true); setToonInstellingenMenu(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-700"
                        >
                          Admin instellingen…
                        </button>
                      </>
                    )}
                    {onLogout && (
                      <>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => { setToonInstellingenMenu(false); onLogout(); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-500"
                        >
                          Uitloggen
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Rendement Parameters Panel */}
        {toonRendementParameters && (
          <div className="bg-white p-4 rounded-lg mb-4 border border-gray-200 shadow-sm klassiek:bg-yellow-50 klassiek:border-2 klassiek:border-yellow-200 klassiek:shadow-none">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Rendement Materialen</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Rendement Binnenzijde (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={materials.rendementBinnenzijde}
                  onChange={(e) => materials.setRendementBinnenzijde(parseInt(e.target.value) || 75)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Rendement Buitenzijde (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={materials.rendementBuitenzijde}
                  onChange={(e) => materials.setRendementBuitenzijde(parseInt(e.target.value) || 70)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* Arbeid Parameters Panel */}
        {toonArbeidParameters && (
          <div className="bg-white p-4 rounded-lg mb-4 border border-gray-200 shadow-sm klassiek:bg-indigo-50 klassiek:border-2 klassiek:border-indigo-200 klassiek:shadow-none">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Arbeid Parameters</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ARBEID_FIELDS.map(({ key, label, step, fallback }) => (
                <div key={key}>
                  <label className="text-xs text-gray-600 block mb-1">{label}</label>
                  <input
                    type="number"
                    step={step}
                    value={arbeidParameters[key]}
                    onChange={(e) => setArbeidParameters(prev => ({ ...prev, [key]: parseFloat(e.target.value) || fallback }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content + floating sidebar */}
        <div className="flex gap-4">
        <div className="flex-1 min-w-0">

        {/* Project Info */}
        <div className="bg-white p-4 rounded-lg mb-4 border border-gray-200 shadow-sm klassiek:bg-blue-50 klassiek:border-2 klassiek:border-blue-200 klassiek:shadow-none">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aantal</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setProjectInfo(prev => ({ ...prev, aantal: Math.max(1, prev.aantal - 1) }))}
                  className="w-8 h-[42px] rounded-md bg-red-100 hover:bg-red-200 text-red-700 font-bold text-lg"
                >-</button>
                <input
                  type="number"
                  min="1"
                  value={projectInfo.aantal}
                  onChange={(e) => setProjectInfo(prev => ({ ...prev, aantal: parseInt(e.target.value) || 1 }))}
                  className="w-14 px-2 py-2 border border-gray-300 rounded-md text-center"
                />
                <button
                  onClick={() => setProjectInfo(prev => ({ ...prev, aantal: prev.aantal + 1 }))}
                  className="w-8 h-[42px] rounded-md bg-green-100 hover:bg-green-200 text-green-700 font-bold text-lg"
                >+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Material Selection Panels */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {MATERIAL_PANELS.map(({ type, label, color, matKey, selectKey, setKey }) => (
            <MaterialenPanel
              key={type}
              type={type}
              materialen={materials[matKey]}
              alleMaterialen={materials.plaatMaterialen}
              geselecteerd={materials[selectKey]}
              label={label}
              color={color}
              setGeselecteerd={materials[setKey]}
              onReloadMaterialen={materials.reloadPlaatMaterialen}
              customMateriaal={customProjectMaterialen[type]}
              onCustomMateriaalChange={(mat) =>
                setCustomProjectMaterialen(prev => ({ ...prev, [type]: mat }))
              }
            />
          ))}
        </div>

        {/* Alternative Materials */}
        <div className="bg-white p-4 rounded-lg mb-4 border border-gray-200 shadow-sm klassiek:bg-green-50 klassiek:border-2 klassiek:border-green-200 klassiek:shadow-none">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Alternatieve Materialen</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="ruggenAlternatief"
                checked={materials.alternatieveMateriaal.ruggenGebruiken}
                onChange={(e) => materials.setAlternatieveMateriaal(prev => ({ ...prev, ruggenGebruiken: e.target.checked }))}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="ruggenAlternatief" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Ruggen in ander materiaal
                </label>
                {materials.alternatieveMateriaal.ruggenGebruiken && (
                  <select
                    value={materials.alternatieveMateriaal.ruggenMateriaal}
                    onChange={(e) => materials.setAlternatieveMateriaal(prev => ({ ...prev, ruggenMateriaal: parseInt(e.target.value) }))}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {materials.materiaalBinnenkast.map((mat, index) => (
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
                checked={materials.alternatieveMateriaal.leggersGebruiken}
                onChange={(e) => materials.setAlternatieveMateriaal(prev => ({ ...prev, leggersGebruiken: e.target.checked }))}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="leggersAlternatief" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Leggers in ander materiaal
                </label>
                {materials.alternatieveMateriaal.leggersGebruiken && (
                  <select
                    value={materials.alternatieveMateriaal.leggersMateriaal}
                    onChange={(e) => materials.setAlternatieveMateriaal(prev => ({ ...prev, leggersMateriaal: parseInt(e.target.value) }))}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {materials.materiaalBinnenkast.map((mat, index) => (
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

        {/* Cabinet Configurators */}
        <KastConfigurator
          bovenkast={kabinet.bovenkast}
          setBovenkast={kabinet.setBovenkast}
          kolomkast={kabinet.kolomkast}
          setKolomkast={kabinet.setKolomkast}
          onderkast={kabinet.onderkast}
          setOnderkast={kabinet.setOnderkast}
          ladekast={kabinet.ladekast}
          setLadekast={kabinet.setLadekast}
          vrijeKast={kabinet.vrijeKast}
          setVrijeKast={kabinet.setVrijeKast}
          customKast={kabinet.customKast}
          setCustomKast={kabinet.setCustomKast}
          huidigKast={kabinet.huidigKast}
          setHuidigKast={kabinet.setHuidigKast}
          voegKastToe={kabinet.voegKastToe}
          voegZijpaneelToeVoorType={kabinet.voegZijpaneelToeVoorType}
          plaatMaterialen={materials.plaatMaterialen}
          projectMaterialen={[
            { rol: 'binnenkast', mat: materials.materiaalBinnenkast[materials.geselecteerdMateriaalBinnen] },
            { rol: 'buitenzijde', mat: materials.materiaalBuitenzijde[materials.geselecteerdMateriaalBuiten] },
            { rol: 'tablet', mat: materials.materiaalTablet[materials.geselecteerdMateriaalTablet] },
            materials.alternatieveMateriaal?.ruggenGebruiken && { rol: 'ruggen', mat: materials.materiaalBinnenkast[materials.alternatieveMateriaal.ruggenMateriaal] },
            materials.alternatieveMateriaal?.leggersGebruiken && { rol: 'leggers', mat: materials.materiaalBinnenkast[materials.alternatieveMateriaal.leggersMateriaal] },
          ].filter(x => x && x.mat)}
        />

        {/* Front-view drawing of all cabinets */}
        <KastenVooraanzicht
          kastenLijst={kabinet.kastenLijst}
          setKastenLijst={kabinet.setKastenLijst}
        />

        {/* Cabinets List */}
        <KastenLijst
          kastenLijst={kabinet.kastenLijst}
          plaatMaterialen={materials.plaatMaterialen}
          voegZijpaneelToe={kabinet.voegZijpaneelToe}
          kopieerKast={kabinet.kopieerKast}
          updateKast={kabinet.updateKast}
          verwijderKast={kabinet.verwijderKast}
        />

        {/* Debug Table */}
        {toonDebugTabel && (
          <DebugTabel
            kastenLijst={kabinet.kastenLijst}
            plaatMaterialen={materials.plaatMaterialen}
            rendementBinnenzijde={materials.rendementBinnenzijde}
            rendementBuitenzijde={materials.rendementBuitenzijde}
            productionParams={productionParams}
          />
        )}

        {/* Keukentoestellen */}
        <KeukentoestellenPanel
          keukentoestellen={keukentoestellen}
          setKeukentoestellen={setKeukentoestellen}
          toestellenPrijzen={toestellenPrijzen}
        />

        {/* Custom plate requests (project-specific plates with auto-nesting) */}
        <CustomPlaatRequests
          requests={customPlaatRequests}
          setRequests={setCustomPlaatRequests}
        />

        {/* Totals Overview */}
        <TotalenOverzicht
          kastenLijst={kabinet.kastenLijst}
          totalen={totalen}
          arbeidUren={arbeidUren}
          accessoires={accessoires}
          extraBeslag={extraBeslag}
          materiaalBinnenkast={effectiveMaterialenBinnen}
          materiaalBuitenzijde={effectiveMaterialenBuiten}
          materiaalTablet={effectiveMaterialenTablet}
          geselecteerdMateriaalBinnen={effectiveGeselecteerdBinnen}
          geselecteerdMateriaalBuiten={effectiveGeselecteerdBuiten}
          geselecteerdMateriaalTablet={effectiveGeselecteerdTablet}
          alternatieveMateriaal={materials.alternatieveMateriaal}
          rendementBuitenzijde={materials.rendementBuitenzijde}
          keukentoestellen={keukentoestellen}
          toestellenPrijzen={toestellenPrijzen}
          schuifbeslagPrijzen={schuifbeslagPrijzen}
          plaatMaterialen={materials.plaatMaterialen}
          beslagBibliotheek={beslagBibliotheek}
          onSaveBeslagBibliotheek={saveBeslagBibliotheek}
          projectInfo={projectInfo}
          groupInfo={groupInfo}
          extraAmounts={extraAmounts}
          setExtraAmounts={setExtraAmounts}
          priceOverrides={priceOverrides}
          setPriceOverrides={setPriceOverrides}
          arbeidOverrides={arbeidOverrides}
          setArbeidOverrides={setArbeidOverrides}
          customBeslag={customBeslag}
          setCustomBeslag={setCustomBeslag}
          customPlaatmateriaal={customPlaatmateriaal}
          setCustomPlaatmateriaal={setCustomPlaatmateriaal}
          customPlaatRequests={customPlaatRequests}
          nestingMode={nestingMode}
          setNestingMode={setNestingMode}
          nestingBuffer={nestingBuffer}
          setNestingBuffer={setNestingBuffer}
          tabletsteun={tabletsteun}
          setTabletsteun={setTabletsteun}
          infoOverrides={infoOverrides}
          setInfoOverrides={setInfoOverrides}
          priceOverrideLocks={priceOverrideLocks}
          setPriceOverrideLocks={setPriceOverrideLocks}
          marge={marge}
          setMarge={setMarge}
          exportPDFRef={exportPDFRef}
          totaalPrijsRef={totaalPrijsRef}
          overrideBasis={overrideBasis}
          setOverrideBasis={setOverrideBasis}
          onTotaalChange={handleTotaalChange}
        />

        {/* Nesting Resultaten */}
        <NestingResultaten
          kastenLijst={kabinet.kastenLijst}
          materiaalBinnenkast={effectiveMaterialenBinnen}
          materiaalBuitenzijde={effectiveMaterialenBuiten}
          materiaalTablet={effectiveMaterialenTablet}
          geselecteerdMateriaalBinnen={effectiveGeselecteerdBinnen}
          geselecteerdMateriaalBuiten={effectiveGeselecteerdBuiten}
          geselecteerdMateriaalTablet={effectiveGeselecteerdTablet}
          alternatieveMateriaal={materials.alternatieveMateriaal}
          plaatMaterialen={materials.plaatMaterialen}
          productionParams={productionParams}
          rendementBinnenzijde={materials.rendementBinnenzijde}
          rendementBuitenzijde={materials.rendementBuitenzijde}
          nestingBuffer={nestingBuffer}
        />

        {/* Summary */}
        {kabinet.kastenLijst.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mt-4">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Samenvatting Configuratie</h2>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Geselecteerde Materialen</h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">Binnenkast:</span> {materials.materiaalBinnenkast[materials.geselecteerdMateriaalBinnen]?.naam}
                  ({materials.materiaalBinnenkast[materials.geselecteerdMateriaalBinnen]?.afmeting} mm) - €{materials.materiaalBinnenkast[materials.geselecteerdMateriaalBinnen]?.prijs.toFixed(2)}/m²
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Buitenzijde:</span> {materials.materiaalBuitenzijde[materials.geselecteerdMateriaalBuiten]?.naam}
                  ({materials.materiaalBuitenzijde[materials.geselecteerdMateriaalBuiten]?.afmeting} mm) - €{materials.materiaalBuitenzijde[materials.geselecteerdMateriaalBuiten]?.prijs.toFixed(2)}/m²
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Tablet:</span> {materials.materiaalTablet[materials.geselecteerdMateriaalTablet]?.naam}
                  ({materials.materiaalTablet[materials.geselecteerdMateriaalTablet]?.afmeting} mm) - €{materials.materiaalTablet[materials.geselecteerdMateriaalTablet]?.prijs.toFixed(2)}/m²
                </p>
                {materials.alternatieveMateriaal.ruggenGebruiken && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Ruggen:</span> {materials.materiaalBinnenkast[materials.alternatieveMateriaal.ruggenMateriaal]?.naam}
                    ({materials.materiaalBinnenkast[materials.alternatieveMateriaal.ruggenMateriaal]?.afmeting} mm) - €{materials.materiaalBinnenkast[materials.alternatieveMateriaal.ruggenMateriaal]?.prijs.toFixed(2)}/m²
                  </p>
                )}
                {materials.alternatieveMateriaal.leggersGebruiken && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Leggers:</span> {materials.materiaalBinnenkast[materials.alternatieveMateriaal.leggersMateriaal]?.naam}
                    ({materials.materiaalBinnenkast[materials.alternatieveMateriaal.leggersMateriaal]?.afmeting} mm) - €{materials.materiaalBinnenkast[materials.alternatieveMateriaal.leggersMateriaal]?.prijs.toFixed(2)}/m²
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
                  Scharnieren: {accessoires.scharnierType === '110' ? '110°' : '155-170°/180°'} -
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

        </div>{/* end flex-1 main content */}

        {/* Floating sidebar: save button + cabinet list */}
        <div className="w-72 flex-shrink-0 hidden xl:block">
          <div className="sticky top-6 space-y-3">
            {/* Live total — always visible while configuring */}
            {sidebarTotaal && kabinet.kastenLijst.length > 0 && (
              <div className="bg-white rounded-lg border-2 border-gray-300 shadow-md p-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Totaal excl. marge</span>
                  <span className="text-lg font-bold text-gray-800">€{Math.round(sidebarTotaal.exclMarge).toLocaleString('nl-BE')}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500">Incl. marge ({marge}%)</span>
                  <span className="text-sm font-semibold text-green-700">€{Math.round(sidebarTotaal.inclMarge).toLocaleString('nl-BE')}</span>
                </div>
                <div className="flex justify-between items-baseline mt-1 pt-1 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Platen</span>
                  <span className="text-sm font-semibold text-gray-700">{sidebarTotaal.platen}</span>
                </div>
                {projectId && (
                  <p className={`text-xs mt-2 ${isSaving ? 'text-gray-500' : hasUnsavedChanges ? 'text-orange-600' : 'text-green-600'}`}>
                    {isSaving ? '⏳ Opslaan…' : hasUnsavedChanges ? '● Niet opgeslagen (autosave na 5 s)' : `✓ Opgeslagen${lastSaved ? ` om ${lastSaved.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}` : ''}`}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              {projectId && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                      isSaving
                        ? 'bg-gray-400 cursor-not-allowed'
                        : hasUnsavedChanges
                        ? 'bg-slate-800 hover:bg-slate-900 text-white klassiek:bg-blue-600 klassiek:hover:bg-blue-700'
                        : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 klassiek:bg-green-600 klassiek:hover:bg-green-700 klassiek:text-white klassiek:border-0'
                    }`}
                  >
                    {isSaving ? '💾 Opslaan...' : '💾 Opslaan'}
                  </button>
                  <button
                    onClick={() => exportPDFRef.current?.()}
                    className="w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 klassiek:bg-red-600 klassiek:hover:bg-red-700 klassiek:text-white klassiek:border-0"
                  >
                    📄 PDF Offerte
                  </button>
                </>
              )}
              {onBackToHome && (
                <button
                  onClick={onBackToHome}
                  className="w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-200"
                >
                  ← Terug
                </button>
              )}
            </div>
            <FloatingKastenLijst
              kastenLijst={kabinet.kastenLijst}
              voegZijpaneelToe={kabinet.voegZijpaneelToe}
              kopieerKast={kabinet.kopieerKast}
              updateKast={kabinet.updateKast}
              verwijderKast={kabinet.verwijderKast}
              plaatMaterialen={materials.plaatMaterialen}
            />
          </div>
        </div>

        </div>{/* end flex wrapper */}
      </div>

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`${notification.color || 'bg-green-600'} text-white px-6 py-3 rounded-lg shadow-lg font-semibold animate-slide-in`}
            style={{
              animation: 'slideIn 0.3s ease-out',
              marginBottom: index > 0 ? '8px' : '0'
            }}
          >
            {notification.text}
            {notification.action && (
              <button
                onClick={() => { notification.action.onClick(); dismissNotification(notification.id); }}
                className="ml-4 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 underline-offset-2 font-semibold"
              >
                {notification.action.label}
              </button>
            )}
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
    </div>
  );
};

export default KeukenKastInvoer;
