import React from 'react';

const ExtraBeslag = ({ extraBeslag, setExtraBeslag }) => (
  <div className="bg-amber-50 p-4 rounded-lg mb-4 border-2 border-amber-200">
    <h2 className="text-lg font-bold text-gray-800 mb-3">Extra Meubelbeslag</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">

      {/* LED */}
      <div className="flex items-center gap-2">
        <span className="text-xs w-32">LED (lm)</span>
        <span className="text-xs">€</span>
        <input
          type="number"
          step="0.1"
          value={extraBeslag.prijsLed}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, prijsLed: parseFloat(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
        <span className="text-xs">/m</span>
        <input
          type="number"
          min="0"
          value={extraBeslag.led}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, led: parseInt(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
      </div>

      {/* Handdoekdrager */}
      <div className="flex items-center gap-2">
        <span className="text-xs w-32">Handdoekdrager</span>
        <span className="text-xs">€</span>
        <input
          type="number"
          step="0.1"
          value={extraBeslag.prijsHanddoekdrager}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, prijsHanddoekdrager: parseFloat(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
        <span className="text-xs">/st</span>
        <input
          type="number"
          min="0"
          value={extraBeslag.handdoekdrager}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, handdoekdrager: parseInt(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
      </div>

      {/* Alubodem 600mm */}
      <div className="flex items-center gap-2">
        <span className="text-xs w-32">Alubodem 600mm</span>
        <span className="text-xs">€</span>
        <input
          type="number"
          step="0.1"
          value={extraBeslag.prijsAlubodem600}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, prijsAlubodem600: parseFloat(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
        <span className="text-xs">/st</span>
        <input
          type="number"
          min="0"
          value={extraBeslag.alubodem600}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, alubodem600: parseInt(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
      </div>

      {/* Alubodem 1200mm */}
      <div className="flex items-center gap-2">
        <span className="text-xs w-32">Alubodem 1200mm</span>
        <span className="text-xs">€</span>
        <input
          type="number"
          step="0.1"
          value={extraBeslag.prijsAlubodem1200}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, prijsAlubodem1200: parseFloat(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
        <span className="text-xs">/st</span>
        <input
          type="number"
          min="0"
          value={extraBeslag.alubodem1200}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, alubodem1200: parseInt(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
      </div>

      {/* Vuilbaksysteem */}
      <div className="flex items-center gap-2">
        <span className="text-xs w-32">Vuilbaksysteem</span>
        <span className="text-xs">€</span>
        <input
          type="number"
          step="0.1"
          value={extraBeslag.prijsVuilbaksysteem}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, prijsVuilbaksysteem: parseFloat(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
        <span className="text-xs">/st</span>
        <input
          type="number"
          min="0"
          value={extraBeslag.vuilbaksysteem}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, vuilbaksysteem: parseInt(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
      </div>

      {/* Bestekbak */}
      <div className="flex items-center gap-2">
        <span className="text-xs w-32">Bestekbak</span>
        <span className="text-xs">€</span>
        <input
          type="number"
          step="0.1"
          value={extraBeslag.prijsBestekbak}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, prijsBestekbak: parseFloat(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
        <span className="text-xs">/st</span>
        <input
          type="number"
          min="0"
          value={extraBeslag.bestekbak}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, bestekbak: parseInt(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
      </div>

      {/* Slot */}
      <div className="flex items-center gap-2">
        <span className="text-xs w-32">Slot</span>
        <span className="text-xs">€</span>
        <input
          type="number"
          step="0.1"
          value={extraBeslag.prijsSlot}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, prijsSlot: parseFloat(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
        <span className="text-xs">/st</span>
        <input
          type="number"
          min="0"
          value={extraBeslag.slot}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, slot: parseInt(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
      </div>

      {/* Cylinderslot */}
      <div className="flex items-center gap-2">
        <span className="text-xs w-32">Cylinderslot</span>
        <span className="text-xs">€</span>
        <input
          type="number"
          step="0.1"
          value={extraBeslag.prijsCylinderslot}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, prijsCylinderslot: parseFloat(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
        <span className="text-xs">/st</span>
        <input
          type="number"
          min="0"
          value={extraBeslag.cylinderslot}
          onChange={(e) => setExtraBeslag(prev => ({ ...prev, cylinderslot: parseInt(e.target.value) || 0 }))}
          className="w-20 px-2 py-1 border rounded text-center"
        />
      </div>

    </div>
  </div>
);

export default ExtraBeslag;
