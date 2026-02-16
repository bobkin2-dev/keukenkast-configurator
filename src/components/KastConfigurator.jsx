import React from 'react';

// Reusable counter component
const Counter = ({ label, value, onChange, onIncrement, onDecrement }) => (
  <div>
    <label className="text-xs text-gray-600">{label}</label>
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-1/3 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
      />
      <button
        onClick={onDecrement}
        className="flex-1 bg-red-400 hover:bg-red-500 text-white py-1 rounded font-bold text-sm"
      >
        −
      </button>
      <button
        onClick={onIncrement}
        className="flex-1 bg-green-400 hover:bg-green-500 text-white py-1 rounded font-bold text-sm"
      >
        +
      </button>
    </div>
  </div>
);

// Cabinet preview component
const KastPreview = ({ type, kast, label, maxHeight = 200 }) => {
  const getPreviewDimensions = () => {
    const heightScale = type === 'Kolomkast' ? 12 : 4;
    return {
      width: `${Math.min(kast.breedte / 4, 200)}px`,
      height: `${Math.min(kast.hoogte / heightScale, maxHeight)}px`
    };
  };

  return (
    <div className="w-1/3 flex-shrink-0 flex items-center justify-center">
      <div
        className="border-2 border-gray-800 bg-gray-100 relative"
        style={getPreviewDimensions()}
      >
        {/* Doors */}
        {kast.aantalDeuren > 0 && Array.from({ length: kast.aantalDeuren }).map((_, i) => (
          <div
            key={`deur-${i}`}
            className="absolute border-2 border-red-500 bg-red-50"
            style={{
              left: `${(i * 100) / kast.aantalDeuren + 2}%`,
              top: '2%',
              width: `${100 / kast.aantalDeuren - 4}%`,
              height: '96%'
            }}
          />
        ))}

        {/* Drawers (for Ladekast) */}
        {type === 'Ladekast' && kast.aantalLades > 0 && Array.from({ length: kast.aantalLades }).map((_, i) => (
          <div
            key={`lade-${i}`}
            className="absolute border-2 border-orange-500 bg-orange-50"
            style={{
              left: '2%',
              top: `${(i * 100) / kast.aantalLades + 2}%`,
              width: '96%',
              height: `${100 / kast.aantalLades - 4}%`
            }}
          />
        ))}

        {/* Shelves */}
        {Array.from({ length: kast.aantalLeggers }).map((_, i) => (
          <div
            key={`legger-${i}`}
            className="absolute w-full border-t-2 border-dashed border-blue-500"
            style={{ top: `${((i + 1) * 100) / (kast.aantalLeggers + 1)}%` }}
          />
        ))}

        {/* Supports */}
        {Array.from({ length: kast.aantalTussensteunen }).map((_, i) => (
          <div
            key={`steun-${i}`}
            className="absolute h-full border-l-2 border-dashed border-green-600"
            style={{ left: `${((i + 1) * 100) / (kast.aantalTussensteunen + 1)}%` }}
          />
        ))}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-bold text-gray-500 bg-white bg-opacity-70 px-2 py-1 rounded">{label}</span>
        </div>
      </div>
    </div>
  );
};

// Color mapping for Tailwind (must use complete class names)
const colorStyles = {
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    button: 'bg-purple-500 hover:bg-purple-600'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    button: 'bg-green-500 hover:bg-green-600'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    button: 'bg-blue-500 hover:bg-blue-600'
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    button: 'bg-orange-500 hover:bg-orange-600'
  }
};

// Toestellen options for Kolomkast (0, 1, or 2 appliances - each adds 1 hour of work)
const toestelOpties = [0, 1, 2];

