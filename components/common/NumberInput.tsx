import React from 'react';

interface NumberInputProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, min = 0, max, step = 1 }) => {

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value);
    if (!isNaN(num)) {
      onChange(num);
    } else if (e.target.value === '') {
        onChange(0); // or handle as you see fit
    }
  };

  const increment = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(parseFloat(newValue.toFixed(2)));
    }
  };

  const decrement = () => {
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onChange(parseFloat(newValue.toFixed(2)));
    }
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={decrement}
        disabled={min !== undefined && value <= min}
        className="px-2 py-2 bg-gray-200 text-gray-700 rounded-l-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
      </button>
      <input
        type="number"
        value={value}
        onChange={handleManualChange}
        min={min}
        max={max}
        step={step}
        className="w-20 text-center p-2 bg-white border-t border-b border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
      />
      <button
        type="button"
        onClick={increment}
        disabled={max !== undefined && value >= max}
        className="px-2 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      </button>
    </div>
  );
};

export default NumberInput;