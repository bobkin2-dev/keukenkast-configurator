import React from 'react';

// Aspect ratio limits: widest = 3000mm wide × 800mm high, tallest = 400mm wide × 3000mm high
const MIN_RATIO = 400 / 3000;  // ~0.133
const MAX_RATIO = 3000 / 800;  // 3.75

// Fit cabinet dimensions into a preview box, preserving clamped aspect ratio
const getScaledDimensions = (breedte, hoogte, maxW, maxH) => {
  const rawRatio = breedte / hoogte;
  const ratio = Math.max(MIN_RATIO, Math.min(MAX_RATIO, rawRatio));

  let w, h;
  if (ratio > maxW / maxH) {
    w = maxW;
    h = maxW / ratio;
  } else {
    h = maxH;
    w = maxH * ratio;
  }
  return { width: `${Math.round(w)}px`, height: `${Math.round(h)}px` };
};

// Standard cabinet preview
export const KastPreview = ({ type, kast, label }) => {
  const isOpen = kast.isOpen === true;

  return (
    <div className="w-1/3 flex-shrink-0 flex items-center justify-center">
      <div
        className={`border-2 relative ${isOpen ? 'border-yellow-600 bg-yellow-50' : 'border-gray-800 bg-gray-100'}`}
        style={getScaledDimensions(kast.breedte, kast.hoogte, 150, 180)}
      >
        {/* Doors - only when closed */}
        {!isOpen && kast.aantalDeuren > 0 && Array.from({ length: kast.aantalDeuren }).map((_, i) => (
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

        {/* Drawers */}
        {kast.aantalLades > 0 && Array.from({ length: kast.aantalLades }).map((_, i) => (
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
            className={`absolute w-full border-t-2 border-dashed ${isOpen ? 'border-yellow-600' : 'border-blue-500'}`}
            style={{ top: `${((i + 1) * 100) / (kast.aantalLeggers + 1)}%` }}
          />
        ))}

        {/* Supports */}
        {Array.from({ length: kast.aantalTussensteunen }).map((_, i) => (
          <div
            key={`steun-${i}`}
            className={`absolute h-full border-l-2 border-dashed ${isOpen ? 'border-yellow-600' : 'border-green-600'}`}
            style={{ left: `${((i + 1) * 100) / (kast.aantalTussensteunen + 1)}%` }}
          />
        ))}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`text-xs font-bold px-2 py-1 rounded ${isOpen ? 'text-yellow-700 bg-yellow-100 bg-opacity-80' : 'text-gray-500 bg-white bg-opacity-70'}`}>
            {isOpen ? 'OPEN' : label}
          </span>
        </div>
      </div>
    </div>
  );
};

// Vrije Kast preview (proportional scaling with part indicators)
export const VrijeKastPreview = ({ kast }) => {
  const dims = getScaledDimensions(kast.breedte, kast.hoogte, 150, 180);

  // Support both new (vrijeKastOnderdelen) and legacy (hplOnderdelen) field names
  const onderdelen = kast.vrijeKastOnderdelen || kast.hplOnderdelen || {};

  return (
    <div className="w-1/3 flex-shrink-0 flex items-center justify-center">
      <div className="relative">
        <div
          className="relative bg-gray-50"
          style={{
            ...dims,
            backgroundColor: onderdelen.RUG ? '#e0e0e0' : 'transparent',
            borderLeft: `${onderdelen.LZ ? '4' : '1'}px solid #333`,
            borderRight: `${onderdelen.RZ ? '4' : '1'}px solid #333`,
            borderTop: `${onderdelen.BK ? '4' : '1'}px solid #333`,
            borderBottom: `${onderdelen.OK ? '4' : '1'}px solid #333`
          }}
        >
          {/* Shelves */}
          {Array.from({ length: kast.aantalLeggers }).map((_, i) => (
            <div
              key={`legger-${i}`}
              className="absolute w-full border-t border-gray-400"
              style={{ top: `${((i + 1) / (kast.aantalLeggers + 1)) * 100}%` }}
            />
          ))}

          {/* Supports */}
          {Array.from({ length: kast.aantalTussensteunen }).map((_, i) => (
            <div
              key={`steun-${i}`}
              className="absolute h-full border-l border-gray-400"
              style={{ left: `${((i + 1) / (kast.aantalTussensteunen + 1)) * 100}%` }}
            />
          ))}

          {/* Doors indicator */}
          {kast.aantalDeuren > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xs font-bold text-pink-600 bg-white bg-opacity-70 px-2 py-1 rounded">
                {kast.aantalDeuren} {kast.aantalDeuren === 1 ? 'deur' : 'deuren'}
              </div>
            </div>
          )}

          <span className="absolute bottom-1 right-1 text-xs font-bold text-gray-500 bg-white bg-opacity-70 px-2 py-1 rounded">VK</span>
        </div>

        <div className="mt-2 text-xs text-center text-gray-600">
          {Object.entries(onderdelen)
            .filter(([_, active]) => active)
            .map(([key]) => key)
            .join(', ')
          }
        </div>
      </div>
    </div>
  );
};
