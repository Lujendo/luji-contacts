import React, { useState, useEffect } from 'react';
import { UserMinus, Loader, X, AlertTriangle } from 'lucide-react';

// Enhanced version with proper validation
const BulkGroupRemove = (props) => {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [validGroups, setValidGroups] = useState([]);

  // Validate groups data when component mounts or groups prop changes
  useEffect(() => {
    if (Array.isArray(props.groups)) {
      // Filter out any invalid group objects
      const filtered = props.groups.filter(group =>
        group && typeof group === 'object' && group.id && group.name
      );
      setValidGroups(filtered);
    } else {
      setValidGroups([]);
    }
  }, [props.groups]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedGroup) {
      setShowConfirm(true);
    }
  };

  // Handle confirmation
  const handleConfirmRemove = () => {
    if (selectedGroup && typeof props.onRemove === 'function' && Array.isArray(props.contactIds)) {
      props.onRemove(selectedGroup, props.contactIds);
    }
    setShowConfirm(false);
  };

  // Handle close button click
  const handleClose = () => {
    if (typeof props.onClose === 'function') {
      props.onClose();
    }
  };

  return (
    <div>
      <div className="relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <UserMinus className="w-6 h-6 mr-2 text-red-600" />
            Remove from Group
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Remove {Array.isArray(props.contactIds) ? props.contactIds.length : 0} selected contacts from group
            {validGroups.length === 0 && <span className="block text-red-500 mt-1">No groups available. Please create a group first.</span>}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Group
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={props.isLoading}
            >
              <option value="">Choose a group...</option>
              {validGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={props.isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              disabled={!selectedGroup || props.isLoading || validGroups.length === 0}
            >
              {props.isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove from Group'
              )}
            </button>
          </div>
        </form>

        {showConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full m-3">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold">Confirm Removal</h3>
              </div>
              <p className="mb-4">
                Are you sure you want to remove the selected contacts from this group?
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={props.isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemove}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  disabled={props.isLoading}
                >
                  {props.isLoading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkGroupRemove;