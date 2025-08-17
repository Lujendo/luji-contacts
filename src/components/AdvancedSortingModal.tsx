import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Save, RotateCcw } from 'lucide-react';
import {
  SortingPreferences,
  SortPreference,
  SORT_FIELDS,
  SortField,
  loadSortingPreferences,
  saveSortingPreferences,
  createSortPreference,
  toggleSortDirection,
  getSortableFields,
  getSortDescription,
  DEFAULT_SORT_PREFERENCES
} from '../utils/sortingPreferences';

interface AdvancedSortingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: SortingPreferences;
  onApply: (preferences: SortingPreferences) => void;
}

const AdvancedSortingModal: React.FC<AdvancedSortingModalProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  onApply
}) => {
  const [preferences, setPreferences] = useState<SortingPreferences>(currentPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  const sortableFields = getSortableFields();

  useEffect(() => {
    setPreferences(currentPreferences);
    setHasChanges(false);
  }, [currentPreferences, isOpen]);

  const handlePrimaryChange = (field: SortField, direction: 'asc' | 'desc') => {
    const newPreferences = {
      ...preferences,
      primary: createSortPreference(field, direction, 1)
    };
    setPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleSecondaryChange = (field: SortField | null, direction: 'asc' | 'desc' = 'asc') => {
    const newPreferences = {
      ...preferences,
      secondary: field ? createSortPreference(field, direction, 2) : undefined
    };
    setPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleApply = () => {
    saveSortingPreferences(preferences);
    onApply(preferences);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    setPreferences(DEFAULT_SORT_PREFERENCES);
    setHasChanges(true);
  };

  const handleCancel = () => {
    setPreferences(currentPreferences);
    setHasChanges(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Advanced Sorting</h2>
            <p className="text-sm text-gray-500 mt-1">Configure how contacts are sorted</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Current Sort Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Current Sorting</h3>
            <p className="text-sm text-blue-700">{getSortDescription(preferences)}</p>
          </div>

          {/* Primary Sort */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Primary Sort</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort by
                </label>
                <select
                  value={preferences.primary.field}
                  onChange={(e) => handlePrimaryChange(e.target.value as SortField, preferences.primary.direction)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {sortableFields.map(({ field, info }) => (
                    <option key={field} value={field}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direction
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePrimaryChange(preferences.primary.field, 'asc')}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                      preferences.primary.direction === 'asc'
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4 inline mr-1" />
                    A-Z
                  </button>
                  <button
                    onClick={() => handlePrimaryChange(preferences.primary.field, 'desc')}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                      preferences.primary.direction === 'desc'
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowDown className="w-4 h-4 inline mr-1" />
                    Z-A
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Sort */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Secondary Sort</h3>
              <span className="text-xs text-gray-500">Optional</span>
            </div>
            
            {preferences.secondary ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Then sort by
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={preferences.secondary.field}
                      onChange={(e) => handleSecondaryChange(e.target.value as SortField, preferences.secondary!.direction)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {sortableFields
                        .filter(({ field }) => field !== preferences.primary.field)
                        .map(({ field, info }) => (
                          <option key={field} value={field}>
                            {info.label}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleSecondaryChange(null)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-300 transition-colors"
                      title="Remove secondary sort"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Direction
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSecondaryChange(preferences.secondary!.field, 'asc')}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                        preferences.secondary.direction === 'asc'
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ArrowUp className="w-4 h-4 inline mr-1" />
                      A-Z
                    </button>
                    <button
                      onClick={() => handleSecondaryChange(preferences.secondary!.field, 'desc')}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                        preferences.secondary.direction === 'desc'
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ArrowDown className="w-4 h-4 inline mr-1" />
                      Z-A
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleSecondaryChange(
                  sortableFields.find(({ field }) => field !== preferences.primary.field)?.field || 'last_name'
                )}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add secondary sort
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!hasChanges}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              Apply Sorting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSortingModal;
