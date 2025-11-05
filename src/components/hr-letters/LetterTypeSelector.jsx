import React from 'react';

const letterTypes = [
  { value: 'offer', label: 'Offer Letter' },
  { value: 'appointment', label: 'Appointment Letter' },
  { value: 'hike', label: 'Salary Hike Letter' },
  { value: 'promotion', label: 'Promotion Letter' },
  { value: 'termination', label: 'Termination Letter' },
  { value: 'experience', label: 'Experience Letter' },
];

const LetterTypeSelector = ({ selectedType, onTypeChange, disabled = false }) => {
  return (
    <div className="w-full">
      <label htmlFor="letterType" className="block text-sm font-medium text-gray-700 mb-2">
        Select Letter Type *
      </label>
      <select
        id="letterType"
        value={selectedType}
        onChange={(e) => onTypeChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        required
      >
        <option value="">Choose a letter type...</option>
        {letterTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LetterTypeSelector;