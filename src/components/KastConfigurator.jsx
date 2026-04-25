import React, { useState } from 'react';
import { colorStyles, toestelOpties, complexiteitOpties, CABINET_TYPE_CONFIG, CUSTOM_CABINET_TYPES, SCHUIFDEUR_DEMPING, SCHUIFDEUR_PROFIEL } from '../constants/cabinet';
import Counter from './Counter';
import { KastPreview, VrijeKastPreview } from './KastPreview';

// Paslat section for STANDARD cabinets — single dimension per filler
// (top filler hoogte, side filler breedte; the other dimension comes from the cabinet)
const PaslatStandaardSection = ({ topH, sideW, onChangeTop, onChangeSide, onClose }) => (
  <div className="bg-blue-50 border border-blue-200 rounded p-2 space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-blue-800">Paslaten</span>
      <button
        onClick={onClose}
        className="text-xs text-gray-400 hover:text-red-500"
        title="Verwijder paslaten"
      >✕</button>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-xs text-gray-600">Bovenkant hoogte (mm)</label>
        <input
          type="number"
          min="0"
          value={topH}
          onChange={(e) => onChangeTop(parseInt(e.target.value) || 0)}
          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-gray-600">Zijkant breedte (mm)</label>
        <input
          type="number"
          min="0"
          value={sideW}
          onChange={(e) => onChangeSide(parseInt(e.target.value) || 0)}
          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
        />
      </div>
    </div>
  </div>
);