// Open Nis HPL complexity options with hours
const openNisComplexiteitOpties = [
  { key: 'heel_gemakkelijk', label: 'Heel gemakkelijk', uren: 1 },
  { key: 'gemakkelijk', label: 'Gemakkelijk', uren: 2 },
  { key: 'gemiddeld', label: 'Gemiddeld', uren: 3 },
  { key: 'moeilijk', label: 'Moeilijk', uren: 4 },
  { key: 'heel_moeilijk', label: 'Heel moeilijk', uren: 6 }
];

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
    setKast(prev => ({
      ...prev,
      aantalToestellen: value
    }));
    if (isActive) {
      setHuidigKast(prev => ({
        ...prev,
        aantalToestellen: value
      }));
    }
  };

  return (
    <div className={`${styles.bg} p-3 rounded-lg border-2 ${styles.border}`}>
      <h3 className="text-sm font-bold text-gray-800 mb-2">{emoji} {type}</h3>

      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-600">Hoogte (mm)</label>
              <input
                type="number"
                value={displayKast.hoogte}
                onChange={(e) => updateField('hoogte', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Breedte (mm)</label>
              <input
                type="number"
                value={displayKast.breedte}
                onChange={(e) => updateField('breedte', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Diepte (mm)</label>
              <input
                type="number"
                value={displayKast.diepte}
                onChange={(e) => updateField('diepte', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-2 gap-2">
            <Counter
              label="Leggers"
              value={displayKast.aantalLeggers}
              onChange={(val) => updateField('aantalLeggers', val)}
              onIncrement={() => incrementField('aantalLeggers')}
              onDecrement={() => decrementField('aantalLeggers')}
            />
            <Counter
              label="Steunen"
              value={displayKast.aantalTussensteunen}
              onChange={(val) => updateField('aantalTussensteunen', val)}
              onIncrement={() => incrementField('aantalTussensteunen')}
              onDecrement={() => decrementField('aantalTussensteunen')}
            />
            <Counter
              label="Lades"
              value={displayKast.aantalLades}
              onChange={(val) => updateField('aantalLades', val)}
              onIncrement={() => incrementField('aantalLades')}
              onDecrement={() => decrementField('aantalLades')}
            />
            <Counter
              label="Deuren"
              value={displayKast.aantalDeuren}
              onChange={(val) => updateField('aantalDeuren', val)}
              onIncrement={() => incrementField('aantalDeuren')}
              onDecrement={() => decrementField('aantalDeuren')}
            />
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

// Open Nis HPL configurator (special case)
const OpenNisHPLConfigurator = ({
  openNisHPL,
  setOpenNisHPL,
  huidigKast,
  setHuidigKast,
  voegKastToe,
  voegZijpaneelToeVoorType,
  materiaalTablet
}) => {
  const isActive = huidigKast.type === 'Open Nis HPL';
  const displayKast = isActive ? huidigKast : openNisHPL;

  const updateField = (field, value) => {
    setOpenNisHPL(prev => ({ ...prev, [field]: value }));
    if (isActive) {
      setHuidigKast(prev => ({ ...prev, [field]: value }));
    }
  };

  const updateHplOnderdeel = (onderdeel, value) => {
    setOpenNisHPL(prev => ({
      ...prev,
      hplOnderdelen: { ...prev.hplOnderdelen, [onderdeel]: value }
    }));
    if (isActive) {
      setHuidigKast(prev => ({
        ...prev,
        hplOnderdelen: { ...prev.hplOnderdelen, [onderdeel]: value }
      }));
    }
  };

  const incrementField = (field) => {
    const newVal = displayKast[field] + 1;
    setOpenNisHPL(prev => ({ ...prev, [field]: newVal }));
    if (isActive) setHuidigKast(prev => ({ ...prev, [field]: newVal }));
  };

  const decrementField = (field) => {
    const newVal = Math.max(0, displayKast[field] - 1);
    setOpenNisHPL(prev => ({ ...prev, [field]: newVal }));
    if (isActive) setHuidigKast(prev => ({ ...prev, [field]: newVal }));
  };

  return (
    <div className="bg-white p-4 rounded-lg mb-4 border-2 border-pink-200 shadow-md">
      <h3 className="text-sm font-bold text-gray-800 mb-2">Open Nis HPL</h3>

      <div className="flex gap-4">
        <div className="flex-1">
          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label className="text-xs text-gray-600">Hoogte (mm)</label>
              <input
                type="number"
                value={displayKast.hoogte}
                onChange={(e) => updateField('hoogte', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Breedte (mm)</label>
              <input
                type="number"
                value={displayKast.breedte}
                onChange={(e) => updateField('breedte', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Diepte (mm)</label>
              <input
                type="number"
                value={displayKast.diepte}
                onChange={(e) => updateField('diepte', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Material selection */}
          <div className="mb-2">
            <label className="text-xs text-gray-600 block mb-1">HPL Materiaal</label>
            <select
              value={displayKast.hplMateriaal}
              onChange={(e) => updateField('hplMateriaal', parseInt(e.target.value))}
              className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
            >
              {materiaalTablet.map((mat, index) => (
                <option key={index} value={index}>
                  {mat.naam} - {mat.afmeting} mm - €{mat.prijs.toFixed(2)}/m²
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
              {openNisComplexiteitOpties.map((optie) => (
                <option key={optie.key} value={optie.key}>
                  {optie.label} ({optie.uren}u)
                </option>
              ))}
            </select>
          </div>

          {/* HPL parts selection */}
          <div className="mb-2">
            <label className="text-xs text-gray-600 block mb-1">HPL Onderdelen</label>
            <div className="grid grid-cols-5 gap-2">
              {['LZ', 'RZ', 'BK', 'OK', 'RUG'].map(onderdeel => (
                <label key={onderdeel} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={displayKast.hplOnderdelen?.[onderdeel] || false}
                    onChange={(e) => updateHplOnderdeel(onderdeel, e.target.checked)}
                    className="rounded"
                  />
                  {onderdeel}
                </label>
              ))}
            </div>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <label className="text-xs text-gray-600">Leggers</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => decrementField('aantalLeggers')}
                  className="flex-1 bg-red-400 hover:bg-red-500 text-white py-1 rounded font-bold text-sm"
                >−</button>
                <input
                  type="number"
                  min="0"
                  value={displayKast.aantalLeggers}
                  onChange={(e) => updateField('aantalLeggers', parseInt(e.target.value) || 0)}
                  className="w-1/3 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
                />
                <button
                  onClick={() => incrementField('aantalLeggers')}
                  className="flex-1 bg-green-400 hover:bg-green-500 text-white py-1 rounded font-bold text-sm"
                >+</button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Steunen</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => decrementField('aantalTussensteunen')}
                  className="flex-1 bg-red-400 hover:bg-red-500 text-white py-1 rounded font-bold text-sm"
                >−</button>
                <input
                  type="number"
                  min="0"
                  value={displayKast.aantalTussensteunen}
                  onChange={(e) => updateField('aantalTussensteunen', parseInt(e.target.value) || 0)}
                  className="w-1/3 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
                />
                <button
                  onClick={() => incrementField('aantalTussensteunen')}
                  className="flex-1 bg-green-400 hover:bg-green-500 text-white py-1 rounded font-bold text-sm"
                >+</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <label className="text-xs text-gray-600">Deuren</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => decrementField('aantalDeuren')}
                  className="flex-1 bg-red-400 hover:bg-red-500 text-white py-1 rounded font-bold text-sm"
                >−</button>
                <input
                  type="number"
                  min="0"
                  value={displayKast.aantalDeuren}
                  onChange={(e) => updateField('aantalDeuren', parseInt(e.target.value) || 0)}
                  className="w-1/3 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
                />
                <button
                  onClick={() => incrementField('aantalDeuren')}
                  className="flex-1 bg-green-400 hover:bg-green-500 text-white py-1 rounded font-bold text-sm"
                >+</button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => voegKastToe({ type: 'Open Nis HPL', ...openNisHPL })}
              className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded-md font-semibold text-sm"
            >
              Toevoegen
            </button>
            <button
              onClick={() => voegZijpaneelToeVoorType('Open Nis HPL', openNisHPL)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md font-semibold text-sm"
            >
              Zijpaneel
            </button>
          </div>
        </div>

        {/* Visual preview */}
        <div className="w-1/3 flex-shrink-0 flex items-center justify-center">
          <div className="relative">
            {(() => {
              // Calculate proportional scaling to fit within max 200x200 container
              const maxSize = 200;
              const aspectRatio = displayKast.breedte / displayKast.hoogte;
              let previewWidth, previewHeight;

              if (aspectRatio > 1) {
                // Wider than tall
                previewWidth = maxSize;
                previewHeight = maxSize / aspectRatio;
              } else {
                // Taller than wide or square
                previewHeight = maxSize;
                previewWidth = maxSize * aspectRatio;
              }

              return (
                <div
                  className="relative bg-gray-50"
                  style={{
                    width: `${previewWidth}px`,
                    height: `${previewHeight}px`,
                    backgroundColor: displayKast.hplOnderdelen?.RUG ? '#e0e0e0' : 'transparent',
                    borderLeft: `${displayKast.hplOnderdelen?.LZ ? '4' : '1'}px solid #333`,
                    borderRight: `${displayKast.hplOnderdelen?.RZ ? '4' : '1'}px solid #333`,
                    borderTop: `${displayKast.hplOnderdelen?.BK ? '4' : '1'}px solid #333`,
                    borderBottom: `${displayKast.hplOnderdelen?.OK ? '4' : '1'}px solid #333`
                  }}
                >
              {/* Shelves */}
              {Array.from({ length: displayKast.aantalLeggers }).map((_, i) => (
                <div
                  key={`legger-${i}`}
                  className="absolute w-full border-t border-gray-400"
                  style={{ top: `${((i + 1) / (displayKast.aantalLeggers + 1)) * 100}%` }}
                />
              ))}

              {/* Supports */}
              {Array.from({ length: displayKast.aantalTussensteunen }).map((_, i) => (
                <div
                  key={`steun-${i}`}
                  className="absolute h-full border-l border-gray-400"
                  style={{ left: `${((i + 1) / (displayKast.aantalTussensteunen + 1)) * 100}%` }}
                />
              ))}

              {/* Doors indicator */}
              {displayKast.aantalDeuren > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-bold text-pink-600 bg-white bg-opacity-70 px-2 py-1 rounded">
                    {displayKast.aantalDeuren} {displayKast.aantalDeuren === 1 ? 'deur' : 'deuren'}
                  </div>
                </div>
              )}

              <span className="absolute bottom-1 right-1 text-xs font-bold text-gray-500 bg-white bg-opacity-70 px-2 py-1 rounded">HPL</span>
                </div>
              );
            })()}

            <div className="mt-2 text-xs text-center text-gray-600">
              {displayKast.hplOnderdelen &&
                Object.entries(displayKast.hplOnderdelen)
                  .filter(([_, active]) => active)
                  .map(([key]) => key)
                  .join(', ')
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main export - KastConfigurator grid
const KastConfigurator = ({
  bovenkast,
  setBovenkast,
  kolomkast,
  setKolomkast,
  onderkast,
  setOnderkast,
  ladekast,
  setLadekast,
  openNisHPL,
  setOpenNisHPL,
  huidigKast,
  setHuidigKast,
  voegKastToe,
  voegZijpaneelToeVoorType,
  materiaalTablet
}) => (
  <>
    <div className="grid grid-cols-2 gap-3 mb-4">
      <SingleKastConfigurator
        type="Bovenkast"
        kast={bovenkast}
        setKast={setBovenkast}
        huidigKast={huidigKast}
        setHuidigKast={setHuidigKast}
        voegKastToe={voegKastToe}
        voegZijpaneelToeVoorType={voegZijpaneelToeVoorType}
        colorClass="purple"
        emoji=""
        label="BK"
      />
      <SingleKastConfigurator
        type="Kolomkast"
        kast={kolomkast}
        setKast={setKolomkast}
        huidigKast={huidigKast}
        setHuidigKast={setHuidigKast}
        voegKastToe={voegKastToe}
        voegZijpaneelToeVoorType={voegZijpaneelToeVoorType}
        colorClass="green"
        emoji=""
        label="KK"
      />
      <SingleKastConfigurator
        type="Onderkast"
        kast={onderkast}
        setKast={setOnderkast}
        huidigKast={huidigKast}
        setHuidigKast={setHuidigKast}
        voegKastToe={voegKastToe}
        voegZijpaneelToeVoorType={voegZijpaneelToeVoorType}
        colorClass="blue"
        emoji=""
        label="OK"
      />
      <SingleKastConfigurator
        type="Ladekast"
        kast={ladekast}
        setKast={setLadekast}
        huidigKast={huidigKast}
        setHuidigKast={setHuidigKast}
        voegKastToe={voegKastToe}
        voegZijpaneelToeVoorType={voegZijpaneelToeVoorType}
        colorClass="orange"
        emoji=""
        label="LK"
      />
    </div>

    <OpenNisHPLConfigurator
      openNisHPL={openNisHPL}
      setOpenNisHPL={setOpenNisHPL}
      huidigKast={huidigKast}
      setHuidigKast={setHuidigKast}
      voegKastToe={voegKastToe}
      voegZijpaneelToeVoorType={voegZijpaneelToeVoorType}
      materiaalTablet={materiaalTablet}
    />
  </>
);

export default KastConfigurator;
