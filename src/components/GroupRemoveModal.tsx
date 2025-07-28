import React, { useState, FormEvent } from 'react';
import { Group } from '../types';
import { UserMinus, X, AlertTriangle } from 'lucide-react';

// Component props interface
interface GroupRemoveModalProps {
  groups: Group[];
  contactIds?: number[];
  onRemove: (groupId: number, contactIds?: number[]) => void;
  onClose: () => void;
  onRemovalComplete?: () => void;
}

const GroupRemoveModal: React.FC<GroupRemoveModalProps> = ({ 
  groups, 
  contactIds = [],
  onRemove, 
  onClose,
  onRemovalComplete 
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!selectedGroup) return;

    setIsSubmitting(true);
    
    try {
      const groupId = parseInt(selectedGroup, 10);
      await onRemove(groupId, contactIds);
      
      if (onRemovalComplete) {
        onRemovalComplete();
      }
      
      onClose();
    } catch (error) {
      console.error('Error removing from group:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const selectedGroupName = groups.find(g => g.id.toString() === selectedGroup)?.name || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <UserMinus className="h-6 w-6 mr-2 text-red-600" />
            Remove from Group
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Info */}
          {contactIds.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
                <p className="text-sm text-yellow-700">
                  Removing <strong>{contactIds.length}</strong> contact{contactIds.length !== 1 ? 's' : ''} from the selected group
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Group Selection */}
            <div>
              <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-2">
                Select Group to Remove From
              </label>
              {groups.length > 0 ? (
                <select
                  id="group"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Choose a group...</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id.toString()}>
                      {group.name} ({group.contact_count || 0} contacts)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-sm text-gray-600">No groups available</p>
                </div>
              )}
            </div>

            {/* Confirmation */}
            {selectedGroup && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Confirm Removal</p>
                    <p className="mt-1">
                      {contactIds.length > 0 
                        ? `This will remove ${contactIds.length} contact${contactIds.length !== 1 ? 's' : ''} from "${selectedGroupName}".`
                        : `This will remove the selected contacts from "${selectedGroupName}".`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedGroup || isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Removing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove from Group
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroupRemoveModal;
