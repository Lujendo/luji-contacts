import React, { useState, FormEvent } from 'react';
import { Group } from '../types';

// Component props interface
interface GroupAssignModalProps {
  groups: Group[];
  contactIds?: number[];
  onAssign?: (groupId: string) => void;
  onClose: () => void;
  onAssignmentComplete?: () => void;
}

const GroupAssignModal: React.FC<GroupAssignModalProps> = ({
  groups,
  contactIds = [],
  onAssign,
  onClose,
  onAssignmentComplete
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (selectedGroup) {
      if (onAssign) {
        onAssign(selectedGroup);
      }
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-[60]">
      <div className="bg-white p-5 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-semibold mb-4">Assign to Group</h2>
        {contactIds.length > 0 && (
          <p className="text-sm text-gray-600 mb-4">
            Assigning {contactIds.length} contact{contactIds.length !== 1 ? 's' : ''} to a group
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="group" className="block text-sm font-medium text-gray-700">Select Group</label>
            <select
              id="group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">Choose a group</option>
              {groups.map(group => (
                <option key={group.id} value={group.id.toString()}>{group.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={!selectedGroup}
            >
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupAssignModal;
