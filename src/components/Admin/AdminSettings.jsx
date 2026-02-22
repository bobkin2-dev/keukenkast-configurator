import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { defaultPlaatMaterialen } from '../../data/defaultMaterials';

// Default production parameters (as of 22 feb 2026)
const DEFAULT_PRODUCTION_PARAMS = {
  afplakkenPerUur: 35, // lm/uur
  platenPerUur: 3, // platen/uur
  // Base montage time: simple cabinet = baseMontageUren × typeMultiplier
  baseMontageUren: 1.5,
  // Type multipliers
  typeMultipliers: {
    'Onderkast': 1.0,
    'Bovenkast': 0.9,
    'Kolomkast': 1.35,
    'Ladekast': 1.35,
    'Vrije Kast': 1.0, // Now controlled by complexity dropdown per cabinet
  },
  // Vrije Kast complexity levels (hours)
  vrijeKastComplexiteit: {
    'heel_gemakkelijk': 1,
    'gemakkelijk': 2,
    'gemiddeld': 3,
    'moeilijk': 4,
    'heel_moeilijk': 6
  },
  // Last updated
  lastUpdated: '2026-02-11',
  updatedBy: 'admin'
};

const AdminSettings = ({ isOpen, onClose, isAdmin }) => {
  const [productionParams, setProductionParams] = useState(DEFAULT_PRODUCTION_PARAMS);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('algemeen');

  // Plaat materialen state
  const [plaatMaterialen, setPlaatMaterialen] = useState([]);
  const [nieuwMateriaal, setNieuwMateriaal] = useState({
    naam: '',
    breedte: 3050,
    hoogte: 1300,
    prijs: 0,
    binnenkast: false,
    buitenzijde: false,
    tablet: false
  });

  // Open Nis voorbeelden state
  const [openNisVoorbeelden, setOpenNisVoorbeelden] = useState([]);
  const [nieuwVoorbeeld, setNieuwVoorbeeld] = useState({
    hoogte: 900,
    breedte: 600,
    diepte: 600,
    aantalLeggers: 0,
    aantalDeuren: 0,
    aantalTussensteunen: 0,
    hplOnderdelen: { LZ: false, RZ: false, BK: false, OK: false, RUG: false },
    effectieveUren: 3,
    complexiteit: 'gemiddeld',
    notities: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadVoorbeelden();
      loadPlaatMaterialen();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
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
      console.log('No saved settings found, using defaults');
    }
    setLoading(false);
  };

  const loadPlaatMaterialen = async () => {
    try {
      const { data, error } = await supabase
        .from('plaat_materialen')
        .select('*')
        .order('id', { ascending: true });

      if (data && !error && data.length > 0) {
        setPlaatMaterialen(data);
      } else {
        // Use defaults if table is empty or doesn't exist
        setPlaatMaterialen(defaultPlaatMaterialen);
      }
    } catch (err) {
      console.log('Using default plate materials');
      setPlaatMaterialen(defaultPlaatMaterialen);
    }
  };

  const saveNieuwMateriaal = async () => {
    if (!isAdmin || !nieuwMateriaal.naam.trim()) return;

    try {
      const afmeting = `${nieuwMateriaal.breedte} x ${nieuwMateriaal.hoogte}`;
      const { error } = await supabase
        .from('plaat_materialen')
        .insert({
          naam: nieuwMateriaal.naam,
          afmeting,
          breedte: nieuwMateriaal.breedte,
          hoogte: nieuwMateriaal.hoogte,
          prijs: nieuwMateriaal.prijs,
          binnenkast: nieuwMateriaal.binnenkast,
          buitenzijde: nieuwMateriaal.buitenzijde,
          tablet: nieuwMateriaal.tablet
        });

      if (error) throw error;

      loadPlaatMaterialen();
      setNieuwMateriaal({
        naam: '',
        breedte: 3050,
        hoogte: 1300,
        prijs: 0,
        binnenkast: false,
        buitenzijde: false,
        tablet: false
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving materiaal:', err);
      alert('Fout bij opslaan: ' + err.message);
    }
  };

  const updateMateriaalPopularUse = async (id, field, value) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('plaat_materialen')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;
      loadPlaatMaterialen();
    } catch (err) {
      console.error('Error updating materiaal:', err);
      alert('Fout bij bijwerken: ' + err.message);
    }
  };

  const deleteMateriaal = async (id) => {
    if (!isAdmin) return;
    if (!confirm('Weet je zeker dat je dit materiaal wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('plaat_materialen')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadPlaatMaterialen();
    } catch (err) {
      console.error('Error deleting materiaal:', err);
      alert('Fout bij verwijderen: ' + err.message);
    }
  };

  const loadVoorbeelden = async () => {
    try {
      const { data, error } = await supabase
        .from('open_nis_voorbeelden')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setOpenNisVoorbeelden(data);
      }
    } catch (err) {
      console.log('No voorbeelden found');
    }
  };

  const saveVoorbeeld = async () => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('open_nis_voorbeelden')
        .insert({
          ...nieuwVoorbeeld,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Reload voorbeelden
      loadVoorbeelden();

      // Reset form
      setNieuwVoorbeeld({
        hoogte: 900,
        breedte: 600,
        diepte: 600,
        aantalLeggers: 0,
        aantalDeuren: 0,
        aantalTussensteunen: 0,
        hplOnderdelen: { LZ: false, RZ: false, BK: false, OK: false, RUG: false },
        effectieveUren: 3,
        complexiteit: 'gemiddeld',
        notities: ''
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving voorbeeld:', err);
      alert('Fout bij opslaan: ' + err.message);
    }
  };

  const deleteVoorbeeld = async (id) => {
    if (!isAdmin) return;
    if (!confirm('Weet je zeker dat je dit voorbeeld wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('open_nis_voorbeelden')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadVoorbeelden();
    } catch (err) {
      console.error('Error deleting voorbeeld:', err);
      alert('Fout bij verwijderen: ' + err.message);
    }
  };

  const saveSettings = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const updatedParams = {
        ...productionParams,
        lastUpdated: new Date().toISOString().split('T')[0],
        updatedBy: 'admin'
      };

      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'production_params',
          value: updatedParams,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;

      setProductionParams(updatedParams);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Fout bij opslaan: ' + err.message);
    }
    setLoading(false);
  };

  const updateParam = (key, value) => {
    setProductionParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateTypeMultiplier = (type, value) => {
    setProductionParams(prev => ({
      ...prev,
      typeMultipliers: {
        ...prev.typeMultipliers,
        [type]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">⚙️ Admin Instellingen</h2>
            <p className="text-purple-200 text-sm">Productie parameters voor werkuurberekening</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex gap-4 -mb-px">
            {[
              { id: 'algemeen', label: 'Algemeen', icon: '📊' },
              { id: 'materialen', label: 'Plaat Materialen', icon: '🪵' },
              { id: 'types', label: 'Kast Types', icon: '🗄️' },
              { id: 'voorbeelden', label: 'Vrije Kast Voorbeelden', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'algemeen' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📅 Huidige Data</h3>
                <p className="text-sm text-blue-700">
                  Laatst bijgewerkt: <strong>{productionParams.lastUpdated}</strong>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎨 Afplakken (lm/uur)
                  </label>
                  <input
                    type="number"
                    value={productionParams.afplakkenPerUur}
                    onChange={(e) => updateParam('afplakkenPerUur', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-gray-500 mt-1">Lopende meters kantenband per uur</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📦 Platen verwerken (platen/uur)
                  </label>
                  <input
                    type="number"
                    value={productionParams.platenPerUur}
                    onChange={(e) => updateParam('platenPerUur', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-gray-500 mt-1">Aantal platen gezaagd per uur</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔧 Basis montage (uren/kast)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={productionParams.baseMontageUren}
                    onChange={(e) => updateParam('baseMontageUren', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-gray-500 mt-1">Basistijd x type multiplier</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'materialen' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-2">🪵 Plaat Materialen</h3>
                <p className="text-sm text-amber-700">
                  Beheer alle plaatmaterialen. Vink aan waarvoor elk materiaal populair is (binnenkast, buitenzijde, tablet).
                  De dropdowns in de configurator tonen populaire materialen bovenaan.
                </p>
              </div>

              {/* Bestaande materialen tabel */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-amber-100">
                      <th className="border px-3 py-2 text-left">Naam</th>
                      <th className="border px-3 py-2 text-right">Breedte</th>
                      <th className="border px-3 py-2 text-right">Hoogte</th>
                      <th className="border px-3 py-2 text-right">Prijs/m²</th>
                      <th className="border px-3 py-2 text-center">Binnenkast</th>
                      <th className="border px-3 py-2 text-center">Buitenzijde</th>
                      <th className="border px-3 py-2 text-center">Tablet</th>
                      <th className="border px-3 py-2 text-center">Actie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plaatMaterialen.map((mat) => (
                      <tr key={mat.id} className="hover:bg-gray-50">
                        <td className="border px-3 py-2 font-medium">{mat.naam}</td>
                        <td className="border px-3 py-2 text-right">{mat.breedte} mm</td>
                        <td className="border px-3 py-2 text-right">{mat.hoogte} mm</td>
                        <td className="border px-3 py-2 text-right font-semibold">€{mat.prijs.toFixed(2)}</td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={mat.binnenkast || false}
                            onChange={(e) => updateMateriaalPopularUse(mat.id, 'binnenkast', e.target.checked)}
                            disabled={!isAdmin}
                            className="rounded"
                          />
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={mat.buitenzijde || false}
                            onChange={(e) => updateMateriaalPopularUse(mat.id, 'buitenzijde', e.target.checked)}
                            disabled={!isAdmin}
                            className="rounded"
                          />
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={mat.tablet || false}
                            onChange={(e) => updateMateriaalPopularUse(mat.id, 'tablet', e.target.checked)}
                            disabled={!isAdmin}
                            className="rounded"
                          />
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <button
                            onClick={() => deleteMateriaal(mat.id)}
                            className="text-red-500 hover:text-red-700"
                            disabled={!isAdmin}
                            title="Verwijderen"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Nieuw materiaal toevoegen */}
              {isAdmin && (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                  <h4 className="font-semibold text-gray-700 mb-3">+ Nieuw materiaal toevoegen</h4>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Naam</label>
                      <input
                        type="text"
                        value={nieuwMateriaal.naam}
                        onChange={(e) => setNieuwMateriaal(prev => ({ ...prev, naam: e.target.value }))}
                        placeholder="bijv. L18 Eik"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Breedte (mm)</label>
                      <input
                        type="number"
                        value={nieuwMateriaal.breedte}
                        onChange={(e) => setNieuwMateriaal(prev => ({ ...prev, breedte: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Hoogte (mm)</label>
                      <input
                        type="number"
                        value={nieuwMateriaal.hoogte}
                        onChange={(e) => setNieuwMateriaal(prev => ({ ...prev, hoogte: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Prijs (€/m²)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={nieuwMateriaal.prijs}
                        onChange={(e) => setNieuwMateriaal(prev => ({ ...prev, prijs: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-6 mb-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={nieuwMateriaal.binnenkast}
                        onChange={(e) => setNieuwMateriaal(prev => ({ ...prev, binnenkast: e.target.checked }))}
                        className="rounded"
                      />
                      Populair voor binnenkast
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={nieuwMateriaal.buitenzijde}
                        onChange={(e) => setNieuwMateriaal(prev => ({ ...prev, buitenzijde: e.target.checked }))}
                        className="rounded"
                      />
                      Populair voor buitenzijde
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={nieuwMateriaal.tablet}
                        onChange={(e) => setNieuwMateriaal(prev => ({ ...prev, tablet: e.target.checked }))}
                        className="rounded"
                      />
                      Populair voor tablet
                    </label>
                  </div>
                  <button
                    onClick={saveNieuwMateriaal}
                    disabled={!nieuwMateriaal.naam.trim()}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white py-2 px-6 rounded-lg font-semibold"
                  >
                    + Materiaal Toevoegen
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'types' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">🗄️ Type Multipliers</h3>
                <p className="text-sm text-purple-700">
                  De basis montagetijd wordt vermenigvuldigd met deze factor per kasttype.
                  <br />1.0 = standaard, &lt;1.0 = sneller, &gt;1.0 = langzamer
                </p>
              </div>

              <div className="space-y-4">
                {Object.entries(productionParams.typeMultipliers).map(([type, multiplier]) => (
                  <div key={type} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                    <span className="font-medium text-gray-700">{type}</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.1"
                        value={multiplier}
                        onChange={(e) => updateTypeMultiplier(type, parseFloat(e.target.value))}
                        className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-center"
                        disabled={!isAdmin}
                      />
                      <span className="text-sm text-gray-500">×</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'voorbeelden' && (
            <div className="space-y-6">
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <h3 className="font-semibold text-pink-800 mb-2">📋 Vrije Kast Voorbeelden</h3>
                <p className="text-sm text-pink-700">
                  Log hier voorbeelden van Open Nis HPL configuraties met hun effectieve werktijd.
                  Dit helpt om in de toekomst betere schattingen te maken.
                </p>
              </div>

              {/* Nieuw voorbeeld formulier */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                <h4 className="font-semibold text-gray-700 mb-3">+ Nieuw voorbeeld toevoegen</h4>

                {/* Afmetingen */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Hoogte (mm)</label>
                    <input
                      type="number"
                      value={nieuwVoorbeeld.hoogte}
                      onChange={(e) => setNieuwVoorbeeld(prev => ({ ...prev, hoogte: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Breedte (mm)</label>
                    <input
                      type="number"
                      value={nieuwVoorbeeld.breedte}
                      onChange={(e) => setNieuwVoorbeeld(prev => ({ ...prev, breedte: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Diepte (mm)</label>
                    <input
                      type="number"
                      value={nieuwVoorbeeld.diepte}
                      onChange={(e) => setNieuwVoorbeeld(prev => ({ ...prev, diepte: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* HPL Onderdelen */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600 block mb-1">HPL Onderdelen</label>
                  <div className="flex gap-4">
                    {['LZ', 'RZ', 'BK', 'OK', 'RUG'].map(onderdeel => (
                      <label key={onderdeel} className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={nieuwVoorbeeld.hplOnderdelen?.[onderdeel] || false}
                          onChange={(e) => setNieuwVoorbeeld(prev => ({
                            ...prev,
                            hplOnderdelen: { ...prev.hplOnderdelen, [onderdeel]: e.target.checked }
                          }))}
                          className="rounded"
                        />
                        {onderdeel}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Aantallen */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Leggers</label>
                    <input
                      type="number"
                      min="0"
                      value={nieuwVoorbeeld.aantalLeggers}
                      onChange={(e) => setNieuwVoorbeeld(prev => ({ ...prev, aantalLeggers: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Deuren</label>
                    <input
                      type="number"
                      min="0"
                      value={nieuwVoorbeeld.aantalDeuren}
                      onChange={(e) => setNieuwVoorbeeld(prev => ({ ...prev, aantalDeuren: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Tussensteunen</label>
                    <input
                      type="number"
                      min="0"
                      value={nieuwVoorbeeld.aantalTussensteunen}
                      onChange={(e) => setNieuwVoorbeeld(prev => ({ ...prev, aantalTussensteunen: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Effectieve uren en complexiteit */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Effectieve uren (gemeten)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={nieuwVoorbeeld.effectieveUren}
                      onChange={(e) => setNieuwVoorbeeld(prev => ({ ...prev, effectieveUren: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-orange-50 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Complexiteit categorie</label>
                    <select
                      value={nieuwVoorbeeld.complexiteit}
                      onChange={(e) => setNieuwVoorbeeld(prev => ({ ...prev, complexiteit: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="heel_gemakkelijk">Heel gemakkelijk (1u)</option>
                      <option value="gemakkelijk">Gemakkelijk (2u)</option>
                      <option value="gemiddeld">Gemiddeld (3u)</option>
                      <option value="moeilijk">Moeilijk (4u)</option>
                      <option value="heel_moeilijk">Heel moeilijk (6u)</option>
                    </select>
                  </div>
                </div>

                {/* Notities */}
                <div className="mb-3">
                  <label className="text-xs text-gray-600 block mb-1">Notities</label>
                  <textarea
                    value={nieuwVoorbeeld.notities}
                    onChange={(e) => setNieuwVoorbeeld(prev => ({ ...prev, notities: e.target.value }))}
                    placeholder="Bijzonderheden, project naam, etc."
                    className="w-full px-3 py-2 border rounded-lg text-sm h-16"
                  />
                </div>

                <button
                  onClick={saveVoorbeeld}
                  disabled={!isAdmin}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-lg font-semibold"
                >
                  + Voorbeeld Opslaan
                </button>
              </div>

              {/* Bestaande voorbeelden */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Opgeslagen voorbeelden ({openNisVoorbeelden.length})</h4>

                {openNisVoorbeelden.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">Nog geen voorbeelden opgeslagen.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {openNisVoorbeelden.map((vb) => (
                      <div key={vb.id} className="bg-white border rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">
                              {vb.hoogte}×{vb.breedte}×{vb.diepte}mm
                              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                                {vb.effectieveUren}u effectief
                              </span>
                              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {vb.complexiteit?.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                              HPL: {Object.entries(vb.hplOnderdelen || {}).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'geen'}
                              {vb.aantalLeggers > 0 && ` | ${vb.aantalLeggers} leggers`}
                              {vb.aantalDeuren > 0 && ` | ${vb.aantalDeuren} deuren`}
                              {vb.aantalTussensteunen > 0 && ` | ${vb.aantalTussensteunen} steunen`}
                            </div>
                            {vb.notities && (
                              <div className="text-gray-500 text-xs mt-1 italic">"{vb.notities}"</div>
                            )}
                          </div>
                          <button
                            onClick={() => deleteVoorbeeld(vb.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Verwijderen"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {isAdmin ? '✅ Admin rechten - wijzigingen worden opgeslagen' : '🔒 Alleen lezen'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
            >
              Sluiten
            </button>
            {isAdmin && (
              <button
                onClick={saveSettings}
                disabled={loading}
                className={`px-6 py-2 rounded-lg font-semibold text-white transition ${
                  saved
                    ? 'bg-green-500'
                    : loading
                    ? 'bg-gray-400'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {saved ? '✓ Opgeslagen!' : loading ? 'Opslaan...' : 'Opslaan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
export { DEFAULT_PRODUCTION_PARAMS };
