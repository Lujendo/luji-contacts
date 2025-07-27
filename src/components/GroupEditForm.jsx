import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader } from 'lucide-react';

const GroupEditForm = ({ group, onClose, onGroupUpdated, isLoading }) => {
  const nameInputRef = useRef(null);
  const [editedGroup, setEditedGroup] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (group) {
      setEditedGroup({
        name: group.name || '',
        description: group.description || ''
      });
    }
    // Focus on name input when form opens
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [group]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onGroupUpdated(group.id, editedGroup);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          disabled={isLoading}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-6 flex items-center">
          Edit Group
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              name="name"
              id="name"
              value={editedGroup.name}
              onChange={(e) => setEditedGroup(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                       focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={editedGroup.description}
              onChange={(e) => setEditedGroup(prev => ({ ...prev, description: e.target.value }))}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                       focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100
                       rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2
                       focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white
                       bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none
                       focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

GroupEditForm.defaultProps = {
  isLoading: false
};

export default GroupEditForm;