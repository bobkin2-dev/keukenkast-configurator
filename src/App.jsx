import React, { useState, useMemo, useEffect } from 'react';

// Data imports
import { defaultAccessoires, defaultExtraBeslag, defaultArbeidParameters, defaultKeukentoestellen, defaultToestellenPrijzen } from './data/defaultMaterials';
import { defaultSchuifbeslagPrijzen } from './constants/cabinet';

// Utility imports
import { berekenTotalen, berekenArbeid } from './utils/calculations';
import { supabase } from './lib/supabase';

// Component imports
import MaterialenPanel from './components/MaterialenPanel';
import AccessoiresPanel from './components/AccessoiresPanel';
import KastConfigurator from './components/KastConfigurator';
import KastenLijst from './components/KastenLijst';
import FloatingKastenLijst from './components/FloatingKastenLijst';
import TotalenOverzicht from './components/TotalenOverzicht';
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
    meubelnummer: initialData?.meubelnummer || ''
  });

  // UI toggles
  const [toonRendementParameters, setToonRendementParameters] = useState(false);
  const [toonArbeidParameters, setToonArbeidParameters] = useState(false);
  const [toonDebugTabel, setToonDebugTabel] = useState(false);

  // Accessories & extra hardware
  const [accessoires, setAccessoires] = useState(defaultAccessoires);
  const [extraBeslag, setExtraBeslag] = useState(defaultExtraBeslag);
  const [arbeidParameters, setArbeidParameters] = useState(defaultArbeidParameters);
  const [keukentoestellen, setKeukentoestellen] = useState(defaultKeukentoestellen);
  const [toestellenPrijzen, setToestellenPrijzen] = useState(defaultToestellenPrijzen);
  const [schuifbeslagPrijzen, setSchuifbeslagPrijzen] = useState(defaultSchuifbeslagPrijzen);

  const updateAccessoire = (field, value) => {
    setAccessoires(prev => ({ ...prev, [field]: value }));
  };

  // Custom hooks
  const { notifications, addNotification } = useNotifications();
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
    setAccessoires,
    setExtraBeslag,
    setArbeidParameters,
    setKeukentoestellen
  });

  // Load admin pricing (toestellen + schuifbeslag)
  useEffect(() => {
    const loadAdminPricing = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('*')
          .in('key', ['keukentoestellen_prijzen', 'schuifbeslag_prijzen']);

        if (data && !error) {
          data.forEach(row => {
            if (row.key === 'keukentoestellen_prijzen') {
              setToestellenPrijzen(prev => ({ ...prev, ...row.value }));
            }
            if (row.key === 'schuifbeslag_prijzen') {
              setSchuifbeslagPrijzen(prev => ({ ...prev, ...row.value }));
            }
          });
        }
      } catch (err) {
        console.log('Using default admin pricing');
      }
    };
    loadAdminPricing();
  }, []);

  // Calculate totals (memoized)
  const totalen = useMemo(() => berekenTotalen(
    kabinet.kastenLijst,
    materials.rendementBinnenzijde,
    materials.rendementBuitenzijde,
    materials.alternatieveMateriaal,
    materials.materiaalBinnenkast,
    materials.materiaalBuitenzijde,
    materials.materiaalTablet,
    materials.geselecteerdMateriaalBinnen,
    materials.geselecteerdMateriaalBuiten,
    materials.geselecteerdMateriaalTablet,
    productionParams,
    materials.plaatMaterialen
  ), [
    kabinet.kastenLijst,
    materials.rendementBinnenzijde,
    materials.rendementBuitenzijde,
    materials.alternatieveMateriaal,
    materials.materiaalBinnenkast,
    materials.materiaalBuitenzijde,
    materials.materiaalTablet,
    materials.geselecteerdMateriaalBinnen,
    materials.geselecteerdMateriaalBuiten,
    materials.geselecteerdMateriaalTablet,
    productionParams,
    materials.plaatMaterialen
  ]);

  const arbeidUren = useMemo(() =>
    berekenArbeid(kabinet.kastenLijst, totalen, arbeidParameters),
    [kabinet.kastenLijst, totalen, arbeidParameters]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-[1800px] mx-auto">
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
          <div className="bg-indigo-50 p-4 rounded-lg mb-4 border-2 border-indigo-200">
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
          {MATERIAL_PANELS.map(({ type, label, color, matKey, selectKey, setKey }) => (
            <MaterialenPanel
              key={type}
              type={type}
              materialen={materials[matKey]}
              geselecteerd={materials[selectKey]}
              label={label}
              color={color}
              showPrijsAanpassing={materials.showPrijsAanpassing}
              setShowPrijsAanpassing={materials.setShowPrijsAanpassing}
              setGeselecteerd={materials[setKey]}
              updateMateriaalPrijs={materials.updateMateriaalPrijs}
            />
          ))}
        </div>

        {/* Alternative Materials */}
        <div className="bg-green-50 p-4 rounded-lg mb-4 border-2 border-green-200">
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

        {/* Accessories Panel */}
        <AccessoiresPanel
          accessoires={accessoires}
          updateAccessoire={updateAccessoire}
        />

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
        />

        {/* Cabinets List */}
        <KastenLijst
          kastenLijst={kabinet.kastenLijst}
          plaatMaterialen={materials.plaatMaterialen}
          voegZijpaneelToe={kabinet.voegZijpaneelToe}
          kopieerKast={kabinet.kopieerKast}
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

        {/* Totals Overview */}
        <TotalenOverzicht
          kastenLijst={kabinet.kastenLijst}
          totalen={totalen}
          arbeidUren={arbeidUren}
          accessoires={accessoires}
          extraBeslag={extraBeslag}
          materiaalBinnenkast={materials.materiaalBinnenkast}
          materiaalBuitenzijde={materials.materiaalBuitenzijde}
          materiaalTablet={materials.materiaalTablet}
          geselecteerdMateriaalBinnen={materials.geselecteerdMateriaalBinnen}
          geselecteerdMateriaalBuiten={materials.geselecteerdMateriaalBuiten}
          geselecteerdMateriaalTablet={materials.geselecteerdMateriaalTablet}
          alternatieveMateriaal={materials.alternatieveMateriaal}
          rendementBuitenzijde={materials.rendementBuitenzijde}
          keukentoestellen={keukentoestellen}
          toestellenPrijzen={toestellenPrijzen}
          schuifbeslagPrijzen={schuifbeslagPrijzen}
          plaatMaterialen={materials.plaatMaterialen}
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

        </div>{/* end flex-1 main content */}

        {/* Floating sidebar: save button + cabinet list */}
        <div className="w-72 flex-shrink-0 hidden xl:block">
          <div className="sticky top-6 space-y-3">
            {projectId && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 ${
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
            <FloatingKastenLijst
              kastenLijst={kabinet.kastenLijst}
              voegZijpaneelToe={kabinet.voegZijpaneelToe}
              kopieerKast={kabinet.kopieerKast}
              verwijderKast={kabinet.verwijderKast}
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
