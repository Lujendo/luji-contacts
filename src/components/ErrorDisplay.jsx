import React from 'react';

function ErrorDisplay({ error, onClose }) {
  if (!error) return null;

  return (
    <div className="bg-red-500 text-white p-4 rounded mb-4">
      <div className="flex justify-between items-center">
        <span>{error}</span>
        <button onClick={onClose} className="text-white font-bold">
          ×
        </button>
      </div>
    </div>
  );
}

export default ErrorDisplay;
