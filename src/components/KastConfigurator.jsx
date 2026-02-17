import React from 'react';
import { colorStyles, toestelOpties, complexiteitOpties, CABINET_TYPE_CONFIG } from '../constants/cabinet';
import Counter from './Counter';
import { KastPreview, VrijeKastPreview } from './KastPreview';

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
          <div className="grid grid-cols-2 gap-2">
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
    <div className="bg-white p-4 rounded-lg mb-4 border-2 border-pink-200 shadow-md">
      <h3 className="text-sm font-bold text-gray-800 mb-2">Vrije Kast</h3>

      <div className="flex gap-4">
        <div className="flex-1">
          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-2 mb-2">
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

          {/* Material selection - shows ALL plaatMaterialen, stores material id */}
          <div className="mb-2">
            <label className="text-xs text-gray-600 block mb-1">Materiaal</label>
            <select
              value={selectedMatId ?? ''}
              onChange={(e) => updateField('vrijeKastMateriaalId', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
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
          <div className="mb-2">
            <label className="text-xs text-gray-600 block mb-1">Complexiteit (montage uren)</label>
            <select
              value={displayKast.complexiteit || 'gemiddeld'}
              onChange={(e) => updateField('complexiteit', e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm bg-orange-50"
            >
              {complexiteitOpties.map((optie) => (
                <option key={optie.key} value={optie.key}>
                  {optie.label} ({optie.uren}u)
                </option>
              ))}
            </select>
          </div>

          {/* Parts selection */}
          <div className="mb-2">
            <label className="text-xs text-gray-600 block mb-1">Onderdelen</label>
            <div className="grid grid-cols-5 gap-2">
              {['LZ', 'RZ', 'BK', 'OK', 'RUG'].map(onderdeel => (
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
          <div className="grid grid-cols-2 gap-2 mb-2">
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

      <VrijeKastConfigurator
        vrijeKast={vrijeKast}
        setVrijeKast={setVrijeKast}
        huidigKast={huidigKast}
        setHuidigKast={setHuidigKast}
        voegKastToe={voegKastToe}
        voegZijpaneelToeVoorType={voegZijpaneelToeVoorType}
        plaatMaterialen={plaatMaterialen}
      />
    </>
  );
};

export default KastConfigurator;
