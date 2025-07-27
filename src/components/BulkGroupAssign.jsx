import React, { useState, useEffect } from 'react';
import { Users, Loader, X } from 'lucide-react';

const BulkGroupAssign = ({ groups = [], contactIds = [], onAssign, onClose, isLoading }) => {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [validGroups, setValidGroups] = useState([]);

  // Validate groups data when component mounts or groups prop changes
  useEffect(() => {
    if (Array.isArray(groups)) {
      // Filter out any invalid group objects
      const filtered = groups.filter(group =>
        group && typeof group === 'object' && group.id && group.name
      );
      setValidGroups(filtered);
    } else {
      setValidGroups([]);
    }
  }, [groups]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedGroup && typeof onAssign === 'function' && Array.isArray(contactIds)) {
      onAssign(selectedGroup, contactIds);
    }
  };

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div>
      <div className="relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Users className="w-6 h-6 mr-2 text-indigo-600" />
            Assign to Group
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
            Assign {Array.isArray(contactIds) ? contactIds.length : 0} selected contacts to group
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
              disabled={isLoading}
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
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={!selectedGroup || isLoading || validGroups.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign to Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkGroupAssign;