// Paslat section for CUSTOM cabinets — free-form rectangles (W × H) per paslat
const PaslatCustomSection = ({ paslatBovenkant = { breedte: 0, hoogte: 0 }, paslatZijkant = { breedte: 0, hoogte: 0 }, onChange, onClose }) => (
  <div className="bg-blue-50 border border-blue-200 rounded p-2 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-blue-800">Paslaten (in buitenzijde materiaal)</span>
      <button
        onClick={onClose}
        className="text-xs text-gray-400 hover:text-red-500"
        title="Verwijder paslaten"
      >✕</button>
    </div>
    {[
      { key: 'paslatBovenkant', label: 'Paslat bovenkant', val: paslatBovenkant },
      { key: 'paslatZijkant', label: 'Paslat zijkant', val: paslatZijkant },
    ].map(({ key, label, val }) => (
      <div key={key}>
        <label className="text-xs text-gray-600">{label}</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Breedte (mm)"
            value={val.breedte || 0}
            onChange={(e) => onChange(key, { ...val, breedte: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Hoogte (mm)"
            value={val.hoogte || 0}
            onChange={(e) => onChange(key, { ...val, hoogte: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>
    ))}
  </div>
);

// Single cabinet configurator
const SingleKastConfigurator = ({
  type,
  kast,
  setKast,
  huidigKast,
  setHuidigKast,
  voegKastToe,
  voegZijpaneelToeVoorType,
  colorClass,
  emoji,
  label
}) => {
  const isActive = huidigKast.type === type;
  const displayKast = isActive ? huidigKast : kast;
  const styles = colorStyles[colorClass] || colorStyles.purple;

  const updateField = (field, value) => {
    setKast(prev => ({ ...prev, [field]: value }));
    if (isActive) {
      setHuidigKast(prev => ({ ...prev, [field]: value }));
    }
  };

  const incrementField = (field) => {
    const newVal = displayKast[field] + 1;
    setKast(prev => ({ ...prev, [field]: newVal }));
    if (isActive) {
      setHuidigKast(prev => ({ ...prev, [field]: newVal }));
    } else {
      setHuidigKast({ type, ...kast, [field]: newVal });
    }
  };

  const decrementField = (field) => {
    if (displayKast[field] > 0) {
      const newVal = displayKast[field] - 1;
      setKast(prev => ({ ...prev, [field]: newVal }));
      if (isActive) {
        setHuidigKast(prev => ({ ...prev, [field]: newVal }));
      } else {
        setHuidigKast({ type, ...kast, [field]: newVal });
      }
    }
  };

  const handleToestelChange = (value) => {
    setKast(prev => ({ ...prev, aantalToestellen: value }));
    if (isActive) {
      setHuidigKast(prev => ({ ...prev, aantalToestellen: value }));
    }
  };

  const isOpenCabinet = displayKast.isOpen === true;
  const isDubbel = displayKast.isDubbel === true;
  const hasPaslat = (displayKast.topFillerHoogte || 0) > 0 || (displayKast.sideFillerBreedte || 0) > 0;
  const [showPaslat, setShowPaslat] = useState(false);
  const paslatVisible = showPaslat || hasPaslat;

  const handleToggleDubbel = (newDubbel) => {
    if (newDubbel === isDubbel) return;
    const newBreedte = newDubbel ? displayKast.breedte * 2 : Math.round(displayKast.breedte / 2);
    const updates = { isDubbel: newDubbel, breedte: newBreedte };
    if (!isOpenCabinet) {
      updates.aantalDeuren = newDubbel ? 2 : 1;
    }
    setKast(prev => ({ ...prev, ...updates }));
    if (isActive) {
      setHuidigKast(prev => ({ ...prev, ...updates }));
    }
  };

  // Build counter fields: hide doors when open, always show the rest
  const counterFields = [
    { field: 'aantalLeggers', label: 'Leggers' },
    { field: 'aantalTussensteunen', label: 'Steunen' },
    { field: 'aantalLades', label: 'Lades' },
    ...(!isOpenCabinet ? [{ field: 'aantalDeuren', label: 'Deuren' }] : [])
  ];

  return (
    <div className={`${styles.bg} p-3 rounded-lg border-2 ${styles.border} ${isOpenCabinet ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-gray-800">{emoji} {type}</h3>
        <div className="flex items-center gap-3">
          {/* Enkel/Dubbel toggle - not for Ladekast */}
          {type !== 'Ladekast' && (
            <div className="flex rounded-md overflow-hidden border border-gray-300 text-xs">
              <button
                onClick={() => handleToggleDubbel(false)}
                className={`px-2 py-0.5 font-semibold transition-colors ${
                  !isDubbel ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Enkel
              </button>
              <button
                onClick={() => handleToggleDubbel(true)}
                className={`px-2 py-0.5 font-semibold transition-colors ${
                  isDubbel ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Dubbel
              </button>
            </div>
          )}
          {/* Open/Closed toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-xs text-gray-600">{isOpenCabinet ? 'Open' : 'Dicht'}</span>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${isOpenCabinet ? 'bg-yellow-500' : 'bg-gray-300'}`}
              onClick={() => {
                const newVal = !displayKast.isOpen;
                updateField('isOpen', newVal);
                // When switching to open, force doors to 0
                if (newVal) {
                  updateField('aantalDeuren', 0);
                }
              }}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isOpenCabinet ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { field: 'hoogte', label: 'Hoogte (mm)' },
              { field: 'breedte', label: 'Breedte (mm)' },
              { field: 'diepte', label: 'Diepte (mm)' }
            ].map(({ field, label: lbl }) => (
              <div key={field}>
                <label className="text-xs text-gray-600">{lbl}</label>
                <input
                  type="number"
                  value={displayKast[field]}
                  onChange={(e) => updateField(field, parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                />
              </div>
            ))}
          </div>

          {/* Open indicator */}
          {isOpenCabinet && (
            <div className="bg-yellow-100 border border-yellow-300 rounded px-2 py-1 text-xs text-yellow-800 font-medium">
              Open kast - volledig buitenzijde materiaal, geen deuren
            </div>
          )}

          {/* Counters */}
          <div className="grid grid-cols-2 gap-2">
            {counterFields.map(({ field, label: lbl }) => (
              <Counter
                key={field}
                label={lbl}
                value={displayKast[field]}
                onChange={(val) => updateField(field, val)}
                onIncrement={() => incrementField(field)}
                onDecrement={() => decrementField(field)}
              />
            ))}
          </div>

          {/* Paslaten (top + side fillers) — visibility controlled by action button below */}
          {paslatVisible && (
            <PaslatStandaardSection
              topH={displayKast.topFillerHoogte || 0}
              sideW={displayKast.sideFillerBreedte || 0}
              onChangeTop={(v) => updateField('topFillerHoogte', v)}
              onChangeSide={(v) => updateField('sideFillerBreedte', v)}
              onClose={() => {
                updateField('topFillerHoogte', 0);
                updateField('sideFillerBreedte', 0);
                setShowPaslat(false);
              }}
            />
          )}

          {/* Toestellen button selector - only for Kolomkast */}
          {type === 'Kolomkast' && (
            <div>
              <label className="text-xs text-gray-600">Toestellen (+1 uur/toestel)</label>
              <div className="flex gap-1">
                {toestelOpties.map(num => (
                  <button
                    key={num}
                    onClick={() => handleToestelChange(num)}
                    className={`flex-1 py-1 rounded text-sm font-semibold ${
                      (displayKast.aantalToestellen || 0) === num
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => voegKastToe({ type, ...kast })}
              className={`${styles.button} text-white px-3 py-2 rounded-md font-semibold text-sm`}
            >
              + Toevoegen
            </button>
            <button
              onClick={() => voegZijpaneelToeVoorType(type, kast)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md font-semibold text-sm"
            >
              Zijpaneel
            </button>
            <button
              onClick={() => setShowPaslat(s => !s)}
              className={`${
                hasPaslat
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
              } px-3 py-2 rounded-md font-semibold text-sm`}
              title={hasPaslat ? 'Paslat actief — klik om te tonen/verbergen' : 'Paslat toevoegen'}
            >
              Paslat{hasPaslat ? ' ✓' : ''}
            </button>
          </div>
        </div>

        <KastPreview type={type} kast={displayKast} label={label} />
      </div>
    </div>
  );
};

// Vrije Kast configurator (custom cabinets with any material from full plaatMaterialen list)
const VrijeKastConfigurator = ({
  vrijeKast,
  setVrijeKast,
  huidigKast,
  setHuidigKast,
  voegKastToe,
  voegZijpaneelToeVoorType,
  plaatMaterialen
}) => {
  const isActive = huidigKast.type === 'Vrije Kast';
  const displayKast = isActive ? huidigKast : vrijeKast;

  const updateField = (field, value) => {
    setVrijeKast(prev => ({ ...prev, [field]: value }));
    if (isActive) {
      setHuidigKast(prev => ({ ...prev, [field]: value }));
    }
  };

  const updateOnderdeel = (onderdeel, value) => {
    setVrijeKast(prev => ({
      ...prev,
      vrijeKastOnderdelen: { ...prev.vrijeKastOnderdelen, [onderdeel]: value }
    }));
    if (isActive) {
      setHuidigKast(prev => ({
        ...prev,
        vrijeKastOnderdelen: { ...prev.vrijeKastOnderdelen, [onderdeel]: value }
      }));
    }
  };

  const incrementField = (field) => {
    const newVal = displayKast[field] + 1;
    setVrijeKast(prev => ({ ...prev, [field]: newVal }));
    if (isActive) setHuidigKast(prev => ({ ...prev, [field]: newVal }));
  };

  const decrementField = (field) => {
    const newVal = Math.max(0, displayKast[field] - 1);
    setVrijeKast(prev => ({ ...prev, [field]: newVal }));
    if (isActive) setHuidigKast(prev => ({ ...prev, [field]: newVal }));
  };

  // Current selected material id (null means first in list)
  const selectedMatId = displayKast.vrijeKastMateriaalId;

  return (
    <div className="bg-white p-3 rounded-lg border-2 border-pink-200 shadow-md">
      <h3 className="text-sm font-bold text-gray-800 mb-2">Vrije Kast</h3>

      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          {/* Custom name */}
          <div>
            <input
              type="text"
              placeholder="Naam (optioneel)"
              value={displayKast.naam || ''}
              onChange={(e) => updateField('naam', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { field: 'hoogte', label: 'Hoogte (mm)' },
              { field: 'breedte', label: 'Breedte (mm)' },
              { field: 'diepte', label: 'Diepte (mm)' }
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="text-xs text-gray-600">{label}</label>
                <input
                  type="number"
                  value={displayKast[field]}
                  onChange={(e) => updateField(field, parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                />
              </div>
            ))}
          </div>

          {/* Material selection */}
          <div>
            <label className="text-xs text-gray-600 block mb-1">Materiaal</label>
            <select
              value={selectedMatId ?? ''}
              onChange={(e) => updateField('vrijeKastMateriaalId', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="">-- Kies materiaal --</option>
              {plaatMaterialen.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.naam} - {mat.breedte}x{mat.hoogte} mm - €{mat.prijs.toFixed(2)}/m²
                </option>
              ))}
            </select>
          </div>

          {/* Complexity selection */}
          <div>
            <label className="text-xs text-gray-600 block mb-1">Complexiteit (montage uren)</label>
            <select
              value={displayKast.complexiteit || 'gemiddeld'}
              onChange={(e) => updateField('complexiteit', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-orange-50"
            >
              {complexiteitOpties.map((optie) => (
                <option key={optie.key} value={optie.key}>
                  {optie.label} ({optie.uren}u)
                </option>
              ))}
            </select>
          </div>

          {/* Parts selection */}
          <div>
            <label className="text-xs text-gray-600 block mb-1">Onderdelen</label>
            <div className="grid grid-cols-6 gap-2">
              {['LZ', 'RZ', 'BK', 'OK', 'RUG', 'VK'].map(onderdeel => (
                <label key={onderdeel} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={displayKast.vrijeKastOnderdelen?.[onderdeel] || false}
                    onChange={(e) => updateOnderdeel(onderdeel, e.target.checked)}
                    className="rounded"
                  />
                  {onderdeel}
                </label>
              ))}
            </div>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { field: 'aantalLeggers', label: 'Leggers' },
              { field: 'aantalTussensteunen', label: 'Steunen' },
              { field: 'aantalDeuren', label: 'Deuren' }
            ].map(({ field, label }) => (
              <Counter
                key={field}
                label={label}
                value={displayKast[field]}
                onChange={(val) => updateField(field, val)}
                onIncrement={() => incrementField(field)}
                onDecrement={() => decrementField(field)}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => voegKastToe({ type: 'Vrije Kast', ...vrijeKast })}
              className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded-md font-semibold text-sm"
            >
              Toevoegen
            </button>
            <button
              onClick={() => voegZijpaneelToeVoorType('Vrije Kast', vrijeKast)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md font-semibold text-sm"
            >
              Zijpaneel
            </button>
          </div>
        </div>

        <VrijeKastPreview kast={displayKast} />
      </div>
    </div>
  );
};

// Custom Kast Configurator (Vaatwasserdeur, Onderkast/Kolomkast Schuifdeur, Tablet)
const CustomKastConfigurator = ({
  customKast,
  setCustomKast,
  huidigKast,
  setHuidigKast,
  voegKastToe,
  voegZijpaneelToeVoorType
}) => {
  const selectedType = customKast.type;
  const typeConfig = CUSTOM_CABINET_TYPES.find(t => t.id === selectedType) || CUSTOM_CABINET_TYPES[0];
  const styles = colorStyles[typeConfig.colorClass] || colorStyles.teal;

  const updateField = (field, value) => {
    setCustomKast(prev => ({ ...prev, [field]: value }));
  };

  const switchType = (newType) => {
    // Reset to defaults for the new type
    const defaults = {
      'Vaatwasserdeur': { hoogte: 700, breedte: 605, diepte: 600, aantalLeggers: 0, aantalTussensteunen: 0, aantalDeuren: 2, spatwand: false },
      'Onderkast Schuifdeur': { hoogte: 900, breedte: 600, diepte: 600, aantalLeggers: 1, aantalTussensteunen: 0, aantalDeuren: 2, spatwand: false },
      'Kolomkast Schuifdeur': { hoogte: 2100, breedte: 600, diepte: 600, aantalLeggers: 4, aantalTussensteunen: 0, aantalDeuren: 2, spatwand: false },
      'Tablet': { hoogte: 600, breedte: 3000, diepte: 600, aantalLeggers: 0, aantalTussensteunen: 0, aantalDeuren: 0, spatwand: false },
    };
    setCustomKast(prev => ({
      ...prev,
      type: newType,
      ...(defaults[newType] || {}),
      schuifdeurDemping: prev.schuifdeurDemping || 'geen',
      schuifdeurBovenprofiel: prev.schuifdeurBovenprofiel || '2_5m',
      schuifdeurOnderprofiel: prev.schuifdeurOnderprofiel || '2_5m',
    }));
  };

  const incrementField = (field) => {
    setCustomKast(prev => ({ ...prev, [field]: (prev[field] || 0) + 1 }));
  };
  const decrementField = (field) => {
    setCustomKast(prev => ({ ...prev, [field]: Math.max(0, (prev[field] || 0) - 1) }));
  };

  const isSchuifdeur = selectedType === 'Onderkast Schuifdeur' || selectedType === 'Kolomkast Schuifdeur';
  const isTablet = selectedType === 'Tablet';
  const isVaatwasser = selectedType === 'Vaatwasserdeur';

  const pb = customKast.paslatBovenkant || { breedte: 0, hoogte: 0 };
  const pz = customKast.paslatZijkant || { breedte: 0, hoogte: 0 };
  const hasPaslat = (pb.breedte > 0 && pb.hoogte > 0) || (pz.breedte > 0 && pz.hoogte > 0);
  const [showPaslat, setShowPaslat] = useState(false);
  const paslatVisible = showPaslat || hasPaslat;

  // Dimension fields vary per type
  const dimensionFields = isVaatwasser
    ? [{ field: 'hoogte', label: 'Hoogte (mm)' }, { field: 'breedte', label: 'Breedte (mm)' }]
    : isTablet
    ? [{ field: 'breedte', label: 'Breedte (mm)' }, { field: 'diepte', label: 'Diepte (mm)' }, { field: 'hoogte', label: 'Hoogte spatwand (mm)' }]
    : [{ field: 'hoogte', label: 'Hoogte (mm)' }, { field: 'breedte', label: 'Breedte (mm)' }, { field: 'diepte', label: 'Diepte (mm)' }];

  return (
    <div className={`${styles.bg} p-3 rounded-lg border-2 ${styles.border} shadow-md`}>
      <h3 className="text-sm font-bold text-gray-800 mb-2">Custom Kast</h3>

      <div className="space-y-2">
        {/* Type selector */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => switchType(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm font-semibold"
          >
            {CUSTOM_CABINET_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Dimensions */}
        <div className={`grid grid-cols-${dimensionFields.length} gap-2`}>
          {dimensionFields.map(({ field, label }) => (
            <div key={field}>
              <label className="text-xs text-gray-600">{label}</label>
              <input
                type="number"
                value={customKast[field] || 0}
                onChange={(e) => updateField(field, parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          ))}
        </div>

        {/* Schuifdeur options */}
        {isSchuifdeur && (
          <>
            {/* Counters for leggers/steunen */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { field: 'aantalLeggers', label: 'Leggers' },
                { field: 'aantalTussensteunen', label: 'Steunen' },
              ].map(({ field, label }) => (
                <Counter
                  key={field}
                  label={label}
                  value={customKast[field] || 0}
                  onChange={(val) => updateField(field, val)}
                  onIncrement={() => incrementField(field)}
                  onDecrement={() => decrementField(field)}
                />
              ))}
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Demping schuifdeursysteem</label>
              <select
                value={customKast.schuifdeurDemping || 'geen'}
                onChange={(e) => updateField('schuifdeurDemping', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                {SCHUIFDEUR_DEMPING.map(d => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Bovenprofiel</label>
              <select
                value={customKast.schuifdeurBovenprofiel || '2_5m'}
                onChange={(e) => updateField('schuifdeurBovenprofiel', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                {SCHUIFDEUR_PROFIEL.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Onderprofiel only for Kolomkast Schuifdeur */}
            {selectedType === 'Kolomkast Schuifdeur' && (
              <div>
                <label className="text-xs text-gray-600 block mb-1">Onderprofiel</label>
                <select
                  value={customKast.schuifdeurOnderprofiel || '2_5m'}
                  onChange={(e) => updateField('schuifdeurOnderprofiel', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                >
                  {SCHUIFDEUR_PROFIEL.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {/* Tablet: spatwand checkbox */}
        {isTablet && (
          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={customKast.spatwand || false}
                onChange={(e) => updateField('spatwand', e.target.checked)}
                className="rounded"
              />
              Spatwand (+1u, in buitenzijde materiaal)
            </label>
          </div>
        )}

        {/* Paslaten (free-form fillers in buitenzijde material) */}
        {paslatVisible && (
          <PaslatCustomSection
            paslatBovenkant={customKast.paslatBovenkant || { breedte: 0, hoogte: 0 }}
            paslatZijkant={customKast.paslatZijkant || { breedte: 0, hoogte: 0 }}
            onChange={(field, value) => updateField(field, value)}
            onClose={() => {
              updateField('paslatBovenkant', { breedte: 0, hoogte: 0 });
              updateField('paslatZijkant', { breedte: 0, hoogte: 0 });
              setShowPaslat(false);
            }}
          />
        )}

        {/* Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => voegKastToe({ ...customKast })}
            className={`${styles.button} text-white px-3 py-2 rounded-md font-semibold text-sm`}
          >
            + Toevoegen
          </button>
          <button
            onClick={() => voegZijpaneelToeVoorType(selectedType, customKast)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md font-semibold text-sm"
          >
            Zijpaneel
          </button>
          <button
            onClick={() => setShowPaslat(s => !s)}
            className={`${
              hasPaslat
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
            } px-3 py-2 rounded-md font-semibold text-sm`}
            title={hasPaslat ? 'Paslat actief — klik om te tonen/verbergen' : 'Paslat toevoegen'}
          >
            Paslat{hasPaslat ? ' ✓' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

// Cabinet grid configuration for data-driven rendering
const CABINET_GRID = [
  { type: 'Bovenkast', stateKey: 'bovenkast', setKey: 'setBovenkast' },
  { type: 'Kolomkast', stateKey: 'kolomkast', setKey: 'setKolomkast' },
  { type: 'Onderkast', stateKey: 'onderkast', setKey: 'setOnderkast' },
  { type: 'Ladekast', stateKey: 'ladekast', setKey: 'setLadekast' },
];

// Main export - KastConfigurator grid
const KastConfigurator = (props) => {
  const {
    huidigKast, setHuidigKast,
    voegKastToe, voegZijpaneelToeVoorType,
    vrijeKast, setVrijeKast,
    customKast, setCustomKast,
    plaatMaterialen
  } = props;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {CABINET_GRID.map(({ type, stateKey, setKey }) => {
          const config = CABINET_TYPE_CONFIG[type];
          return (
            <SingleKastConfigurator
              key={type}
              type={type}
              kast={props[stateKey]}
              setKast={props[setKey]}
              huidigKast={huidigKast}
              setHuidigKast={setHuidigKast}
              voegKastToe={voegKastToe}
              voegZijpaneelToeVoorType={voegZijpaneelToeVoorType}
              colorClass={config.colorClass}
              emoji={config.emoji}
              label={config.label}
            />
          );
        })}
      </div>

      {/* Vrije Kast + Custom Kast side by side */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <VrijeKastConfigurator
          vrijeKast={vrijeKast}
          setVrijeKast={setVrijeKast}
          huidigKast={huidigKast}
          setHuidigKast={setHuidigKast}
          voegKastToe={voegKastToe}
          voegZijpaneelToeVoorType={voegZijpaneelToeVoorType}
          plaatMaterialen={plaatMaterialen}
        />
        <CustomKastConfigurator
          customKast={customKast}
          setCustomKast={setCustomKast}
          huidigKast={huidigKast}
          setHuidigKast={setHuidigKast}
          voegKastToe={voegKastToe}
          voegZijpaneelToeVoorType={voegZijpaneelToeVoorType}
        />
      </div>
    </>
  );
};

export default KastConfigurator;
