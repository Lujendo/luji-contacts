import React, { useState, useRef, useEffect } from 'react';
import { X, Loader } from 'lucide-react';

const GroupForm = ({ onClose, onGroupAdded, isLoading }) => {
  const nameInputRef = useRef(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onGroupAdded(newGroup);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-96 max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Add New Group</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              id="name"
              value={newGroup.name}
              onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
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
              value={newGroup.description}
              onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
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
                  Adding...
                </>
              ) : (
                'Add Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupForm;