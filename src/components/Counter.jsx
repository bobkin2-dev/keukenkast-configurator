import React from 'react';

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

export default Counter;
